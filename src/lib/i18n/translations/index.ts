import en from "./en";
import uz from "./uz";
import ru from "./ru";
import tr from "./tr";

export type TranslationKey = keyof typeof en;

export const translations: Record<string, typeof en> = {
  EN: en,
  UZ: uz,
  RU: ru,
  TR: tr,
};

export function getTranslation(key: string, lang: string): string | undefined {
  const langTranslations = translations[lang];
  if (!langTranslations) return undefined;
  return langTranslations[key as TranslationKey];
}

export function hasTranslation(key: string, lang: string): boolean {
  return key in (translations[lang] || {});
}
