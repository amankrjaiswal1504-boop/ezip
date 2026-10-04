// Helpers shared by the admin operations pages (dashboard, dispatch, pickups,
// people, fraud, audit). Kept local to these pages on purpose.
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Search } from 'lucide-react';
import { download } from '../../../services/api';
import useApi from '../../../hooks/useApi';
import { Button, Card, Field, Input, Modal, Select, cx } from '../../../components/ui';

export const pct = (v, digits = 0) => (v == null || Number.isNaN(Number(v)) ? '—' : `${(Number(v) * 100).toFixed(digits)}%`);

// Run a mutation with toasts and a busy flag. Returns the response data or null.
export function useMutation() {
  const [busy, setBusy] = useState(null);
  const run = useCallback(async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      if (success) toast.success(typeof success === 'function' ? success(res?.data?.data) : success);
      return res?.data?.data ?? true;
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      return null;
    } finally {
      setBusy(null);
    }
  }, []);
  return { busy, run };
}

// Build a query string from an object, skipping empty values.
export function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null && v !== false) s.set(k, v);
  });
  return s.toString();
}

export function ExportButton({ path, filename, label = 'Export CSV', variant = 'outline', size = 'md' }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      await download(path, filename);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant={variant} size={size} icon={Download} loading={busy} onClick={go}>
      {label}
    </Button>
  );
}

export function FilterBar({ children, className }) {
  return <Card className={cx('flex flex-wrap items-end gap-3 mb-5 !p-4', className)}>{children}</Card>;
}

export function SearchField({ value, onChange, label = 'Search', placeholder, className = 'flex-1 min-w-[200px]' }) {
  return (
    <Field label={label} className={className}>
      {(id) => (
        <div className="relative">
          <Search className="w-4 h-4 text-steel-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
          <Input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="!pl-9" />
        </div>
      )}
    </Field>
  );
}

export function useCollectorOptions(enabled = true) {
  const { data, loading } = useApi('/admin/collectors', { params: { available: 'true', limit: 100 }, enabled });
  return { collectors: data?.collectors || [], loading };
}

// Pick a collector for one or more pickups.
export function AssignModal({ open, onClose, title = 'Assign collector', count = 1, onAssign, busy }) {
  const { collectors, loading } = useCollectorOptions(open);
  const [collectorId, setCollectorId] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!collectorId} loading={busy} onClick={() => onAssign(collectorId)}>
            Assign{count > 1 ? ` ${count} pickups` : ''}
          </Button>
        </>
      }
    >
      <Field label="Collector" hint={loading ? 'Loading available collectors…' : `${collectors.length} available collectors`}>
        {(id) => (
          <Select id={id} value={collectorId} onChange={(e) => setCollectorId(e.target.value)}>
            <option value="">Choose a collector</option>
            {collectors.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} · {c.collectorProfile?.city || '—'} · {c.activePickups} active
              </option>
            ))}
          </Select>
        )}
      </Field>
    </Modal>
  );
}

export function CityField({ value, onChange, cities, label = 'City', className = 'w-full sm:w-44' }) {
  return (
    <Field label={label} className={className}>
      {(id) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

export const FLAG_LABEL = {
  duplicate: 'Possible duplicate',
  high_value: 'High value',
  blocked: 'Blocklisted',
  frequent_cancel: 'Frequent canceller',
};
export const flagLabel = (f) => FLAG_LABEL[f] || String(f).replace(/[_-]/g, ' ');
