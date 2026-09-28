import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Logo from '../components/Logo';

export default function Placeholder({ title }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-10">
      <Logo />
      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-muted">Signed in as {user?.name} ({user?.role})</p>
        <p className="mt-2 text-sm">
          Live connection:{' '}
          <span className={connected ? 'text-success' : 'text-critical'}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </p>
        <button onClick={logout} className="mt-5 rounded-lg border border-navy-700 px-4 py-2 text-sm font-semibold">
          Sign out
        </button>
      </div>
    </div>
  );
}