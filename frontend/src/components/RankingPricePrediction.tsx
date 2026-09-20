"use client";

import { useState } from "react";

import { getKitchin } from "@/lib/api";
import {
  DEFAULT_PREDICTION_WEIGHTS,
  predictTouch,
  type PredictionWeights,
} from "@/lib/pricePrediction";
import type { KitchinPhaseScore, RankingEntry } from "@/types/market";

export interface PredictionState {
  targetPct: number;
  minPercent: number;
  results: Map<string, number>;
  /** Stocks that couldn't be scored at all (no vol_forecast yet - see below). */
  skippedCount: number;
}

const INPUT_CLASS = "w-24 rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white";

const WEIGHT_FIELDS: { key: keyof PredictionWeights; label: string; hint: string }[] = [
  { key: "momentum", label: "Momentum (6M)", hint: "zmiana ceny za ostatnie 6 miesięcy" },
  { key: "analyst", label: "Analitycy", hint: "mediana celu analityków" },
  { key: "ml", label: "Cel ML (A)", hint: "tylko gdy model ma werdykt 'edge'" },
  { key: "ichimoku", label: "Wynik Ichimoku", hint: "ważony trend D1/H4/W1/H1" },
  { key: "kitchin", label: "Kitchin", hint: "dominująca faza cyklu koniunkturalnego" },
];

export function RankingPricePrediction({
  entries,
  applied,
  onApply,
}: {
  entries: RankingEntry[];
  applied: PredictionState | null;
  onApply: (state: PredictionState | null) => void;
}) {
  const [targetPct, setTargetPct] = useState("30");
  const [minPercent, setMinPercent] = useState("60");
  const [weights, setWeights] = useState<PredictionWeights>(DEFAULT_PREDICTION_WEIGHTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [kitchinPhase, setKitchinPhase] = useState<KitchinPhaseScore | null>(null);
  const [kitchinLoaded, setKitchinLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = Number(targetPct);
  const min = Number(minPercent);
  const inputsValid = Number.isFinite(target) && target !== 0 && Number.isFinite(min) && min >= 0 && min <= 100;
  const isDefaultWeights = WEIGHT_FIELDS.every(({ key }) => weights[key] === DEFAULT_PREDICTION_WEIGHTS[key]);

  async function handleSearch() {
    setError(null);
    if (!inputsValid) {
      setError("Podaj niezerową docelową zmianę % i próg 0-100.");
      return;
    }
    setLoading(true);
    try {
      let phase = kitchinPhase;
      if (!kitchinLoaded) {
        try {
          const snapshot = await getKitchin();
          phase = snapshot.phases.find((p) => p.phase === snapshot.dominant_phase) ?? null;
        } catch {
          // Kitchin unreachable - proceed without the macro tilt rather than blocking the search.
          phase = null;
        }
        setKitchinPhase(phase);
        setKitchinLoaded(true);
      }
      const results = new Map<string, number>();
      let skippedCount = 0;
      for (const entry of entries) {
        const p = predictTouch(entry, phase, target, weights);
        if (p != null) results.set(entry.symbol, p);
        else skippedCount += 1;
      }
      onApply({ targetPct: target, minPercent: min, results, skippedCount });
    } finally {
      setLoading(false);
    }
  }

  const matchCount = applied
    ? entries.filter((e) => (applied.results.get(e.symbol) ?? -1) >= applied.minPercent).length
    : 0;

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <h2 className="text-sm font-semibold">Predykcja: prawdopodobieństwo osiągnięcia zmiany %</h2>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">Docelowa zmiana %</span> (np. 30, ujemna = spadek)
          </span>
          <input
            type="number"
            step={1}
            value={targetPct}
            onChange={(e) => setTargetPct(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">Min. prawdopodobieństwo %</span> (0-100)
          </span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={minPercent}
            onChange={(e) => setMinPercent(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <button
          onClick={handleSearch}
          disabled={loading || entries.length === 0}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Liczenie..." : "Szukaj"}
        </button>
        {applied && (
          <button
            onClick={() => onApply(null)}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5"
          >
            Wyczyść filtr
          </button>
        )}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-white/50 underline hover:text-white/80"
        >
          {showAdvanced ? "Ukryj zaawansowane wagi" : "Zaawansowane wagi"}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 rounded-lg border border-white/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white/70">
              Wagi składników dryfu (0 = wyłączony, 1 = pełny wpływ)
            </p>
            <button
              onClick={() => setWeights(DEFAULT_PREDICTION_WEIGHTS)}
              disabled={isDefaultWeights}
              className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Przywróć domyślne
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            {WEIGHT_FIELDS.map(({ key, label, hint }) => (
              <label key={key} className="flex flex-col gap-1 text-xs text-white/60">
                <span>
                  <span className="font-semibold text-white">{label}</span> - {hint}
                </span>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights({ ...weights, [key]: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 })
                  }
                  className={INPUT_CLASS}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-fall">{error}</p>}

      {applied && !loading && (
        <p className="mt-3 text-xs text-white/70">
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">Filtr aktywny</span> zmiana{" "}
          {applied.targetPct >= 0 ? "+" : ""}
          {applied.targetPct}% w ciągu 12 miesięcy, prawdopodobieństwo &ge; {applied.minPercent}%: pokazano{" "}
          <span className="font-semibold text-white">{matchCount}</span> z {entries.length} spółek.
        </p>
      )}

      {applied && !loading && applied.skippedCount > 0 && (
        <p className="mt-2 text-xs text-fall">
          Pominięto {applied.skippedCount} z {entries.length} spółek bez obliczonej prognozy zmienności - kliknij
          przycisk &quot;Oblicz prognozę zmienności&quot; powyżej (nad tabelą), żeby ją policzyć dla całego
          uniwersum, potem uruchom Szukaj ponownie.
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        Matematyczny model progu bariery (jak wycena opcji &quot;one-touch&quot;) na bazie zmienności z prognozy
        wolatylności (metoda C), dryfu z momentum 6M, celów analityków, prognozy ML (A, tylko z werdyktem
        &quot;edge&quot;), trendu Ichimoku i koniunktury Kitchina. To model matematyczny,{" "}
        <span className="text-white/60">nie backtestowany</span> jak metody A/C - traktuj jako orientacyjne
        oszacowanie, nie gwarancję. Spółki bez obliczonej prognozy zmienności (przycisk &quot;Oblicz prognozę
        zmienności&quot; powyżej) nie mogą być ocenione.
      </p>
    </section>
  );
}
