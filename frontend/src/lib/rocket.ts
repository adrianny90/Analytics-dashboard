import type { Translate } from "@/lib/i18n";
import type { RankingEntry } from "@/types/market";

/**
 * Filtr "Rocket" - cechy, przy których w backteście (test3.txt, sekcja 5; backtests/t_rockets.py) najczęściej trafiały się
 * "rakiety" (wzrost >= x4 w 2 lata): tania, bardzo zmienna spółka po przecenie, w trendzie (nad MA200), z potencjałem
 * wg analityków >= 20% jak w metodzie. Wszystko na D1. To loteria z większą liczbą losów, nie sygnał kupna: mediana wyniku takich spółek była ~0,
 * a obok rakiet są spółki tracące 80-90%.
 */
export const ROCKET_MAX_PRICE = 10;
/** Zmienność roczna (60 sesji) w %. */
export const ROCKET_MIN_VOL = 60;
/** Cena tyle % pod najwyższym zamknięciem z 52 tygodni (od-do). */
export const ROCKET_OFF_HIGH: [number, number] = [20, 50];
/** Jak w metodzie (kolumna Alert, backtest) - rakiety miały w dniu sygnału medianę celów ok. +36% (AXTI +44%, CRDO +30%, BE +23%). */
export const ROCKET_MIN_UPSIDE = 20;
export const ROCKET_MIN_FIRMS = 3;

export interface RocketResult {
  rocket: boolean;
  price: number | null;
  vol: number | null;
  offHigh: number | null;
  upside: number | null;
  firms: number | null;
  ma200: boolean | null;
}

export function evaluateRocket(entry: RankingEntry): RocketResult {
  const d = entry.levels?.day;
  const price = entry.quote?.price ?? d?.close ?? null;
  const vol = d?.vol60 != null ? d.vol60 * Math.sqrt(252) * 100 : null;
  const offHigh = d?.high_252 && d.close != null ? (1 - d.close / d.high_252) * 100 : null;
  const target = entry.targets?.median;
  const upside = target != null && price ? (target / price - 1) * 100 : null;
  const firms = entry.targets?.n_firms ?? null;
  const ma200 = d?.close != null && d?.ma200 != null ? d.close > d.ma200 : null;
  const rocket =
    price != null &&
    price < ROCKET_MAX_PRICE &&
    vol != null &&
    vol > ROCKET_MIN_VOL &&
    offHigh != null &&
    offHigh >= ROCKET_OFF_HIGH[0] &&
    offHigh <= ROCKET_OFF_HIGH[1] &&
    upside != null &&
    upside >= ROCKET_MIN_UPSIDE &&
    firms != null &&
    firms >= ROCKET_MIN_FIRMS &&
    ma200 === true;
  return { rocket, price, vol, offHigh, upside, firms, ma200 };
}

export function describeRocket(r: RocketResult, t: Translate): string {
  const mark = (ok: boolean | null, v: string) =>
    `${ok === null ? t("brak danych", "no data", "keine Daten") : ok ? "✓" : "✗"}${v ? ` (${v})` : ""}`;
  const f = (v: number | null, d = 0) => (v == null ? "" : v.toFixed(d));
  const [lo, hi] = ROCKET_OFF_HIGH;
  return [
    t(
      "ROCKET: cechy, przy których w backteście najczęściej trafiały się wzrosty ≥ x4 w 2 lata (AXTI, RKLB, APLD, CIFR...). Loteria - obok rakiet są spółki tracące 80-90%; tylko małe pozycje (2-3%).",
      "ROCKET: traits that most often preceded ≥ 4x gains within 2 years in the backtest (AXTI, RKLB, APLD, CIFR...). A lottery - next to rockets are stocks losing 80-90%; small positions only (2-3%).",
      "ROCKET: Merkmale, die im Backtest am häufigsten ≥ 4-fachen Anstiegen binnen 2 Jahren vorausgingen (AXTI, RKLB, APLD, CIFR...). Eine Lotterie - neben Raketen stehen Aktien mit 80-90 % Verlust; nur kleine Positionen (2-3 %).",
    ),
    "",
    `${t("Cena", "Price", "Kurs")} < ${ROCKET_MAX_PRICE} USD: ${mark(r.price == null ? null : r.price < ROCKET_MAX_PRICE, f(r.price, 2))}`,
    `${t("Zmienność roczna (60 sesji)", "Annual volatility (60 sessions)", "Jahresvolatilität (60 Sitzungen)")} > ${ROCKET_MIN_VOL}%: ${mark(r.vol == null ? null : r.vol > ROCKET_MIN_VOL, r.vol == null ? "" : `${f(r.vol)}%`)}`,
    `${t(`${lo}-${hi}% pod szczytem z 52 tyg.`, `${lo}-${hi}% below the 52-week high`, `${lo}-${hi} % unter dem 52-Wochen-Hoch`)}: ${mark(r.offHigh == null ? null : r.offHigh >= lo && r.offHigh <= hi, r.offHigh == null ? "" : `${f(r.offHigh)}%`)}`,
    `${t("Analitycy", "Analysts", "Analysten")} ≥ ${ROCKET_MIN_UPSIDE}%, min. ${ROCKET_MIN_FIRMS} ${t("firmy", "firms", "Häuser")}: ${mark(r.upside == null || r.firms == null ? null : r.upside >= ROCKET_MIN_UPSIDE && r.firms >= ROCKET_MIN_FIRMS, r.upside == null ? "" : `${f(r.upside, 1)}%, ${r.firms ?? "?"}`)}`,
    `${t("Cena nad MA200 (D1)", "Price above MA200 (D1)", "Kurs über MA200 (D1)")}: ${mark(r.ma200, "")}`,
  ].join("\n");
}
