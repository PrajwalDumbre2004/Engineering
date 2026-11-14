import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, homeFor } from '../context/AuthContext.jsx';

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-base font-bold uppercase sm:text-2xl tracking-wider text-white">
      <svg viewBox="0 0 24 24" className="size-6 animate-[spin_12s_linear_infinite] fill-accent">
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 5v-2l-2.1-.6a7 7 0 00-.7-1.7l1.1-1.9-1.4-1.4-1.9 1.1a7 7 0 00-1.7-.7L14 3h-2l-.6 2.1a7 7 0 00-1.7.7L7.8 4.7 6.4 6.1l1.1 1.9a7 7 0 00-.7 1.7L4.7 10.3v2l2.1.6c.2.6.4 1.2.7 1.7l-1.1 1.9 1.4 1.4 1.9-1.1c.5.3 1.1.5 1.7.7L12 19h2l.6-2.1c.6-.2 1.2-.4 1.7-.7l1.9 1.1 1.4-1.4-1.1-1.9c.3-.5.5-1.1.7-1.7z" />
      </svg>
      <span className="leading-none">
        Samarth <span className="text-accent">Engineering Works</span>
      </span>
    </span>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="blueprint min-h-screen">
      <header className="sticky top-0 z-20 border-b border-steel-600/60 bg-steel-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to={homeFor(user.role)}>
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm text-white">{user.name}</p>
              <p className="text-xs text-steel-400">{user.role === 'admin' ? 'Administrator' : user.companyName}</p>
            </div>
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <div className="hazard h-1" />
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl px-4 py-6 sm:py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
