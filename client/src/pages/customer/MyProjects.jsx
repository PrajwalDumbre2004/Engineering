import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

function ProgressRing({ done, total }) {
  const pct = total ? done / total : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="size-16 shrink-0 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#262e37" strokeWidth="7" />
      <motion.circle
        cx="36" cy="36" r={r} fill="none" stroke="#ff6a00" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-white text-[15px] font-semibold">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export default function MyProjects() {
  const { user } = useAuth();
  const { data, loading, error } = useApi('/me/projects');

  return (
    <>
      <p className="text-sm text-steel-400">{user.companyName}</p>
      <h1 className="heading mb-6">Your projects</h1>

      {loading && <p className="text-steel-400">Loading…</p>}
      {error && <p className="text-red-300">{error}</p>}
      {data?.projects.length === 0 && <div className="panel text-center text-steel-400">No projects yet. They'll appear here once the workshop adds them.</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.projects.map((p, i) => (
          <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
            <Link to={`/app/projects/${p._id}`} className="panel flex items-center gap-4 transition hover:border-accent/60">
              <ProgressRing done={p.done} total={p.total} />
              <div className="min-w-0">
                <p className="truncate font-mono text-lg text-white">{p.projectNo}</p>
                <p className="truncate text-sm text-steel-400">{p.title || 'Untitled'}</p>
                <p className="mt-1 text-xs text-steel-400">{p.done} of {p.total} parts done</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
