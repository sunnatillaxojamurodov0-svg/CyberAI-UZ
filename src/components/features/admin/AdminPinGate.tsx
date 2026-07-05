import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { cn } from "@/lib/utils";

interface AdminPinGateProps {
  onVerified: () => void;
}

export function AdminPinGate({ onVerified }: AdminPinGateProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!pin || pin.length < 6) {
      setError("PIN must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.ok) {
        if (data.requiresSetup) {
          setRequiresSetup(true);
        } else {
          setSuccess(true);
          setTimeout(() => onVerified(), 500);
        }
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch {
      setError("Failed to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!setupPin || setupPin.length < 6) {
      setSetupError("PIN must be at least 6 characters");
      return;
    }
    if (setupPin !== setupConfirm) {
      setSetupError("PINs do not match");
      return;
    }

    setSetupLoading(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/admin/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin: setupPin }),
      });
      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => onVerified(), 500);
      } else {
        setSetupError(data.error || "Failed to set PIN");
      }
    } catch {
      setSetupError("Failed to set PIN");
    } finally {
      setSetupLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-lg font-medium text-foreground">Access Granted</p>
        </div>
      </motion.div>
    );
  }

  if (requiresSetup) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <GlassPanel className="w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-amber-500/10">
              <Shield size={32} className="text-amber-400" />
            </div>

            <div className="text-center">
              <h2 className="font-display text-xl font-bold">Set Admin PIN</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a 4-8 digit PIN for additional admin panel security.
              </p>
            </div>

            <div className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New PIN</label>
                <input
                  type={showPin ? "text" : "password"}
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value.slice(0, 32))}
                  placeholder="Enter 6-32 character PIN"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm focus:border-accent/40 outline-none"
                  maxLength={32}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Letters, numbers, and special characters (!@#$%^&*)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm PIN
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value.slice(0, 32))}
                  placeholder="Confirm PIN"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm focus:border-accent/40 outline-none"
                  maxLength={32}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPin ? "Hide" : "Show"} PIN
              </button>

              {setupError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                  <XCircle size={14} />
                  {setupError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSetup}
                disabled={setupLoading || !setupPin || !setupConfirm}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {setupLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Setting PIN...
                  </span>
                ) : (
                  "Set Admin PIN"
                )}
              </button>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <GlassPanel className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="grid size-16 place-items-center rounded-2xl bg-accent/10">
            <Lock size={32} className="text-accent" />
          </div>

          <div className="text-center">
            <h2 className="font-display text-xl font-bold">Admin Verification</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your admin PIN to access the panel.
            </p>
          </div>

          <div className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Admin PIN</label>
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 32))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter your PIN"
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm focus:border-accent/40 outline-none"
                maxLength={32}
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPin ? "Hide" : "Show"} PIN
            </button>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                <XCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || !pin}
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify PIN"
              )}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Contact the system administrator if you forgot your PIN.
          </p>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
