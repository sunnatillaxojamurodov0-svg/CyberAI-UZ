import { useState, useEffect, useCallback } from "react";

type Direction = "ltr" | "rtl";
type Language = "en" | "ar" | "fa" | "ur" | "he";

const RTL_LANGUAGES: Language[] = ["ar", "fa", "ur", "he"];

interface LanguageConfig {
  code: Language;
  name: string;
  dir: Direction;
}

const LANGUAGES: LanguageConfig[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "fa", name: "فارسی", dir: "rtl" },
  { code: "ur", name: "اردو", dir: "rtl" },
  { code: "he", name: "עברית", dir: "rtl" },
];

function getDirection(lang: Language): Direction {
  return RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
}

function getLanguageFromBrowser(): Language {
  const browserLang = navigator.language.split("-")[0] as Language;
  if (RTL_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }
  return "en";
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en");
  const [direction, setDirection] = useState<Direction>("ltr");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null;
    const lang = saved || getLanguageFromBrowser();
    setLanguage(lang);
    setDirection(getDirection(lang));
    document.documentElement.dir = getDirection(lang);
    document.documentElement.lang = lang;
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    const dir = getDirection(lang);
    setDirection(dir);
    localStorage.setItem("language", lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, []);

  const isRTL = direction === "rtl";

  return {
    language,
    direction,
    isRTL,
    changeLanguage,
    languages: LANGUAGES,
  };
}

export function getLanguageConfig(code: Language): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function isRTLCode(code: string): boolean {
  return RTL_LANGUAGES.includes(code as Language);
}
