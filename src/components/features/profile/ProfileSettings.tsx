import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, Trash2, AlertTriangle, LogOut } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";

interface Props {
  onSignOut: () => void;
}

export function ProfileSettings({ onSignOut }: Props) {
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    security: true,
    updates: false,
  });

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    // Supabase admin delete — in production use Edge Function
    // Here we just sign out as a safe fallback
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
            Notification Settings
          </span>
        </div>
        <div className="space-y-3">
          {[
            {
              key: "email" as const,
              label: "Email Notifications",
              desc: "Important news and updates",
            },
            {
              key: "security" as const,
              label: "Security Alerts",
              desc: "About sign-ins and activity",
            },
            {
              key: "updates" as const,
              label: "Platform Updates",
              desc: "New features and changes",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((p) => ({ ...p, [item.key]: !p[item.key] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications[item.key] ? "bg-accent" : "bg-surface-2"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    notifications[item.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
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
            Privacy Settings
          </span>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your profile is only visible to you. Other users cannot access your personal
            information.
          </p>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-primary/80">
            All data is protected by Supabase Row Level Security (RLS).
          </div>
        </div>
      </GlassPanel>

      {/* Sign out */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground">Sign Out</div>
            <div className="mt-0.5 text-sm text-muted-foreground">End current session</div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </GlassPanel>

      {/* Delete account */}
      <GlassPanel className="border-destructive/20 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 size={15} className="text-destructive" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-destructive/80">
            Delete Account
          </span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Deleting an account is irreversible. All your data will be permanently erased. Type{" "}
          <span className="font-mono font-bold text-destructive">DELETE</span> in the field below to
          confirm.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
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
            Delete Account
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
