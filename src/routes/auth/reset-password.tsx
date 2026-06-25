import { useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setMessage("Password reset successfully! You can now log in.");
        setTimeout(() => navigate({ to: "/" }), 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Password reset failed.");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="relative z-10 flex items-center justify-center px-4 pt-24 pb-16">
          <div className="max-w-md w-full text-center space-y-4">
            <XCircle size={48} className="mx-auto text-destructive" />
            <h1 className="text-xl font-semibold">Invalid Reset Link</h1>
            <p className="text-sm text-muted-foreground">No reset token provided.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative z-10 flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {status === "success" ? (
            <div className="text-center space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-semibold">Password Reset!</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h1 className="text-xl font-semibold">Reset Password</h1>
                <p className="mt-2 text-sm text-muted-foreground">Enter your new password below.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40 font-mono"
                    />
                  </div>
                </div>
              </div>

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive"
                >
                  {message}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !password || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_0_30px_-8px] shadow-accent/40 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Lock size={15} />
                )}
                {status === "loading" ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
