import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function Receipt() {
  const { id } = useParams();
  const [pickup, setPickup] = useState(null);

  useEffect(() => {
    api.get(`/pickups/${id}`).then((res) => setPickup(res.data.data.pickup));
  }, [id]);

  if (!pickup) return <div className="max-w-2xl mx-auto px-5 py-16 text-steel-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="font-head font-semibold text-lg">ScrapMate</div>
            <div className="text-xs text-steel-500">Digital receipt</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">{pickup.pickupId}</div>
            <div className="text-steel-500">{new Date(pickup.scheduledDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="text-sm mb-6">
          <div><b>Customer:</b> {pickup.customer?.name}</div>
          <div><b>Collector:</b> {pickup.collector?.name || '—'}</div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="text-left text-steel-500 border-b border-steel-100">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Weight</th>
              <th className="py-2 font-medium">Rate</th>
              <th className="py-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pickup.items.map((it) => (
              <tr key={it.itemName} className="border-b border-steel-100">
                <td className="py-2">{it.itemName}</td>
                <td className="py-2">{it.actualWeight ?? '—'}</td>
                <td className="py-2">{it.rateApplied ? `₹${it.rateApplied}` : '—'}</td>
                <td className="py-2 text-right">{it.subtotal ? `₹${it.subtotal.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between font-head font-semibold text-lg mb-6">
          <span>Total</span>
          <span>₹{(pickup.finalAmount || 0).toFixed(2)}</span>
        </div>

        <p className="text-xs text-steel-500 text-center border-t border-steel-100 pt-4">
          Thank you for recycling with ScrapMate — every kilogram counts toward a cleaner future.
        </p>
      </div>

      <button className="btn-outline w-full mt-4 text-sm" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}
