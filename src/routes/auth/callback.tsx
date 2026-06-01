import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.navigate({ to: "/" });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={24} className="animate-spin text-accent" />
        <p className="text-sm text-muted-foreground font-mono">Redirecting...</p>
      </div>
    </div>
  );
}
