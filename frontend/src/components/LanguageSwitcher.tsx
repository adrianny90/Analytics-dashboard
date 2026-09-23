"use client";

import { useEffect, useRef, useState } from "react";

import { LANGS, useLang, type Lang } from "@/lib/i18n";

const LANG_NAMES: Record<Lang, string> = { pl: "Polski", en: "English", de: "Deutsch" };

// Inline SVG: flag emoji render as plain letters ("PL", "US") on Windows.
function Flag({ lang }: { lang: Lang }) {
  return (
    <span className="inline-block h-[14px] w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/20">
      <svg viewBox="0 0 28 20" width="20" height="14" className="block" aria-hidden="true">
        {lang === "pl" && (
          <>
            <rect width="28" height="10" fill="#ffffff" />
            <rect y="10" width="28" height="10" fill="#dc143c" />
          </>
        )}
        {lang === "de" && (
          <>
            <rect width="28" height="6.67" fill="#000000" />
            <rect y="6.67" width="28" height="6.67" fill="#dd0000" />
            <rect y="13.33" width="28" height="6.67" fill="#ffce00" />
          </>
        )}
        {lang === "en" && (
          <>
            <rect width="28" height="20" fill="#ffffff" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} y={(i * 2 * 20) / 13} width="28" height={20 / 13} fill="#b22234" />
            ))}
            <rect width="11.2" height={(7 * 20) / 13} fill="#3c3b6e" />
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3, 4].map((col) => (
                <circle key={`${row}-${col}`} cx={1.6 + col * 2.2} cy={1.6 + row * 2.2} r="0.55" fill="#ffffff" />
              )),
            )}
          </>
        )}
      </svg>
    </span>
  );
}

/** Small flag button that slides open a panel with the three languages. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Język", "Language", "Sprache")}
        title={t("Język", "Language", "Sprache")}
        className="flex items-center gap-1.5 rounded-md border border-white/10 px-1.5 py-1 transition hover:bg-white/10"
      >
        <Flag lang={lang} />
        <svg
          viewBox="0 0 10 6"
          width="8"
          height="5"
          className={`text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <ul
        role="listbox"
        aria-label={t("Język", "Language", "Sprache")}
        className={`absolute left-0 top-full z-40 mt-1.5 w-36 origin-top-left overflow-hidden rounded-lg border border-white/10 bg-slate-900 py-1 shadow-lg transition duration-150 ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {LANGS.map((code) => (
          <li key={code} role="option" aria-selected={code === lang}>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition hover:bg-white/10 ${
                code === lang ? "font-medium text-white" : "text-white/70"
              }`}
            >
              <Flag lang={code} />
              {LANG_NAMES[code]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
