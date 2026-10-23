const COLORS = {
  Pending: 'bg-amber-100 text-amber-800',
  Stitching: 'bg-blue-100 text-blue-800',
  Ready: 'bg-green-100 text-green-800',
  Delivered: 'bg-stone-200 text-stone-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>
      {status}
    </span>
  );
}
