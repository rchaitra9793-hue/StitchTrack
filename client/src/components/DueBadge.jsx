import { daysUntil } from '../utils.js';

// Warns about orders that still need stitching and are close to (or past) their due date
export default function DueBadge({ order }) {
  if (!order.due_date || order.status === 'Ready' || order.status === 'Delivered') return null;

  const days = daysUntil(order.due_date);
  let text, color;
  if (days < 0) [text, color] = ['Overdue', 'bg-red-100 text-red-700'];
  else if (days === 0) [text, color] = ['Due today', 'bg-orange-100 text-orange-700'];
  else if (days === 1) [text, color] = ['Due tomorrow', 'bg-orange-100 text-orange-700'];
  else return null;

  return <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{text}</span>;
}
