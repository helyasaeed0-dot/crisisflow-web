import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth, homePathFor } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { RESPONDER_TYPE_LABELS } from '../utils/constants';

const inputClass =
  'w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2.5 outline-none focus:border-accent';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CITIZEN',
    responderType: 'AMBULANCE',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      ...(form.phone && { phone: form.phone }),
      ...(form.role === 'RESPONDER' && { responderType: form.responderType }),
    };

    try {
      const created = await register(payload);
      navigate(homePathFor(created.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-full place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-navy-700 bg-navy-900 p-6">
          <h1 className="text-xl font-bold">Create an account</h1>

          {error && (
            <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-navy-950 p-1">
            {['CITIZEN', 'RESPONDER'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role }))}
                className={`rounded-md py-2 text-sm font-semibold ${
                  form.role === role ? 'bg-accent text-navy-950' : 'text-muted'
                }`}
              >
                {role === 'CITIZEN' ? 'Citizen' : 'Responder'}
              </button>
            ))}
          </div>

          <input className={inputClass} placeholder="Full name" required value={form.name} onChange={update('name')} />
          <input className={inputClass} placeholder="Email" type="email" required value={form.email} onChange={update('email')} />
          <input className={inputClass} placeholder="Phone (optional)" value={form.phone} onChange={update('phone')} />
          <input
            className={inputClass}
            placeholder="Password (min 8 characters)"
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={update('password')}
          />

          {form.role === 'RESPONDER' && (
            <>
              <select className={inputClass} value={form.responderType} onChange={update('responderType')}>
                {Object.entries(RESPONDER_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-muted">
                New responder accounts must be verified by an admin before they can receive assignments.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-2.5 font-bold text-navy-950 hover:bg-accent/90 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-muted">
            Already registered? <Link to="/login" className="font-semibold text-accent">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}