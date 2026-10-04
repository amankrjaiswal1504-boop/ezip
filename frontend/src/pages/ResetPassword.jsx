import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth, homePathFor } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import AuthShell from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';

export default function ResetPassword() {
  const { token } = useParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  usePageMeta({ title: 'Set a new password', noindex: true });

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setUser(res.data.data.user);
      toast.success('Password updated. You are signed in.');
      navigate(homePathFor(res.data.data.user), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="This signs you out on every other device." footer={<Link to="/forgot-password" className="link">Need a new link?</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" hint="At least 8 characters">
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />}
        </Field>
        <Field label="Confirm password" error={error}>
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
