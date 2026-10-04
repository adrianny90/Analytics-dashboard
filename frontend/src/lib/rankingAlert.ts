import type { Translate } from "@/lib/i18n";
import type { RankingEntry } from "@/types/market";

/**
 * Kolumna "Alert" - metoda z backtestu (strona Metodologia, sekcja 13), wszystko na D1:
 *
 * - GO      - dzisiejsze zamknięcie przebiło Kijun-sen(52) od dołu (poprzednie zamknięcie na lub pod nim)
 *             + analitycy >= 20% (min. 3 firmy) + cena > MA200. Liczone dla spółek indeksu danej tabeli.
 *             Kupno na otwarciu następnej sesji - czekanie na potwierdzenie pogarszało wynik (summary.txt, sekcja 51).
 * - READY   - filtry jak w GO spełnione, cena jeszcze pod Kijun-sen(52), ale przy niezmienionej cenie
 *             przebije go za 1-5 sesji albo jest najwyżej 3% pod nim.
 * - WARNING - analitycy spełnieni oraz (blisko Kijun jak w READY, ale cena pod MA200)
 *             LUB (na H4 cena już nad Kijun-sen(52), na D1 jeszcze nie).
 * - null    - żadne z powyższych ("None" w tabeli).
 */
export type AlertLevel = "go" | "ready" | "warning";

export const ALERT_MIN_UPSIDE = 20;
export const ALERT_MIN_FIRMS = 3;
/** Cena najwyżej tyle % pod Kijun-sen(52) = "blisko przebicia". */
export const ALERT_NEAR_PCT = 3;

export const ALERT_STYLES: Record<AlertLevel, { badge: string; label: string }> = {
  go: { badge: "bg-green-500/20 text-green-300", label: "GO" },
  ready: { badge: "bg-white/10 text-white/60", label: "READY" },
  warning: { badge: "bg-yellow-400/20 text-yellow-300", label: "WARNING" },
};

/** Opis kolumny w nagłówku tabeli: [pl, en, de]. */
export const ALERT_COLUMN_TITLE: [string, string, string] = [
  "Alert wg metody z backtestu (Metodologia, sekcja 13), na D1. GO (zielony): dzisiejsze zamknięcie przebiło Kijun-sen (52) od dołu + analitycy ≥ 20% (min. 3 firmy) + cena nad MA200 - kupno na otwarciu następnej sesji. READY (szary): te same filtry, cena jeszcze pod Kijun-sen (52), ale przy tej cenie przebicie za 1-5 sesji albo najwyżej 3% pod nim. WARNING (żółty): jak READY, ale cena pod MA200, albo cena nad Kijun-sen (52) na H4, a na D1 jeszcze nie. None: brak.",
  "Alert by the backtested method (Methodology, section 13), on D1. GO (green): today's close crossed above Kijun-sen (52) + analysts ≥ 20% (min. 3 firms) + price above MA200 - buy at the next session's open. READY (gray): same filters, price still below Kijun-sen (52), but at this price the cross comes in 1-5 sessions or it is at most 3% below. WARNING (yellow): like READY but price below MA200, or price above Kijun-sen (52) on H4 but not yet on D1. None: nothing.",
  "Alert nach der getesteten Methode (Methodik, Abschnitt 13), auf D1. GO (grün): heutiger Schlusskurs kreuzt Kijun-sen (52) nach oben + Analysten ≥ 20 % (mind. 3 Häuser) + Kurs über MA200 - Kauf zur Eröffnung der nächsten Sitzung. READY (grau): gleiche Filter, Kurs noch unter Kijun-sen (52), aber bei diesem Kurs Durchbruch in 1-5 Sitzungen oder höchstens 3 % darunter. WARNING (gelb): wie READY, aber Kurs unter MA200, oder Kurs auf H4 über Kijun-sen (52), auf D1 noch nicht. None: nichts.",
];

export interface AlertResult {
  level: AlertLevel | null;
  /** Dzisiejsze zamknięcie przebiło Kijun-sen(52) od dołu (D1). */
  cross: boolean | null;
  /** Cena pod Kijun-sen(52), ale przebicie za 1-5 sesji przy tej cenie albo <= 3% pod nim. */
  near: boolean | null;
  /** Sesje do przebicia przy niezmienionej cenie (1-5) albo null. */
  crossIn: number | null;
  /** Odległość ceny pod Kijun-sen(52) w % (dodatnia = pod). */
  belowPct: number | null;
  analyst: boolean | null;
  upside: number | null;
  firms: number | null;
  ma200: boolean | null;
  h4Above: boolean | null;
}

export function evaluateAlert(entry: RankingEntry): AlertResult {
  const d = entry.levels?.day;
  const h4 = entry.levels?.h4;

  const close = d?.close;
  const kijun = d?.kijun52;
  const above = close != null && kijun != null ? close > kijun : null;
  const cross =
    above === null || d?.prev_close == null || d?.prev_kijun52 == null
      ? null
      : above && d.prev_close <= d.prev_kijun52;
  const belowPct = close != null && kijun != null && kijun > 0 ? (kijun / close - 1) * 100 : null;
  const crossIn = d?.kijun52_cross_in ?? null;
  const near =
    above === null ? null : !above && ((crossIn != null && crossIn >= 1) || (belowPct != null && belowPct <= ALERT_NEAR_PCT));

  const target = entry.targets?.median;
  const price = entry.quote?.price;
  const upside = target != null && price ? (target / price - 1) * 100 : null;
  const firms = entry.targets?.n_firms ?? null;
  const analyst = upside == null || firms == null ? null : upside >= ALERT_MIN_UPSIDE && firms >= ALERT_MIN_FIRMS;

  const ma200 = close != null && d?.ma200 != null ? close > d.ma200 : null;
  const h4Above = h4?.close != null && h4?.kijun52 != null ? h4.close > h4.kijun52 : null;

  const base = analyst === true;
  let level: AlertLevel | null = null;
  if (base && cross === true && ma200 === true) level = "go";
  else if (base && near === true && ma200 === true) level = "ready";
  else if (base && ((near === true && ma200 === false) || (h4Above === true && above === false))) level = "warning";

  return { level, cross, near, crossIn, belowPct, analyst, upside, firms, ma200, h4Above };
}

/** Wartość do sortowania kolumny: GO > READY > WARNING, None (null) zawsze na dole. */
export function alertRank(level: AlertLevel | null): number | null {
  return level === "go" ? 3 : level === "ready" ? 2 : level === "warning" ? 1 : null;
}

export function describeAlert(r: AlertResult, t: Translate): string {
  const mark = (v: boolean | null) =>
    v === null ? t("brak danych", "no data", "keine Daten") : v ? t("tak", "yes", "ja") : t("nie", "no", "nein");
  const up = r.upside != null ? ` (${r.upside.toFixed(1)}%, ${r.firms ?? "?"} ${t("firm", "firms", "Häuser")})` : "";
  const dist =
    r.belowPct != null && r.belowPct > 0
      ? t(` - ${r.belowPct.toFixed(1)}% pod Kijun`, ` - ${r.belowPct.toFixed(1)}% below the Kijun`, ` - ${r.belowPct.toFixed(1)} % unter der Kijun`)
      : "";
  const crossIn =
    r.crossIn != null
      ? t(` (przy tej cenie przebicie za ${r.crossIn} ses.)`, ` (cross in ${r.crossIn} sessions at this price)`, ` (Durchbruch in ${r.crossIn} Sitzungen bei diesem Kurs)`)
      : "";
  return [
    t(
      "GO: przebicie Kijun-sen (52) na zamknięciu D1 + analitycy ≥ 20% (min. 3 firmy) + cena > MA200 (D1). READY: filtry OK, cena pod Kijun, przebicie za 1-5 sesji lub ≤ 3% pod. WARNING: jak READY, ale pod MA200, albo cena nad Kijun-sen (52) na H4, a na D1 jeszcze nie.",
      "GO: close crossing above Kijun-sen (52) on D1 + analysts ≥ 20% (min. 3 firms) + price > MA200 (D1). READY: filters met, price below the Kijun, cross in 1-5 sessions or ≤ 3% below. WARNING: like READY but below MA200, or price above Kijun-sen (52) on H4 but not yet on D1.",
      "GO: Schlusskurs kreuzt Kijun-sen (52) auf D1 nach oben + Analysten ≥ 20 % (mind. 3 Häuser) + Kurs > MA200 (D1). READY: Filter erfüllt, Kurs unter der Kijun, Durchbruch in 1-5 Sitzungen oder ≤ 3 % darunter. WARNING: wie READY, aber unter MA200, oder Kurs auf H4 über Kijun-sen (52), auf D1 noch nicht.",
    ),
    "",
    t(`Przebicie Kijun-sen (52) dziś (D1): ${mark(r.cross)}`, `Kijun-sen (52) crossed today (D1): ${mark(r.cross)}`, `Kijun-sen (52) heute gekreuzt (D1): ${mark(r.cross)}`),
    t(`Blisko przebicia: ${mark(r.near)}${dist}${crossIn}`, `Close to a cross: ${mark(r.near)}${dist}${crossIn}`, `Nahe am Durchbruch: ${mark(r.near)}${dist}${crossIn}`),
    t(`Analitycy ≥ 20%, min. 3 firmy: ${mark(r.analyst)}${up}`, `Analysts ≥ 20%, min. 3 firms: ${mark(r.analyst)}${up}`, `Analysten ≥ 20 %, mind. 3 Häuser: ${mark(r.analyst)}${up}`),
    t(`Cena nad MA200 (D1): ${mark(r.ma200)}`, `Price above MA200 (D1): ${mark(r.ma200)}`, `Kurs über MA200 (D1): ${mark(r.ma200)}`),
    t(`Cena nad Kijun-sen (52) na H4: ${mark(r.h4Above)}`, `Price above Kijun-sen (52) on H4: ${mark(r.h4Above)}`, `Kurs über Kijun-sen (52) auf H4: ${mark(r.h4Above)}`),
  ].join("\n");
}
