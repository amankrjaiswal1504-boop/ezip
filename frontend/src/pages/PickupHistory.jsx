import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function PickupHistory() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pickups').then((res) => setPickups(res.data.data.pickups)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-6">Pickup history</h1>
      {loading && <p className="text-steel-500 text-sm">Loading…</p>}
      {!loading && pickups.length === 0 && <p className="text-steel-500 text-sm">No pickups yet.</p>}

      <div className="border border-steel-100 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-steel-100 text-left text-steel-700">
            <tr>
              <th className="px-4 py-2 font-medium">Pickup ID</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Categories</th>
              <th className="px-4 py-2 font-medium">Final amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pickups.map((p) => (
              <tr key={p.pickupId} className="border-t border-steel-100">
                <td className="px-4 py-2 font-medium">{p.pickupId}</td>
                <td className="px-4 py-2">{new Date(p.scheduledDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">{p.items.map((i) => i.itemName).join(', ')}</td>
                <td className="px-4 py-2">{p.finalAmount ? `₹${p.finalAmount.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-2">{p.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2">
                  <Link to={`/pickups/${p.pickupId}`} className="text-rust-600 font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
