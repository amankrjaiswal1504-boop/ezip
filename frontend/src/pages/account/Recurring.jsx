import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pause, Play, Plus, Repeat, Trash2 } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import usePageMeta from '../../hooks/usePageMeta';
import { useConfig } from '../../context/ConfigContext';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, SkeletonRows } from '../../components/ui';
import { addressLine, fmtDay, unitLabel } from '../../utils/format';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQ = { weekly: 'Every week', biweekly: 'Every 2 weeks', monthly: 'Every month' };

function PlanForm({ onDone }) {
  const { config } = useConfig();
  const { data: addr } = useApi('/addresses');
  const addresses = addr?.addresses || [];
  const city = addresses[0]?.city;
  const { data: rates } = useApi('/scrap/rates', { params: { city }, enabled: Boolean(city) });
  const [form, setForm] = useState({ addressId: '', frequency: 'monthly', dayOfWeek: 6, dayOfMonth: 1, timeSlot: '', items: [{ itemId: '', estimatedQuantity: '' }] });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const slots = config?.slots?.slots || [];
  const addressId = form.addressId || addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || '';

  async function submit(e) {
    e.preventDefault();
    const items = form.items.filter((i) => i.itemId && Number(i.estimatedQuantity) > 0).map((i) => ({ itemId: i.itemId, estimatedQuantity: Number(i.estimatedQuantity) }));
    if (!items.length) return toast.error('Add at least one item with a quantity');
    if (!form.timeSlot && !slots[0]) return toast.error('Choose a time slot');
    setBusy(true);
    try {
      await api.post('/recurring', {
        addressId,
        items,
        frequency: form.frequency,
        dayOfWeek: Number(form.dayOfWeek),
        dayOfMonth: Number(form.dayOfMonth),
        timeSlot: form.timeSlot || slots[0].label,
      });
      toast.success('Recurring pickup created');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (addr && !addresses.length) return <p className="text-sm text-steel-600">Add an address first from the Addresses page.</p>;

  return (
    <form id="plan-form" onSubmit={submit} className="space-y-4">
      <Field label="Address">
        {(id) => (
          <Select id={id} value={addressId} onChange={(e) => set('addressId', e.target.value)}>
            {addresses.map((a) => (
              <option key={a._id} value={a._id}>
                {addressLine(a)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="How often">
          {(id) => (
            <Select id={id} value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
              {Object.entries(FREQ).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {form.frequency === 'monthly' ? (
          <Field label="Day of month">
            {(id) => (
              <Select id={id} value={form.dayOfMonth} onChange={(e) => set('dayOfMonth', e.target.value)}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <Field label="Day">
            {(id) => (
              <Select id={id} value={form.dayOfWeek} onChange={(e) => set('dayOfWeek', e.target.value)}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Time slot">
          {(id) => (
            <Select id={id} value={form.timeSlot || slots[0]?.label || ''} onChange={(e) => set('timeSlot', e.target.value)}>
              {slots.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div>
        <div className="label">Items each time</div>
        <div className="space-y-2">
          {form.items.map((it, i) => {
            const rate = rates?.rates.find((r) => r.itemId === it.itemId);
            return (
              <div key={i} className="grid grid-cols-[1fr_6rem] gap-2">
                <Select aria-label="Item" value={it.itemId} onChange={(e) => set('items', form.items.map((x, j) => (j === i ? { ...x, itemId: e.target.value } : x)))}>
                  <option value="">Select item</option>
                  {(rates?.rates || []).map((r) => (
                    <option key={r.itemId} value={r.itemId}>
                      {r.name}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  placeholder={unitLabel(rate?.unit || 'kg')}
                  value={it.estimatedQuantity}
                  onChange={(e) => set('items', form.items.map((x, j) => (j === i ? { ...x, estimatedQuantity: e.target.value } : x)))}
                />
              </div>
            );
          })}
        </div>
        <button type="button" className="text-sm link mt-2" onClick={() => set('items', [...form.items, { itemId: '', estimatedQuantity: '' }])}>
          + Add item
        </button>
      </div>
      <Button type="submit" loading={busy} className="w-full">
        Create recurring pickup
      </Button>
    </form>
  );
}

export default function Recurring() {
  usePageMeta({ title: 'Recurring pickups', noindex: true });
  const { data, error, loading, reload } = useApi('/recurring');
  const [open, setOpen] = useState(false);

  async function toggle(plan) {
    try {
      await api.put(`/recurring/${plan._id}`, { isActive: !plan.isActive });
      toast.success(plan.isActive ? 'Paused' : 'Resumed');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function remove(plan) {
    if (!window.confirm('Delete this recurring pickup?')) return;
    try {
      await api.delete(`/recurring/${plan._id}`);
      toast.success('Deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Recurring pickups"
        subtitle="Perfect for shops, offices and societies. We book each pickup automatically two days ahead."
        actions={
          <Button icon={Plus} onClick={() => setOpen(true)}>
            New schedule
          </Button>
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : !data.plans.length ? (
        <EmptyState icon={Repeat} title="No recurring pickups" description="Set it once and forget it: weekly, fortnightly or monthly." action={<Button onClick={() => setOpen(true)}>Create one</Button>} />
      ) : (
        <div className="space-y-3">
          {data.plans.map((p) => (
            <Card key={p._id} className="flex flex-wrap gap-4 items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-steel-900">
                    {FREQ[p.frequency]}
                    {p.frequency === 'monthly' ? ` on day ${p.dayOfMonth}` : ` on ${DAYS[p.dayOfWeek]}`}
                  </span>
                  <Badge tone={p.isActive ? 'patina' : 'steel'}>{p.isActive ? 'Active' : 'Paused'}</Badge>
                </div>
                <div className="text-sm text-steel-500 mt-1">
                  {p.timeSlot} · {p.items.map((i) => `${i.item?.name} × ${i.estimatedQuantity} ${unitLabel(i.item?.unit)}`).join(', ')}
                </div>
                <div className="text-xs text-steel-500 mt-0.5">
                  {addressLine(p.address)}
                  {p.isActive && ` · Next: ${fmtDay(p.nextRunDate)}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={p.isActive ? Pause : Play} onClick={() => toggle(p)}>
                  {p.isActive ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(p)} aria-label="Delete schedule" />
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New recurring pickup" size="lg">
        {open && (
          <PlanForm
            onDone={() => {
              setOpen(false);
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
