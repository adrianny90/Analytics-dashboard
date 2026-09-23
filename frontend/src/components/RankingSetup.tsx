"use client";

import {
  DEFAULT_SETUP,
  LEVEL_TIMEFRAME_OPTIONS,
  MA_PERIOD_OPTIONS,
  SETUP_TIER_SORT_ORDER,
  SETUP_TIER_STYLES,
  evaluateSetup,
  type SetupTier,
  type LevelTimeframe,
  type MaPeriod,
  type SetupConfig,
} from "@/lib/rankingSetup";
import { useLang } from "@/lib/i18n";
import type { RankingEntry } from "@/types/market";

const INPUT_CLASS = "rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white";

export function RankingSetup({
  entries,
  setup,
  onChange,
}: {
  entries: RankingEntry[];
  setup: SetupConfig;
  onChange: (setup: SetupConfig) => void;
}) {
  const { t } = useLang();
  const isDefault = (Object.keys(DEFAULT_SETUP) as (keyof SetupConfig)[]).every((k) => setup[k] === DEFAULT_SETUP[k]);
  // Liczba spółek w każdym kolorze znaczka (każda spółka ma najwyżej jeden).
  const tierCounts: Record<SetupTier, number> = { blue: 0, yellow: 0, purple: 0, green: 0, red: 0, pink: 0 };
  for (const entry of entries) {
    const tier = evaluateSetup(entry, setup).tier;
    if (tier) tierCounts[tier]++;
  }
  const noLevels = entries.length > 0 && entries.every((entry) => !entry.levels || Object.keys(entry.levels).length === 0);
  const tfLabel = (tf: LevelTimeframe) => LEVEL_TIMEFRAME_OPTIONS.find((o) => o.value === tf)?.label ?? tf;

  return (
    <section className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t("Setup trendowy (najwyższa waga)", "Trend setup (highest weight)", "Trend-Setup (höchste Gewichtung)")}
        </h2>
        <button
          onClick={() => onChange(DEFAULT_SETUP)}
          disabled={isDefault}
          className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("Przywróć domyślne", "Restore defaults", "Standardwerte wiederherstellen")}
        </button>
      </div>

      <p className="mt-2 text-xs text-white/50">
        {t(
          `Spółka spełnia setup, gdy jednocześnie: cena jest powyżej Kijun-sen z 52 okresów na ${tfLabel(setup.kijunTimeframe)}, potencjał wzrostu wg analityków (mediana celu vs cena) wynosi co najmniej ${setup.minUpside}%, a cena jest powyżej MA${setup.maPeriod} na ${tfLabel(setup.maTimeframe)}. Spełnienie dodaje do wyniku rankingu ${setup.weight} pkt (obok wag trendu powyżej, nie zamiast nich). W backteście (S&P 500, 5 lat) to połączenie dawało najlepsze wyniki, ale to hipoteza, a nie potwierdzona przewaga.`,
          `A stock meets the setup when all of the following hold at once: the price is above the 52-period Kijun-sen on ${tfLabel(setup.kijunTimeframe)}, the analyst upside (median target vs. price) is at least ${setup.minUpside}%, and the price is above the MA${setup.maPeriod} on ${tfLabel(setup.maTimeframe)}. Meeting it adds ${setup.weight} points to the ranking score (on top of the trend weights above, not instead of them). In the backtest (S&P 500, 5 years) this combination gave the best results, but it is a hypothesis, not a proven edge.`,
          `Eine Aktie erfüllt das Setup, wenn gleichzeitig gilt: Der Kurs liegt über der 52-Perioden-Kijun-sen auf ${tfLabel(setup.kijunTimeframe)}, das Analysten-Aufwärtspotenzial (Median-Kursziel vs. Kurs) beträgt mindestens ${setup.minUpside} % und der Kurs liegt über der MA${setup.maPeriod} auf ${tfLabel(setup.maTimeframe)}. Die Erfüllung addiert ${setup.weight} Punkte zum Ranking-Score (zusätzlich zu den oben genannten Trendgewichten, nicht anstelle davon). Im Backtest (S&P 500, 5 Jahre) lieferte diese Kombination die besten Ergebnisse, es handelt sich jedoch um eine Hypothese und nicht um einen bestätigten Vorteil.`,
        )}
      </p>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>{t("Kijun-sen (52) z interwału", "Kijun-sen (52) from timeframe", "Kijun-sen (52) aus Zeitrahmen")}</span>
          <select
            value={setup.kijunTimeframe}
            onChange={(e) => onChange({ ...setup, kijunTimeframe: e.target.value as LevelTimeframe })}
            className={INPUT_CLASS}
          >
            {LEVEL_TIMEFRAME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-white/30">{t("domyślnie H4", "default H4", "Standard: H4")}</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>{t("Min. potencjał wg analityków %", "Min. analyst upside %", "Min. Analysten-Potenzial %")}</span>
          <input
            type="number"
            step={1}
            value={setup.minUpside}
            onChange={(e) => onChange({ ...setup, minUpside: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 })}
            className={`${INPUT_CLASS} w-24`}
          />
          <span className="text-white/30">
            {t(`domyślnie ${DEFAULT_SETUP.minUpside}`, `default ${DEFAULT_SETUP.minUpside}`, `Standard: ${DEFAULT_SETUP.minUpside}`)}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>{t("Cena powyżej MA", "Price above MA", "Kurs über MA")}</span>
          <select
            value={setup.maPeriod}
            onChange={(e) => onChange({ ...setup, maPeriod: Number(e.target.value) as MaPeriod })}
            className={INPUT_CLASS}
          >
            {MA_PERIOD_OPTIONS.map((n) => (
              <option key={n} value={n}>
                MA{n}
              </option>
            ))}
          </select>
          <span className="text-white/30">
            {t(`domyślnie MA${DEFAULT_SETUP.maPeriod}`, `default MA${DEFAULT_SETUP.maPeriod}`, `Standard: MA${DEFAULT_SETUP.maPeriod}`)}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>{t("MA z interwału", "MA from timeframe", "MA aus Zeitrahmen")}</span>
          <select
            value={setup.maTimeframe}
            onChange={(e) => onChange({ ...setup, maTimeframe: e.target.value as LevelTimeframe })}
            className={INPUT_CLASS}
          >
            {LEVEL_TIMEFRAME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-white/30">
            {t("domyślnie H4 (D1 = wariant z backtestu)", "default H4 (D1 = backtest variant)", "Standard: H4 (D1 = Backtest-Variante)")}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span className="font-semibold text-white">{t("Waga setupu (pkt)", "Setup weight (pts)", "Setup-Gewichtung (Pkt.)")}</span>
          <input
            type="number"
            min={0}
            step={1}
            value={setup.weight}
            onChange={(e) => onChange({ ...setup, weight: Math.max(0, Number(e.target.value) || 0) })}
            className={`${INPUT_CLASS} w-24`}
          />
          <span className="text-white/30">
            {t(`domyślnie ${DEFAULT_SETUP.weight} (0 = wyłączone)`, `default ${DEFAULT_SETUP.weight} (0 = off)`, `Standard: ${DEFAULT_SETUP.weight} (0 = aus)`)}
          </span>
        </label>
      </div>

      <p className="mt-3 text-xs text-white/50">
        {entries.length === 0
          ? t("Brak danych - uruchom skan.", "No data - run a scan.", "Keine Daten – starten Sie einen Scan.")
          : noLevels
            ? t(
                "Brak poziomów cen w zapisanym rankingu - uruchom skan (Start), żeby je policzyć.",
                "The saved ranking has no price levels - run a scan (Start) to calculate them.",
                "Im gespeicherten Ranking fehlen Kurslevel – starten Sie einen Scan (Start), um sie zu berechnen.",
              )
            : (
                <>
                  {t("Spółki wg koloru setupu", "Stocks by setup color", "Aktien nach Setup-Farbe")} ({entries.length}):{" "}
                  {SETUP_TIER_SORT_ORDER.map((tier, i) => (
                    <span key={tier}>
                      {i > 0 && " · "}
                      <span className={SETUP_TIER_STYLES[tier].text}>
                        {t(...SETUP_TIER_STYLES[tier].label)} {tierCounts[tier]}
                      </span>
                    </span>
                  ))}
                  {tierCounts.green === 0 && tierCounts.red === 0 && tierCounts.pink === 0 && (
                    <span className="text-white/30">
                      {" "}
                      {t(
                        "- zielony/czerwony/różowy wymagają danych Ichimoku z nowego skanu (Start).",
                        "- green/red/pink need Ichimoku data from a new scan (Start).",
                        "- Grün/Rot/Rosa benötigen Ichimoku-Daten aus einem neuen Scan (Start).",
                      )}
                    </span>
                  )}
                </>
              )}
      </p>
    </section>
  );
}
