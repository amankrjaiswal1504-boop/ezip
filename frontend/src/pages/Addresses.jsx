import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY = { houseNumber: '', street: '', locality: '', city: '', state: '', pinCode: '', landmark: '', addressType: 'home' };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/addresses').then((res) => setAddresses(res.data.data.addresses)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave() {
    try {
      if (form._id) {
        await api.put(`/addresses/${form._id}`, form);
      } else {
        await api.post('/addresses', form);
      }
      toast.success('Address saved');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSetDefault(a) {
    await api.put(`/addresses/${a._id}`, { isDefault: true });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-head text-2xl font-semibold">Saved addresses</h1>
        {!form && (
          <button className="btn-primary text-sm" onClick={() => setForm(EMPTY)}>
            + Add address
          </button>
        )}
      </div>

      {form && (
        <div className="card mb-6 space-y-2">
          {['houseNumber', 'street', 'locality', 'city', 'state', 'pinCode', 'landmark'].map((f) => (
            <input key={f} className="input" placeholder={f} value={form[f]} onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))} />
          ))}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary text-sm" onClick={handleSave}>Save</button>
            <button className="btn-outline text-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p className="text-steel-500 text-sm">Loading…</p>}
      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a._id} className="card flex items-start justify-between gap-3">
            <div className="text-sm">
              <div>
                {a.houseNumber}, {a.street}, {a.locality}, {a.city}, {a.state} - {a.pinCode}
              </div>
              {a.isDefault && <span className="text-xs text-patina-700 font-medium">Default</span>}
            </div>
            <div className="flex gap-3 text-sm shrink-0">
              {!a.isDefault && (
                <button className="text-steel-500" onClick={() => handleSetDefault(a)}>
                  Set default
                </button>
              )}
              <button className="text-steel-500" onClick={() => setForm(a)}>
                Edit
              </button>
              <button className="text-rust-600" onClick={() => handleDelete(a._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
