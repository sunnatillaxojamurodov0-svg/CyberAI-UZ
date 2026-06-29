import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProgressiveBlur } from "@/components/shared/ProgressiveBlur";
import { ConsolePage } from "@/components/features/console/ConsolePage";
import { ProtectedRoute } from "@/components/features/auth/ProtectedRoute";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "CyberAI — Console · Kali CTF Lab" },
      {
        name: "description",
        content:
          "30 CTF challenges in a sandboxed Kali Linux environment, 3 levels. Real terminal, VAEL AI co-pilot, and OSCP-style scoring.",
      },
      { property: "og:title", content: "CyberAI — Kali CTF Console" },
      {
        property: "og:description",
        content:
          "Fully isolated Kali sandbox. 30 CTFs · 3 levels · VAEL AI co-pilot · OSCP-style scoring.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/console" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/console" }],
  }),
  component: ConsoleRoute,
});

function ConsoleRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <ProgressiveBlur position="top" />
      <ProgressiveBlur position="bottom" />
      <Navbar />
      <main className="relative z-10 pt-16">
        <ProtectedRoute
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="font-mono text-sm text-muted-foreground">Sandbox yuklanmoqda…</div>
            </div>
          }
        >
          <ConsolePage />
        </ProtectedRoute>
      </main>
    </div>
  );
}
