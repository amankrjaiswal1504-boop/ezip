import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'];
const STEP_LABELS = ['Category', 'Items', 'Quantity', 'Estimate', 'Address', 'Date', 'Time', 'Contact', 'Confirm'];

export default function SchedulePickup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [items, setItems] = useState([]); // all items in category
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [quantities, setQuantities] = useState({}); // itemId -> qty
  const [rates, setRates] = useState([]); // rate lookup for estimate
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedPickup, setConfirmedPickup] = useState(null);

  useEffect(() => {
    api.get('/scrap/categories').then((res) => setCategories(res.data.data.categories));
    api.get('/addresses').then((res) => {
      setAddresses(res.data.data.addresses);
      const def = res.data.data.addresses.find((a) => a.isDefault);
      if (def) setAddressId(def._id);
    });
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    api.get('/scrap/items', { params: { category: categoryId } }).then((res) => setItems(res.data.data.items));
  }, [categoryId]);

  useEffect(() => {
    // fetch rates for estimate once city known (from selected address) — default city fallback
    const city = addresses.find((a) => a._id === addressId)?.city || 'Bengaluru';
    api.get('/scrap/rates', { params: { city } }).then((res) => setRates(res.data.data.rates));
  }, [addressId, addresses]);

  const selectedItems = items.filter((i) => selectedItemIds.includes(i._id));

  const estimate = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const item of selectedItems) {
      const qty = Number(quantities[item._id]) || 0;
      const rate = rates.find((r) => r.itemId === item._id);
      if (rate) {
        min += rate.minPrice * qty;
        max += rate.maxPrice * qty;
      }
    }
    return { min, max };
  }, [selectedItems, quantities, rates]);

  function toggleItem(id) {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveNewAddress() {
    const res = await api.post('/addresses', newAddress);
    setAddresses((prev) => [...prev, res.data.data.address]);
    setAddressId(res.data.data.address._id);
    setNewAddress(null);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const payload = {
        items: selectedItems.map((i) => ({ itemId: i._id, estimatedQuantity: Number(quantities[i._id]) || 0 })),
        addressId,
        scheduledDate: date,
        timeSlot,
        contactPhone: phone,
      };
      const res = await api.post('/pickups', payload);
      setConfirmedPickup(res.data.data.pickup);
      toast.success('Pickup booked!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <p className="mb-4">Log in to schedule a pickup.</p>
        <a href="/login" className="btn-primary">Log in</a>
      </div>
    );
  }

  if (confirmedPickup) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-patina-100 text-patina-700 flex items-center justify-center mx-auto mb-4 font-head text-2xl">
          ✓
        </div>
        <h1 className="font-head text-2xl font-semibold mb-2">Pickup booked</h1>
        <p className="text-steel-500 mb-1">Your pickup ID is</p>
        <p className="font-head text-xl font-semibold mb-6">{confirmedPickup.pickupId}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={() => navigate(`/pickups/${confirmedPickup.pickupId}`)}>
            Track pickup
          </button>
          <button className="btn-outline" onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-head text-2xl font-semibold mb-2">Schedule pickup</h1>
      <div className="flex flex-wrap gap-1 mb-8">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`text-xs px-2 py-1 rounded-sm ${
              i === step ? 'bg-steel-900 text-white' : i < step ? 'bg-patina-100 text-patina-700' : 'bg-steel-100 text-steel-500'
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div>
            <h2 className="font-medium mb-3">Select a scrap category</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCategoryId(c._id)}
                  className={`border rounded-sm p-3 text-left text-sm ${
                    categoryId === c._id ? 'border-rust-600 bg-rust-100/40' : 'border-steel-200 hover:border-steel-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-medium mb-3">Select items</h2>
            <div className="grid grid-cols-2 gap-2">
              {items.map((it) => (
                <label key={it._id} className="flex items-center gap-2 border border-steel-200 rounded-sm p-2 text-sm">
                  <input type="checkbox" checked={selectedItemIds.includes(it._id)} onChange={() => toggleItem(it._id)} />
                  {it.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-medium mb-3">Enter estimated quantity</h2>
            <div className="space-y-3">
              {selectedItems.map((it) => (
                <div key={it._id} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{it.name}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="input w-28"
                    placeholder={it.unit}
                    value={quantities[it._id] || ''}
                    onChange={(e) => setQuantities((q) => ({ ...q, [it._id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-medium mb-3">Estimated value</h2>
            <div className="bg-patina-100/60 border border-patina-100 rounded-sm p-4 text-center">
              <div className="font-head text-2xl font-semibold text-patina-700">
                ₹{estimate.min.toFixed(0)} – ₹{estimate.max.toFixed(0)}
              </div>
              <p className="text-xs text-steel-500 mt-2">
                This is an ESTIMATE. Final value depends on actual weight and condition verified at pickup.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-medium mb-3">Pickup address</h2>
            <div className="space-y-2 mb-3">
              {addresses.map((a) => (
                <label key={a._id} className="flex items-start gap-2 border border-steel-200 rounded-sm p-3 text-sm">
                  <input type="radio" name="addr" checked={addressId === a._id} onChange={() => setAddressId(a._id)} className="mt-1" />
                  <span>
                    {a.houseNumber}, {a.street}, {a.locality}, {a.city}, {a.state} - {a.pinCode}
                  </span>
                </label>
              ))}
            </div>
            {!newAddress ? (
              <button
                className="text-sm text-rust-600 font-medium"
                onClick={() =>
                  setNewAddress({ houseNumber: '', street: '', locality: '', city: '', state: '', pinCode: '', landmark: '', addressType: 'home' })
                }
              >
                + Add new address
              </button>
            ) : (
              <div className="border border-steel-200 rounded-sm p-3 space-y-2">
                {['houseNumber', 'street', 'locality', 'city', 'state', 'pinCode', 'landmark'].map((f) => (
                  <input
                    key={f}
                    className="input"
                    placeholder={f}
                    value={newAddress[f]}
                    onChange={(e) => setNewAddress((a) => ({ ...a, [f]: e.target.value }))}
                  />
                ))}
                <button className="btn-secondary text-sm" onClick={saveNewAddress}>
                  Save address
                </button>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-medium mb-3">Select pickup date</h2>
            <input
              type="date"
              className="input"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="font-medium mb-3">Select time slot</h2>
            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={`border rounded-sm p-3 text-sm ${
                    timeSlot === slot ? 'border-rust-600 bg-rust-100/40' : 'border-steel-200 hover:border-steel-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <h2 className="font-medium mb-3">Contact information</h2>
            <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}

        {step === 8 && (
          <div>
            <h2 className="font-medium mb-3">Confirm your booking</h2>
            <div className="text-sm space-y-1 text-steel-700">
              <div><b>Items:</b> {selectedItems.map((i) => i.name).join(', ')}</div>
              <div><b>Estimate:</b> ₹{estimate.min.toFixed(0)} – ₹{estimate.max.toFixed(0)}</div>
              <div><b>Date:</b> {date} · {timeSlot}</div>
              <div><b>Phone:</b> {phone}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button className="btn-outline text-sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
          {step < STEP_LABELS.length - 1 ? (
            <button className="btn-primary text-sm" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <button className="btn-primary text-sm" onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
