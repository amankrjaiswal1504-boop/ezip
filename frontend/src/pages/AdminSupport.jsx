import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const TABS = [
  { key: 'conversations', label: 'Conversations' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'faqs', label: 'FAQs' },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

function Pager({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center gap-3 mt-3 text-sm">
      <button className="btn-outline py-1 px-3 text-xs" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
        Previous
      </button>
      <span className="text-steel-500">
        Page {pagination.page} of {pagination.pages}
      </span>
      <button
        className="btn-outline py-1 px-3 text-xs"
        disabled={pagination.page >= pagination.pages}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function Badge({ tone = 'steel', children }) {
  const tones = {
    steel: 'bg-steel-100 text-steel-700',
    rust: 'bg-rust-100 text-rust-700',
    patina: 'bg-patina-100 text-patina-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-sm ${tones[tone]}`}>{children}</span>;
}

function Conversations() {
  const [filter, setFilter] = useState('unresolved');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  function load() {
    api
      .get('/admin/support/conversations', { params: { filter, page } })
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(err.message));
  }
  useEffect(load, [filter, page]);

  async function open(id) {
    try {
      const res = await api.get(`/admin/support/conversations/${id}`);
      setSelected(res.data.data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function resolve(id) {
    try {
      await api.put(`/admin/support/conversations/${id}/resolve`);
      toast.success('Marked resolved');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <div className="flex gap-2 mb-3">
          {['unresolved', 'escalated', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-sm capitalize ${filter === f ? 'bg-steel-900 text-white' : 'bg-steel-100 text-steel-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {!data ? (
          <div className="text-steel-500 text-sm">Loading…</div>
        ) : data.conversations.length === 0 ? (
          <div className="card text-sm text-steel-500">No conversations here.</div>
        ) : (
          <ul className="border border-steel-100 rounded-sm divide-y divide-steel-100 bg-white">
            {data.conversations.map((c) => (
              <li key={c._id}>
                <button
                  onClick={() => open(c._id)}
                  className={`w-full text-left px-4 py-3 hover:bg-steel-50 ${selected?.conversation._id === c._id ? 'bg-steel-50' : ''}`}
                >
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium">{c.user ? c.user.name : 'Anonymous visitor'}</span>
                    <span className="text-xs text-steel-500">{fmtDate(c.lastMessageAt)}</span>
                  </div>
                  <div className="text-xs text-steel-500 truncate mt-0.5">{c.lastUserMessage || '—'}</div>
                  <div className="flex gap-2 mt-1.5">
                    {c.escalated && <Badge tone="rust">Escalated</Badge>}
                    {c.resolved && <Badge tone="patina">Resolved</Badge>}
                    {c.ticket && <Badge>{c.ticket.ticketId}</Badge>}
                    <Badge>{c.messageCount} msgs</Badge>
                    {c.language === 'hi' && <Badge>Hindi</Badge>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager pagination={data?.pagination} onPage={setPage} />
      </div>

      <div>
        {selected ? (
          <div className="card">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div>
                <div className="font-medium">{selected.conversation.user?.name || 'Anonymous visitor'}</div>
                {selected.conversation.user && (
                  <div className="text-xs text-steel-500">
                    {selected.conversation.user.email} · {selected.conversation.user.phone}
                  </div>
                )}
              </div>
              {selected.conversation.escalated && !selected.conversation.resolved && (
                <button className="btn-primary text-xs py-1.5 px-3" onClick={() => resolve(selected.conversation._id)}>
                  Mark resolved
                </button>
              )}
            </div>
            {selected.tickets.map((t) => (
              <div key={t._id} className="text-xs bg-rust-100/50 border border-rust-100 rounded-sm p-2 mb-3">
                <span className="font-medium">{t.ticketId}</span> · {t.reason.replace('_', ' ')} · {t.status}
                <div className="text-steel-700 mt-1">{t.summary}</div>
              </div>
            ))}
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {selected.messages.map((m) => (
                <div key={m._id} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block max-w-[85%] text-left rounded-sm px-3 py-2 whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-steel-900 text-white' : 'bg-steel-50 border border-steel-100'
                    }`}
                  >
                    {m.content || <span className="text-steel-500 italic">[cards only]</span>}
                    {m.cards?.length > 0 && (
                      <div className="text-[11px] text-steel-500 mt-1">Cards: {m.cards.map((c) => c.type).join(', ')}</div>
                    )}
                  </div>
                  <div className="text-[11px] text-steel-400 mt-0.5">
                    {fmtDate(m.createdAt)}
                    {m.role === 'assistant' && ` · ${m.mode}`}
                    {m.topic && m.role === 'user' && ` · ${m.topic}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-sm text-steel-500">Select a conversation to read the transcript.</div>
        )}
      </div>
    </div>
  );
}

function Tickets() {
  const [status, setStatus] = useState('unresolved');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  function load() {
    api
      .get('/admin/support/tickets', { params: { status, page } })
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(err.message));
  }
  useEffect(load, [status, page]);

  async function update(ticketId, body) {
    try {
      await api.put(`/admin/support/tickets/${ticketId}`, body);
      toast.success('Ticket updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {['unresolved', 'open', 'in_progress', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-sm ${status === s ? 'bg-steel-900 text-white' : 'bg-steel-100 text-steel-700'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      {!data ? (
        <div className="text-steel-500 text-sm">Loading…</div>
      ) : data.tickets.length === 0 ? (
        <div className="card text-sm text-steel-500">No tickets.</div>
      ) : (
        <div className="border border-steel-100 rounded-sm overflow-x-auto bg-white">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-steel-100 text-left text-steel-700">
              <tr>
                <th className="px-4 py-2 font-medium">Ticket</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Summary</th>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((t) => (
                <tr key={t._id} className="border-t border-steel-100 align-top">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">
                    {t.ticketId}
                    {t.pickupId && <div className="text-xs text-steel-500 font-normal">{t.pickupId}</div>}
                  </td>
                  <td className="px-4 py-2">
                    {t.user ? (
                      <>
                        {t.user.name}
                        <div className="text-xs text-steel-500">{t.user.phone}</div>
                      </>
                    ) : (
                      'Anonymous'
                    )}
                  </td>
                  <td className="px-4 py-2 max-w-xs text-steel-700">{t.summary}</td>
                  <td className="px-4 py-2 text-xs">{t.reason.replace('_', ' ')}</td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-2">
                    <select
                      className="input py-1 text-xs"
                      value={t.status}
                      aria-label={`Status of ${t.ticketId}`}
                      onChange={(e) => update(t.ticketId, { status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api
      .get('/admin/support/analytics')
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(err.message));
  }, []);
  if (!data) return <div className="text-steel-500 text-sm">Loading…</div>;
  const maxTopic = Math.max(1, ...data.topics.map((t) => t.count));
  const stats = [
    ['Conversations', data.sessions],
    ['Escalation rate', `${(data.escalationRate * 100).toFixed(0)}%`],
    ['Unresolved escalations', data.unresolvedConversations],
    ['Open tickets', data.openTickets],
    ['AI replies', data.replies.ai || 0],
    ['Fallback replies', data.replies.fallback || 0],
    ['Unanswered rate', `${(data.unansweredRate * 100).toFixed(0)}%`],
  ];
  return (
    <div className="space-y-6">
      <p className="text-xs text-steel-500">Last {data.days} days</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card">
            <div className="font-head text-xl font-semibold">{value}</div>
            <div className="text-xs text-steel-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-3">What customers ask about</h3>
          {data.topics.length === 0 && <p className="text-sm text-steel-500">No messages yet.</p>}
          <ul className="space-y-2">
            {data.topics.map((t) => (
              <li key={t.topic} className="text-sm">
                <div className="flex justify-between">
                  <span className="capitalize">{t.topic.replace('_', ' ')}</span>
                  <span className="text-steel-500">{t.count}</span>
                </div>
                <div className="h-1.5 bg-steel-100 rounded-full mt-1">
                  <div className="h-1.5 bg-rust-600 rounded-full" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-medium mb-3">Most repeated questions</h3>
          {data.commonQuestions.length === 0 && <p className="text-sm text-steel-500">No repeated questions yet.</p>}
          <ol className="space-y-1.5 text-sm list-decimal pl-5">
            {data.commonQuestions.map((q) => (
              <li key={q.question}>
                {q.question} <span className="text-steel-500">×{q.count}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FAQ = { question: '', answer: '', topic: '', keywords: '', isActive: true };

function Faqs() {
  const [faqs, setFaqs] = useState(null);
  const [form, setForm] = useState(EMPTY_FAQ);
  const [editingId, setEditingId] = useState(null);

  function load() {
    api
      .get('/admin/faqs')
      .then((res) => setFaqs(res.data.data.faqs))
      .catch((err) => toast.error(err.message));
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/admin/faqs/${editingId}`, form);
      else await api.post('/admin/faqs', form);
      toast.success(editingId ? 'FAQ updated' : 'FAQ added');
      setForm(EMPTY_FAQ);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/admin/faqs/${id}`);
      toast.success('FAQ deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <p className="text-xs text-steel-500 mb-3">The chat assistant answers from these FAQs (both AI and fallback mode).</p>
        {!faqs ? (
          <div className="text-steel-500 text-sm">Loading…</div>
        ) : faqs.length === 0 ? (
          <div className="card text-sm text-steel-500">No FAQs yet. Add one to teach the assistant.</div>
        ) : (
          <ul className="space-y-3">
            {faqs.map((f) => (
              <li key={f._id} className="card">
                <div className="flex justify-between gap-3">
                  <div className="font-medium text-sm">{f.question}</div>
                  <div className="flex gap-3 text-xs shrink-0">
                    <button
                      className="text-rust-600 font-medium"
                      onClick={() => {
                        setEditingId(f._id);
                        setForm({ ...f, keywords: (f.keywords || []).join(', ') });
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-steel-500" onClick={() => remove(f._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-steel-700 mt-1">{f.answer}</p>
                <div className="flex gap-2 mt-2">
                  <Badge>{f.topic}</Badge>
                  {!f.isActive && <Badge tone="rust">Inactive</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={save} className="card space-y-3 h-fit">
        <h3 className="font-medium">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h3>
        <input className="input" placeholder="Question" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <textarea className="input" rows={4} placeholder="Answer" required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
        <input className="input" placeholder="Topic (e.g. payment)" required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <input
          className="input"
          placeholder="Keywords, comma separated"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
        <div className="flex gap-2">
          <button className="btn-primary text-sm">{editingId ? 'Save changes' : 'Add FAQ'}</button>
          {editingId && (
            <button
              type="button"
              className="btn-outline text-sm"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FAQ);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function AdminSupport() {
  const [tab, setTab] = useState('conversations');
  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-4">Chat & Support</h1>
      <div className="flex gap-1 border-b border-steel-100 mb-6 overflow-x-auto overflow-y-hidden" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key ? 'border-rust-600 text-steel-900' : 'border-transparent text-steel-500 hover:text-steel-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'conversations' && <Conversations />}
      {tab === 'tickets' && <Tickets />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'faqs' && <Faqs />}
    </div>
  );
}
