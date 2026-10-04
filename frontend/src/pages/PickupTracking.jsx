import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const TIMELINE = ['BOOKED', 'ASSIGNED', 'COLLECTOR_ON_THE_WAY', 'ARRIVED', 'WEIGHING', 'COMPLETED'];

export default function PickupTracking() {
  const { id } = useParams();
  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/pickups/${id}`)
      .then((res) => setPickup(res.data.data.pickup))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-16 text-steel-500">Loading…</div>;
  if (error) return <div className="max-w-2xl mx-auto px-5 py-16 text-rust-600">{error}</div>;
  if (!pickup) return null;

  const currentIndex = TIMELINE.indexOf(pickup.status);

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-2xl font-semibold">{pickup.pickupId}</h1>
          <p className="text-steel-500 text-sm">
            {new Date(pickup.scheduledDate).toLocaleDateString()} · {pickup.timeSlot}
          </p>
        </div>
        {pickup.status === 'COMPLETED' && (
          <Link to={`/receipt/${pickup.pickupId}`} className="btn-outline text-sm">
            View receipt
          </Link>
        )}
      </div>

      {pickup.status === 'CANCELLED' ? (
        <div className="card bg-rust-100/40 border-rust-100">
          <p className="font-medium text-rust-700">This pickup was cancelled.</p>
          {pickup.cancelReason && <p className="text-sm text-steel-600 mt-1">{pickup.cancelReason}</p>}
        </div>
      ) : (
        <div className="card mb-6">
          <div className="flex flex-col gap-4">
            {TIMELINE.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    i <= currentIndex ? 'bg-patina-600' : 'bg-steel-200'
                  }`}
                />
                <span className={i <= currentIndex ? 'text-steel-900 font-medium text-sm' : 'text-steel-400 text-sm'}>
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="font-medium mb-3">Details</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-steel-500">Collector</dt>
            <dd>{pickup.collector ? `${pickup.collector.name} · ${pickup.collector.phone}` : 'Not yet assigned'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-500">Address</dt>
            <dd className="text-right max-w-xs">
              {pickup.addressSnapshot.houseNumber}, {pickup.addressSnapshot.street}, {pickup.addressSnapshot.city}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-500">Scrap</dt>
            <dd>{pickup.items.map((i) => i.itemName).join(', ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-500">Estimated value</dt>
            <dd>₹{pickup.estimatedValueMin} – ₹{pickup.estimatedValueMax}</dd>
          </div>
          {pickup.finalAmount !== undefined && pickup.finalAmount !== null && (
            <div className="flex justify-between font-medium">
              <dt>Final amount</dt>
              <dd>₹{pickup.finalAmount.toFixed(2)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
