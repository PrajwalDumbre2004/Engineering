import { motion } from 'framer-motion';

// Mirrors PART_STATUSES in server/src/models/Part.js
export const STATUSES = [
  { key: 'QUEUED', label: 'Queued', color: '#8593a3' },
  { key: 'IN_PRODUCTION', label: 'In Production', color: '#ff6a00' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', color: '#facc15' },
  { key: 'COMPLETED', label: 'Completed', color: '#4ade80' },
  { key: 'DISPATCHED', label: 'Dispatched', color: '#38bdf8' },
  { key: 'ON_HOLD', label: 'On Hold', color: '#f87171' },
];

export default function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.key === status) || STATUSES[0];
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
      style={{ color: s.color, borderColor: `${s.color}66`, background: `${s.color}1a` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </motion.span>
  );
}
