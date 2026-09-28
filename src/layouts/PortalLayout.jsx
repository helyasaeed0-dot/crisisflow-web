import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Siren, FileText, History, LogOut, LayoutDashboard, X } from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useAuth, homePathFor } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useNotifications from '../hooks/useNotifications';
import { incidentLinkFor } from '../utils/links';

const NAV = {
  CITIZEN: [
    { to: '/citizen', label: 'Home', icon: Home, end: true },
    { to: '/citizen/report', label: 'Report', icon: Siren },
    { to: '/citizen/reports', label: 'My Reports', icon: FileText },
  ],
  RESPONDER: [
    { to: '/responder', label: 'Home', icon: Home, end: true },
    { to: '/responder/history', label: 'History', icon: History },
  ],
};

// Mobile-first layout for the citizen and responder portals
export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { unreadCount, latest, dismissLatest } = useNotifications();
  const navigate = useNavigate();
  const nav = NAV[user?.role] || [];
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const onSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const openLatest = () => {
    const link = incidentLinkFor(user.role, latest?.data?.incidentId);
    dismissLatest();
    if (link) navigate(link);
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-[1100] border-b border-navy-700 bg-navy-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 lg:max-w-3xl">
          <Link to={homePathFor(user.role)}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <span
              className={`mr-1 h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-critical'}`}
              title={connected ? 'Live updates connected' : 'Live updates disconnected'}
            >
              <span className="sr-only">{connected ? 'Live updates connected' : 'Live updates disconnected'}</span>
            </span>
            {isAdmin && (
              <Link to="/admin" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800" aria-label="Command Center">
                <LayoutDashboard size={18} />
              </Link>
            )}
            <NotificationBell count={unreadCount} />
            <button
              type="button"
              onClick={onSignOut}
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {latest && (
        <div className="fixed inset-x-0 top-16 z-[1200] px-4">
          <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-accent/40 bg-navy-900 p-3 shadow-xl">
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

      <main className={`mx-auto w-full max-w-md flex-1 px-4 py-5 lg:max-w-3xl ${nav.length ? 'pb-24' : ''}`}>
        <Outlet />
      </main>

      {nav.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-[1100] border-t border-navy-700 bg-navy-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${isActive ? 'text-accent' : 'text-muted'}`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}