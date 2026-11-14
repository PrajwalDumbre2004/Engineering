import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const homeFor = (role) => (role === 'admin' ? '/admin' : '/app');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const expire = () => setUser(null);
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const login = async (loginId, password) => {
    const { data } = await api.post('/auth/login', { loginId, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
