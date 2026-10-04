import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data.data));
  }, []);

  if (!stats) return <p className="text-steel-500 text-sm">Loading…</p>;

  const cards = [
    ['Total customers', stats.totalCustomers],
    ['Total collectors', stats.totalCollectors],
    ['Total pickups', stats.totalPickups],
    ['Completed pickups', stats.completedPickups],
    ['Pending pickups', stats.pendingPickups],
    ['Cancelled pickups', stats.cancelledPickups],
    ['Total amount paid', `₹${stats.totalAmountPaid.toFixed(2)}`],
  ];

  const maxCount = Math.max(1, ...Object.values(stats.pickupsByStatus || {}));

  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-6">Admin dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <div className="text-steel-500 text-sm">{label}</div>
            <div className="font-head text-2xl font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-medium mb-4">Pickups by status</h2>
        <div className="space-y-2">
          {Object.entries(stats.pickupsByStatus || {}).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs w-40 shrink-0 text-steel-600">{status.replace(/_/g, ' ')}</span>
              <div className="flex-1 bg-steel-100 rounded-sm h-3 overflow-hidden">
                <div className="bg-patina-600 h-full" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="text-xs w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
