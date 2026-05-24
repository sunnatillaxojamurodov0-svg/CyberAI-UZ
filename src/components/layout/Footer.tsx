import { GitBranch, Send, Globe } from "lucide-react";

const COLS = [
  { title: "Modules", links: ["Threat Intelligence", "Neural Defense", "Asset Guard", "Prompt Library"] },
  { title: "Platform", links: ["API Docs", "Changelog", "Status", "Security"] },
  { title: "Company", links: ["About", "Journal", "Careers", "Press"] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border px-6 pt-24 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 md:col-span-4">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="relative grid size-7 place-items-center">
                <span className="absolute inset-0 rotate-45 rounded-[5px] bg-primary" />
                <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
                <span className="absolute size-1.5 rounded-full bg-primary" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                CYBER<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sovereign intelligence infrastructure for autonomous systems. Quiet power for the next era of computing.
            </p>
            <div className="mt-6 flex gap-3">
              {[Send, GitBranch, Globe].map((Icon, i) => (
                <a key={i} href="#" className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title} className="col-span-6 md:col-span-2">
              <h4 className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80">{c.title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="transition-colors hover:text-primary">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-12 md:col-span-2">
            <div className="glass-panel rounded-xl border border-border p-5">
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Intel Brief</div>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                Monthly tactical briefings, direct.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="orbital@node.com"
                  className="min-w-0 flex-1 rounded-md border border-border bg-black/40 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button className="rounded-md bg-foreground px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-background">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:flex-row">
          <span>© 2026 CYBERAI SYSTEMS CORP.</span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            ORBITAL SECTOR 001 // SECURE
          </span>
        </div>
      </div>
    </footer>
  );
}
