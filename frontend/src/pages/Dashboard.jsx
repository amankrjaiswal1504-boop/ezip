import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/pickups')
      .then((res) => setPickups(res.data.data.pickups))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = pickups.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status));
  const past = pickups.filter((p) => ['COMPLETED', 'CANCELLED'].includes(p.status));
  const totalSold = past
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.finalAmount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-head text-2xl font-semibold">Dashboard</h1>
        <Link to="/schedule-pickup" className="btn-primary text-sm">
          Schedule pickup
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="text-steel-500 text-sm">Upcoming pickups</div>
          <div className="font-head text-2xl font-semibold mt-1">{upcoming.length}</div>
        </div>
        <div className="card">
          <div className="text-steel-500 text-sm">Total pickups completed</div>
          <div className="font-head text-2xl font-semibold mt-1">
            {past.filter((p) => p.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="card">
          <div className="text-steel-500 text-sm">Total amount received</div>
          <div className="font-head text-2xl font-semibold mt-1">₹{totalSold.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="font-head font-semibold text-lg mb-3">Upcoming</h2>
      {loading && <p className="text-steel-500 text-sm">Loading…</p>}
      {!loading && upcoming.length === 0 && (
        <p className="text-steel-500 text-sm mb-8">No upcoming pickups. Schedule one to get started.</p>
      )}
      <div className="space-y-3 mb-10">
        {upcoming.map((p) => (
          <Link
            to={`/pickups/${p.pickupId}`}
            key={p.pickupId}
            className="card flex items-center justify-between hover:border-steel-300"
          >
            <div>
              <div className="font-medium">{p.pickupId}</div>
              <div className="text-steel-500 text-sm">
                {new Date(p.scheduledDate).toLocaleDateString()} · {p.timeSlot}
              </div>
            </div>
            <span className="text-xs font-medium bg-patina-100 text-patina-700 px-2.5 py-1 rounded-sm">
              {p.status.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-head font-semibold text-lg">Recent history</h2>
        <Link to="/pickups" className="text-sm text-rust-600 font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {past.slice(0, 5).map((p) => (
          <Link
            to={`/pickups/${p.pickupId}`}
            key={p.pickupId}
            className="card flex items-center justify-between hover:border-steel-300"
          >
            <div>
              <div className="font-medium">{p.pickupId}</div>
              <div className="text-steel-500 text-sm">{new Date(p.scheduledDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{p.finalAmount ? `₹${p.finalAmount.toFixed(2)}` : '—'}</div>
              <div className="text-xs text-steel-400">{p.status}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
