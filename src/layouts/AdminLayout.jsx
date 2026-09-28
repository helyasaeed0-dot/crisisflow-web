import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Siren, Ambulance, Map as MapIcon, BarChart3, Brain,
  PlayCircle, Users, ScrollText, Menu, X, LogOut,
} from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useNotifications from '../hooks/useNotifications';
import { incidentLinkFor } from '../utils/links';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/incidents', label: 'Incidents', icon: Siren },
  { to: '/admin/responders', label: 'Responders', icon: Ambulance },
  { to: '/admin/map', label: 'Live Map', icon: MapIcon },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/insights', label: 'AI Insights', icon: Brain },
  { to: '/admin/demo', label: 'Demo Mode', icon: PlayCircle },
];

const SUPER_ADMIN_NAV = [
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
];

function NavItems({ items, onNavigate }) {
  return items.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-navy-800 hover:text-fg'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  ));
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { unreadCount, latest, dismissLatest } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const onSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const openLatest = () => {
    const link = incidentLinkFor(user.role, latest?.data?.incidentId);
    dismissLatest();
    if (link) navigate(link);
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/admin" onClick={() => setMenuOpen(false)}>
        <Logo />
      </Link>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Command center">
        <NavItems items={NAV} onNavigate={() => setMenuOpen(false)} />
        {isSuperAdmin && (
          <>
            <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Super Admin</p>
            <NavItems items={SUPER_ADMIN_NAV} onNavigate={() => setMenuOpen(false)} />
          </>
        )}
      </nav>
      <div className="rounded-lg border border-navy-700 p-3 text-sm">
        <p className="font-semibold">{user?.name}</p>
        <p className="text-xs text-muted">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[1100] hidden w-60 border-r border-navy-700 bg-navy-950 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[1300] lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-64 border-r border-navy-700 bg-navy-950">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-navy-700 bg-navy-950/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <p className="hidden text-sm text-muted lg:block">From Emergency to Action, Automatically.</p>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-success' : 'text-critical'}`}>
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-critical'}`} />
              {connected ? 'Live' : 'Offline'}
            </span>
            <NotificationBell count={unreadCount} to="/admin/notifications" />
            <button
              type="button"
              onClick={onSignOut}
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {latest && (
          <div className="fixed right-4 top-16 z-[1200] w-80 max-w-[calc(100%-2rem)]">
            <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-navy-900 p-3 shadow-xl">
              <button type="button" onClick={openLatest} className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold">{latest.title}</p>
                <p className="text-sm text-muted">{latest.message}</p>
              </button>
              <button type="button" onClick={dismissLatest} aria-label="Dismiss notification" className="text-muted">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}