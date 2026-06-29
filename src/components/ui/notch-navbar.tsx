import { useState } from "react";
import { Link, useNavigate, useMatches } from "@tanstack/react-router";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from "@/lib/i18n";
import brandLogo from "@/assets/brand-logo.png";
import { motion, AnimatePresence } from "framer-motion";

export function NotchNavbar({ className }: { className?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const { user, signOut, openAuthModal } = useAuth();
  const { profile } = useProfile();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const matches = useMatches();

  const NAV_LEFT = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.console"), to: "/console" },
    { label: t("nav.vael_ai"), to: "/chat" },
  ];

  const NAV_RIGHT = [
    { label: t("nav.leaderboard"), to: "/leaderboard" },
    { label: t("nav.dashboard"), to: "/dashboard" },
    { label: t("nav.targets"), to: "/targets" },
    { label: t("nav.threats"), to: "/threats" },
  ];

  const NAV_MORE = [
    { label: t("nav.zkp"), to: "/zkp" },
    { label: t("nav.projects"), to: "/projects" },
    { label: t("nav.prompts"), to: "/prompts" },
    { label: t("nav.about"), to: "/about" },
  ];

  const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT, ...NAV_MORE];

  const goProfile = () => navigate({ to: "/profile" });

  const isActive = (to: string) => {
    const currentPath = matches[matches.length - 1]?.pathname ?? "/";
    if (to === "/") return currentPath === "/";
    return currentPath === to || currentPath.startsWith(to + "/");
  };

  return (
    <>
      <header className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0", className)}>
        {/* Left Side Bar */}
        <div className="flex-1 h-10 bg-surface z-20 relative min-w-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-foreground"
            />
            <line
              x1="0"
              y1="36.5"
              x2="100%"
              y2="36.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-foreground"
            />
          </svg>
        </div>

        {/* Notch Container */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px">
          {/* Left Slice */}
          <div className="w-[50px] h-full relative shrink-0">
            <div
              className="absolute inset-0 bg-surface"
              style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path
                d="M0 39.5 C25 39.5 25 63.5 50 63.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-foreground"
              />
              <path
                d="M0 36.5 C25 36.5 25 60.5 50 60.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-foreground"
              />
            </svg>
          </div>

          {/* Center Content */}
          <div className="flex-1 h-full relative min-w-0 -ml-px">
            <div className="absolute inset-0 bg-surface">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="63.5"
                  x2="100%"
                  y2="63.5"
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeWidth={0.5}
                  className="text-foreground"
                />
                <line
                  x1="0"
                  y1="60.5"
                  x2="100%"
                  y2="60.5"
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeWidth={0.5}
                  className="text-foreground"
                />
              </svg>
            </div>

            <div className="relative w-full h-full flex items-end pb-2 px-4 md:px-8">
              <div className="hidden md:flex items-center gap-5 w-full">
                <Link to="/" className="flex items-center gap-2 group shrink-0">
                  <img
                    src={brandLogo}
                    alt={t("nav.cyberai")}
                    className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="font-display text-lg font-extrabold tracking-tight">
                    CYBER<span className="text-primary">AI</span>
                  </span>
                </Link>

                {NAV_LEFT.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "text-sm font-medium transition-colors whitespace-nowrap",
                      isActive(item.to)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {NAV_RIGHT.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "text-sm font-medium transition-colors whitespace-nowrap",
                      isActive(item.to)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <div
                  className="relative shrink-0"
                  onMouseEnter={() => setShowMore(true)}
                  onMouseLeave={() => setShowMore(false)}
                >
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                    {t("nav.more")} ▾
                  </button>
                  {showMore && (
                    <>
                      <div className="absolute left-0 right-0 h-2 top-full" />
                      <div className="absolute right-0 top-full w-40 rounded-xl border border-border bg-surface/95 shadow-xl shadow-black/20 backdrop-blur-xl p-2 pt-3 z-50">
                        {NAV_MORE.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive(item.to)
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 items-center shrink-0">
                  <LanguageSwitcher />
                  <ThemeToggle className="size-8" />
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={goProfile}
                        className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-2 py-1 transition-all hover:border-primary/30"
                      >
                        <UserAvatar profile={profile} size="xs" />
                        <span className="text-xs font-medium text-foreground hidden lg:block">
                          {profile?.name ?? user.email?.split("@")[0] ?? t("nav.operator")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={signOut}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={t("nav.sign_out")}
                      >
                        <LogOut size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="px-3 py-1.5 text-sm font-medium text-background bg-foreground rounded-xl hover:bg-foreground/90 transition-colors"
                    >
                      {t("nav.sign_in")}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden mb-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={t("nav.toggle_menu")}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo (Mobile) */}
              <div className="flex md:hidden justify-center shrink-0 mx-2 mt-1">
                <Link to="/" className="flex items-center gap-2 group">
                  <img
                    src={brandLogo}
                    alt={t("nav.cyberai")}
                    className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="font-display text-lg font-extrabold tracking-tight">
                    CYBER<span className="text-primary">AI</span>
                  </span>
                </Link>
              </div>

              {/* Mobile Right Actions */}
              <div className="md:hidden flex items-center gap-2 mb-1">
                <LanguageSwitcher />
                <ThemeToggle className="size-8" />
              </div>
            </div>
          </div>

          {/* Right Slice */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            <div
              className="absolute inset-0 bg-surface"
              style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path
                d="M0 63.5 C25 63.5 25 39.5 50 39.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-foreground"
              />
              <path
                d="M0 60.5 C25 60.5 25 36.5 50 36.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.05}
                strokeWidth={0.5}
                className="text-foreground"
              />
            </svg>
          </div>
        </div>

        {/* Right Side Bar */}
        <div className="flex-1 h-10 bg-surface z-20 relative min-w-0 -ml-px">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-foreground"
            />
            <line
              x1="0"
              y1="36.5"
              x2="100%"
              y2="36.5"
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={0.5}
              className="text-foreground"
            />
          </svg>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-surface border-b border-border p-4 md:hidden shadow-lg"
          >
            <nav className="flex flex-col gap-1">
              {ALL_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isActive(item.to)
                      ? "text-primary bg-primary/5"
                      : "text-foreground hover:bg-surface-2",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      goProfile();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors font-medium text-foreground text-left"
                  >
                    <UserAvatar profile={profile} size="sm" />
                    <div>
                      <div className="text-sm font-medium">
                        {profile?.name ?? user.email?.split("@")[0] ?? t("nav.operator")}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("nav.view_profile")}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors text-muted-foreground"
                  >
                    <LogOut size={16} /> {t("nav.sign_out")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-foreground text-background font-medium mt-2"
                >
                  {t("nav.sign_in")}
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
