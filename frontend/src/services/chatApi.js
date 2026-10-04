import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function fetchChatConfig() {
  const res = await api.get('/chat/config');
  return res.data.data;
}

export async function fetchChatHistory() {
  const res = await api.get('/chat/history');
  return res.data.data;
}

export async function clearChatHistory() {
  await api.delete('/chat/history');
}

export async function resolveChatAction(actionId, decision) {
  const res = await api.post(`/chat/actions/${actionId}`, { decision });
  return res.data.data;
}

// Non-streaming fallback: returns { userMessage, message, escalated }.
export async function sendChatMessage({ message, page }) {
  const res = await api.post('/chat', { message, page, stream: false });
  return res.data.data;
}

// Streams a reply over SSE (POST + ReadableStream). Calls onEvent for every
// event: start | delta | card | reset | done | error.
export async function streamChatMessage({ message, page, onEvent, signal }) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message, page, stream: true }),
    signal,
  });
  if (!res.ok) {
    let msg = 'Something went wrong';
    try {
      msg = (await res.json()).message || msg;
    } catch {
      /* not JSON */
    }
    throw new HttpError(msg, res.status);
  }
  if (!res.body || !(res.headers.get('content-type') || '').includes('text/event-stream')) {
    throw new Error('Streaming not supported');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = chunk
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('');
      if (data) onEvent(JSON.parse(data));
    }
  }
}
