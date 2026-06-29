import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChallengeAdmin } from "@/components/features/admin/ChallengeAdmin";
import { AnalyticsDashboard } from "@/components/features/console/AnalyticsDashboard";
import { AdminPinGate } from "@/components/features/admin/AdminPinGate";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);

  // Check if user is admin
  if (!user || !(user as { is_admin?: number }).is_admin) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="relative z-10 px-4 py-10 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <h1 className="font-display text-2xl font-bold text-red-400">Access Denied</h1>
              <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show PIN gate if not verified
  if (!pinVerified) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="relative z-10 px-4 py-10 md:px-6">
          <div className="mx-auto max-w-6xl">
            <AdminPinGate onVerified={() => setPinVerified(true)} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative z-10 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-muted-foreground">Manage challenges and platform settings</p>
          </div>
          <div className="space-y-8">
            <AnalyticsDashboard />
            <ChallengeAdmin />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
