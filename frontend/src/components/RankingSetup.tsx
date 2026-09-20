"use client";

import {
  DEFAULT_SETUP,
  LEVEL_TIMEFRAME_OPTIONS,
  MA_PERIOD_OPTIONS,
  evaluateSetup,
  type LevelTimeframe,
  type MaPeriod,
  type SetupConfig,
} from "@/lib/rankingSetup";
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
  const isDefault = (Object.keys(DEFAULT_SETUP) as (keyof SetupConfig)[]).every((k) => setup[k] === DEFAULT_SETUP[k]);
  const metCount = entries.filter((entry) => evaluateSetup(entry, setup).met).length;
  const noLevels = entries.length > 0 && entries.every((entry) => !entry.levels || Object.keys(entry.levels).length === 0);
  const tfLabel = (tf: LevelTimeframe) => LEVEL_TIMEFRAME_OPTIONS.find((o) => o.value === tf)?.label ?? tf;

  return (
    <section className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Setup trendowy (najwyższa waga)</h2>
        <button
          onClick={() => onChange(DEFAULT_SETUP)}
          disabled={isDefault}
          className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Przywróć domyślne
        </button>
      </div>

      <p className="mt-2 text-xs text-white/50">
        Spółka spełnia setup, gdy jednocześnie: cena jest powyżej Kijun-sen z 52 okresów na {tfLabel(setup.kijunTimeframe)},
        potencjał wzrostu wg analityków (mediana celu vs cena) wynosi co najmniej {setup.minUpside}%, a cena jest powyżej
        MA{setup.maPeriod} na {tfLabel(setup.maTimeframe)}. Spełnienie dodaje do wyniku rankingu {setup.weight} pkt (obok wag
        trendu powyżej, nie zamiast nich). W backteście (S&amp;P 500, 5 lat) to połączenie dawało najlepsze wyniki, ale to
        hipoteza, a nie potwierdzona przewaga.
      </p>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>Kijun-sen (52) z interwału</span>
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
          <span className="text-white/30">domyślnie H4</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>Min. potencjał wg analityków %</span>
          <input
            type="number"
            step={1}
            value={setup.minUpside}
            onChange={(e) => onChange({ ...setup, minUpside: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 })}
            className={`${INPUT_CLASS} w-24`}
          />
          <span className="text-white/30">domyślnie {DEFAULT_SETUP.minUpside}</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>Cena powyżej MA</span>
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
          <span className="text-white/30">domyślnie MA{DEFAULT_SETUP.maPeriod}</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>MA z interwału</span>
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
          <span className="text-white/30">domyślnie H4 (D1 = wariant z backtestu)</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span className="font-semibold text-white">Waga setupu (pkt)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={setup.weight}
            onChange={(e) => onChange({ ...setup, weight: Math.max(0, Number(e.target.value) || 0) })}
            className={`${INPUT_CLASS} w-24`}
          />
          <span className="text-white/30">domyślnie {DEFAULT_SETUP.weight} (0 = wyłączone)</span>
        </label>
      </div>

      <p className="mt-3 text-xs text-white/50">
        {entries.length === 0
          ? "Brak danych - uruchom skan."
          : noLevels
            ? "Brak poziomów cen w zapisanym rankingu - uruchom skan (Start), żeby je policzyć."
            : `Spełnia setup: ${metCount} z ${entries.length} spółek.`}
      </p>
    </section>
  );
}
