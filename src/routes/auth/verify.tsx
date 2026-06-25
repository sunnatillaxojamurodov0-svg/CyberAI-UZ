import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; message?: string; error?: string }) => {
        if (data.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch((err) => {
        console.error("Email verification failed:", err);
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative z-10 flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 size={48} className="mx-auto animate-spin text-accent" />
              <h1 className="text-xl font-semibold">Verifying your email...</h1>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-semibold">Email Verified!</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
              >
                Go to Dashboard
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10">
                <XCircle size={32} className="text-destructive" />
              </div>
              <h1 className="text-xl font-semibold">Verification Failed</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-all"
              >
                Back to Home
              </a>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
