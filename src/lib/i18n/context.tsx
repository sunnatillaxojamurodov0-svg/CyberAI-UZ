import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { DEFAULT_LANGUAGE } from "./languages";
import { getTranslation, type TranslationKey } from "./translations";

interface TranslationContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

const STORAGE_KEY = "cyberai_language";

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      // 1. Try current language
      const translation = getTranslation(key, language);
      if (translation) return translation;

      // 2. Fallback to English
      if (language !== DEFAULT_LANGUAGE) {
        const englishTranslation = getTranslation(key, DEFAULT_LANGUAGE);
        if (englishTranslation) return englishTranslation;
      }

      // 3. Return fallback or key itself
      return fallback ?? key;
    },
    [language],
  );

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used within TranslationProvider");
  return ctx;
}
