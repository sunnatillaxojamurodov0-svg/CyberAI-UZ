import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LANGUAGES, getLanguageByCode } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLang = getLanguageByCode(language);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-accent/30 hover:text-foreground",
          open && "border-accent/30 text-foreground",
        )}
      >
        <Globe size={14} />
        <span className="hidden sm:inline">{currentLang?.nativeName ?? language}</span>
        <span className="sm:hidden">{currentLang?.flag}</span>
        <ChevronDown
          size={12}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
          >
            <div className="border-b border-border p-2">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("lang.search")}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/40"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filtered.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    language === lang.code
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-surface",
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{lang.name}</div>
                    <div className="text-[10px] text-muted-foreground/60 truncate">
                      {lang.nativeName}
                    </div>
                  </div>
                  {language === lang.code && <Check size={12} className="shrink-0 text-accent" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground/40">
                  {t("lang.not_found")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
