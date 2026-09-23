"use client";

import { Fragment, useEffect, useState } from "react";

import { getKitchin, refreshKitchin } from "@/lib/api";
import { fmtDateTime, useLang, type Translate } from "@/lib/i18n";
import type { KitchinInstrument, KitchinPhaseScore, KitchinSnapshot } from "@/types/market";

const HEADERS: { key: string; label: [string, string, string]; span: number }[] = [
  { key: "wzrost", label: ["Wzrost", "Growth", "Wachstum"], span: 2 },
  { key: "spowolnienie", label: ["Spowolnienie", "Slowdown", "Abschwächung"], span: 1 },
  { key: "recesja", label: ["Recesja", "Recession", "Rezession"], span: 2 },
  { key: "ozywienie", label: ["Ożywienie", "Recovery", "Erholung"], span: 1 },
];

const CATEGORY_LABEL: Record<string, [string, string, string]> = {
  bonds: ["Obligacje (US / Japonia / Europa)", "Bonds (US / Japan / Europe)", "Anleihen (USA / Japan / Europa)"],
  stocks: ["Akcje (US / Japonia / Europa)", "Stocks (US / Japan / Europe)", "Aktien (USA / Japan / Europa)"],
  commodities: ["Surowce", "Commodities", "Rohstoffe"],
};

// The backend sends these labels in Polish (without diacritics); shown per language by phase number.
const PHASE_LABELS: Record<number, [string, string, string]> = {
  1: ["Wczesny wzrost", "Early growth", "Frühes Wachstum"],
  2: ["Szczyt wzrostu", "Peak growth", "Wachstumshöhepunkt"],
  3: ["Spowolnienie", "Slowdown", "Abschwächung"],
  4: ["Wczesna recesja", "Early recession", "Frühe Rezession"],
  5: ["Dołek / koniec recesji", "Trough / end of recession", "Tiefpunkt / Ende der Rezession"],
  6: ["Ożywienie", "Recovery", "Erholung"],
};

function phaseLabel(t: Translate, phase: number, fallback: string) {
  const labels = PHASE_LABELS[phase];
  return labels ? t(...labels) : fallback;
}

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function ChangeCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <td className="px-3 py-2 text-right text-white/30">-</td>;
  return <td className={`px-3 py-2 text-right ${value >= 0 ? "text-rise" : "text-fall"}`}>{pct(value)}</td>;
}

function InstrumentTable({ instruments }: { instruments: KitchinInstrument[] }) {
  const { t } = useLang();
  const categories: KitchinInstrument["category"][] = ["bonds", "stocks", "commodities"];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
          <th className="px-3 py-2 font-medium">Instrument</th>
          <th className="px-3 py-2 text-right font-medium">{t("Cena", "Price", "Kurs")}</th>
          <th className="px-3 py-2 text-right font-medium">1D</th>
          <th className="px-3 py-2 text-right font-medium">1W</th>
          <th className="px-3 py-2 text-right font-medium">1M</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <Fragment key={category}>
            <tr className="bg-white/5">
              <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-white/60">
                {t(...CATEGORY_LABEL[category])}
              </td>
            </tr>
            {instruments
              .filter((i) => i.category === category)
              .map((i) => (
                <tr key={i.symbol} className="border-b border-white/5">
                  <td className="px-3 py-2">
                    {i.name} <span className="text-white/30">({i.region})</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{i.price}</td>
                  <ChangeCell value={i.change_1d?.change_percent} />
                  <ChangeCell value={i.change_1w?.change_percent} />
                  <ChangeCell value={i.change_1m?.change_percent} />
                </tr>
              ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

// Six equal-width columns; the sine wave peaks at the wzrost/spowolnienie
// boundary and troughs at the recesja/ozywienie boundary, matching the
// reference "Cykl Kitchina.jpg" layout.
const COLUMNS = 6;
const CHART_WIDTH = 900;
const CHART_HEIGHT = 160;
const AMPLITUDE = 55;
const MIDLINE = CHART_HEIGHT / 2;

function curveY(x: number) {
  return MIDLINE - AMPLITUDE * Math.cos((2 * Math.PI * (x - 1.5)) / COLUMNS);
}

function CycleChart({ phases, dominantPhase }: { phases: KitchinPhaseScore[]; dominantPhase: number }) {
  const { t } = useLang();
  const colWidth = CHART_WIDTH / COLUMNS;
  const points: string[] = [];
  const samples = 120;
  for (let s = 0; s <= samples; s++) {
    const x = (s / samples) * COLUMNS;
    points.push(`${(x / COLUMNS) * CHART_WIDTH},${curveY(x)}`);
  }
  const dominantIndex = dominantPhase - 1;
  const dominantX = ((dominantIndex + 0.5) / COLUMNS) * CHART_WIDTH;
  const dominantY = curveY(dominantIndex + 0.5);

  return (
    <div className="mt-4">
      <div className="flex text-center text-xs font-medium text-white/70">
        {HEADERS.map((h) => (
          <div key={h.key} style={{ width: `${(h.span / COLUMNS) * 100}%` }} className="border-b border-white/10 pb-1">
            {t(...h.label)}
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="mt-2 w-full">
        {Array.from({ length: COLUMNS + 1 }).map((_, i) => (
          <line key={i} x1={i * colWidth} y1={0} x2={i * colWidth} y2={CHART_HEIGHT} stroke="white" strokeOpacity={0.08} />
        ))}
        <line x1={0} y1={MIDLINE} x2={CHART_WIDTH} y2={MIDLINE} stroke="white" strokeOpacity={0.15} />
        <polyline points={points.join(" ")} fill="none" stroke="#60a5fa" strokeWidth={3} />
        <circle cx={dominantX} cy={dominantY} r={7} fill="#60a5fa" stroke="white" strokeWidth={2} />
      </svg>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}>
        {phases.map((p) => {
          const isDominant = p.phase === dominantPhase;
          return (
            <div
              key={p.phase}
              className={`border-t px-1 py-2 text-center text-xs ${
                isDominant ? "border-t-2 border-white bg-white/10" : "border-white/10"
              }`}
            >
              <div className="text-white/50">{phaseLabel(t, p.phase, p.label)}</div>
              <div className="mt-1 flex justify-center gap-2">
                <span className={p.bonds_up ? "text-rise" : "text-fall"}>{p.bonds_up ? "↑" : "↓"}</span>
                <span className={p.stocks_up ? "text-rise" : "text-fall"}>{p.stocks_up ? "↑" : "↓"}</span>
                <span className={p.commodities_up ? "text-rise" : "text-fall"}>{p.commodities_up ? "↑" : "↓"}</span>
              </div>
              <div className={`mt-1 font-semibold ${isDominant ? "text-white" : "text-white/60"}`}>
                {p.percent.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-center gap-6 text-xs text-white/40">
        <span>{t("obligacje", "bonds", "Anleihen")}</span>
        <span>{t("akcje", "stocks", "Aktien")}</span>
        <span>{t("surowce", "commodities", "Rohstoffe")}</span>
      </div>
    </div>
  );
}

export function KitchinPage() {
  const { t } = useLang();
  const [snapshot, setSnapshot] = useState<KitchinSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKitchin()
      .then(setSnapshot)
      .catch((err) => setError(err.message));
  }, []);

  function handleRefresh() {
    setLoading(true);
    setError(null);
    refreshKitchin()
      .then(setSnapshot)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{t("Cykl Kitchina", "Kitchin Cycle", "Kitchin-Zyklus")}</h1>
      <p className="mt-1 text-sm text-white/50">
        {t(
          "Rentowności US 10Y/2Y i obligacje Japonii/Niemiec/UK, giełda USA/Japonii/Europy oraz koszyk surowcowy (indeks + miedź + ropa + złoto), zestawione wg klasycznej rotacji obligacje-akcje-surowce, żeby oszacować, w której fazie cyklu koniunkturalnego prawdopodobnie jesteśmy.",
          "US 10Y/2Y yields and Japanese/German/UK bonds, the US/Japanese/European stock markets and a commodity basket (index + copper + oil + gold), combined according to the classic bond–stock–commodity rotation to estimate which phase of the business cycle we are probably in.",
          "Renditen 10- und 2-jähriger US-Staatsanleihen sowie Anleihen aus Japan, Deutschland und Großbritannien, die Aktienmärkte der USA, Japans und Europas und ein Rohstoffkorb (Index + Kupfer + Öl + Gold), kombiniert nach der klassischen Rotation Anleihen–Aktien–Rohstoffe, um abzuschätzen, in welcher Phase des Konjunkturzyklus wir uns wahrscheinlich befinden.",
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("Odświeżanie...", "Refreshing...", "Wird aktualisiert...") : t("Odśwież", "Refresh", "Aktualisieren")}
        </button>
        {snapshot?.updated_at && (
          <span className="text-xs text-white/40">
            {t("Ostatnia aktualizacja", "Last updated", "Zuletzt aktualisiert")}: {fmtDateTime(snapshot.updated_at)}
          </span>
        )}
      </div>

      {error && <p className="mt-4 text-fall">
          {t("Nie udało się pobrać danych", "Failed to load data", "Daten konnten nicht geladen werden")}: {error}
        </p>}
      {snapshot?.error && <p className="mt-4 text-fall">{snapshot.error}</p>}

      {snapshot && (
        <>
          <div className="mt-8 overflow-x-auto rounded-lg border border-white/10">
            <InstrumentTable instruments={snapshot.instruments} />
          </div>

          <CycleChart phases={snapshot.phases} dominantPhase={snapshot.dominant_phase} />
        </>
      )}
    </main>
  );
}
