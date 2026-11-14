import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api, { errMsg, useApi } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import { STATUSES } from '../../components/StatusBadge.jsx';

const ROW = 'grid items-center gap-3 md:grid-cols-[1.5fr_0.7fr_1.4fr_auto]';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pj = useApi(`/admin/projects/${id}`);
  const pt = useApi(`/admin/projects/${id}/parts`);
  const [editing, setEditing] = useState(null); // null = closed, {} = new part, part = edit
  const [form, setForm] = useState({ partNo: '', quantity: 1 });
  const [formError, setFormError] = useState('');

  const openForm = (part) => {
    setEditing(part);
    setForm({ partNo: part._id ? part.partNo : '', quantity: part._id ? part.quantity : 1 });
    setFormError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    const body = { partNo: form.partNo, quantity: Number(form.quantity) };
    try {
      if (editing._id) await api.patch(`/admin/parts/${editing._id}`, body);
      else await api.post(`/admin/projects/${id}/parts`, body);
      setEditing(null);
      pt.reload();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  // Optimistic status change; reload on failure to restore truth
  const changeStatus = async (part, status) => {
    pt.setData((d) => ({ parts: d.parts.map((p) => (p._id === part._id ? { ...p, status } : p)) }));
    try {
      await api.patch(`/admin/parts/${part._id}`, { status });
    } catch (err) {
      alert(errMsg(err));
      pt.reload();
    }
  };

  const removePart = async (part) => {
    if (!confirm(`Delete part ${part.partNo}?`)) return;
    await api.delete(`/admin/parts/${part._id}`).catch((e) => alert(errMsg(e)));
    pt.reload();
  };

  const removeProject = async () => {
    if (!confirm('Delete this project and all its parts?')) return;
    await api.delete(`/admin/projects/${id}`).catch((e) => alert(errMsg(e)));
    navigate(`/admin/companies/${pj.data.project.companyId._id}`);
  };

  if (pj.loading) return <p className="text-steel-400">Loading…</p>;
  if (pj.error) return <p className="text-red-300">{pj.error}</p>;
  const { project } = pj.data;
  const parts = pt.data?.parts || [];

  return (
    <>
      <Link to={`/admin/companies/${project.companyId._id}`} className="text-sm text-steel-400 hover:text-accent">
        ← {project.companyId.name}
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading font-mono normal-case">{project.projectNo}</h1>
          <p className="text-steel-400">{project.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => openForm({})}>+ Add part</button>
          <button className="btn btn-danger" onClick={removeProject}>Delete project</button>
        </div>
      </div>

      {parts.length === 0 && !pt.loading && <div className="panel text-center text-steel-400">No parts yet. Add the first part for this project.</div>}

      {parts.length > 0 && (
        <div className="space-y-2">
          <div className={`${ROW} hidden px-5 text-xs uppercase tracking-wider text-steel-400 md:grid`}>
            <span>Part no.</span><span>Qty</span><span>Status</span><span className="w-28" />
          </div>
          <AnimatePresence initial={false}>
            {parts.map((p) => (
              <motion.div key={p._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`panel ${ROW} !py-3`}>
                <span className="font-mono text-white">{p.partNo}</span>
                <span className="text-steel-400">Qty: <b className="text-white">{p.quantity}</b></span>
                <select className="input" value={p.status} onChange={(e) => changeStatus(p, e.target.value)}>
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <div className="flex gap-2 md:w-28">
                  <button className="btn px-3" onClick={() => openForm(p)} aria-label="Edit">✎</button>
                  <button className="btn btn-danger px-3" onClick={() => removePart(p)} aria-label="Delete">🗑</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit part' : 'Add part'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Part no.</label>
            <input className="input font-mono" value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="1" step="1" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </div>
          {formError && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-300">{formError}</p>}
          <button className="btn btn-primary w-full">Save</button>
        </form>
      </Modal>
    </>
  );
}
