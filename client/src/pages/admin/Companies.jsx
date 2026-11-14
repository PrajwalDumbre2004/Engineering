import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { errMsg, useApi } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import CredentialsModal from '../../components/CredentialsModal.jsx';

const empty = { name: '', code: '', memberName: '' };

export default function Companies() {
  const { data, loading, error, reload } = useApi('/admin/companies');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await api.post('/admin/companies', {
        name: form.name,
        code: form.code,
        member: { name: form.memberName },
      });
      setOpen(false);
      setForm(empty);
      setCredentials(res.data.credentials);
      reload();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="heading">Companies</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add company</button>
      </div>

      {loading && <p className="text-steel-400">Loading…</p>}
      {error && <p className="text-red-300">{error}</p>}
      {data?.companies.length === 0 && (
        <div className="panel text-center text-steel-400">No companies yet. Add your first client to get started.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.companies.map((c, i) => (
          <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
            <Link to={`/admin/companies/${c._id}`} className="panel block h-full transition hover:border-accent/60">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-2xl font-semibold uppercase text-white">{c.name}</h2>
                <span className="rounded bg-steel-950 px-2 py-0.5 font-mono text-xs text-accent">{c.code}</span>
              </div>
              <div className="mt-4 flex gap-6 text-sm text-steel-400">
                <span><b className="text-white">{c.memberCount}</b> members</span>
                <span><b className="text-white">{c.projectCount}</b> projects</span>
                {!c.isActive && <span className="text-red-300">Disabled</span>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add company">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Company name</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Short code (used in login IDs)</label>
            <input className="input font-mono uppercase" value={form.code} onChange={set('code')} placeholder="ACME" maxLength={10} required />
          </div>
          <div>
            <label className="label">First member name</label>
            <input className="input" value={form.memberName} onChange={set('memberName')} required />
          </div>
          {formError && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-300">{formError}</p>}
          <button className="btn btn-primary w-full">Create & generate login</button>
        </form>
      </Modal>

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
