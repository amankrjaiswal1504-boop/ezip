import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

// GET with loading/error/reload. Keeps previous data while refetching so
// tables and charts don't jump (no flash of skeleton on filter change).
export default function useApi(path, { params, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const seq = useRef(0);
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!enabled || !path) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path, { params });
      if (id === seq.current) setData(res.data.data);
    } catch (err) {
      if (id === seq.current) setError(err);
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, enabled, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
