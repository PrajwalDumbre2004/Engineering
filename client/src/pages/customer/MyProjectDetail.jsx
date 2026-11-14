import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../../api/client.js';
import StatusBadge, { STATUSES } from '../../components/StatusBadge.jsx';

const ROW = 'grid items-center gap-2 md:grid-cols-[1.5fr_0.7fr_1.2fr_1fr]';

export default function MyProjectDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/me/projects/${id}`);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  if (loading) return <p className="text-steel-400">Loading…</p>;
  if (error) return <p className="text-red-300">{error}</p>;

  const { project, parts } = data;
  const shown = parts.filter(
    (p) => (filter === 'ALL' || p.status === filter) && p.partNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Link to="/app" className="text-sm text-steel-400 hover:text-accent">← Your projects</Link>
      <h1 className="heading mb-1 mt-2 font-mono normal-case">{project.projectNo}</h1>
      <p className="mb-6 text-steel-400">{project.title}</p>

      <div className="mb-4 space-y-3">
        <input className="input sm:max-w-xs" placeholder="Search part no." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {[{ key: 'ALL', label: 'All' }, ...STATUSES].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`min-h-9 rounded-full border px-3 text-xs transition ${filter === s.key ? 'border-accent bg-accent/15 text-accent' : 'border-steel-600 text-steel-400 hover:text-white'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <div className="panel text-center text-steel-400">No parts to show.</div>}

      {shown.length > 0 && (
        <div className="space-y-2">
          <div className={`${ROW} hidden px-5 text-xs uppercase tracking-wider text-steel-400 md:grid`}>
            <span>Part no.</span><span>Quantity</span><span>Status</span><span>Last updated</span>
          </div>
          {shown.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }} className={`panel ${ROW} !py-3`}>
              <span className="font-mono text-white">{p.partNo}</span>
              <span className="text-steel-400">Qty: <b className="text-white">{p.quantity}</b></span>
              <span><StatusBadge status={p.status} /></span>
              <span className="text-sm text-steel-400">{new Date(p.updatedAt).toLocaleDateString()}</span>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
