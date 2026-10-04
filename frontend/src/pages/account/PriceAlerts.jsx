import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Trash2 } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import usePageMeta from '../../hooks/usePageMeta';
import { Button, Card, EmptyState, ErrorState, PageHeader, SkeletonRows } from '../../components/ui';
import { fmtDateTime, rupees, unitLabel } from '../../utils/format';

export default function PriceAlerts() {
  usePageMeta({ title: 'Price alerts', noindex: true });
  const { data, error, loading, reload } = useApi('/price-alerts');

  async function remove(id) {
    try {
      await api.delete(`/price-alerts/${id}`);
      toast.success('Alert removed');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Price alerts" subtitle="We notify you by app, email and WhatsApp when a rate crosses your target." actions={<Button to="/rates" icon={Bell}>Add from rates</Button>} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : !data.alerts.length ? (
        <EmptyState
          icon={Bell}
          title="No price alerts"
          description="Open any item's price trend on the rates page and set a target."
          action={
            <Link to="/rates" className="btn-primary">
              Browse rates
            </Link>
          }
        />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-steel-100">
            {data.alerts.map((a) => (
              <li key={a._id} className="flex items-center gap-3 px-5 py-4">
                <span className="w-9 h-9 rounded-full bg-rust-50 text-rust-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-steel-900 text-sm">
                    {a.item?.name} in {a.city} goes {a.direction} {rupees(a.threshold)}/{unitLabel(a.item?.unit)}
                  </div>
                  <div className="text-xs text-steel-500">{a.lastTriggeredAt ? `Last triggered ${fmtDateTime(a.lastTriggeredAt)}` : 'Not triggered yet'}</div>
                </div>
                <button type="button" onClick={() => remove(a._id)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-steel-500 hover:bg-steel-100" aria-label="Delete alert">
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
