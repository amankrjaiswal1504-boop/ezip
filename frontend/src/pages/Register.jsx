import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(data) {
    setSubmitting(true);
    try {
      await registerUser(data);
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-head text-2xl font-semibold mb-1">Create an account</h1>
      <p className="text-steel-500 mb-6 text-sm">Book your first pickup in under a minute.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Full name</label>
          <input className="input" {...register('name', { required: true })} />
          {errors.name && <p className="text-rust-600 text-xs mt-1">Name is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} />
          {errors.email && <p className="text-rust-600 text-xs mt-1">Email is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Phone</label>
          <input className="input" {...register('phone', { required: true })} />
          {errors.phone && <p className="text-rust-600 text-xs mt-1">Phone is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password</label>
          <input className="input" type="password" {...register('password', { required: true, minLength: 6 })} />
          {errors.password && <p className="text-rust-600 text-xs mt-1">Minimum 6 characters</p>}
        </div>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-steel-500 mt-6">
        Already have an account? <Link to="/login" className="text-rust-600 font-medium">Log in</Link>
      </p>
    </div>
  );
}
