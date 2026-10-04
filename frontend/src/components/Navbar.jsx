import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const dashboardPath =
    user?.role === 'admin' ? '/admin' : user?.role === 'collector' ? '/collector' : '/dashboard';

  return (
    <header className="border-b border-steel-100 bg-steel-50 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-rust-600 flex items-center justify-center text-white font-head font-bold rounded-sm">
            S
          </span>
          <span className="font-head font-semibold text-lg tracking-tight">ScrapMate</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-steel-700">
          <Link to="/rates" className="hover:text-steel-900">
            Scrap rates
          </Link>
          {user && (
            <Link to={dashboardPath} className="hover:text-steel-900">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium text-steel-700 hover:text-steel-900">
                Log in
              </Link>
              <Link to="/schedule-pickup" className="btn-primary text-sm">
                Schedule pickup
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-steel-500">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-outline text-sm">
                Log out
              </button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <div className="w-6 h-0.5 bg-steel-900 mb-1.5" />
          <div className="w-6 h-0.5 bg-steel-900" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-steel-100 px-5 py-4 flex flex-col gap-3 bg-white">
          <Link to="/rates" onClick={() => setOpen(false)}>
            Scrap rates
          </Link>
          {user ? (
            <>
              <Link to={dashboardPath} onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-left">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
              <Link to="/schedule-pickup" onClick={() => setOpen(false)}>
                Schedule pickup
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
