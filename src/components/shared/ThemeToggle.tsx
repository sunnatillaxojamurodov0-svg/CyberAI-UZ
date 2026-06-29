import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type Theme = "light" | "dark" | "system";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(true);

  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let dark = true;
    if (theme === "system") {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      dark = theme === "dark";
    }
    root.classList.add(dark ? "dark" : "light");
    setIsDark(dark);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
  }, [applyTheme]);

  const toggle = useCallback(() => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }, [isDark, applyTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative size-10 cursor-pointer rounded-full transition-all duration-300 active:scale-95",
        isDark ? "bg-surface text-foreground" : "bg-surface text-foreground",
        className,
      )}
      title={isDark ? t("theme.light") : t("theme.dark")}
      aria-label={t("theme.toggle")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        strokeLinecap="round"
        viewBox="0 0 32 32"
        className="size-full"
      >
        <clipPath id="theme-toggle-clip">
          <motion.path
            animate={{ y: isDark ? 10 : 0, x: isDark ? -12 : 0 }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
          />
        </clipPath>
        <g clipPath="url(#theme-toggle-clip)">
          <motion.circle
            initial={{ r: 8 }}
            animate={{ r: isDark ? 10 : 8 }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            cx="16"
            cy="16"
          />
          <motion.g
            animate={{
              rotate: isDark ? -100 : 0,
              scale: isDark ? 0.5 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M16 5.5v-4" />
            <path d="M16 30.5v-4" />
            <path d="M1.5 16h4" />
            <path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" />
            <path d="m5.7 26.3 2.9-2.9" />
            <path d="m5.8 5.8 2.8 2.8" />
            <path d="m23.4 23.4 2.9 2.9" />
          </motion.g>
        </g>
      </svg>
    </button>
  );
}
