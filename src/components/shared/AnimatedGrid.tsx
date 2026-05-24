export function AnimatedGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[920px] rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 70%)" }} />
      <div className="absolute top-40 right-0 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent) 0%, transparent 70%)" }} />
    </div>
  );
}
