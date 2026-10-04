import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import useApi from '../../hooks/useApi';
import usePageMeta from '../../hooks/usePageMeta';
import { useI18n } from '../../i18n/I18nContext';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, SkeletonRows, StatusBadge, Tabs, Badge } from '../../components/ui';
import { fmtDay, rupees } from '../../utils/format';

export default function MyPickups() {
  const { t } = useI18n();
  usePageMeta({ title: t('dash.pickups'), noindex: true });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/pickups', { params: { status: status || undefined, page, limit: 10 } });

  return (
    <div>
      <PageHeader title={t('dash.pickups')} actions={<Button to="/schedule-pickup" icon={Plus}>{t('nav.book')}</Button>} />
      <Tabs
        className="mb-5"
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        tabs={[
          { value: '', label: 'All' },
          { value: 'active', label: 'Upcoming' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows rows={5} />
      ) : !data.pickups.length ? (
        <EmptyState icon={Package} title="No pickups here" action={<Button to="/schedule-pickup">{t('nav.book')}</Button>} />
      ) : (
        <>
          <div className="space-y-3">
            {data.pickups.map((p) => (
              <Link key={p._id} to={`/pickups/${p.pickupId}`} className="block bg-surface border border-steel-100 rounded-xl p-4 hover:border-steel-300 transition-colors">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-steel-900">{p.pickupId}</span>
                      <StatusBadge status={p.status} />
                      {p.type === 'donation' && <Badge tone="patina">Donation</Badge>}
                    </div>
                    <div className="text-sm text-steel-500 mt-1">
                      {fmtDay(p.scheduledDate)} · {p.timeSlot}
                    </div>
                    <div className="text-sm text-steel-700 mt-1 truncate">{p.items.map((i) => i.itemName).join(', ')}</div>
                  </div>
                  <div className="text-right">
                    {p.type !== 'donation' &&
                      (p.finalAmount != null ? (
                        <div className="font-head text-lg font-semibold text-steel-900 tabular">{rupees((p.finalAmount || 0) + (p.bonusAmount || 0))}</div>
                      ) : (
                        <div className="text-sm text-steel-600 tabular">
                          Est. {rupees(p.estimatedValueMin)}–{rupees(p.estimatedValueMax)}
                        </div>
                      ))}
                    {p.collector && <div className="text-xs text-steel-500 mt-1">{p.collector.name}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
