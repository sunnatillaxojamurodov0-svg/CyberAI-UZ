import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChallengeAdmin } from "@/components/features/admin/ChallengeAdmin";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative z-10 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-muted-foreground">Manage challenges and platform settings</p>
          </div>
          <ChallengeAdmin />
        </div>
      </main>
      <Footer />
    </div>
  );
}
