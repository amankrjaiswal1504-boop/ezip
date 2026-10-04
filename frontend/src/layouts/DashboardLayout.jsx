import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function DashboardLayout({ links }) {
  return (
    <div className="min-h-screen flex flex-col font-body text-steel-900 bg-steel-50">
      <Navbar />
      <div className="flex-1 max-w-6xl w-full mx-auto flex gap-8 px-5 py-8">
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="flex flex-col gap-1 sticky top-24">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-sm text-sm font-medium ${
                    isActive ? 'bg-steel-900 text-white' : 'text-steel-700 hover:bg-steel-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
