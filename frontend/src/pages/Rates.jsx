import { useEffect, useState } from 'react';
import api from '../services/api';

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR'];

export default function Rates() {
  const [city, setCity] = useState('Bengaluru');
  const [search, setSearch] = useState('');
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/scrap/rates', { params: { city, search: search || undefined } })
      .then((res) => setRates(res.data.data.rates))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, search]);

  const grouped = rates.reduce((acc, r) => {
    const catName = r.category?.name || 'Other';
    acc[catName] = acc[catName] || [];
    acc[catName].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <h1 className="font-head text-3xl font-semibold mb-2">Scrap rates</h1>
      <p className="text-steel-500 mb-6">
        Indicative price. Final value depends on actual weight/condition and verification.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <select value={city} onChange={(e) => setCity(e.target.value)} className="input sm:w-56">
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          className="input flex-1"
          placeholder="Search an item (e.g. copper, laptop, cardboard)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-steel-500">Loading rates…</p>}
      {error && <p className="text-rust-600">{error}</p>}
      {!loading && !error && rates.length === 0 && (
        <p className="text-steel-500">No prices found for this city yet. Try a different search or city.</p>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([catName, items]) => (
          <div key={catName}>
            <h2 className="font-head font-semibold text-lg mb-3">{catName}</h2>
            <div className="border border-steel-100 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-steel-100 text-steel-700 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">Unit</th>
                    <th className="px-4 py-2 font-medium">Price range</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.itemId} className="border-t border-steel-100">
                      <td className="px-4 py-2">{it.name}</td>
                      <td className="px-4 py-2 text-steel-500">{it.unit}</td>
                      <td className="px-4 py-2 font-medium">
                        ₹{it.minPrice} – ₹{it.maxPrice} / {it.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
