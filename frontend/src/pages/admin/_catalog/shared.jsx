// Small helpers shared by the catalog / growth / settings admin pages.
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';
import PhotoUploader from '../../../components/PhotoUploader';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal as KitModal, SkeletonRows, cx } from '../../../components/ui';

// The kit Modal re-runs its focus trap whenever onClose changes identity, which
// would steal focus on every parent re-render. Keep onClose stable.
export function Modal({ onClose, ...rest }) {
  const ref = useRef(onClose);
  ref.current = onClose;
  const stable = useCallback(() => ref.current?.(), []);
  return <KitModal onClose={stable} {...rest} />;
}

// Wrap a mutation: tracks busy state and shows toasts.
export function useAction() {
  const [busy, setBusy] = useState(null);
  const run = useCallback(async (key, fn, { success, error } = {}) => {
    setBusy(key);
    try {
      const out = await fn();
      if (success) toast.success(typeof success === 'function' ? success(out) : success);
      return { ok: true, out };
    } catch (err) {
      toast.error(error || err.message || 'Something went wrong');
      return { ok: false, err };
    } finally {
      setBusy(null);
    }
  }, []);
  return { busy, run };
}

// Loading / error / empty wrapper for async views.
export function Async({ loading, error, data, onRetry, empty, isEmpty, rows = 4, children }) {
  if (error && !data) return <ErrorState error={error} onRetry={onRetry} />;
  if (!data) return loading ? <SkeletonRows rows={rows} /> : null;
  if (isEmpty && isEmpty(data)) return empty || <EmptyState title="Nothing here yet" />;
  return children(data);
}

// Number input that keeps '' when cleared (so validation can say "required").
export function NumberInput({ value, onChange, ...rest }) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      {...rest}
    />
  );
}

export const isBlank = (v) => v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));
export const toNumOrNull = (v) => (isBlank(v) ? null : Number(v));

// Single-image picker (value is a URL string).
export function ImageField({ label = 'Image', value, onChange, folder, hint }) {
  return (
    <div>
      <span className="label">{label}</span>
      <PhotoUploader value={value ? [value] : []} onChange={(urls) => onChange(urls[0] || '')} max={1} folder={folder} label="Upload" />
      {hint && <p className="text-steel-500 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

export function Callout({ icon: Icon = Info, tone = 'steel', children, className }) {
  const tones = {
    steel: 'bg-surface-2 border-steel-100 text-steel-700',
    rust: 'bg-rust-50 border-rust-100 text-steel-700',
    amber: 'bg-amber-50 border-amber-100 text-steel-700',
    patina: 'bg-patina-50 border-patina-100 text-steel-700',
  };
  const iconTone = { steel: 'text-steel-500', rust: 'text-rust-600', amber: 'text-amber-600', patina: 'text-patina-600' };
  return (
    <div className={cx('flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>
      <Icon className={cx('w-4 h-4 mt-0.5 shrink-0', iconTone[tone])} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Toolbar({ children, className }) {
  return <div className={cx('flex flex-wrap items-end gap-3 mb-4', className)}>{children}</div>;
}

export function ConfirmModal({ open, onClose, title, children, confirmLabel = 'Confirm', variant = 'primary', busy, onConfirm, disabled }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={busy} disabled={disabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-steel-700 space-y-3">{children}</div>
    </Modal>
  );
}

// Chip toggles for a fixed set of options plus free-typed extras.
export function ChipToggles({ options, value = [], onChange, label, allowCustom, customPlaceholder = 'Add another' }) {
  const [text, setText] = useState('');
  const all = [...new Set([...options, ...value])];
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  function add() {
    const t = text.trim();
    if (t.length >= 2 && !value.includes(t)) onChange([...value, t]);
    setText('');
  }
  return (
    <fieldset>
      {label && <legend className="label">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              className={cx(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                on ? 'bg-rust-50 border-rust-500 text-rust-700' : 'bg-surface border-steel-200 text-steel-600 hover:border-steel-400'
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={customPlaceholder}
            aria-label={customPlaceholder}
            className="max-w-[220px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={add} disabled={text.trim().length < 2}>
            Add
          </Button>
        </div>
      )}
    </fieldset>
  );
}

// Labelled section inside a form.
export function FormSection({ title, description, children }) {
  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-steel-900">{title}</h3>}
          {description && <p className="text-xs text-steel-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function KeyValue({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-steel-500">{label}</dt>
      <dd className="text-sm text-steel-900 mt-0.5 break-words">{children ?? '—'}</dd>
    </div>
  );
}

export function Thumb({ src, alt = '', fallback: Fallback, className }) {
  return (
    <span className={cx('w-10 h-10 rounded-lg bg-steel-100 text-steel-500 inline-flex items-center justify-center overflow-hidden shrink-0', className)}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" /> : Fallback ? <Fallback className="w-5 h-5" aria-hidden /> : null}
    </span>
  );
}

export const maskAccount = (n) => {
  const s = String(n || '');
  if (!s) return '—';
  return `•••• ${s.slice(-4)}`;
};

export { Card, Field };
