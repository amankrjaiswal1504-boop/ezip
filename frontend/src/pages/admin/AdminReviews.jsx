import { useEffect, useState } from 'react';
import { Check, MessageSquareQuote, Sparkles, X } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Pagination, Stars, Tabs, Toggle, cx } from '../../components/ui';
import { Async, Callout, useAction } from './_catalog/shared';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminReviews() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);
  const res = useApi('/admin/reviews', { params: { status, page, limit: 20 } });
  const { busy, run } = useAction();

  async function moderate(r, body, success) {
    const out = await run(`${r._id}`, () => api.put(`/admin/reviews/${r._id}`, body), { success });
    if (!out.ok) return;
    if (body.status && body.status !== status) {
      // Moved to another tab: drop it from this list.
      res.setData((d) => ({ ...d, reviews: d.reviews.filter((x) => x._id !== r._id) }));
      if (res.data?.reviews?.length <= 1) res.reload();
    } else {
      res.setData((d) => ({ ...d, reviews: d.reviews.map((x) => (x._id === r._id ? { ...x, ...body } : x)) }));
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Approve customer reviews before they count toward a collector's rating." />
      <Callout icon={Sparkles} tone="rust" className="mb-6">
        Featured reviews that are approved appear on the home page as testimonials. Feature short, specific reviews with a comment.
      </Callout>
      <Tabs
        className="mb-5"
        value={status}
        onChange={setStatus}
        tabs={TABS.map((t) => ({ ...t, count: t.value === status ? res.data?.pagination?.total : undefined }))}
      />
      <Async
        {...res}
        onRetry={res.reload}
        isEmpty={(d) => !d.reviews.length}
        empty={
          <EmptyState
            icon={MessageSquareQuote}
            title={status === 'pending' ? 'All caught up' : `No ${status} reviews`}
            description={status === 'pending' ? 'New reviews from customers will appear here for moderation.' : undefined}
          />
        }
      >
        {(d) => (
          <ul className={cx('space-y-3 transition-opacity', res.loading && 'opacity-60')}>
            {d.reviews.map((r) => (
              <li key={r._id}>
                <Card className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Avatar name={r.customer?.name || '?'} size="sm" />
                      <span className="font-medium text-steel-900">{r.customer?.name || 'Customer'}</span>
                      <Stars value={r.rating} />
                      {r.featured && <Badge tone="amber">Featured</Badge>}
                    </div>
                    {r.comment ? (
                      <p className="text-steel-700 mt-3 whitespace-pre-line break-words">“{r.comment}”</p>
                    ) : (
                      <p className="text-sm text-steel-400 italic mt-3">No written comment</p>
                    )}
                    <p className="text-xs text-steel-500 mt-3">
                      {fmtDate(r.createdAt)}
                      {r.pickup?.pickupId && <> · Pickup {r.pickup.pickupId}</>}
                      {r.collector?.name && <> · Collector {r.collector.name}</>}
                    </p>
                  </div>
                  <div className="flex sm:flex-col flex-wrap gap-2 sm:items-end sm:w-48 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-steel-100">
                    {r.status !== 'approved' && (
                      <Button size="sm" icon={Check} loading={busy === r._id} onClick={() => moderate(r, { status: 'approved' }, 'Review approved')}>
                        Approve
                      </Button>
                    )}
                    {r.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={X}
                        disabled={busy === r._id}
                        onClick={() => moderate(r, { status: 'rejected', ...(r.featured ? { featured: false } : {}) }, 'Review rejected')}
                      >
                        Reject
                      </Button>
                    )}
                    {r.status === 'approved' && (
                      <Toggle
                        checked={!!r.featured}
                        disabled={busy === r._id}
                        onChange={(v) => moderate(r, { featured: v }, v ? 'Featured on the home page' : 'Removed from the home page')}
                        label="Feature on home"
                      />
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Async>
      <Pagination pagination={res.data?.pagination} onPage={setPage} />
    </div>
  );
}
