import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth, homePathFor } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../utils/constants';

// Demo buttons are shown unless VITE_SHOW_DEMO_LOGIN=false (set this for a public deployment)
const SHOW_DEMO_LOGIN = import.meta.env.VITE_SHOW_DEMO_LOGIN !== 'false';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      const target = location.state?.from || homePathFor(loggedIn.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Only fills the form; the user still presses "Sign in"
  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  const inputClass =
    'w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5 outline-none focus:border-accent';

  return (
    <div className="grid min-h-full place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-navy-700 bg-navy-900 p-6">
          <h1 className="text-xl font-bold">Sign in</h1>

          {error && (
            <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-2.5 font-bold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-muted">
            New here? <Link to="/register" className="font-semibold text-accent">Create an account</Link>
          </p>
        </form>

        {SHOW_DEMO_LOGIN && (
          <div className="mt-6 rounded-2xl border border-dashed border-navy-700 p-4">
            <p className="mb-3 text-center text-xs uppercase tracking-wide text-muted">
              Demo accounts (simulated data)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className={`rounded-lg border py-2 text-sm font-semibold ${
                    email === acc.email ? 'border-accent text-accent' : 'border-navy-700 bg-navy-900 hover:border-accent/50'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              Tap a role to fill its details, then press Sign in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}