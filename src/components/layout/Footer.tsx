import brandLogo from "@/assets/brand-logo.png";

export function Footer() {
  return (
    <footer className="relative border-t border-border px-6 pt-24 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 md:col-span-4">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="grid size-7 place-items-center">
                <img src={brandLogo} alt="CyberAI" className="size-7 object-contain" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                CYBER<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sovereign intelligence infrastructure for autonomous systems. Quiet power for the next
              era of computing.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://t.me/Cyber_AI_UZ"
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@CyberAI_UZ"
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/cyberaiuz?utm_source=qr&igsh=dTRlNmFpNHdtNDN6"
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:flex-row">
          <span>&copy; 2026 CYBERAI SYSTEMS CORP.</span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            ORBITAL SECTOR 001 // SECURE
          </span>
        </div>
      </div>
    </footer>
  );
}
