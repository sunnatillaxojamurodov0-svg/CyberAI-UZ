import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  profile: { name: string | null; email: string; avatar_url: string | null } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
};

const ICON_SIZES = { xs: 12, sm: 14, md: 16, lg: 24, xl: 36 };

export function UserAvatar({ profile, size = "md", className, onClick }: UserAvatarProps) {
  const sizeClass = SIZES[size];
  const iconSize = ICON_SIZES[size];

  const initials = (() => {
    if (profile?.name) return profile.name[0].toUpperCase();
    if (profile?.email) return profile.email[0].toUpperCase();
    return null;
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-2 border-accent/30 bg-surface-2 transition-all",
        onClick &&
          "cursor-pointer hover:border-accent/60 hover:shadow-[0_0_16px_-4px] hover:shadow-accent/40",
        !onClick && "cursor-default",
        sizeClass,
        className,
      )}
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt="Avatar"
          className="size-full object-cover"
          draggable={false}
        />
      ) : initials ? (
        <span className="flex size-full items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20 font-display font-bold text-foreground">
          {initials}
        </span>
      ) : (
        <span className="flex size-full items-center justify-center bg-surface-2">
          <User size={iconSize} className="text-muted-foreground" />
        </span>
      )}
    </button>
  );
}
