import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      const loggedInUser = await login(data.email, data.password);
      toast.success('Logged in');
      const dest =
        location.state?.from ||
        (loggedInUser.role === 'admin' ? '/admin' : loggedInUser.role === 'collector' ? '/collector' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-head text-2xl font-semibold mb-1">Log in</h1>
      <p className="text-steel-500 mb-6 text-sm">Access your ScrapMate dashboard.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} />
          {errors.email && <p className="text-rust-600 text-xs mt-1">Email is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password</label>
          <input className="input" type="password" {...register('password', { required: true })} />
          {errors.password && <p className="text-rust-600 text-xs mt-1">Password is required</p>}
        </div>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-steel-500 mt-6">
        No account? <Link to="/register" className="text-rust-600 font-medium">Register</Link>
      </p>

      <div className="mt-8 card bg-steel-100/60 text-xs text-steel-600">
        <div className="font-medium mb-1">Demo credentials (dev seed data)</div>
        <div>Admin: admin@scrapmate.dev / Admin@123</div>
        <div>Collector: collector1@scrapmate.dev / Collector@123</div>
        <div>Customer: customer@scrapmate.dev / Customer@123</div>
      </div>
    </div>
  );
}
