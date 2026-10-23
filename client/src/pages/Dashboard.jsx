import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { GARMENTS, STATUSES } from '../garments.js';
import { balanceOf, daysUntil, formatDate, formatMoney } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DueBadge from '../components/DueBadge.jsx';

const isActive = (o) => o.status === 'Pending' || o.status === 'Stitching';

function Stat({ label, value, highlight }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    const timer = setTimeout(() => {
      api(`/orders?${params}`)
        .then(setOrders)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search]);

  const overdue = orders.filter((o) => isActive(o) && o.due_date && daysUntil(o.due_date) < 0).length;
  const toCollect = orders.reduce((sum, o) => sum + balanceOf(o), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      {!status && !search && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="In progress" value={orders.filter(isActive).length} />
          <Stat label="Overdue" value={overdue} highlight={overdue > 0} />
          <Stat label="Ready for pickup" value={orders.filter((o) => o.status === 'Ready').length} />
          <Stat label="Balance to collect" value={formatMoney(toCollect)} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder="Search name or phone"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input sm:max-w-[180px]" value={status}
          onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p className="text-stone-500">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card text-center text-stone-500">No orders found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Garment</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                  className="cursor-pointer border-t border-stone-100 hover:bg-rose-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.id}`} className="font-semibold text-rose-600 hover:underline">
                      {o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-stone-500">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3">{GARMENTS[o.garment_type]?.label}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(o.due_date)}
                    <DueBadge order={o} />
                  </td>
                  <td className="px-4 py-3">
                    {o.price > 0 ? formatMoney(balanceOf(o)) : <span className="text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
