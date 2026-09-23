import type { Translate } from "@/lib/i18n";
import type { RankingEntry, TimeframeLevels } from "@/types/market";

export type LevelTimeframe = "week" | "day" | "h4" | "h1";
export type MaPeriod = 50 | 100 | 150 | 200;

export const LEVEL_TIMEFRAME_OPTIONS: { value: LevelTimeframe; label: string }[] = [
  { value: "week", label: "W1" },
  { value: "day", label: "D1" },
  { value: "h4", label: "H4" },
  { value: "h1", label: "H1" },
];
export const MA_PERIOD_OPTIONS: MaPeriod[] = [50, 100, 150, 200];

export interface SetupConfig {
  kijunTimeframe: LevelTimeframe;
  minUpside: number;
  maPeriod: MaPeriod;
  maTimeframe: LevelTimeframe;
  weight: number;
}

// Backtest (S&P 500, 5 lat): analitycy >= 20% + cena nad MA + cena nad Kijun-sen dawały najlepsze wyniki.
export const DEFAULT_SETUP: SetupConfig = {
  kijunTimeframe: "h4",
  minUpside: 20,
  maPeriod: 100,
  maTimeframe: "h4",
  weight: 5,
};

/**
 * Kolor znaczka "Setup" w tabeli rankingu. Każda spółka dostaje najwyżej jeden,
 * ten najmocniejszy, jaki spełnia
 * (priorytet: green > yellow > blue > red > purple > pink):
 *
 * - blue   - setup bazowy z panelu "Setup trendowy" (ustawienia użytkownika):
 *            cena > Kijun-sen(52) na `kijunTimeframe`, potencjał analityków
 *            >= `minUpside`, cena > MA`maPeriod` na `maTimeframe`.
 * - yellow - jak blue, ale ostrzej: Kijun-sen(52) zawsze z D1 i MA200 zamiast
 *            wybranej MA (interwał MA i próg analityków - jak w blue).
 * - green  - sygnał "5 linii" Ichimoku na D1 (cena nad chmurą, Chikou nad
 *            ceną, cena nad Kijun-sen i Tenkan-sen) + cena > MA200 na D1 +
 *            potencjał analityków >= `minUpside`.
 * - red    - te same warunki techniczne co green, ale BEZ potwierdzenia od
 *            analityków (potencjał poniżej progu albo brak danych).
 * - purple - te same warunki techniczne co yellow (Kijun-sen(52) na D1 +
 *            MA200), ale BEZ potwierdzenia od analityków.
 * - pink   - wszystko na H4: cena > MA100, cena > Kijun-sen(52) i Chikou Span
 *            nad chmurą (nie musi być nad ceną). Analitycy nie są sprawdzani
 *            w ogóle - dlatego pink ma najniższy priorytet: spółka, która do
 *            tego ma potwierdzenie analityków, zwykle spełnia już blue.
 *
 * Warianty "z analitykami" (green, yellow, blue) wykluczają się z wariantami
 * "bez analityków" (red, purple), więc priorytet rozstrzyga tylko wewnątrz
 * każdej z tych dwóch grup: green > yellow > blue oraz red > purple.
 */
export type SetupTier = "blue" | "yellow" | "purple" | "green" | "red" | "pink";

/** Kolejność, w jakiej kolejne kliknięcia nagłówka "Setup" wyciągają dany
 * kolor na górę tabeli (po ostatnim - powrót do kolejności rankingu). Ta sama
 * kolejność jest w legendzie nad tabelą: każdy wariant "bez analityków" stoi
 * zaraz za swoim odpowiednikiem z analitykami (yellow -> purple, green -> red). */
export const SETUP_TIER_SORT_ORDER: SetupTier[] = ["blue", "yellow", "purple", "green", "red", "pink"];

export const SETUP_TIER_STYLES: Record<
  SetupTier,
  {
    badge: string;
    text: string;
    label: [string, string, string];
  }
> = {
  blue: {
    badge: "bg-sky-500/20 text-sky-300",
    text: "text-sky-300",
    label: ["niebieski", "blue", "blau"],
  },
  yellow: {
    badge: "bg-yellow-400/20 text-yellow-300",
    text: "text-yellow-300",
    label: ["żółty", "yellow", "gelb"],
  },
  purple: {
    badge: "bg-purple-500/20 text-purple-300",
    text: "text-purple-300",
    label: ["purpurowy", "purple", "lila"],
  },
  green: {
    badge: "bg-green-500/20 text-green-300",
    text: "text-green-300",
    label: ["zielony", "green", "grün"],
  },
  red: {
    badge: "bg-red-500/20 text-red-300",
    text: "text-red-300",
    label: ["czerwony", "red", "rot"],
  },
  pink: {
    badge: "bg-pink-500/20 text-pink-300",
    text: "text-pink-300",
    label: ["różowy", "pink", "rosa"],
  },
};

// Stałe parametry setupu żółtego/purpurowego - nie zależą od ustawień w panelu.
const YELLOW_KIJUN_TIMEFRAME: LevelTimeframe = "day";
const YELLOW_MA_PERIOD: MaPeriod = 200;
// Stałe parametry setupu różowego - wszystkie warunki z jednego interwału.
const PINK_TIMEFRAME: LevelTimeframe = "h4";
const PINK_MA_PERIOD: MaPeriod = 100;

export interface FiveLineResult {
  /** Cena nad chmurą (nad wyższą z Senkou Span A/B pod ostatnią świecą). */
  cloud: boolean | null;
  /** Chikou Span (dzisiejsze zamknięcie) nad ceną sprzed 26 świec. */
  chikou: boolean | null;
  kijun: boolean | null;
  tenkan: boolean | null;
  /** Wszystkie cztery warunki spełnione = 5 linii Ichimoku po stronie byków. */
  met: boolean;
}

export interface SetupResult {
  /** Setup bazowy (blue) - tylko on dolicza wagę setupu do wyniku rankingu. */
  met: boolean;
  kijun: boolean | null;
  analyst: boolean | null;
  ma: boolean | null;
  upside: number | null;
  // Warunki setupu żółtego/purpurowego.
  kijunD1: boolean | null;
  ma200: boolean | null;
  // Warunki setupu zielonego/czerwonego (wszystko z D1).
  fiveLine: FiveLineResult;
  ma200D1: boolean | null;
  // Warunki setupu różowego (wszystko z H4).
  pinkMa: boolean | null;
  pinkKijun: boolean | null;
  /** Chikou Span nad chmurą w miejscu, gdzie jest rysowany (26 świec wstecz). */
  pinkChikouCloud: boolean | null;
  /** Kolor znaczka albo null, gdy spółka nie spełnia żadnego wariantu. */
  tier: SetupTier | null;
}

/** close > value; null, gdy brakuje którejś wartości (warunek nieoceniony,
 * czyli traktowany jak niespełniony). */
function above(close: number | undefined, value: number | null | undefined): boolean | null {
  return close != null && value != null ? close > value : null;
}

/** Sygnał "5 linii" Ichimoku na danym interwale: cena nad chmurą, nad
 * Kijun-sen i Tenkan-sen, a Chikou Span nad ceną sprzed 26 świec. */
function evaluateFiveLine(levels: TimeframeLevels | undefined): FiveLineResult {
  const close = levels?.close;
  const cloudTop =
    levels?.senkou_a != null && levels?.senkou_b != null ? Math.max(levels.senkou_a, levels.senkou_b) : null;
  const cloud = above(close, cloudTop);
  const chikou = above(close, levels?.chikou_ref);
  const kijun = above(close, levels?.kijun);
  const tenkan = above(close, levels?.tenkan);
  return { cloud, chikou, kijun, tenkan, met: cloud === true && chikou === true && kijun === true && tenkan === true };
}

const label = (tf: LevelTimeframe) => LEVEL_TIMEFRAME_OPTIONS.find((o) => o.value === tf)?.label ?? tf;

/** Opis warunków danego koloru do legendy nad tabelą - budowany z bieżących
 * ustawień panelu (interwały, okres MA, próg analityków), żeby zawsze
 * pokazywał dokładnie to, co jest sprawdzane. Zwraca [pl, en, de]. */
export function setupTierLegend(tier: SetupTier, cfg: SetupConfig): [string, string, string] {
  const kijunTf = label(cfg.kijunTimeframe);
  const maTf = label(cfg.maTimeframe);
  const up = cfg.minUpside;
  switch (tier) {
    case "blue":
      return [
        `cena > Kijun-sen (52) na ${kijunTf} + cena > MA${cfg.maPeriod} na ${maTf} + analitycy ≥ ${up}%`,
        `price > Kijun-sen (52) on ${kijunTf} + price > MA${cfg.maPeriod} on ${maTf} + analysts ≥ ${up}%`,
        `Kurs > Kijun-sen (52) auf ${kijunTf} + Kurs > MA${cfg.maPeriod} auf ${maTf} + Analysten ≥ ${up} %`,
      ];
    case "yellow":
      return [
        `cena > Kijun-sen (52) na D1 + cena > MA${YELLOW_MA_PERIOD} na ${maTf} + analitycy ≥ ${up}%`,
        `price > Kijun-sen (52) on D1 + price > MA${YELLOW_MA_PERIOD} on ${maTf} + analysts ≥ ${up}%`,
        `Kurs > Kijun-sen (52) auf D1 + Kurs > MA${YELLOW_MA_PERIOD} auf ${maTf} + Analysten ≥ ${up} %`,
      ];
    case "purple":
      return [
        `cena > Kijun-sen (52) na D1 + cena > MA${YELLOW_MA_PERIOD} na ${maTf}, analitycy < ${up}% lub brak`,
        `price > Kijun-sen (52) on D1 + price > MA${YELLOW_MA_PERIOD} on ${maTf}, analysts < ${up}% or none`,
        `Kurs > Kijun-sen (52) auf D1 + Kurs > MA${YELLOW_MA_PERIOD} auf ${maTf}, Analysten < ${up} % oder keine`,
      ];
    case "green":
      return [
        `5 linii Ichimoku na D1 + cena > MA200 na D1 + analitycy ≥ ${up}%`,
        `Ichimoku 5-line signal on D1 + price > MA200 on D1 + analysts ≥ ${up}%`,
        `Ichimoku-5-Linien-Signal auf D1 + Kurs > MA200 auf D1 + Analysten ≥ ${up} %`,
      ];
    case "pink":
      return [
        `cena > MA${PINK_MA_PERIOD} na H4 + cena > Kijun-sen (52) na H4 + Chikou Span nad chmurą na H4 (analitycy bez znaczenia)`,
        `price > MA${PINK_MA_PERIOD} on H4 + price > Kijun-sen (52) on H4 + Chikou Span above the cloud on H4 (analysts ignored)`,
        `Kurs > MA${PINK_MA_PERIOD} auf H4 + Kurs > Kijun-sen (52) auf H4 + Chikou Span über der Wolke auf H4 (Analysten egal)`,
      ];
    case "red":
      return [
        `5 linii Ichimoku na D1 + cena > MA200 na D1, analitycy < ${up}% lub brak`,
        `Ichimoku 5-line signal on D1 + price > MA200 on D1, analysts < ${up}% or none`,
        `Ichimoku-5-Linien-Signal auf D1 + Kurs > MA200 auf D1, Analysten < ${up} % oder keine`,
      ];
  }
}

/** null = brak danych do oceny tego warunku (nie liczy się jako spełniony). */
export function evaluateSetup(entry: RankingEntry, cfg: SetupConfig): SetupResult {
  const kLevels = entry.levels?.[cfg.kijunTimeframe];
  const kijun = kLevels && kLevels.kijun52 != null ? kLevels.close > kLevels.kijun52 : null;

  const target = entry.targets?.median;
  const price = entry.quote?.price;
  const upside = target != null && price ? (target / price - 1) * 100 : null;
  const analyst = upside != null ? upside >= cfg.minUpside : null;

  const mLevels = entry.levels?.[cfg.maTimeframe];
  const maValue = mLevels ? mLevels[`ma${cfg.maPeriod}` as const] : null;
  const ma = mLevels && maValue != null ? mLevels.close > maValue : null;

  const met = kijun === true && analyst === true && ma === true;

  // Żółty/purpurowy: Kijun-sen(52) z D1 i MA200 na interwale MA z ustawień.
  const yLevels = entry.levels?.[YELLOW_KIJUN_TIMEFRAME];
  const kijunD1 = above(yLevels?.close, yLevels?.kijun52);
  const ma200 = above(mLevels?.close, mLevels?.[`ma${YELLOW_MA_PERIOD}` as const]);
  const technicalYellow = kijunD1 === true && ma200 === true;

  // Zielony/czerwony: 5 linii Ichimoku + MA200, wszystko na D1.
  const dLevels = entry.levels?.day;
  const fiveLine = evaluateFiveLine(dLevels);
  const ma200D1 = above(dLevels?.close, dLevels?.ma200);
  const technicalD1 = fiveLine.met && ma200D1 === true;

  // Różowy: MA100, Kijun-sen(52) i Chikou nad chmurą - wszystko na H4.
  const pLevels = entry.levels?.[PINK_TIMEFRAME];
  const pinkMa = above(pLevels?.close, pLevels?.[`ma${PINK_MA_PERIOD}` as const]);
  const pinkKijun = above(pLevels?.close, pLevels?.kijun52);
  // Chikou Span = dzisiejsze zamknięcie, więc "Chikou nad chmurą" to
  // zamknięcie powyżej górnej krawędzi chmury sprzed 26 świec.
  const chikouCloudTop =
    pLevels?.chikou_senkou_a != null && pLevels?.chikou_senkou_b != null
      ? Math.max(pLevels.chikou_senkou_a, pLevels.chikou_senkou_b)
      : null;
  const pinkChikouCloud = above(pLevels?.close, chikouCloudTop);
  const pink = pinkMa === true && pinkKijun === true && pinkChikouCloud === true;

  // Najpierw warianty potwierdzone przez analityków (od najmocniejszego),
  // potem te same układy techniczne bez tego potwierdzenia.
  const tier: SetupTier | null =
    technicalD1 && analyst === true
      ? "green"
      : technicalYellow && analyst === true
        ? "yellow"
        : met
          ? "blue"
          : technicalD1
            ? "red" // technika jak w zielonym, ale analitycy nie potwierdzają
            : technicalYellow
              ? "purple" // technika jak w żółtym, ale analitycy nie potwierdzają
              : pink
                ? "pink" // tylko technika H4, analitycy bez znaczenia
                : null;

  return { met, kijun, analyst, ma, upside, kijunD1, ma200, fiveLine, ma200D1, pinkMa, pinkKijun, pinkChikouCloud, tier };
}

export function describeSetup(result: SetupResult, cfg: SetupConfig, t: Translate): string {
  const mark = (v: boolean | null) =>
    v === null ? t("brak danych", "no data", "keine Daten") : v ? t("tak", "yes", "ja") : t("nie", "no", "nein");
  const upside = result.upside != null ? ` (${result.upside.toFixed(1)}%)` : "";
  return [
    t(
      `Cena nad Kijun-sen (52) na ${label(cfg.kijunTimeframe)}: ${mark(result.kijun)}`,
      `Price above Kijun-sen (52) on ${label(cfg.kijunTimeframe)}: ${mark(result.kijun)}`,
      `Kurs über Kijun-sen (52) auf ${label(cfg.kijunTimeframe)}: ${mark(result.kijun)}`,
    ),
    t(
      `Potencjał wg analityków >= ${cfg.minUpside}%: ${mark(result.analyst)}${upside}`,
      `Analyst upside >= ${cfg.minUpside}%: ${mark(result.analyst)}${upside}`,
      `Analysten-Potenzial >= ${cfg.minUpside} %: ${mark(result.analyst)}${upside}`,
    ),
    t(
      `Cena nad MA${cfg.maPeriod} na ${label(cfg.maTimeframe)}: ${mark(result.ma)}`,
      `Price above MA${cfg.maPeriod} on ${label(cfg.maTimeframe)}: ${mark(result.ma)}`,
      `Kurs über MA${cfg.maPeriod} auf ${label(cfg.maTimeframe)}: ${mark(result.ma)}`,
    ),
    "",
    t(
      `Żółty/purpurowy - Kijun-sen (52) na D1: ${mark(result.kijunD1)}, MA200 na ${label(cfg.maTimeframe)}: ${mark(result.ma200)} (żółty wymaga dodatkowo analityków)`,
      `Yellow/purple - Kijun-sen (52) on D1: ${mark(result.kijunD1)}, MA200 on ${label(cfg.maTimeframe)}: ${mark(result.ma200)} (yellow also requires analysts)`,
      `Gelb/lila – Kijun-sen (52) auf D1: ${mark(result.kijunD1)}, MA200 auf ${label(cfg.maTimeframe)}: ${mark(result.ma200)} (Gelb erfordert zusätzlich Analysten)`,
    ),
    t(
      `Zielony/czerwony (D1) - nad chmurą: ${mark(result.fiveLine.cloud)}, Chikou nad ceną: ${mark(result.fiveLine.chikou)}, nad Kijun: ${mark(result.fiveLine.kijun)}, nad Tenkan: ${mark(result.fiveLine.tenkan)}, nad MA200: ${mark(result.ma200D1)} (zielony wymaga dodatkowo analityków)`,
      `Green/red (D1) - above cloud: ${mark(result.fiveLine.cloud)}, Chikou above price: ${mark(result.fiveLine.chikou)}, above Kijun: ${mark(result.fiveLine.kijun)}, above Tenkan: ${mark(result.fiveLine.tenkan)}, above MA200: ${mark(result.ma200D1)} (green also requires analysts)`,
      `Grün/rot (D1) – über Wolke: ${mark(result.fiveLine.cloud)}, Chikou über Kurs: ${mark(result.fiveLine.chikou)}, über Kijun: ${mark(result.fiveLine.kijun)}, über Tenkan: ${mark(result.fiveLine.tenkan)}, über MA200: ${mark(result.ma200D1)} (Grün erfordert zusätzlich Analysten)`,
    ),
    t(
      `Różowy (H4) - nad MA100: ${mark(result.pinkMa)}, nad Kijun-sen (52): ${mark(result.pinkKijun)}, Chikou nad chmurą: ${mark(result.pinkChikouCloud)}`,
      `Pink (H4) - above MA100: ${mark(result.pinkMa)}, above Kijun-sen (52): ${mark(result.pinkKijun)}, Chikou above the cloud: ${mark(result.pinkChikouCloud)}`,
      `Rosa (H4) – über MA100: ${mark(result.pinkMa)}, über Kijun-sen (52): ${mark(result.pinkKijun)}, Chikou über der Wolke: ${mark(result.pinkChikouCloud)}`,
    ),
  ].join("\n");
}
