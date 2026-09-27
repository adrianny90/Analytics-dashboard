import { formatNumber } from "@/lib/format";
import type { QualityFail, QualityPart, RankingEntry } from "@/types/market";

type Tri = [string, string, string];
type T = (pl: string, en: string, de: string) => string;

// Quality-filter columns of the ranking tables (see backend
// app/services/indicators/quality.py and backtests/t_quality.py).
export type QualitySortKey = "quality" | "fscore" | "revenue" | "breadth" | "dispersion";

export const QUALITY_PART_LABELS: Record<QualityPart, Tri> = {
  fscore: ["F-score", "F-score", "F-Score"],
  roa: ["rentowność aktywów (ROA)", "return on assets (ROA)", "Gesamtkapitalrendite (ROA)"],
  cfo_to_assets: ["przepływy operacyjne / aktywa", "operating cash flow / assets", "operativer Cashflow / Aktiva"],
  breadth: ["rewizje celów", "target revisions", "Kurszielrevisionen"],
  momentum: ["momentum 12-1", "momentum 12-1", "Momentum 12-1"],
  sector: ["siła sektora", "sector strength", "Sektorstärke"],
};

export const QUALITY_FAIL_LABELS: Record<QualityFail, Tri> = {
  score: ["ocena poniżej 30 (najsłabsze spółki w indeksie)", "score below 30 (the weakest stocks in the index)", "Bewertung unter 30 (die schwächsten Aktien im Index)"],
  data: ["za mało danych (< 3 składniki)", "not enough data (< 3 components)", "zu wenige Daten (< 3 Komponenten)"],
};

/** Value a quality column sorts by (null = no data, always last). */
export function qualitySortValue(entry: RankingEntry, key: QualitySortKey): number | null | undefined {
  switch (key) {
    case "quality":
      return entry.quality?.score;
    case "fscore":
      return entry.fundamentals?.fscore;
    case "revenue":
      return entry.fundamentals?.revenue_growth;
    case "breadth":
      return entry.targets?.breadth;
    case "dispersion":
      return entry.targets?.dispersion;
  }
}

export const pct = (v: number | null | undefined, digits = 0) =>
  v == null ? null : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`;

export function qualityTitle(entry: RankingEntry, t: T): string | undefined {
  const q = entry.quality;
  if (!q) return undefined;
  const parts = Object.entries(q.parts ?? {})
    .map(([k, v]) => `${t(...QUALITY_PART_LABELS[k as QualityPart])}: ${Math.round(v)}`)
    .join(", ");
  const fails = (q.fails ?? []).map((f) => t(...QUALITY_FAIL_LABELS[f])).join(", ");
  return [
    t("Percentyle w tym indeksie (0-100)", "Percentiles within this index (0-100)", "Perzentile innerhalb dieses Index (0-100)") +
      (parts ? `: ${parts}.` : "."),
    q.passes
      ? t("Przechodzi filtr jakości.", "Passes the quality filter.", "Besteht den Qualitätsfilter.")
      : `${t("Nie przechodzi filtra", "Fails the filter", "Besteht den Filter nicht")}: ${fails}.`,
  ].join(" ");
}

export function fundamentalsTitle(entry: RankingEntry, t: T): string | undefined {
  const f = entry.fundamentals;
  if (!f) return undefined;
  const fmt = (v: number | null | undefined) => (v == null ? t("brak", "n/a", "k. A.") : `${formatNumber(v * 100)}%`);
  return t(
    `Piotroski F-score z ostatniego rocznego raportu SEC (rok obrotowy do ${f.fiscal_year_end}), policzony z ${f.fscore_n ?? "?"} z 9 testów. ROA ${fmt(f.roa)}, marża brutto ${fmt(f.gross_margin)}, wzrost EPS ${fmt(f.eps_growth)}, przepływy operacyjne / aktywa ${fmt(f.cfo_to_assets)}.`,
    `Piotroski F-score from the latest annual SEC report (fiscal year to ${f.fiscal_year_end}), from ${f.fscore_n ?? "?"} of 9 tests. ROA ${fmt(f.roa)}, gross margin ${fmt(f.gross_margin)}, EPS growth ${fmt(f.eps_growth)}, operating cash flow / assets ${fmt(f.cfo_to_assets)}.`,
    `Piotroski F-Score aus dem letzten SEC-Jahresbericht (Geschäftsjahr bis ${f.fiscal_year_end}), aus ${f.fscore_n ?? "?"} von 9 Tests. ROA ${fmt(f.roa)}, Bruttomarge ${fmt(f.gross_margin)}, EPS-Wachstum ${fmt(f.eps_growth)}, operativer Cashflow / Aktiva ${fmt(f.cfo_to_assets)}.`,
  );
}

export function analystQualityTitle(entry: RankingEntry, t: T): string | undefined {
  const a = entry.targets;
  if (!a || a.n_firms == null) return undefined;
  return t(
    `${a.n_firms} firm z celem z ostatnich 180 dni, mediana wieku celów ${a.stale_days != null ? Math.round(a.stale_days) : "?"} dni, rozrzut celów ${a.dispersion != null ? `${formatNumber(a.dispersion * 100)}%` : "brak (< 3 firmy)"}. Rewizje 90 dni: ${pct(a.breadth) ?? "brak zmian celów"}, podwyżki - obniżki rekomendacji: ${a.net_upgrades ?? 0}.`,
    `${a.n_firms} firms with a target from the last 180 days, median target age ${a.stale_days != null ? Math.round(a.stale_days) : "?"} days, target dispersion ${a.dispersion != null ? `${formatNumber(a.dispersion * 100)}%` : "n/a (< 3 firms)"}. 90-day revisions: ${pct(a.breadth) ?? "no target changes"}, rating upgrades - downgrades: ${a.net_upgrades ?? 0}.`,
    `${a.n_firms} Häuser mit Kursziel aus den letzten 180 Tagen, Medianalter der Ziele ${a.stale_days != null ? Math.round(a.stale_days) : "?"} Tage, Streuung ${a.dispersion != null ? `${formatNumber(a.dispersion * 100)} %` : "k. A. (< 3 Häuser)"}. Revisionen 90 Tage: ${pct(a.breadth) ?? "keine Zieländerungen"}, Hoch- minus Herabstufungen: ${a.net_upgrades ?? 0}.`,
  );
}

// Filter modes of the ranking tables (backtests/t_strict.py, summary.txt section 41):
// - "basic": removes the weakest stocks (score < 30);
// - "strict": at least `minFirms` analyst firms with a target from the last 180 days,
//   score >= 50 and non-negative target revisions over 90 days. In the backtest this
//   raised the share of stocks whose consensus target was reached within 12 months
//   from ~40% (analysts >= 20% upside) to ~75-80%, but did not beat the index.
export type QualityMode = "off" | "basic" | "strict";
export const STRICT_MIN_SCORE = 50;
export const DEFAULT_MIN_FIRMS = 5;

export function passesQuality(entry: RankingEntry, mode: QualityMode, minFirms: number): boolean {
  if (mode === "off") return true;
  const q = entry.quality;
  if (!q?.passes) return false;
  if (mode === "basic") return true;
  const a = entry.targets;
  return (q.score ?? 0) >= STRICT_MIN_SCORE && (a?.n_firms ?? 0) >= minFirms && a?.breadth != null && a.breadth >= 0;
}
