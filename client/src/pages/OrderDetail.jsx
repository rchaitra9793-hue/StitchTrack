import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { GARMENTS, STATUSES, labelFor } from '../garments.js';
import { balanceOf, formatDate, formatMoney } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DueBadge from '../components/DueBadge.jsx';

function whatsappLink(order) {
  const garment = GARMENTS[order.garment_type]?.label.toLowerCase();
  const balance = balanceOf(order);
  const message =
    `Hi ${order.customer_name}, your ${garment} (Order #${order.id}) is ready! ` +
    (balance > 0 ? `Balance to pay: ${formatMoney(balance)}. ` : '') +
    'Please visit the boutique to collect it. Thank you!';
  return `https://wa.me/91${order.phone}?text=${encodeURIComponent(message)}`;
}

function Payment({ order, onSaved }) {
  const [price, setPrice] = useState(order.price || '');
  const [advance, setAdvance] = useState(order.advance || '');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const updated = await api(`/orders/${order.id}`, {
        method: 'PATCH',
        body: { price: Number(price) || 0, advance: Number(advance) || 0 },
      });
      onSaved(updated);
      setMessage('Saved');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-2 font-semibold">Payment</h2>
      <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="text-xs text-stone-600" htmlFor="price">Price (₹)</label>
          <input id="price" type="number" min="0" className="input"
            value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-stone-600" htmlFor="advance">Advance paid (₹)</label>
          <input id="advance" type="number" min="0" className="input"
            value={advance} onChange={(e) => setAdvance(e.target.value)} />
        </div>
        <div className="rounded-lg bg-stone-50 px-3 py-2">
          <p className="text-xs text-stone-500">Balance due</p>
          <p className="font-semibold">{formatMoney(balanceOf(order))}</p>
        </div>
        <button type="submit" className="btn-outline">Save payment</button>
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message === 'Saved' ? 'text-green-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api(`/orders/${id}`).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  const changeStatus = async (status) => {
    if (status === order.status || saving) return;
    setSaving(true);
    setMessage('');
    try {
      setOrder(await api(`/orders/${id}`, { method: 'PATCH', body: { status } }));
      setMessage(`Saved: order marked as ${status}`);
    } catch (err) {
      setMessage(`Could not update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this order?')) return;
    try {
      await api(`/orders/${id}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      setMessage(`Could not delete: ${err.message}`);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-stone-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="text-sm text-stone-500 hover:underline">← Back to orders</Link>

      <div className="card space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.id} · {GARMENTS[order.garment_type]?.label}
            </h1>
            <p className="text-stone-600">{order.customer_name} · {order.phone}</p>
            <p className="text-sm text-stone-500">
              Placed {new Date(order.created_at + 'Z').toLocaleString('en-IN')}
              {order.due_date && ` · Due ${formatDate(order.due_date)}`}
              <DueBadge order={order} />
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={order.status} />
            <p className="mt-2 text-xs text-stone-500">
              Tracking code <span className="font-mono font-semibold text-stone-700">{order.tracking_code}</span>
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Measurements (inches)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(order.measurements).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-stone-50 p-3">
                <p className="text-xs text-stone-500">{labelFor(order.garment_type, key)}</p>
                <p className="text-lg font-semibold">{value}"</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Design Notes</h2>
          <p className="whitespace-pre-wrap text-stone-700">{order.design_notes || 'None'}</p>
        </div>

        <Payment order={order} onSaved={setOrder} />

        <div>
          <h2 className="mb-2 font-semibold">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => changeStatus(s)} disabled={saving}
                className={order.status === s ? 'btn ring-2 ring-rose-200' : 'btn-outline'}>
                {order.status === s && '✓ '}{s}
              </button>
            ))}
          </div>
          {message && (
            <p className={`mt-2 text-sm ${message.startsWith('Saved') ? 'text-green-700' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        {order.status === 'Ready' && (
          <div className="rounded-lg bg-green-50 p-4">
            <p className="mb-3 text-sm text-green-800">
              This order is ready. Let {order.customer_name} know it can be picked up.
            </p>
            <a href={whatsappLink(order)} target="_blank" rel="noreferrer"
              className="btn bg-green-600 hover:bg-green-700">
              Notify on WhatsApp
            </a>
          </div>
        )}

        <div className="border-t border-stone-100 pt-4">
          <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline">
            Delete order
          </button>
        </div>
      </div>
    </div>
  );
}
