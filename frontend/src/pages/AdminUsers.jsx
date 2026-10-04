import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  function load() {
    api.get('/admin/users', { params: { search: search || undefined } }).then((res) => setUsers(res.data.data.users));
  }
  useEffect(load, [search]);

  async function toggleActive(id) {
    await api.put(`/admin/users/${id}/toggle-active`);
    load();
  }

  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-6">Customers</h1>
      <input className="input mb-4 max-w-sm" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="border border-steel-100 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-steel-100 text-left text-steel-700">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-steel-100">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.phone}</td>
                <td className="px-4 py-2">{u.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2">
                  <button className="text-rust-600 font-medium" onClick={() => toggleActive(u._id)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
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
