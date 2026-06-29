import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, FileText, Camera, Loader2, Check, Trash2, Calendar } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: number;
  updated_at: number;
}

export function ProfileEdit() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { ok: boolean; user?: ProfileData }) => {
        if (data.ok && data.user) {
          setProfile(data.user);
          setName(data.user.name ?? "");
          setBio(data.user.bio ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: t("profile.edit.error.file_type") });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: t("profile.edit.error.file_size") });
        return;
      }

      setAvatarUploading(true);
      setMessage(null);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await fetch("/api/user/avatar", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (data.ok) {
          setMessage({ type: "success", text: t("profile.edit.success.avatar_updated") });
          refreshUser();
          setProfile((prev) => (prev ? { ...prev, avatar_url: data.url } : prev));
        } else {
          setMessage({ type: "error", text: data.error || t("profile.edit.error.upload_failed") });
        }
      } catch {
        setMessage({ type: "error", text: t("profile.edit.error.network") });
      } finally {
        setAvatarUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [refreshUser, t],
  );

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: t("profile.edit.success.avatar_removed") });
        refreshUser();
        setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
      }
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
    }
  }, [refreshUser, t]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage({ type: "error", text: t("profile.edit.error.empty_name") });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName, bio: bio.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: t("profile.edit.success.profile_updated") });
        refreshUser();
        setProfile((prev) =>
          prev ? { ...prev, name: trimmedName, bio: bio.trim() || null } : prev,
        );
      } else {
        setMessage({ type: "error", text: data.error || t("profile.edit.error.save_failed") });
      }
    } catch {
      setMessage({ type: "error", text: t("profile.edit.error.network") });
    } finally {
      setSaving(false);
    }
  }, [name, bio, refreshUser, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = profile?.name ?? user?.email.split("@")[0] ?? "Operator";
  const avatarUrl = profile?.avatar_url ?? user?.avatar_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Avatar Section */}
      <GlassPanel className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Camera size={15} className="text-accent" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("profile.edit.avatar_section")}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="relative size-20 overflow-hidden rounded-full border-2 border-accent/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="size-full object-cover"
                  key={avatarUrl}
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/20 to-primary/15">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">{t("profile.edit.avatar_helper")}</p>
            <div className="flex gap-2">
              <label
                htmlFor="edit-avatar-upload"
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground",
                  avatarUploading && "pointer-events-none opacity-50",
                )}
              >
                {avatarUploading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Camera size={12} />
                )}
                {t("profile.edit.upload")}
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  {t("profile.edit.remove")}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="edit-avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </GlassPanel>

      {/* Profile Info */}
      <GlassPanel className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <User size={15} className="text-accent" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("profile.edit.personal_info")}
          </span>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <User size={12} />
              {t("profile.edit.name_label")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.edit.name_placeholder")}
              maxLength={100}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:border-accent/40"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Mail size={12} />
              {t("profile.edit.email_label")}
            </label>
            <input
              type="email"
              value={profile?.email ?? user?.email ?? ""}
              readOnly
              className="w-full rounded-xl border border-border/50 bg-surface/30 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground/60">{t("profile.edit.email_helper")}</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <FileText size={12} />
              {t("profile.edit.bio_label")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.edit.bio_placeholder")}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:border-accent/40"
            />
            <p className="text-[10px] text-muted-foreground/60">{bio.length}/500</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-4 rounded-lg px-3 py-2 font-mono text-[11px]",
              message.type === "success"
                ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border border-destructive/20 bg-destructive/5 text-destructive",
            )}
          >
            {message.text}
          </motion.div>
        )}

        {/* Save Button */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Calendar size={12} />
            {profile?.created_at
              ? `${t("profile.member_since")}: ${new Date(profile.created_at * 1000).toLocaleDateString("uz-UZ")}`
              : ""}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {t("profile.edit.save")}
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
