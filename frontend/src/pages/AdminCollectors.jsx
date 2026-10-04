import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY = { name: '', email: '', phone: '', password: '', city: '', vehicleNumber: '' };

export default function AdminCollectors() {
  const [collectors, setCollectors] = useState([]);
  const [form, setForm] = useState(null);

  function load() {
    api.get('/admin/collectors').then((res) => setCollectors(res.data.data.collectors));
  }
  useEffect(load, []);

  async function handleCreate() {
    try {
      await api.post('/admin/collectors', form);
      toast.success('Collector created');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleActive(c) {
    await api.put(`/admin/collectors/${c._id}`, { isActive: !c.isActive });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-head text-2xl font-semibold">Collectors</h1>
        {!form && (
          <button className="btn-primary text-sm" onClick={() => setForm(EMPTY)}>
            + Add collector
          </button>
        )}
      </div>

      {form && (
        <div className="card mb-6 space-y-2 max-w-md">
          {Object.keys(EMPTY).map((f) => (
            <input
              key={f}
              className="input"
              placeholder={f}
              type={f === 'password' ? 'password' : 'text'}
              value={form[f]}
              onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))}
            />
          ))}
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={handleCreate}>Create</button>
            <button className="btn-outline text-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="border border-steel-100 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-steel-100 text-left text-steel-700">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Pickups completed</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {collectors.map((c) => (
              <tr key={c._id} className="border-t border-steel-100">
                <td className="px-4 py-2">{c.name} <span className="text-steel-400">({c.phone})</span></td>
                <td className="px-4 py-2">{c.collectorProfile?.city}</td>
                <td className="px-4 py-2">{c.collectorProfile?.totalPickupsCompleted || 0}</td>
                <td className="px-4 py-2">{c.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2">
                  <button className="text-rust-600 font-medium" onClick={() => toggleActive(c)}>
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
