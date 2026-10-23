import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { GARMENTS, STATUSES } from '../garments.js';
import { formatDate, formatMoney } from '../utils.js';

export default function Track() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setOrder(null);
    setError('');
    api(`/orders/track/${encodeURIComponent(code)}`).then(setOrder).catch((err) => setError(err.message));
  }, [code]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = input.trim().toUpperCase();
    if (value) navigate(`/track/${value}`);
  };

  const step = order ? STATUSES.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h1 className="text-xl font-bold">Track Your Order</h1>
        <div className="flex gap-2">
          <input className="input uppercase" placeholder="Enter tracking code e.g. K7MX2P"
            value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} />
          <button type="submit" className="btn">Track</button>
        </div>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {order && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-bold">
              Hi {order.first_name}, here's your {GARMENTS[order.garment_type]?.label.toLowerCase()}
            </h2>
            <p className="text-sm text-stone-500">
              Order #{order.id}
              {order.due_date && ` · Expected by ${formatDate(order.due_date)}`}
            </p>
          </div>

          <ol className="space-y-4">
            {STATUSES.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i <= step ? 'bg-rose-600 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span className={i === step ? 'font-semibold' : i < step ? 'text-stone-700' : 'text-stone-400'}>
                  {s}
                </span>
              </li>
            ))}
          </ol>

          {order.status === 'Ready' && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              Your order is ready for pickup!
              {order.balance > 0 && ` Balance to pay: ${formatMoney(order.balance)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
