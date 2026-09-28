// Brand mark from /public/brand plus the "CrisisFlow" name as text for sharp rendering
export default function Logo({ size = 'md' }) {
  const text = size === 'lg' ? 'text-2xl' : 'text-lg';
  const mark = size === 'lg' ? 'h-10' : 'h-8';

  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${text}`}>
      <img src="/brand/crisisflow-mark-cyan.png" alt="" aria-hidden="true" className={`${mark} w-auto`} />
      <span>
        Crisis<span className="text-accent">Flow</span>
      </span>
    </span>
  );
}