import { useEffect, useMemo, useState } from 'react';
import { Banknote, Check, CreditCard, FlaskConical, Landmark, X } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { fmtDateTime, rupees } from '../../utils/format';
import { Badge, Button, DataTable, EmptyState, Field, PageHeader, Pagination, Segmented, Select, Tabs, Textarea } from '../../components/ui';
import { Async, Callout, ConfirmModal, KeyValue, Toolbar, maskAccount, useAction } from './_catalog/shared';

const W_STATUS = {
  requested: { label: 'Requested', tone: 'amber' },
  processing: { label: 'Processing', tone: 'blue' },
  paid: { label: 'Paid', tone: 'patina' },
  rejected: { label: 'Rejected', tone: 'danger' },
};
const P_STATUS = { pending: 'amber', successful: 'patina', failed: 'danger' };
const METHOD = { upi: 'UPI', bank_transfer: 'Bank transfer', cash: 'Cash', razorpay: 'Razorpay', wallet: 'Wallet' };
const pretty = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const TestBadge = () => (
  <Badge tone="amber" className="ml-1">
    <FlaskConical className="w-3 h-3" aria-hidden /> Test mode
  </Badge>
);

export default function AdminFinance() {
  const { can } = useAuth();
  const tabs = [can('withdrawals') && { value: 'withdrawals', label: 'Withdrawals' }, can('payments') && { value: 'payments', label: 'Payments' }].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]?.value || 'withdrawals');
  return (
    <div>
      <PageHeader title="Payouts & wallet" subtitle="Approve wallet withdrawals and review every payment in and out." />
      {tabs.length > 1 && <Tabs className="mb-5" tabs={tabs} value={tab} onChange={setTab} />}
      {tab === 'withdrawals' ? <Withdrawals /> : <Payments />}
    </div>
  );
}

function destination(w) {
  if (w.method === 'upi') return { title: 'UPI', detail: w.upiId || '—' };
  const b = w.bankAccount || {};
  return { title: 'Bank', detail: `${maskAccount(b.accountNumber)}${b.ifsc ? ` · ${b.ifsc}` : ''}`, holder: b.holderName };
}

function Withdrawals() {
  const [status, setStatus] = useState('requested');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);
  const res = useApi('/admin/withdrawals', { params: { status, page, limit: 20 } });
  const [acting, setActing] = useState(null); // { w, action }
  const [note, setNote] = useState('');
  const { busy, run } = useAction();

  function openAction(w, action) {
    setNote('');
    setActing({ w, action });
  }

  async function confirm() {
    const { w, action } = acting;
    const body = { action };
    if (note.trim()) body.note = note.trim();
    const r = await run('act', () => api.post(`/admin/withdrawals/${w._id}`, body), {
      success: (out) => {
        const s = out.data.data.withdrawal?.status;
        if (action === 'reject') return `Rejected. ${rupees(w.amount)} returned to ${w.user?.name || 'the customer'}'s wallet`;
        return s === 'paid' ? `${rupees(w.amount)} paid to ${w.user?.name || 'customer'}` : 'Payout sent, waiting for the bank to confirm';
      },
    });
    if (r.ok) {
      setActing(null);
      res.reload();
    }
  }

  const columns = [
    {
      key: 'user',
      header: 'Customer',
      render: (w) => (
        <div className="min-w-[140px]">
          <div className="font-medium text-steel-900">{w.user?.name || '—'}</div>
          <div className="text-xs text-steel-500">{w.user?.phone}</div>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', render: (w) => <span className="font-semibold tabular text-steel-900">{rupees(w.amount)}</span> },
    {
      key: 'to',
      header: 'Pay to',
      render: (w) => {
        const d = destination(w);
        return (
          <div className="min-w-[150px]">
            <div className="text-steel-900">
              <span className="text-xs text-steel-500 mr-1">{d.title}</span>
              <span className="tabular">{d.detail}</span>
            </div>
            {d.holder && <div className="text-xs text-steel-500">{d.holder}</div>}
          </div>
        );
      },
    },
    { key: 'createdAt', header: 'Requested', render: (w) => <span className="whitespace-nowrap text-steel-700">{fmtDateTime(w.createdAt)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <div className="whitespace-nowrap">
          <Badge tone={W_STATUS[w.status]?.tone} dot>
            {W_STATUS[w.status]?.label || w.status}
          </Badge>
          {w.isMock && <TestBadge />}
          {w.payoutReference && <div className="text-xs text-steel-500 mt-1 font-mono">{w.payoutReference}</div>}
          {w.note && <div className="text-xs text-steel-500 mt-1 max-w-[200px] truncate" title={w.note}>{w.note}</div>}
        </div>
      ),
    },
  ];
  if (status === 'requested')
    columns.push({
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (w) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" icon={X} onClick={() => openAction(w, 'reject')}>
            Reject
          </Button>
          <Button size="sm" icon={Check} onClick={() => openAction(w, 'approve')}>
            Approve
          </Button>
        </div>
      ),
    });

  const d = acting && destination(acting.w);
  return (
    <>
      <Toolbar>
        <div className="overflow-x-auto max-w-full">
          <Segmented
            size="sm"
            value={status}
            onChange={setStatus}
            options={Object.entries(W_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
        </div>
      </Toolbar>
      {res.error && !res.data ? (
        <Async {...res} onRetry={res.reload}>
          {() => null}
        </Async>
      ) : (
        <DataTable
          columns={columns}
          rows={res.data?.withdrawals}
          loading={res.loading}
          empty={
            <EmptyState
              icon={Landmark}
              title={status === 'requested' ? 'No withdrawals waiting' : `No ${W_STATUS[status].label.toLowerCase()} withdrawals`}
              description={status === 'requested' ? 'Requests from customer wallets appear here for approval.' : undefined}
            />
          }
        />
      )}
      <Pagination pagination={res.data?.pagination} onPage={setPage} />

      <ConfirmModal
        open={!!acting}
        onClose={() => setActing(null)}
        title={acting?.action === 'approve' ? 'Approve withdrawal' : 'Reject withdrawal'}
        confirmLabel={acting?.action === 'approve' ? `Pay ${rupees(acting?.w.amount)}` : 'Reject & refund'}
        variant={acting?.action === 'approve' ? 'primary' : 'danger'}
        busy={busy === 'act'}
        onConfirm={confirm}
      >
        {acting && (
          <>
            <dl className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-2 border border-steel-100">
              <KeyValue label="Customer">{acting.w.user?.name}</KeyValue>
              <KeyValue label="Amount">
                <span className="font-semibold tabular">{rupees(acting.w.amount)}</span>
              </KeyValue>
              <KeyValue label={d.title === 'UPI' ? 'UPI ID' : 'Account'}>{d.detail}</KeyValue>
              {d.holder && <KeyValue label="Account holder">{d.holder}</KeyValue>}
            </dl>
            {acting.action === 'approve' ? (
              <Callout icon={Banknote}>The payout is sent right away through the payment gateway. This can't be undone.</Callout>
            ) : (
              <Callout tone="amber">The amount goes back to the customer's ScrapMate wallet and they are notified.</Callout>
            )}
            <Field label={acting.action === 'reject' ? 'Reason (shown to the customer)' : 'Note (optional)'} hint={`${note.length}/300`}>
              {(id) => <Textarea id={id} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          </>
        )}
      </ConfirmModal>
    </>
  );
}

function Payments() {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, method]);
  const params = useMemo(() => {
    const p = { page, limit: 25 };
    if (status) p.status = status;
    if (method) p.method = method;
    return p;
  }, [page, status, method]);
  const res = useApi('/admin/payments', { params });
  const anyMock = res.data?.payments?.some((p) => p.isMock);

  const columns = [
    {
      key: 'paymentId',
      header: 'Payment',
      render: (p) => (
        <div className="whitespace-nowrap">
          <div className="font-mono text-xs text-steel-900">{p.paymentId}</div>
          <div className="text-xs text-steel-500">{fmtDateTime(p.createdAt)}</div>
        </div>
      ),
    },
    { key: 'user', header: 'Customer', render: (p) => <span className="text-steel-900">{p.user?.name || '—'}</span> },
    {
      key: 'purpose',
      header: 'For',
      render: (p) => (
        <div className="whitespace-nowrap">
          <div className="text-steel-900">{pretty(p.purpose)}</div>
          {p.pickup?.pickupId && <div className="text-xs text-steel-500">{p.pickup.pickupId}</div>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (p) => {
        const inbound = p.direction === 'collection';
        return (
          <span className={inbound ? 'text-patina-700 font-semibold tabular whitespace-nowrap' : 'text-steel-900 font-semibold tabular whitespace-nowrap'}>
            {inbound ? '+' : '−'}
            {rupees(p.amount)}
          </span>
        );
      },
    },
    { key: 'method', header: 'Method', render: (p) => <span className="text-steel-700 whitespace-nowrap">{METHOD[p.method] || pretty(p.method)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <div className="whitespace-nowrap">
          <Badge tone={P_STATUS[p.status] || 'steel'} dot>
            {pretty(p.status)}
          </Badge>
          {p.isMock && <TestBadge />}
          {p.payoutReference && <div className="text-xs text-steel-500 mt-1 font-mono">{p.payoutReference}</div>}
        </div>
      ),
    },
  ];

  return (
    <>
      <Toolbar>
        <Field label="Status" className="w-[calc(50%-6px)] sm:w-40">
          {(id) => (
            <Select id={id} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
            </Select>
          )}
        </Field>
        <Field label="Method" className="w-[calc(50%-6px)] sm:w-44">
          {(id) => (
            <Select id={id} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">All methods</option>
              {Object.entries(METHOD).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Toolbar>
      {anyMock && (
        <Callout icon={FlaskConical} tone="amber" className="mb-4">
          Payments marked <strong>Test mode</strong> went through the mock gateway: no real money moved.
        </Callout>
      )}
      {res.error && !res.data ? (
        <Async {...res} onRetry={res.reload}>
          {() => null}
        </Async>
      ) : (
        <DataTable
          dense
          columns={columns}
          rows={res.data?.payments}
          loading={res.loading}
          empty={<EmptyState icon={CreditCard} title="No payments found" description={status || method ? 'Try different filters.' : undefined} />}
        />
      )}
      <Pagination pagination={res.data?.pagination} onPage={setPage} />
    </>
  );
}
