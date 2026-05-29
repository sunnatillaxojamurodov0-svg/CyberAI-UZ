import { useEffect, useState } from "react";
import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("Authenticated. Redirecting...");
        setTimeout(() => router.navigate({ to: "/chat" }), 500);
      } else {
        setStatus("No session found. Redirecting...");
        setTimeout(() => router.navigate({ to: "/" }), 1000);
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={24} className="animate-spin text-accent" />
        <p className="text-sm text-muted-foreground font-mono">{status}</p>
      </div>
    </div>
  );
}
