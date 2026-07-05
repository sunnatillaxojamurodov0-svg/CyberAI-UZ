import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProtectedRoute } from "@/components/features/auth/ProtectedRoute";
import { DashboardPage } from "@/components/features/dashboard/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "CyberAI — Dashboard" },
      { name: "description", content: "System dashboard and analytics." },
      { property: "og:title", content: "CyberAI — Dashboard" },
      { property: "og:url", content: "https://app.cyberaiuz.workers.dev/dashboard" },
    ],
    links: [{ rel: "canonical", href: "https://app.cyberaiuz.workers.dev/dashboard" }],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navbar />
      <main className="relative z-10 pt-16">
        <ProtectedRoute
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="font-mono text-sm text-muted-foreground">Loading…</div>
            </div>
          }
        >
          <DashboardPage />
        </ProtectedRoute>
      </main>
      <Footer />
    </div>
  );
}
