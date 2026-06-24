import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { language, changeLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
      >
        <Globe size={14} />
        <span>{currentLang?.code.toUpperCase()}</span>
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-xl z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                language === lang.code
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="font-mono text-xs">{lang.code.toUpperCase()}</span>
              <span>{lang.name}</span>
              {lang.dir === "rtl" && (
                <span className="ml-auto text-[10px] text-muted-foreground/50">RTL</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
