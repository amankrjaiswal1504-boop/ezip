import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      let res = await api.get('/auth/session');
      // Access cookie expired but a refresh cookie may still be valid.
      if (!res.data.data.user) {
        const refreshed = await api.post('/auth/refresh').catch(() => null);
        if (refreshed?.data?.data?.user) res = { data: { data: { user: refreshed.data.data.user } } };
      }
      setUser(res.data.data.user);
      return res.data.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      refreshMe,
      can: (perm) => {
        const p = user?.permissions || [];
        return p.includes('*') || p.includes(perm);
      },
      async login(email, password) {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      async register(payload) {
        const res = await api.post('/auth/register', payload);
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      async requestOtp(phone, purpose = 'login') {
        const res = await api.post('/auth/otp/request', { phone, purpose });
        return res.data.data;
      },
      async verifyOtp(payload) {
        const res = await api.post('/auth/otp/verify', payload);
        setUser(res.data.data.user);
        return res.data.data.user;
      },
      async logout() {
        await api.post('/auth/logout').catch(() => {});
        setUser(null);
      },
    }),
    [user, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function homePathFor(user) {
  if (!user) return '/';
  if (user.role === 'admin' || user.role === 'staff') return '/admin';
  if (user.role === 'collector') return '/collector';
  return '/dashboard';
}
