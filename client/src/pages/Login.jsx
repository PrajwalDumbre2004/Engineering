import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/client.js';
import { Logo } from '../components/Layout.jsx';

// Three.js is heavy: load it after the form is already usable
const GearScene = lazy(() => import('../components/GearScene.jsx'));
const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Login() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(loginId, password); // App redirects once the user is set
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="blueprint relative flex min-h-screen items-center overflow-hidden bg-steel-950">
      {!reduceMotion && (
        <div className="absolute inset-0 opacity-50 lg:right-1/3 lg:opacity-100">
          <Suspense fallback={null}>
            <GearScene />
          </Suspense>
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-6xl justify-center px-4 lg:justify-end">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="panel w-full max-w-sm bg-steel-900/90 backdrop-blur"
        >
          <Logo />
          <h1 className="heading mt-4">Parts Tracker</h1>
          <p className="mb-5 mt-1 text-sm text-steel-400">Sign in with the login ID given to you by the workshop.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="loginId">Login ID</label>
              <input id="loginId" className="input" value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" autoFocus required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}
            <button className="btn btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
