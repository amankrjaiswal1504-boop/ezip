import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import { PageFallback } from '../components/PageFallback';
import { useAuth } from '../context/AuthContext';
import { cx } from '../components/ui';

// sections: [{ title?, links: [{ to, label, icon, end?, perm? }] }]
function SideNav({ sections, onNavigate }) {
  const { can } = useAuth();
  return (
    <nav className="space-y-6" aria-label="Dashboard">
      {sections.map((s, i) => {
        const links = s.links.filter((l) => !l.perm || can(l.perm) || (Array.isArray(l.perm) && l.perm.some(can)));
        if (!links.length) return null;
        return (
          <div key={s.title || i}>
            {s.title && <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-steel-400">{s.title}</div>}
            <div className="flex flex-col gap-0.5">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-rust-50 text-rust-700' : 'text-steel-700 hover:bg-steel-100 hover:text-steel-900'
                    )
                  }
                >
                  {l.icon && <l.icon className="w-[18px] h-[18px] shrink-0" aria-hidden />}
                  <span className="truncate">{l.label}</span>
                  {l.badge ? <span className="ml-auto text-[11px] rounded-full bg-rust-600 text-white px-1.5">{l.badge}</span> : null}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ sections, wide = false }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const current = sections.flatMap((s) => s.links).find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to)));
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className={cx('flex-1 w-full mx-auto flex gap-8 px-4 sm:px-6 py-6 lg:py-8', wide ? 'max-w-[90rem]' : 'max-w-6xl')}>
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6 pr-1">
            <SideNav sections={sections} />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-lg border border-steel-200 bg-surface px-3 py-2 text-sm font-medium"
            aria-label="Open section menu"
          >
            <Menu className="w-4 h-4" aria-hidden />
            {current?.label || 'Menu'}
          </button>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface p-4 overflow-y-auto shadow-lift animate-fade-up" role="dialog" aria-label="Section menu">
            <div className="flex justify-end mb-2">
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-steel-100" aria-label="Close menu">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <SideNav sections={sections} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
