import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';
import { useRealtime } from '../../context/RealtimeContext';
import { Button, Card, EmptyState, PageHeader, cx } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function Notifications() {
  usePageMeta({ title: 'Notifications', noindex: true });
  const { notifications, unread, markRead, reload } = useRealtime();
  const navigate = useNavigate();
  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Pickup updates, payments, price alerts and rewards."
        actions={unread > 0 && <Button variant="outline" icon={CheckCheck} onClick={() => markRead('all')}>Mark all read</Button>}
      />
      {!notifications.length ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-steel-100">
            {notifications.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  className={cx('w-full text-left px-5 py-4 flex gap-3 hover:bg-steel-50', !n.read && 'bg-rust-50/50')}
                  onClick={() => {
                    if (!n.read) markRead(n._id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', n.read ? 'bg-steel-200' : 'bg-rust-600')} aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm text-steel-900">{n.title}</span>
                    <span className="block text-sm text-steel-600">{n.body}</span>
                    <span className="block text-xs text-steel-400 mt-1">{fmtDateTime(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
