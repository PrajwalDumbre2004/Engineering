import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, useApi } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import CredentialsModal from '../../components/CredentialsModal.jsx';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const co = useApi(`/admin/companies/${id}`);
  const pr = useApi(`/admin/companies/${id}/projects`);
  const [tab, setTab] = useState('projects');
  const [modal, setModal] = useState(null); // 'member' | 'project'
  const [field, setField] = useState({ a: '', b: '' });
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] = useState(null);

  const openModal = (m) => {
    setField({ a: '', b: '' });
    setFormError('');
    setModal(m);
  };

  const run = async (fn) => {
    try {
      await fn();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (modal === 'member') {
        const res = await api.post(`/admin/companies/${id}/members`, { name: field.a });
        setCredentials(res.data.credentials);
        co.reload();
      } else {
        await api.post(`/admin/companies/${id}/projects`, { projectNo: field.a, title: field.b });
        pr.reload();
      }
      setModal(null);
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  const resetPassword = (m) =>
    confirm(`Reset password for ${m.name}? The old password will stop working.`) &&
    run(async () => {
      const res = await api.post(`/admin/users/${m._id}/reset-password`);
      setCredentials(res.data.credentials);
    });

  const toggleMember = (m) => run(async () => { await api.patch(`/admin/users/${m._id}`, { isActive: !m.isActive }); co.reload(); });
  const toggleCompany = () => run(async () => { await api.patch(`/admin/companies/${id}`, { isActive: !co.data.company.isActive }); co.reload(); });
  const deleteCompany = () =>
    confirm('Delete this company with ALL its members, projects and parts? This cannot be undone.') &&
    run(async () => { await api.delete(`/admin/companies/${id}`); navigate('/admin'); });

  if (co.loading) return <p className="text-steel-400">Loading…</p>;
  if (co.error) return <p className="text-red-300">{co.error}</p>;
  const { company, members } = co.data;

  return (
    <>
      <Link to="/admin" className="text-sm text-steel-400 hover:text-accent">← Companies</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading">{company.name}</h1>
          <span className="font-mono text-sm text-accent">{company.code}</span>
          {!company.isActive && <span className="ml-3 text-sm text-red-300">Disabled - members cannot log in</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={toggleCompany}>{company.isActive ? 'Disable' : 'Enable'}</button>
          <button className="btn btn-danger" onClick={deleteCompany}>Delete</button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-steel-600/60">
        {['projects', 'members'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-11 border-b-2 px-4 font-display text-lg uppercase tracking-wide ${tab === t ? 'border-accent text-white' : 'border-transparent text-steel-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <>
          <button className="btn btn-primary mb-4" onClick={() => openModal('project')}>+ Add project</button>
          {pr.data?.projects.length === 0 && <div className="panel text-center text-steel-400">No projects yet.</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            {pr.data?.projects.map((p) => (
              <Link key={p._id} to={`/admin/projects/${p._id}`} className="panel block transition hover:border-accent/60">
                <p className="font-mono text-lg text-white">{p.projectNo}</p>
                <p className="text-sm text-steel-400">{p.title || 'Untitled'}</p>
                <p className="mt-3 text-sm text-steel-400"><b className="text-white">{p.done}</b> / {p.total} parts done</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === 'members' && (
        <>
          <button className="btn btn-primary mb-4" onClick={() => openModal('member')}>+ Add member</button>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m._id} className="panel flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white">{m.name} {!m.isActive && <span className="text-sm text-red-300">(disabled)</span>}</p>
                  <p className="font-mono text-sm text-accent">{m.loginId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => resetPassword(m)}>Reset password</button>
                  <button className="btn" onClick={() => toggleMember(m)}>{m.isActive ? 'Disable' : 'Enable'}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'member' ? 'Add member' : 'Add project'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{modal === 'member' ? 'Member name' : 'Project no.'}</label>
            <input className="input" value={field.a} onChange={(e) => setField({ ...field, a: e.target.value })} required autoFocus />
          </div>
          {modal === 'project' && (
            <div>
              <label className="label">Title (optional)</label>
              <input className="input" value={field.b} onChange={(e) => setField({ ...field, b: e.target.value })} />
            </div>
          )}
          {formError && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-300">{formError}</p>}
          <button className="btn btn-primary w-full">{modal === 'member' ? 'Create & generate login' : 'Create project'}</button>
        </form>
      </Modal>

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
