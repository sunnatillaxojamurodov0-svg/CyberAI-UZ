import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as Sentry from "@sentry/react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { AuthModal } from "@/components/features/auth/AuthModal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e17] px-4">
      <div className="max-w-xl w-full">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 font-mono shadow-[0_0_60px_-20px] shadow-destructive/20">
          <div className="mb-6 flex items-center gap-2 text-destructive">
            <span className="inline-block size-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">KERNEL PANIC</span>
            <span className="ml-auto text-[10px] text-destructive/50">cyberai::error_handler</span>
          </div>

          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-destructive/90">
              <span className="text-destructive font-bold">[ERROR]</span> Kernel panic: Route not
              found.
            </p>
            <p className="text-destructive/70">
              <span className="text-destructive/50">[CAUSE]</span> The requested route does not
              exist or has been relocated.
            </p>
            <p className="text-destructive/50">
              <span className="text-destructive/40">[STATUS]</span> 404 — Not Found
            </p>
            <p className="text-destructive/50">
              <span className="text-destructive/40">[ADDRESS]</span> Access denied. Your IP has been
              logged.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-destructive transition-all hover:bg-destructive/10 hover:border-destructive/50"
            >
              $ reboot --system
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground transition-all hover:border-muted-foreground/30 hover:text-foreground"
            >
              $ cd ..
            </button>
          </div>

          <div className="mt-6 border-t border-destructive/10 pt-4">
            <p className="font-mono text-[10px] text-destructive/30">
              cyberai@kernel:~$ _ <span className="animate-blink">|</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  Sentry.captureException(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page failed to load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or go back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CyberAI — Autonomous Defense for the Synthetic Era" },
      {
        name: "description",
        content: "Sovereign AI cybersecurity platform for high-stakes infrastructure.",
      },
      { property: "og:site_name", content: "CyberAI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#020408" },
      { property: "og:title", content: "CyberAI — Autonomous Defense for the Synthetic Era" },
      { name: "twitter:title", content: "CyberAI — Autonomous Defense for the Synthetic Era" },
      {
        property: "og:description",
        content: "Sovereign AI cybersecurity platform for high-stakes infrastructure.",
      },
      {
        name: "twitter:description",
        content: "Sovereign AI cybersecurity platform for high-stakes infrastructure.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/708cf964-2a2c-4a0a-b091-e4c6ca7db4a0",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/708cf964-2a2c-4a0a-b091-e4c6ca7db4a0",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "CyberAI",
              url: "https://cyberaiuz.lovable.app",
              description: "Sovereign AI cybersecurity platform for high-stakes infrastructure.",
            },
            {
              "@type": "WebSite",
              name: "CyberAI",
              url: "https://cyberaiuz.lovable.app",
              description:
                "Autonomous defense for the synthetic era — predictive threat intelligence, conversational defense, and autonomous remediation.",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <AuthModal />
      </AuthProvider>
    </QueryClientProvider>
  );
}
