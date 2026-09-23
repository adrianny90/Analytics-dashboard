"use client";

import { useLang } from "@/lib/i18n";
import {
  SETUP_TIER_SORT_ORDER,
  SETUP_TIER_STYLES,
  setupTierLegend,
  type SetupConfig,
  type SetupTier,
} from "@/lib/rankingSetup";

/** Legenda kolorów kolumny "Setup" - w tej samej kolejności co sortowanie po
 *  kolorze. Z `onSelect` każda pozycja jest przyciskiem (RankingTable: wyciąga
 *  ten kolor na górę tabeli, ponowne kliknięcie wraca do kolejności rankingu);
 *  bez niego to sama legenda (panel główny). */
export function SetupLegend({
  setup,
  active = null,
  onSelect,
}: {
  setup: SetupConfig;
  active?: SetupTier | null;
  onSelect?: (tier: SetupTier | null) => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/60">
      <span className="font-semibold text-white/70">Setup:</span>
      {SETUP_TIER_SORT_ORDER.map((tier) => {
        const style = SETUP_TIER_STYLES[tier];
        const legend = setupTierLegend(tier, setup);
        const content = (
          <>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.badge}`}>✓</span>
            {t(...legend)}
          </>
        );
        if (!onSelect) {
          return (
            <span key={tier} title={`${t(...style.label)}: ${t(...legend)}`} className="flex items-center gap-1.5 px-1 py-0.5">
              {content}
            </span>
          );
        }
        const isActive = active === tier;
        return (
          <button
            key={tier}
            type="button"
            onClick={() => onSelect(isActive ? null : tier)}
            aria-pressed={isActive}
            title={t(
              `${style.label[0]}: ${legend[0]}. Kliknij, żeby pokazać te spółki na górze tabeli.`,
              `${style.label[1]}: ${legend[1]}. Click to bring these stocks to the top of the table.`,
              `${style.label[2]}: ${legend[2]}. Klicken, um diese Aktien oben in der Tabelle anzuzeigen.`,
            )}
            className={`flex items-center gap-1.5 rounded px-1 py-0.5 transition hover:bg-white/5 hover:text-white/90 ${
              isActive ? "bg-white/10 text-white/90" : ""
            }`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
