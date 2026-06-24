import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldOff, Loader2, Check, X, Copy, Eye, EyeOff } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function ProfileSecurity() {
  const { user } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa");
      const data = await res.json();
      setTwoFAEnabled(data.enabled);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (data.ok) {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setSetupMode(true);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to setup 2FA" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      setMessage({ type: "error", text: "Enter a valid 6-digit code" });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", token: verifyToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setTwoFAEnabled(true);
        setSetupMode(false);
        setVerifyToken("");
        setMessage({ type: "success", text: "2FA enabled successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Invalid code" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableToken || disableToken.length !== 6) {
      setMessage({ type: "error", text: "Enter a valid 6-digit code" });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", token: disableToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setTwoFAEnabled(false);
        setShowDisable(false);
        setDisableToken("");
        setMessage({ type: "success", text: "2FA disabled successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Invalid code" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setMessage({ type: "success", text: "Secret copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* 2FA Status */}
      <GlassPanel className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {twoFAEnabled ? (
            <ShieldCheck size={15} className="text-emerald-400" />
          ) : (
            <Shield size={15} className="text-muted-foreground" />
          )}
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Two-Factor Authentication
          </span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
              twoFAEnabled
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {twoFAEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {twoFAEnabled
            ? "Your account is protected with two-factor authentication."
            : "Add an extra layer of security to your account with TOTP-based two-factor authentication."}
        </p>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-4 rounded-lg px-3 py-2 font-mono text-[11px]",
              message.type === "success"
                ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border border-destructive/20 bg-destructive/5 text-destructive",
            )}
          >
            {message.text}
          </motion.div>
        )}

        {/* Setup Mode */}
        {setupMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4 border-t border-border pt-4"
          >
            <div className="flex items-center gap-4">
              {qrCodeUrl && (
                <div className="rounded-lg border border-border bg-white p-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}`}
                    alt="2FA QR Code"
                    className="h-[120px] w-[120px]"
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Scan this QR code with your authenticator app
                </p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                    {showSecret ? secret : "•".repeat(16)}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={copySecret}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Enter 6-digit code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40 font-mono text-center tracking-[0.3em]"
                />
                <button
                  onClick={handleEnable}
                  disabled={actionLoading || verifyToken.length !== 6}
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-all disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSetupMode(false);
                setSecret("");
                setQrCodeUrl("");
                setVerifyToken("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Disable Mode */}
        {showDisable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4 border-t border-border pt-4"
          >
            <p className="text-xs text-muted-foreground">
              Enter your 2FA code to disable two-factor authentication.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 rounded-xl border border-border bg-surface py-3 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40 font-mono text-center tracking-[0.3em]"
              />
              <button
                onClick={handleDisable}
                disabled={actionLoading || disableToken.length !== 6}
                className="rounded-xl bg-destructive px-6 py-3 text-sm font-semibold text-white hover:bg-destructive/90 transition-all disabled:opacity-40"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
              </button>
            </div>
            <button
              onClick={() => {
                setShowDisable(false);
                setDisableToken("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Action Buttons */}
        {!setupMode && !showDisable && (
          <div className="flex gap-3">
            {twoFAEnabled ? (
              <button
                onClick={() => setShowDisable(true)}
                className="flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-all"
              >
                <ShieldOff size={14} />
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleSetup}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/5 transition-all"
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                Enable 2FA
              </button>
            )}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
