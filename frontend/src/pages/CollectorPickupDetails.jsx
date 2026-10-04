import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const NEXT_STATUS = {
  ASSIGNED: 'COLLECTOR_ON_THE_WAY',
  COLLECTOR_ON_THE_WAY: 'ARRIVED',
  ARRIVED: 'WEIGHING',
};

export default function CollectorPickupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [weights, setWeights] = useState({});
  const [rateChoice, setRateChoice] = useState('avg');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/collector/pickups/${id}`).then((res) => setPickup(res.data.data.pickup));
  }
  useEffect(load, [id]);

  async function advanceStatus() {
    const next = NEXT_STATUS[pickup.status];
    if (!next) return;
    setBusy(true);
    try {
      await api.put(`/collector/pickups/${id}/status`, { status: next });
      toast.success(`Marked as ${next.replace(/_/g, ' ')}`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitWeighing() {
    setBusy(true);
    try {
      const weighedItems = pickup.items.map((i) => ({
        itemName: i.itemName,
        actualWeight: Number(weights[i.itemName]) || 0,
      }));
      const res = await api.put(`/collector/pickups/${id}/weighing`, { weighedItems, rateChoice });
      setPickup(res.data.data.pickup);
      toast.success('Weighing recorded — review and complete');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function completePickup() {
    setBusy(true);
    try {
      await api.put(`/collector/pickups/${id}/complete`, {});
      toast.success('Pickup completed');
      navigate('/collector');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!pickup) return <div className="max-w-2xl mx-auto px-5 py-16 text-steel-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-head text-2xl font-semibold mb-1">{pickup.pickupId}</h1>
      <p className="text-steel-500 text-sm mb-6">Status: {pickup.status.replace(/_/g, ' ')}</p>

      <div className="card mb-6 text-sm space-y-1">
        <div><b>Customer:</b> {pickup.customer?.name} · {pickup.customer?.phone}</div>
        <div><b>Address:</b> {pickup.addressSnapshot.houseNumber}, {pickup.addressSnapshot.street}, {pickup.addressSnapshot.city}</div>
        <div><b>Items:</b> {pickup.items.map((i) => `${i.itemName} (~${i.estimatedQuantity})`).join(', ')}</div>
      </div>

      {NEXT_STATUS[pickup.status] && (
        <button className="btn-primary text-sm mb-6" onClick={advanceStatus} disabled={busy}>
          Mark as {NEXT_STATUS[pickup.status].replace(/_/g, ' ')}
        </button>
      )}

      {(pickup.status === 'ARRIVED' || pickup.status === 'WEIGHING') && (
        <div className="card mb-6">
          <h2 className="font-medium mb-3">Final weighing</h2>
          <div className="space-y-2 mb-3">
            {pickup.items.map((i) => (
              <div key={i.itemName} className="flex items-center justify-between gap-3 text-sm">
                <span>{i.itemName}</span>
                <input
                  type="number"
                  className="input w-28"
                  placeholder="kg"
                  defaultValue={i.actualWeight || ''}
                  onChange={(e) => setWeights((w) => ({ ...w, [i.itemName]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <select className="input mb-3" value={rateChoice} onChange={(e) => setRateChoice(e.target.value)}>
            <option value="min">Apply minimum rate</option>
            <option value="avg">Apply average rate</option>
            <option value="max">Apply maximum rate</option>
          </select>
          <button className="btn-secondary text-sm" onClick={submitWeighing} disabled={busy}>
            Calculate final amount
          </button>

          {pickup.finalAmount !== undefined && pickup.finalAmount !== null && (
            <div className="mt-4 border-t border-steel-100 pt-4">
              <div className="font-head text-xl font-semibold mb-3">Total: ₹{pickup.finalAmount.toFixed(2)}</div>
              <button className="btn-primary text-sm" onClick={completePickup} disabled={busy}>
                Mark pickup completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
