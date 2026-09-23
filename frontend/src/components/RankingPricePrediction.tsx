"use client";

import { useState } from "react";

import { getKitchin } from "@/lib/api";
import { useLang } from "@/lib/i18n";
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

type Tri = [string, string, string];
const WEIGHT_FIELDS: { key: keyof PredictionWeights; label: Tri; hint: Tri }[] = [
  { key: "momentum", label: ["Momentum (6M)", "Momentum (6M)", "Momentum (6M)"], hint: ["zmiana ceny za ostatnie 6 miesięcy", "price change over the last 6 months", "Kursänderung der letzten 6 Monate"] },
  { key: "analyst", label: ["Analitycy", "Analysts", "Analysten"], hint: ["mediana celu analityków", "median analyst target", "Median der Analystenziele"] },
  { key: "ml", label: ["Cel ML (A)", "ML target (A)", "ML-Ziel (A)"], hint: ["tylko gdy model ma werdykt 'edge'", "only when the model's verdict is 'edge'", "nur wenn das Modell das Urteil „edge“ hat"] },
  { key: "ichimoku", label: ["Wynik Ichimoku", "Ichimoku score", "Ichimoku-Score"], hint: ["ważony trend D1/H4/W1/H1", "weighted D1/H4/W1/H1 trend", "gewichteter D1/H4/W1/H1-Trend"] },
  { key: "kitchin", label: ["Kitchin", "Kitchin", "Kitchin"], hint: ["dominująca faza cyklu koniunkturalnego", "dominant phase of the business cycle", "dominante Phase des Konjunkturzyklus"] },
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
  const { t } = useLang();
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
      setError(
        t(
          "Podaj niezerową docelową zmianę % i próg 0-100.",
          "Enter a non-zero target change % and a threshold of 0-100.",
          "Geben Sie eine Ziel-Änderung in % ungleich null und einen Schwellenwert von 0–100 ein.",
        ),
      );
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
      <h2 className="text-sm font-semibold">
        {t("Predykcja: prawdopodobieństwo osiągnięcia zmiany %", "Prediction: probability of reaching a % change", "Prognose: Wahrscheinlichkeit für das Erreichen einer prozentualen Änderung")}
      </h2>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">{t("Docelowa zmiana %", "Target change %", "Ziel-Änderung %")}</span>{" "}
            {t("(np. 30, ujemna = spadek)", "(e.g. 30, negative = decline)", "(z. B. 30, negativ = Rückgang)")}
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
            <span className="font-semibold text-white">{t("Min. prawdopodobieństwo %", "Min. probability %", "Min. Wahrscheinlichkeit %")}</span> (0-100)
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
          {loading ? t("Liczenie...", "Calculating...", "Wird berechnet...") : t("Szukaj", "Search", "Suchen")}
        </button>
        {applied && (
          <button
            onClick={() => onApply(null)}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5"
          >
            {t("Wyczyść filtr", "Clear filter", "Filter zurücksetzen")}
          </button>
        )}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-white/50 underline hover:text-white/80"
        >
          {showAdvanced
            ? t("Ukryj zaawansowane wagi", "Hide advanced weights", "Erweiterte Gewichtungen ausblenden")
            : t("Zaawansowane wagi", "Advanced weights", "Erweiterte Gewichtungen")}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 rounded-lg border border-white/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white/70">
              {t("Wagi składników dryfu (0 = wyłączony, 1 = pełny wpływ)", "Drift component weights (0 = off, 1 = full impact)", "Gewichtungen der Drift-Komponenten (0 = aus, 1 = voller Einfluss)")}
            </p>
            <button
              onClick={() => setWeights(DEFAULT_PREDICTION_WEIGHTS)}
              disabled={isDefaultWeights}
              className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Przywróć domyślne", "Restore defaults", "Standardwerte wiederherstellen")}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            {WEIGHT_FIELDS.map(({ key, label, hint }) => (
              <label key={key} className="flex flex-col gap-1 text-xs text-white/60">
                <span>
                  <span className="font-semibold text-white">{t(...label)}</span> - {t(...hint)}
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
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">{t("Filtr aktywny", "Filter active", "Filter aktiv")}</span>{" "}
          {t(
            <>
              zmiana {applied.targetPct >= 0 ? "+" : ""}
              {applied.targetPct}% w ciągu 12 miesięcy, prawdopodobieństwo &ge; {applied.minPercent}%: pokazano{" "}
              <span className="font-semibold text-white">{matchCount}</span> z {entries.length} spółek.
            </>,
            <>
              change {applied.targetPct >= 0 ? "+" : ""}
              {applied.targetPct}% within 12 months, probability &ge; {applied.minPercent}%: showing{" "}
              <span className="font-semibold text-white">{matchCount}</span> of {entries.length} stocks.
            </>,
            <>
              Änderung {applied.targetPct >= 0 ? "+" : ""}
              {applied.targetPct} % innerhalb von 12 Monaten, Wahrscheinlichkeit &ge; {applied.minPercent} %:{" "}
              <span className="font-semibold text-white">{matchCount}</span> von {entries.length} Aktien angezeigt.
            </>,
          )}
        </p>
      )}

      {applied && !loading && applied.skippedCount > 0 && (
        <p className="mt-2 text-xs text-fall">
          {t(
            `Pominięto ${applied.skippedCount} z ${entries.length} spółek bez obliczonej prognozy zmienności - kliknij przycisk "Oblicz prognozę zmienności" powyżej (nad tabelą), żeby ją policzyć dla całego uniwersum, potem uruchom Szukaj ponownie.`,
            `Skipped ${applied.skippedCount} of ${entries.length} stocks without a calculated volatility forecast – click the "Calculate volatility forecast" button above (over the table) to compute it for the whole universe, then run Search again.`,
            `${applied.skippedCount} von ${entries.length} Aktien ohne berechnete Volatilitätsprognose wurden übersprungen – klicken Sie oben (über der Tabelle) auf „Volatilitätsprognose berechnen“, um sie für das gesamte Universum zu berechnen, und starten Sie die Suche danach erneut.`,
          )}
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        {t(
          <>
            Matematyczny model progu bariery (jak wycena opcji &quot;one-touch&quot;) na bazie zmienności z prognozy
            wolatylności (metoda C), dryfu z momentum 6M, celów analityków, prognozy ML (A, tylko z werdyktem
            &quot;edge&quot;), trendu Ichimoku i koniunktury Kitchina. To model matematyczny,{" "}
            <span className="text-white/60">nie backtestowany</span> jak metody A/C - traktuj jako orientacyjne
            oszacowanie, nie gwarancję. Spółki bez obliczonej prognozy zmienności (przycisk &quot;Oblicz prognozę
            zmienności&quot; powyżej) nie mogą być ocenione.
          </>,
          <>
            A mathematical barrier-hitting model (like pricing a &quot;one-touch&quot; option) based on the volatility
            from the volatility forecast (method C), with drift from 6M momentum, analyst targets, the ML forecast (A,
            only with an &quot;edge&quot; verdict), the Ichimoku trend and the Kitchin cycle. This is a mathematical
            model, <span className="text-white/60">not backtested</span> like methods A/C – treat it as a rough
            estimate, not a guarantee. Stocks without a calculated volatility forecast (the &quot;Calculate volatility
            forecast&quot; button above) cannot be scored.
          </>,
          <>
            Ein mathematisches Barrieremodell (wie die Bewertung einer &bdquo;One-Touch&ldquo;-Option) auf Basis der
            Volatilität aus der Volatilitätsprognose (Methode C), mit Drift aus dem 6M-Momentum, Analystenzielen, der
            ML-Prognose (A, nur bei &bdquo;edge&ldquo;-Urteil), dem Ichimoku-Trend und der Kitchin-Konjunktur. Es
            handelt sich um ein mathematisches Modell, das anders als die Methoden A/C{" "}
            <span className="text-white/60">nicht backgetestet</span> wurde – betrachten Sie es als grobe Schätzung,
            nicht als Garantie. Aktien ohne berechnete Volatilitätsprognose (Schaltfläche &bdquo;Volatilitätsprognose
            berechnen&ldquo; oben) können nicht bewertet werden.
          </>,
        )}
      </p>
    </section>
  );
}
