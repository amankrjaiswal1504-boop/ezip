import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Map, Settings, Wallet, WifiOff } from 'lucide-react';
import Logo from '../components/Logo';
import { PreferenceButtons, UserMenu } from '../components/Navbar';
import { PageFallback } from '../components/PageFallback';
import { useOnline } from '../hooks/useApi';
import { cx } from '../components/ui';

const TABS = [
  { to: '/collector', label: 'Today', icon: ClipboardList, end: true },
  { to: '/collector/route', label: 'Route', icon: Map },
  { to: '/collector/earnings', label: 'Earnings', icon: Wallet },
  { to: '/collector/settings', label: 'Settings', icon: Settings },
];

// Mobile-first shell for collectors: top bar + bottom tab bar.
export default function CollectorLayout() {
  const online = useOnline();
  return (
    <div className="min-h-screen flex flex-col bg-steel-50">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-steel-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          <Logo to="/collector" />
          <span className="text-xs font-semibold uppercase tracking-wider text-patina-700 bg-patina-100 rounded-full px-2 py-0.5 ml-1">Partner</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden sm:flex">
              <PreferenceButtons />
            </div>
            <UserMenu />
          </div>
        </div>
        {!online && (
          <div className="bg-amber-100 text-amber-700 text-xs text-center py-1.5 flex items-center justify-center gap-1.5" role="status">
            <WifiOff className="w-3.5 h-3.5" aria-hidden /> You're offline. Weighings are saved on this phone and will sync automatically.
          </div>
        )}
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 pb-28">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-steel-100" aria-label="Collector" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-4 pr-20 sm:pr-0">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-rust-600' : 'text-steel-500 hover:text-steel-900')}
            >
              <tab.icon className="w-5 h-5" aria-hidden />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
