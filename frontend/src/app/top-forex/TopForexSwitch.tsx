"use client";

import { useLang } from "@/lib/i18n";

import { TopForexPl } from "./TopForexPl";

/** Polish only for now; EN / DE readers get a short notice above the Polish text. */
export function TopForexSwitch() {
  const { lang } = useLang();
  return (
    <>
      {lang !== "pl" && (
        <p className="mx-auto mt-6 max-w-5xl rounded-lg border border-amber-400/30 bg-amber-400/5 px-6 py-2 text-xs text-white/70">
          {lang === "de"
            ? "Diese Seite ist derzeit nur auf Polnisch verfügbar."
            : "This page is currently available in Polish only."}
        </p>
      )}
      <TopForexPl />
    </>
  );
}
