import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, MapPin, Plus, Star, Trash2, XCircle } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import usePageMeta from '../../hooks/usePageMeta';
import { Badge, Button, Card, EmptyState, ErrorState, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import AddressForm from '../../components/AddressForm';
import { addressLine } from '../../utils/format';

export default function Addresses() {
  usePageMeta({ title: 'Addresses', noindex: true });
  const { data, error, loading, reload } = useApi('/addresses');
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [busy, setBusy] = useState(false);

  async function save(addr) {
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/addresses', addr);
      else await api.put(`/addresses/${editing._id}`, addr);
      toast.success('Address saved');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(a) {
    try {
      await api.put(`/addresses/${a._id}`, { isDefault: true });
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(a) {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${a._id}`);
      toast.success('Address deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Saved addresses" actions={<Button icon={Plus} onClick={() => setEditing('new')}>Add address</Button>} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : !data.addresses.length ? (
        <EmptyState icon={MapPin} title="No saved addresses" action={<Button onClick={() => setEditing('new')}>Add your first address</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.addresses.map((a) => {
            const { _id, user, createdAt, updatedAt, __v, serviceable, serviceReason, ...fields } = a;
            return (
              <Card key={a._id} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rust-600" aria-hidden />
                  <span className="font-medium capitalize text-steel-900">{a.addressType}</span>
                  {a.isDefault && <Badge tone="rust">Default</Badge>}
                </div>
                <p className="text-sm text-steel-600 mt-2 flex-1">
                  {addressLine(a)}
                  {a.landmark ? ` (near ${a.landmark})` : ''}
                </p>
                <p className={`text-xs mt-2 flex items-center gap-1 ${serviceable ? 'text-patina-700' : 'text-danger-600'}`}>
                  {serviceable ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> : <XCircle className="w-3.5 h-3.5" aria-hidden />}
                  {serviceable ? 'We pick up here' : serviceReason}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setEditing({ _id, ...fields })}>
                    Edit
                  </Button>
                  {!a.isDefault && (
                    <Button variant="ghost" size="sm" icon={Star} onClick={() => makeDefault(a)}>
                      Make default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={Trash2} className="ml-auto !text-danger-600" onClick={() => remove(a)} aria-label="Delete address" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'} size="lg">
        {editing && (
          <AddressForm
            initial={editing === 'new' ? undefined : (({ _id, isDefault, ...rest }) => rest)(editing)}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        )}
      </Modal>
    </div>
  );
}
