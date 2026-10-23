import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { GARMENTS } from '../garments.js';
import { todayStr } from '../utils.js';

const emptyForm = {
  customer_name: '',
  phone: '',
  garment_type: 'blouse',
  design_notes: '',
  due_date: '',
};

export default function OrderForm() {
  const [form, setForm] = useState(emptyForm);
  const [measurements, setMeasurements] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [saved, setSaved] = useState(null);

  const fields = GARMENTS[form.garment_type].fields;

  // Offer a returning customer their last measurements for this garment
  useEffect(() => {
    setSaved(null);
    if (!/^\d{10}$/.test(form.phone)) return;
    let cancelled = false;
    const params = new URLSearchParams({ phone: form.phone, garment_type: form.garment_type });
    api(`/orders/lookup?${params}`)
      .then((data) => !cancelled && setSaved(data))
      .catch(() => {}); // 404 just means a new customer
    return () => {
      cancelled = true;
    };
  }, [form.phone, form.garment_type]);

  const applySaved = () => {
    const values = Object.fromEntries(
      fields.filter((f) => saved.measurements[f.key]).map((f) => [f.key, saved.measurements[f.key]])
    );
    setMeasurements(values);
    if (!form.customer_name) setForm({ ...form, customer_name: saved.customer_name });
    setSaved(null);
  };
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const changeGarment = (type) => {
    setForm({ ...form, garment_type: type });
    setMeasurements({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const values = Object.fromEntries(fields.map((f) => [f.key, Number(measurements[f.key])]));
      const result = await api('/orders', {
        method: 'POST',
        body: { ...form, due_date: form.due_date || null, measurements: values },
      });
      setPlaced(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-2 text-xl font-bold">Order submitted!</h2>
        <p className="mt-2 text-stone-600">Save your tracking code to check your order status:</p>
        <p className="my-4 rounded-lg bg-rose-50 py-3 font-mono text-3xl font-bold tracking-widest text-rose-700">
          {placed.tracking_code}
        </p>
        <Link to={`/track/${placed.tracking_code}`} className="btn w-full">Track this order</Link>
        <button
          className="btn-outline mt-3 w-full"
          onClick={() => {
            setPlaced(null);
            setForm(emptyForm);
            setMeasurements({});
          }}
        >
          Place another order
        </button>
        <Link to="/" className="mt-3 block text-sm text-stone-500 hover:underline">Back home</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Stitching Order</h1>
        <p className="text-sm text-stone-500">All measurements in inches.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="customer_name">Your Name</label>
          <input id="customer_name" name="customer_name" className="input" required
            value={form.customer_name} onChange={update} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone Number</label>
          <input id="phone" name="phone" className="input" required inputMode="numeric"
            pattern="\d{10}" title="10 digit phone number" maxLength={10}
            value={form.phone} onChange={update} />
        </div>
      </div>

      <div>
        <span className="label">Garment</span>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(GARMENTS).map(([type, g]) => (
            <button type="button" key={type} onClick={() => changeGarment(type)}
              className={`rounded-lg border-2 py-3 font-semibold ${
                form.garment_type === type
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-50 p-4">
          <p className="text-sm text-rose-800">
            Welcome back, <span className="font-semibold">{saved.customer_name}</span>! Use your
            saved {GARMENTS[form.garment_type].label.toLowerCase()} measurements?
          </p>
          <button type="button" onClick={applySaved} className="btn">Use saved</button>
        </div>
      )}

      <div>
        <span className="label">Measurements</span>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-stone-600" htmlFor={f.key}>{f.label}</label>
              <input id={f.key} type="number" step="0.25" min="0.25" required className="input"
                value={measurements[f.key] ?? ''}
                onChange={(e) => setMeasurements({ ...measurements, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="design_notes">Design Notes</label>
          <textarea id="design_notes" name="design_notes" rows={3} className="input"
            placeholder="e.g. Boat neck, puff sleeves, with lining and hooks at back"
            value={form.design_notes} onChange={update} />
        </div>
        <div>
          <label className="label" htmlFor="due_date">Needed By</label>
          <input id="due_date" name="due_date" type="date" className="input"
            min={todayStr()}
            value={form.due_date} onChange={update} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Order'}
      </button>
    </form>
  );
}
