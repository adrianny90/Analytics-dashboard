"use client";

import { useLang } from "@/lib/i18n";

/** Star toggle in front of a ticker - filled yellow when the ticker is marked
 * as "watched by me" (see useFavorites), an empty outline otherwise. */
export function FavoriteStar({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { t } = useLang();
  const title = active
    ? t("Obserwowana przeze mnie - kliknij, żeby odznaczyć", "Watched by me - click to unmark", "Von mir beobachtet - klicken zum Entfernen")
    : t("Kliknij, żeby oznaczyć jako obserwowaną przeze mnie", "Click to mark as watched by me", "Klicken, um als von mir beobachtet zu markieren");
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`mr-2 inline-flex align-[-2px] transition ${
        active ? "text-yellow-400 hover:text-yellow-300" : "text-white/30 hover:text-yellow-400/80"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      >
        <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
      </svg>
    </button>
  );
}
