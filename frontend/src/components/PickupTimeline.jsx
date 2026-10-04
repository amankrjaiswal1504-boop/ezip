import { Check, Package, Scale, Truck, UserCheck, MapPin, CircleCheckBig, XCircle } from 'lucide-react';
import { STATUS_LABEL, STATUS_STEPS, fmtDateTime } from '../utils/format';
import { cx } from './ui';

const ICONS = {
  BOOKED: Package,
  ASSIGNED: UserCheck,
  COLLECTOR_ON_THE_WAY: Truck,
  ARRIVED: MapPin,
  WEIGHING: Scale,
  COMPLETED: CircleCheckBig,
};

// Vertical status timeline with timestamps from statusHistory.
export default function PickupTimeline({ status, history = [] }) {
  if (status === 'CANCELLED') {
    const at = history.find((h) => h.status === 'CANCELLED')?.at;
    return (
      <div className="flex items-center gap-3 text-danger-700">
        <XCircle className="w-6 h-6" aria-hidden />
        <div>
          <div className="font-medium">Cancelled</div>
          {at && <div className="text-xs text-steel-500">{fmtDateTime(at)}</div>}
        </div>
      </div>
    );
  }
  const current = STATUS_STEPS.indexOf(status);
  return (
    <ol className="relative">
      {STATUS_STEPS.map((step, i) => {
        const done = i < current || status === 'COMPLETED';
        const active = i === current && status !== 'COMPLETED';
        const Icon = ICONS[step];
        const at = [...history].reverse().find((h) => h.status === step)?.at;
        return (
          <li key={step} className="flex gap-3 pb-5 last:pb-0 relative">
            {i < STATUS_STEPS.length - 1 && (
              <span className={cx('absolute left-[15px] top-8 bottom-0 w-0.5', i < current ? 'bg-patina-600' : 'bg-steel-200')} aria-hidden />
            )}
            <span
              className={cx(
                'relative z-[1] w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                done && 'bg-patina-600 border-patina-600 text-white',
                active && 'bg-surface border-rust-600 text-rust-600 ring-4 ring-rust-100',
                !done && !active && 'bg-surface border-steel-200 text-steel-400'
              )}
            >
              {done ? <Check className="w-4 h-4" aria-hidden /> : <Icon className="w-4 h-4" aria-hidden />}
            </span>
            <div className="pt-1">
              <div className={cx('text-sm font-medium', done || active ? 'text-steel-900' : 'text-steel-400')}>
                {STATUS_LABEL[step]}
                {active && <span className="sr-only"> (current)</span>}
              </div>
              {at && <div className="text-xs text-steel-500">{fmtDateTime(at)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
