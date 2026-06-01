import { useState } from "react";
import { motion } from "framer-motion";
import { User, Settings, Shield, Camera } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/lib/auth-context";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { ProfileSecurity } from "./ProfileSecurity";
import { ProfileSettings } from "./ProfileSettings";
import { cn } from "@/lib/utils";

type Tab = "overview" | "security" | "settings";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "overview", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const name = profile?.name ?? user?.email.split("@")[0] ?? "Operator";

  const handleAvatarChange = async (_e: React.ChangeEvent<HTMLInputElement>) => {
    // Avatar upload not implemented in D1 auth yet
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
          <span className="size-2 animate-ping rounded-full bg-accent" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* ── Header card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassPanel className="relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute -right-32 -top-32 size-80 rounded-full bg-accent/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-primary/6 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative size-24 overflow-hidden rounded-full border-2 border-accent/30 shadow-[0_0_30px_-8px] shadow-accent/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/20 to-primary/15">
                    <span className="font-display text-3xl font-bold text-foreground">
                      {name[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className={cn(
                  "absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full border-2 border-background bg-accent transition-all hover:bg-accent/80",
                  avatarUploading && "animate-pulse",
                )}
                title="Change avatar"
              >
                <Camera size={14} className="text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {name}
                </h1>
              </div>
              <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                {user?.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Registered with email</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-xl border border-border bg-surface/40 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <GlassPanel className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Email</div>
                  <div className="text-sm text-foreground">{user?.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Name</div>
                  <div className="text-sm text-foreground">{profile?.name ?? "Not set"}</div>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}
        {activeTab === "security" && <ProfileSecurity />}
        {activeTab === "settings" && <ProfileSettings onSignOut={signOut} />}
      </div>
    </div>
  );
}
