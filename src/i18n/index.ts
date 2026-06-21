import en from "./locales/en";
import fr from "./locales/fr";

export type Locale = "en" | "fr";

export const SUPPORTED_LOCALES: { code: Locale; labelKey: "common.english" | "common.french" }[] = [
  { code: "en", labelKey: "common.english" },
  { code: "fr", labelKey: "common.french" },
];

export const translations: Record<Locale, typeof en> = {
  en,
  fr: fr as unknown as typeof en,
};

export type TranslationKey = string;

const STORAGE_KEY = "twofstock_locale";

export function detectInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "fr") {
    return stored;
  }
  const nav = navigator.language.toLowerCase();
  return nav.startsWith("fr") ? "fr" : "en";
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key)
    ?? getNestedValue(translations.en as unknown as Record<string, unknown>, key)
    ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : `{{${name}}}`;
  });
}
