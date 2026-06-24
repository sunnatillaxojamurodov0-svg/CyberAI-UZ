import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(t);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => handleThemeChange(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            theme === value
              ? "bg-accent text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          title={label}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
