"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_LANG, LANG_COOKIE, LOCALES, type Lang } from "@/lib/lang";

export { DEFAULT_LANG, LANGS, LANG_COOKIE, isLang, type Lang } from "@/lib/lang";

// Plain (non-React) helpers such as formatNumber need the active locale too;
// the provider keeps this in sync on every language change.
let currentLocale = LOCALES[DEFAULT_LANG];

export function getLocale(): string {
  return currentLocale;
}

export function fmtDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString(currentLocale);
}

export function fmtTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString(currentLocale);
}

/** Picks the text (or JSX) for the active language: t(pl, en, de). */
export type Translate = <T>(pl: T, en: T, de: T) => T;

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}

function makeTranslate(lang: Lang): Translate {
  return (pl, en, de) => (lang === "pl" ? pl : lang === "en" ? en : de);
}

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => undefined,
  t: makeTranslate(DEFAULT_LANG),
});

export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  currentLocale = LOCALES[lang];

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
    } catch {
      // Cookies blocked - the choice still applies until the page is closed.
    }
  }, []);

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, t: makeTranslate(lang) }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
