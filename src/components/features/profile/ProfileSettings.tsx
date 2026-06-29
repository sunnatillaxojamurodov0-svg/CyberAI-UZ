import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, Trash2, AlertTriangle, LogOut, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  onSignOut: () => void;
}

interface NotificationSettings {
  email: boolean;
  security: boolean;
  updates: boolean;
}

export function ProfileSettings({ onSignOut }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    security: true,
    updates: false,
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { ok: boolean; settings?: NotificationSettings }) => {
        if (data.ok && data.settings) {
          setNotifications(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const saveSettings = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      setSaving(key);
      const next = { ...notifications, [key]: value };
      setNotifications(next);
      try {
        await fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(next),
        });
      } catch {
        setNotifications(notifications);
      } finally {
        setSaving(null);
      }
    },
    [notifications],
  );

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    await onSignOut();
    setDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Notifications */}
      <GlassPanel className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Bell size={15} className="text-accent" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("profile.settings.notifications")}
          </span>
        </div>
        <div className="space-y-3">
          {(
            [
              {
                key: "email" as const,
                label: t("profile.settings.email_notif"),
                desc: t("profile.settings.email_notif_desc"),
              },
              {
                key: "security" as const,
                label: t("profile.settings.security_alerts"),
                desc: t("profile.settings.security_alerts_desc"),
              },
              {
                key: "updates" as const,
                label: t("profile.settings.platform_updates"),
                desc: t("profile.settings.platform_updates_desc"),
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-4 py-3 transition-colors hover:bg-surface/50"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                disabled={saving === item.key}
                onClick={() => saveSettings(item.key, !notifications[item.key])}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                  notifications[item.key] ? "bg-accent" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
                    notifications[item.key] ? "translate-x-[22px]" : "translate-x-[2px]",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Privacy */}
      <GlassPanel className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock size={15} className="text-primary" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("profile.settings.privacy")}
          </span>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{t("profile.settings.privacy_desc")}</p>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-primary/80">
            {t("profile.settings.rls")}
          </div>
        </div>
      </GlassPanel>

      {/* Sign out */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground">
              {t("profile.settings.sign_out_title")}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {t("profile.settings.sign_out_desc")}
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
          >
            <LogOut size={15} />
            {t("profile.settings.sign_out_btn")}
          </button>
        </div>
      </GlassPanel>

      {/* Delete account */}
      <GlassPanel className="border-destructive/20 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 size={15} className="text-destructive" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-destructive/80">
            {t("profile.settings.delete_title")}
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {t("profile.settings.delete_desc")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={t("profile.settings.delete_placeholder")}
            className="flex-1 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-destructive/50"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-destructive/80 disabled:opacity-40"
          >
            {deleting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <AlertTriangle size={15} />
            )}
            {t("profile.settings.delete_btn")}
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
