import { Link } from 'react-router-dom';
import { Siren, LayoutDashboard, Brain, GitMerge, Route as RouteIcon, Radio, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth, homePathFor } from '../context/AuthContext';

const LIFECYCLE = ['Detect', 'Understand', 'Verify', 'Prioritize', 'Match', 'Respond', 'Track', 'Resolve'];

const FEATURES = [
  { icon: Brain, title: 'AI-Assisted Triage', text: 'Classifies each report and explains its severity score, factor by factor.' },
  { icon: GitMerge, title: 'Duplicate Detection', text: 'Merges many reports of the same event into one master incident.' },
  { icon: RouteIcon, title: 'Smart Matching', text: 'Ranks responders by distance, availability and specialization.' },
  { icon: Radio, title: 'Real-Time Tracking', text: 'Every status change and responder movement appears live.' },
];

// Static, restrained hero visual with a few labelled markers
const HERO_MARKERS = [
  { top: '28%', left: '22%', color: 'bg-critical', label: 'Critical', pulse: true },
  { top: '58%', left: '64%', color: 'bg-high', label: 'High' },
  { top: '40%', left: '78%', color: 'bg-medium', label: 'Medium' },
  { top: '70%', left: '32%', color: 'bg-success', label: 'Resolved' },
];

export default function Landing() {
  const { user } = useAuth();
  const reportPath = user?.role === 'CITIZEN' ? '/citizen/report' : '/login';
  const commandPath = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? '/admin' : '/login';

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        {user ? (
          <Link to={homePathFor(user.role)} className="text-sm font-semibold text-accent">
            Go to my dashboard →
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-accent">Sign in</Link>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
              From Emergency to Action, Automatically.
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              CRISISFLOW
              <span className="block text-muted">When Every Second Matters</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              AI-powered emergency detection, coordination and real-time response.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={reportPath}
                className="inline-flex items-center gap-2 rounded-xl bg-critical px-6 py-3 font-bold text-white hover:bg-critical/90"
              >
                <Siren size={20} /> Report Emergency
              </Link>
              <Link
                to={commandPath}
                className="inline-flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-900 px-6 py-3 font-semibold hover:border-accent/50"
              >
                <LayoutDashboard size={20} /> Open Command Center
              </Link>
            </div>

            <p className="mt-6 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-success" />
              If a life is in danger right now, call 1122 or 15 first. CrisisFlow supports responders; it does not replace emergency services.
            </p>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-navy-700 bg-navy-900">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(#24334F 1px, transparent 1px), linear-gradient(90deg, #24334F 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {HERO_MARKERS.map((m) => (
              <div key={m.label} className="absolute flex items-center gap-2" style={{ top: m.top, left: m.left }}>
                <span className={`h-3.5 w-3.5 rounded-full ${m.color} ${m.pulse ? 'cf-pulse' : ''}`} />
                <span className="rounded bg-navy-950/80 px-2 py-0.5 text-xs font-semibold">{m.label}</span>
              </div>
            ))}
            <span className="absolute bottom-3 right-3 rounded bg-navy-950/80 px-2 py-1 text-[10px] uppercase tracking-wide text-muted">
              Illustration
            </span>
          </div>
        </section>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-navy-700 bg-navy-900 p-5">
              <Icon className="mb-3 text-accent" size={22} />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>

        <section className="py-8">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {LIFECYCLE.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-navy-700 bg-navy-900 px-3 py-1 font-medium">{step}</span>
                {i < LIFECYCLE.length - 1 && <span className="text-muted">→</span>}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}