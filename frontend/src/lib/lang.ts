// Language basics shared by server and client code (no "use client" here, so
// the root layout can read the cookie on the server).

export type Lang = "pl" | "en" | "de";

export const LANGS: Lang[] = ["pl", "en", "de"];
export const DEFAULT_LANG: Lang = "pl";
export const LANG_COOKIE = "lang";

export const LOCALES: Record<Lang, string> = { pl: "pl-PL", en: "en-US", de: "de-DE" };

export function isLang(value: unknown): value is Lang {
  return value === "pl" || value === "en" || value === "de";
}
