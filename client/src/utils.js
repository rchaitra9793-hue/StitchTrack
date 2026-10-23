// Today's date as YYYY-MM-DD in the user's local time zone
export function todayStr() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Whole days from today until a YYYY-MM-DD date (negative = past)
export function daysUntil(date) {
  return Math.round((Date.parse(date) - Date.parse(todayStr())) / 86400000);
}

export const formatDate = (date) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN') : '—';

export const formatMoney = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const balanceOf = (order) => Math.max(order.price - order.advance, 0);
