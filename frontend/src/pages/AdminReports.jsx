import { useEffect, useState } from 'react';
import api from '../services/api';

function toCSV(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [revenue, setRevenue] = useState([]);
  const [scrapByItem, setScrapByItem] = useState([]);

  useEffect(() => {
    api.get('/admin/reports', { params: { type: 'revenue' } }).then((res) => setRevenue(res.data.data.revenue));
    api.get('/admin/reports', { params: { type: 'scrap-by-category' } }).then((res) => setScrapByItem(res.data.data.scrapByItem));
  }, []);

  return (
    <div>
      <h1 className="font-head text-2xl font-semibold mb-6">Reports</h1>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Revenue by day</h2>
          <button className="text-sm text-rust-600 font-medium" onClick={() => downloadCSV('revenue.csv', toCSV(revenue, ['_id', 'total', 'count']))}>
            Export CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-steel-500 border-b border-steel-100">
            <tr><th className="py-2">Date</th><th className="py-2">Payments</th><th className="py-2">Total</th></tr>
          </thead>
          <tbody>
            {revenue.map((r) => (
              <tr key={r._id} className="border-b border-steel-100">
                <td className="py-2">{r._id}</td><td className="py-2">{r.count}</td><td className="py-2">₹{r.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Scrap quantity by item (completed pickups)</h2>
          <button className="text-sm text-rust-600 font-medium" onClick={() => downloadCSV('scrap-by-item.csv', toCSV(scrapByItem, ['_id', 'totalWeight', 'totalValue']))}>
            Export CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-steel-500 border-b border-steel-100">
            <tr><th className="py-2">Item</th><th className="py-2">Total weight</th><th className="py-2">Total value</th></tr>
          </thead>
          <tbody>
            {scrapByItem.map((r) => (
              <tr key={r._id} className="border-b border-steel-100">
                <td className="py-2">{r._id}</td><td className="py-2">{r.totalWeight}</td><td className="py-2">₹{(r.totalValue || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
