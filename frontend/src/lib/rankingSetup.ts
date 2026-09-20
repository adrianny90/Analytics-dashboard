import type { RankingEntry } from "@/types/market";

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

export interface SetupResult {
  met: boolean;
  kijun: boolean | null;
  analyst: boolean | null;
  ma: boolean | null;
  upside: number | null;
}

const label = (tf: LevelTimeframe) => LEVEL_TIMEFRAME_OPTIONS.find((o) => o.value === tf)?.label ?? tf;

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

  return { met: kijun === true && analyst === true && ma === true, kijun, analyst, ma, upside };
}

export function describeSetup(result: SetupResult, cfg: SetupConfig): string {
  const mark = (v: boolean | null) => (v === null ? "brak danych" : v ? "tak" : "nie");
  return [
    `Cena nad Kijun-sen (52) na ${label(cfg.kijunTimeframe)}: ${mark(result.kijun)}`,
    `Potencjał wg analityków >= ${cfg.minUpside}%: ${mark(result.analyst)}${
      result.upside != null ? ` (${result.upside.toFixed(1)}%)` : ""
    }`,
    `Cena nad MA${cfg.maPeriod} na ${label(cfg.maTimeframe)}: ${mark(result.ma)}`,
  ].join("\n");
}
