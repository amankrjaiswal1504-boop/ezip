import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function CollectorDashboard() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/collector/pickups').then((res) => setPickups(res.data.data.pickups)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-head text-2xl font-semibold mb-6">Assigned pickups</h1>
      {loading && <p className="text-steel-500 text-sm">Loading…</p>}
      {!loading && pickups.length === 0 && <p className="text-steel-500 text-sm">No pickups assigned yet.</p>}

      <div className="space-y-3">
        {pickups.map((p) => (
          <Link key={p.pickupId} to={`/collector/pickups/${p.pickupId}`} className="card flex items-center justify-between hover:border-steel-300">
            <div>
              <div className="font-medium">{p.pickupId}</div>
              <div className="text-steel-500 text-sm">
                {p.customer?.name} · {new Date(p.scheduledDate).toLocaleDateString()} · {p.timeSlot}
              </div>
            </div>
            <span className="text-xs font-medium bg-patina-100 text-patina-700 px-2.5 py-1 rounded-sm">
              {p.status.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
