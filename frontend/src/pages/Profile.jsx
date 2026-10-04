import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { name, phone });
      setUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-head text-2xl font-semibold mb-6">Profile</h1>
      <div className="card space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input className="input bg-steel-100" value={user?.email} disabled />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button className="btn-primary text-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
