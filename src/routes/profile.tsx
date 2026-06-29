import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorSpotlight } from "@/components/shared/CursorSpotlight";
import { ProtectedRoute } from "@/components/features/auth/ProtectedRoute";
import { ProfilePage } from "@/components/features/profile/ProfilePage";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "CyberAI — Profile" },
      { name: "description", content: "User profile and settings." },
      { property: "og:title", content: "CyberAI — Profile" },
      { property: "og:url", content: "https://app.cyberaiuz.workers.dev/profile" },
    ],
    links: [{ rel: "canonical", href: "https://app.cyberaiuz.workers.dev/profile" }],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
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
          <ProfilePage />
        </ProtectedRoute>
      </main>
      <Footer />
    </div>
  );
}
