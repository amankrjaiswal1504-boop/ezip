import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HttpError,
  clearChatHistory,
  fetchChatConfig,
  fetchChatHistory,
  resolveChatAction,
  sendChatMessage,
  streamChatMessage,
} from '../services/chatApi';

const DRAFT_ID = 'assistant-draft';

// State for the floating assistant: history (from the server), streaming draft,
// unread flag, and actions. `isOpen` is passed in so replies that land while
// the panel is minimised mark the chat as unread.
export default function useChatAssistant({ user, isOpen, page }) {
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const [error, setError] = useState(null);
  const openRef = useRef(isOpen);
  const abortRef = useRef(null);
  openRef.current = isOpen;

  useEffect(() => {
    fetchChatConfig()
      .then(setConfig)
      .catch(() => setConfig({ aiMode: 'fallback', whatsappNumber: null, support: null }));
  }, []);

  // Different person => different conversation. Reload lazily on next open.
  const userId = user?._id || null;
  useEffect(() => {
    abortRef.current?.abort();
    setMessages([]);
    setHistoryLoaded(false);
  }, [userId]);

  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    setHistoryLoaded(true);
    fetchChatHistory()
      .then((data) => setMessages((prev) => (prev.length ? prev : data.messages)))
      .catch(() => {});
  }, [isOpen, historyLoaded]);

  useEffect(() => {
    if (isOpen) setUnread(false);
  }, [isOpen]);

  const updateDraft = (fn) =>
    setMessages((prev) => prev.map((m) => (m.id === DRAFT_ID ? { ...m, ...fn(m) } : m)));

  const finish = (finalMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === DRAFT_ID ? finalMessage : m)));
    if (!openRef.current) setUnread(true);
  };

  const send = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || sending) return;
      setError(null);
      setSending(true);
      const tempId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== DRAFT_ID),
        { id: tempId, role: 'user', content: text, cards: [] },
        { id: DRAFT_ID, role: 'assistant', content: '', cards: [], streaming: true },
      ]);

      let started = false;
      let finished = false;
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await streamChatMessage({
          message: text,
          page,
          signal: controller.signal,
          onEvent: (evt) => {
            if (evt.type === 'start') {
              started = true;
              setMessages((prev) => prev.map((m) => (m.id === tempId ? evt.userMessage : m)));
            } else if (evt.type === 'delta') {
              updateDraft((m) => ({ content: m.content + evt.text }));
            } else if (evt.type === 'card') {
              updateDraft((m) => ({ cards: [...m.cards, evt.card] }));
            } else if (evt.type === 'reset') {
              updateDraft(() => ({ content: '', cards: [] }));
            } else if (evt.type === 'done') {
              finished = true;
              finish(evt.message);
            } else if (evt.type === 'error') {
              finished = true;
              finish({ id: `err-${Date.now()}`, role: 'assistant', content: evt.message, cards: [], isError: true });
            }
          },
        });
        if (!finished) throw new Error('Stream ended early');
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof HttpError) {
          // Server rejected the message (rate limit, too long, ...): nothing was saved.
          setMessages((prev) => prev.filter((m) => m.id !== DRAFT_ID && m.id !== tempId));
          setError(err.message);
        } else if (!started) {
          // Streaming unavailable (proxy, old browser): retry as a normal request.
          try {
            const data = await sendChatMessage({ message: text, page });
            setMessages((prev) => prev.map((m) => (m.id === tempId ? data.userMessage : m)));
            finish(data.message);
          } catch (fallbackErr) {
            setMessages((prev) => prev.filter((m) => m.id !== DRAFT_ID && m.id !== tempId));
            setError(fallbackErr.message);
          }
        } else {
          // Stream broke midway: the server still saves the reply, so resync.
          try {
            const data = await fetchChatHistory();
            setMessages(data.messages);
          } catch {
            updateDraft(() => ({ streaming: false, isError: true, content: 'Connection lost. Please try again.' }));
          }
        }
      } finally {
        setSending(false);
      }
    },
    [sending, page]
  );

  const clear = useCallback(async () => {
    abortRef.current?.abort();
    await clearChatHistory();
    setMessages([]);
    setError(null);
  }, []);

  const resolveAction = useCallback(async (actionId, decision) => {
    try {
      const data = await resolveChatAction(actionId, decision);
      setMessages((prev) => [
        ...prev.map((m) => (data.updatedMessage && m.id === data.updatedMessage.id ? data.updatedMessage : m)),
        data.message,
      ]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { messages, config, sending, unread, error, setError, send, clear, resolveAction };
}
