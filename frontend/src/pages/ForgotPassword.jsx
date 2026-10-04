import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api from '../services/api';
import usePageMeta from '../hooks/usePageMeta';
import AuthShell from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  usePageMeta({ title: 'Reset your password', noindex: true });

  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to set a new one."
      footer={
        <>
          Remembered it? <Link to="/login" className="link">Log in</Link> · or log in with your phone number instead.
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl bg-patina-50 border border-patina-100 p-5 flex gap-3" role="status">
          <MailCheck className="w-6 h-6 text-patina-600 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-steel-900">Check your inbox</p>
            <p className="text-sm text-steel-600 mt-1">If {email} has an account, a reset link is on its way. It expires in 30 minutes.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={error}>
            {(id) => <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />}
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
