import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// A 401 on any non-auth call means the session expired -> tell AuthContext
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.startsWith('/auth')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || 'Something went wrong';

// GET helper: { data, loading, error, reload, setData }
export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      api
        .get(path)
        .then((r) => {
          setData(r.data);
          setError('');
        })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false)),
    [path]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

export default api;
