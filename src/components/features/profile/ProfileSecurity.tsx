import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldOff, Loader2, Check, X, Copy, Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import QRCode from "qrcode";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ProfileSecurity() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  useEffect(() => {
    if (qrCodeUrl) {
      QRCode.toDataURL(qrCodeUrl, { width: 120, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => { });
    }
  }, [qrCodeUrl]);

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
        setMessage({ type: "error", text: data.error || t("profile.security.error.setup_failed") });
      }
    } catch {
      setMessage({ type: "error", text: t("profile.security.error.network") });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      setMessage({ type: "error", text: t("profile.security.error.invalid_digits") });
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
        setMessage({ type: "success", text: t("profile.security.success.enabled") });
      } else {
        setMessage({ type: "error", text: data.error || t("profile.security.error.invalid_code") });
      }
    } catch {
      setMessage({ type: "error", text: t("profile.security.error.network") });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableToken || disableToken.length !== 6) {
      setMessage({ type: "error", text: t("profile.security.error.invalid_digits") });
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
        setMessage({ type: "success", text: t("profile.security.success.disabled") });
      } else {
        setMessage({ type: "error", text: data.error || t("profile.security.error.invalid_code") });
      }
    } catch {
      setMessage({ type: "error", text: t("profile.security.error.network") });
    } finally {
      setActionLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setMessage({ type: "success", text: t("profile.security.success.copied") });
  };

  const handleChangePassword = async () => {
    setPwMessage(null);
    if (!currentPassword) {
      setPwMessage({ type: "error", text: "Enter current password." });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (currentPassword === newPassword) {
      setPwMessage({ type: "error", text: "New password must be different from current." });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setPwMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwMessage({ type: "error", text: data.error || "Failed to change password." });
      }
    } catch {
      setPwMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
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
            {t("profile.security.title")}
          </span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
              twoFAEnabled
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {twoFAEnabled ? t("profile.security.enabled") : t("profile.security.disabled")}
          </span>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {twoFAEnabled ? t("profile.security.enabled_desc") : t("profile.security.disabled_desc")}
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
              {qrDataUrl && (
                <div className="rounded-lg border border-border bg-white p-3">
                  <img
                    src={qrDataUrl}
                    alt={t("profile.security.qr_alt")}
                    className="h-[120px] w-[120px]"
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("profile.security.qr_instruction")}
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
                    aria-label="Copy secret"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {t("profile.security.code_label")}
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
              {t("profile.security.cancel")}
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
              {t("profile.security.disable_instruction")}
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
              {t("profile.security.cancel")}
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
                {t("profile.security.disable_btn")}
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
                {t("profile.security.enable_btn")}
              </button>
            )}
          </div>
        )}
      </GlassPanel>

      {/* Password Change */}
      <GlassPanel className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={15} className="text-accent" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Change Password
          </span>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Update your account password. Make sure to use a strong, unique password.
        </p>

        {pwMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-4 rounded-lg px-3 py-2 font-mono text-[11px]",
              pwMessage.type === "success"
                ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border border-destructive/20 bg-destructive/5 text-destructive",
            )}
          >
            {pwMessage.text}
          </motion.div>
        )}

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Current Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      newPassword.length >= i * 3
                        ? newPassword.length >= 12
                          ? "bg-emerald-500"
                          : newPassword.length >= 8
                            ? "bg-yellow-500"
                            : "bg-destructive"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Confirm New Password
            </label>
            <div className="relative">
              <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type={showNewPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={cn(
                  "w-full rounded-xl border bg-surface py-3 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40",
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-destructive/40"
                    : confirmPassword && confirmPassword === newPassword
                      ? "border-emerald-500/40"
                      : "border-border",
                )}
              />
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-[11px] text-destructive">Passwords do not match</p>
            )}
            {confirmPassword && confirmPassword === newPassword && (
              <p className="mt-1 text-[11px] text-emerald-400">Passwords match</p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40"
          >
            {pwLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Lock size={15} />
            )}
            {pwLoading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
