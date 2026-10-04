import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminPickups() {
  const [pickups, setPickups] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  function load() {
    api.get('/admin/pickups', { params: { status: statusFilter || undefined } }).then((res) => setPickups(res.data.data.pickups));
  }
  useEffect(load, [statusFilter]);
  useEffect(() => {
    api.get('/admin/collectors').then((res) => setCollectors(res.data.data.collectors.filter((c) => c.isActive)));
  }, []);

  async function assign(pickupId, collectorId) {
    if (!collectorId) return;
    try {
      await api.post('/admin/assign-collector', { pickupId, collectorId });
      toast.success('Collector assigned');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const statuses = ['', 'BOOKED', 'ASSIGNED', 'COLLECTOR_ON_THE_WAY', 'ARRIVED', 'WEIGHING', 'COMPLETED', 'CANCELLED'];

  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-6">All pickups</h1>
      <select className="input mb-4 max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        {statuses.map((s) => (
          <option key={s} value={s}>{s || 'All statuses'}</option>
        ))}
      </select>

      <div className="border border-steel-100 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-steel-100 text-left text-steel-700">
            <tr>
              <th className="px-4 py-2 font-medium">Pickup ID</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Collector</th>
            </tr>
          </thead>
          <tbody>
            {pickups.map((p) => (
              <tr key={p.pickupId} className="border-t border-steel-100">
                <td className="px-4 py-2 font-medium">{p.pickupId}</td>
                <td className="px-4 py-2">{p.customer?.name}</td>
                <td className="px-4 py-2">{p.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2">
                  {p.collector ? (
                    p.collector.name
                  ) : (
                    <select className="input py-1 text-xs" defaultValue="" onChange={(e) => assign(p.pickupId, e.target.value)}>
                      <option value="" disabled>Assign collector</option>
                      {collectors.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
