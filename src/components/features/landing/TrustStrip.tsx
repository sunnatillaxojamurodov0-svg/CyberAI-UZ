const LOGOS = ["AETHERIA", "VECTRA-9", "CORE.SYS", "LUNAR-OPS", "NEO-GEN", "QUANTUM_CORE", "TITAN-NET"];

export function TrustStrip() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface/30 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
      <div className="flex animate-marquee gap-16 whitespace-nowrap opacity-60">
        {[...LOGOS, ...LOGOS].map((l, i) => (
          <span key={i} className="font-mono text-sm font-bold tracking-[0.25em] text-muted-foreground">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
