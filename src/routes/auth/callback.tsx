import { useEffect, useState } from "react";
import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();
  const search = useSearch<{ code?: string; error?: string }>() as { code?: string; error?: string };
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (search.error) {
      setStatus("error");
      setMessage("GitHub authorization was denied.");
      return;
    }

    if (!search.code) {
      setStatus("error");
      setMessage("No authorization code received.");
      return;
    }

    fetch("/api/auth/github/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: search.code }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: { ok: boolean; error?: string }) => {
        if (data.ok) {
          setStatus("success");
          setMessage("Authentication successful. Redirecting...");
          setTimeout(() => router.navigate({ to: "/" }), 1000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Authentication failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error during authentication.");
      });
  }, [search.code, search.error, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="font-mono text-sm text-muted-foreground">Authenticating with GitHub...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="grid size-14 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <p className="font-mono text-sm text-emerald-400">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="grid size-14 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10">
              <XCircle size={28} className="text-destructive" />
            </div>
            <p className="font-mono text-sm text-destructive">{message}</p>
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="mt-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
