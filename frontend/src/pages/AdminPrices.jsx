import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminPrices() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState([]);
  const [city, setCity] = useState('Bengaluru');
  const [editing, setEditing] = useState({}); // itemId -> {min, max}
  const [newItem, setNewItem] = useState(null);

  useEffect(() => {
    api.get('/scrap/categories').then((res) => setCategories(res.data.data.categories));
  }, []);

  function loadRates() {
    api.get('/scrap/rates', { params: { city } }).then((res) => setRates(res.data.data.rates));
  }
  useEffect(loadRates, [city]);

  async function savePrice(itemId) {
    const vals = editing[itemId];
    if (!vals) return;
    try {
      await api.put(`/admin/scrap-items/${itemId}`, { minPrice: Number(vals.min), maxPrice: Number(vals.max), city });
      toast.success('Price updated');
      loadRates();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function createItem() {
    try {
      await api.post('/admin/scrap-items', {
        categoryId: newItem.categoryId,
        name: newItem.name,
        unit: newItem.unit || 'kg',
        minPrice: Number(newItem.min),
        maxPrice: Number(newItem.max),
        city,
      });
      toast.success('Item created');
      setNewItem(null);
      loadRates();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deactivate(itemId) {
    await api.delete(`/admin/scrap-items/${itemId}`);
    toast.success('Item deactivated');
    loadRates();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-head text-2xl font-semibold">Price management</h1>
        <select className="input w-48" value={city} onChange={(e) => setCity(e.target.value)}>
          <option>Bengaluru</option>
          <option>Mumbai</option>
          <option>Delhi NCR</option>
        </select>
      </div>

      {!newItem ? (
        <button
          className="btn-primary text-sm mb-4"
          onClick={() => setNewItem({ categoryId: categories[0]?._id || '', name: '', unit: 'kg', min: '', max: '' })}
        >
          + Add scrap item
        </button>
      ) : (
        <div className="card mb-6 max-w-lg space-y-2">
          <select className="input" value={newItem.categoryId} onChange={(e) => setNewItem((s) => ({ ...s, categoryId: e.target.value }))}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <input className="input" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))} />
          <div className="flex gap-2">
            <input className="input" placeholder="Min price" value={newItem.min} onChange={(e) => setNewItem((s) => ({ ...s, min: e.target.value }))} />
            <input className="input" placeholder="Max price" value={newItem.max} onChange={(e) => setNewItem((s) => ({ ...s, max: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={createItem}>Create</button>
            <button className="btn-outline text-sm" onClick={() => setNewItem(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="border border-steel-100 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-steel-100 text-left text-steel-700">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Min</th>
              <th className="px-4 py-2 font-medium">Max</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.itemId} className="border-t border-steel-100">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">
                  <input
                    className="input py-1 w-24"
                    defaultValue={r.minPrice}
                    onChange={(e) => setEditing((s) => ({ ...s, [r.itemId]: { ...s[r.itemId], min: e.target.value, max: s[r.itemId]?.max ?? r.maxPrice } }))}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="input py-1 w-24"
                    defaultValue={r.maxPrice}
                    onChange={(e) => setEditing((s) => ({ ...s, [r.itemId]: { ...s[r.itemId], max: e.target.value, min: s[r.itemId]?.min ?? r.minPrice } }))}
                  />
                </td>
                <td className="px-4 py-2 flex gap-3">
                  <button className="text-patina-700 font-medium" onClick={() => savePrice(r.itemId)}>Save</button>
                  <button className="text-rust-600 font-medium" onClick={() => deactivate(r.itemId)}>Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
