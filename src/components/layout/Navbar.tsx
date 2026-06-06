import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import brandLogo from "@/assets/brand-logo.png";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Platform", to: "/" },
  { label: "Console", to: "/console" },
  { label: "Chat", to: "/chat" },
  { label: "Projects", to: "/projects" },
  { label: "Prompts", to: "/prompts" },
  { label: "Designs", to: "/stitch" },
  { label: "About", to: "/about" },
];

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const goProfile = () => navigate({ to: "/profile" });
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(2, 4, 8, 0.4)", "rgba(2, 4, 8, 0.82)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(6px)", "blur(16px)"]);
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      style={{
        backgroundColor: bg,
        backdropFilter: blur,
        WebkitBackdropFilter: blur as unknown as string,
      }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-7 place-items-center">
            <img src={brandLogo} alt="CyberAI" className="size-7 object-contain" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            CYBER<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goProfile}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-surface/50 px-2.5 py-1.5 transition-all hover:border-accent/30 hover:bg-accent/5"
              >
                <UserAvatar profile={profile} size="xs" />
                <span className="text-xs font-medium text-foreground/80">
                  {profile?.name ?? user.email?.split("@")[0] ?? "Operator"}
                </span>
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openAuthModal}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden rounded-md p-2 text-foreground"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border transition-[max-height,opacity] duration-500",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
          {user ? (
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  goProfile();
                  setOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-2.5 text-left transition-colors hover:border-accent/30"
              >
                <UserAvatar profile={profile} size="sm" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {profile?.name ?? user.email?.split("@")[0] ?? "Operator"}
                  </div>
                  <div className="text-xs text-muted-foreground">View Profile</div>
                </div>
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                openAuthModal();
                setOpen(false);
              }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground text-left"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
