import type { KitchinPhaseScore, RankingEntry } from "@/types/market";

// Heuristic "will it touch this target within 12 months" estimate - a closed-form
// barrier-hitting-probability formula (the same math family as one-touch option
// pricing), NOT a backtested model like the ML target (A) or volatility band (C)
// columns. See the Kitchin/prediction plan for the full derivation.

export interface PredictionWeights {
  momentum: number;
  analyst: number;
  ml: number;
  ichimoku: number;
  kitchin: number;
}

export const DEFAULT_PREDICTION_WEIGHTS: PredictionWeights = {
  momentum: 1,
  analyst: 1,
  ml: 1,
  ichimoku: 1,
  kitchin: 1,
};

const SIGMA_FLOOR = 0.08;
const BASELINE_DRIFT = Math.log(1.08); // ~8%/year long-run equity average, before any tilt
const MU_MIN = Math.log(0.4); // clamp: no worse than -60%/year
const MU_MAX = Math.log(2.5); // clamp: no better than +150%/year
const COMPONENT_CLIP = 0.6;

function clip(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, ~1e-7 accurate). */
export function normCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** Annualized volatility from the already-computed 3-month vol_forecast.sigma, or
 *  null if that hasn't been calculated for this stock yet ("Oblicz prognoze zmiennosci"). */
export function estimateSigmaAnnual(entry: RankingEntry): number | null {
  const sigma3m = entry.vol_forecast?.sigma;
  if (sigma3m == null) return null;
  return Math.max(sigma3m * 2, SIGMA_FLOOR); // 3-month -> annual: * sqrt(4)
}

export function estimateDriftAnnual(
  entry: RankingEntry,
  dominantPhase: KitchinPhaseScore | null,
  weights: PredictionWeights,
): number {
  const price = entry.quote?.price;

  const momentum = clip((entry.changes?.["6m"]?.change_percent ?? 0) / 100, -COMPONENT_CLIP, COMPONENT_CLIP);

  const analystTarget = entry.targets?.median;
  const analyst =
    analystTarget != null && price ? clip(analystTarget / price - 1, -COMPONENT_CLIP, COMPONENT_CLIP) : 0;

  const ml =
    entry.forecast?.verdict === "edge" && price
      ? clip((entry.forecast.median / price - 1) * 4, -COMPONENT_CLIP, COMPONENT_CLIP)
      : 0;

  const ichimoku = (entry.score / 10) * 0.1;

  const kitchin = dominantPhase
    ? (dominantPhase.stocks_up ? 1 : -1) * (dominantPhase.percent / 100) * 0.08
    : 0;

  const mu =
    BASELINE_DRIFT +
    weights.momentum * momentum +
    weights.analyst * analyst +
    weights.ml * ml +
    weights.ichimoku * ichimoku +
    weights.kitchin * kitchin;

  return clip(mu, MU_MIN, MU_MAX);
}

/** P(the price touches `targetPct` (signed - negative = downside target) at least
 *  once within the next `horizonYears`), given annualized drift/volatility, via the
 *  closed-form barrier-hitting formula for arithmetic Brownian motion with drift. */
export function touchProbabilityPercent(
  targetPct: number,
  muAnnual: number,
  sigmaAnnual: number,
  horizonYears = 1,
): number {
  const g = Math.log(1 + targetPct / 100);
  if (g === 0) return 100;
  const sign = g > 0 ? 1 : -1;
  const b = sign * g; // > 0
  const mu = sign * muAnnual;
  const sigma = Math.max(sigmaAnnual, SIGMA_FLOOR);
  const sqrtT = Math.sqrt(horizonYears);

  const d1 = (mu * horizonYears - b) / (sigma * sqrtT);
  const d2 = (-mu * horizonYears - b) / (sigma * sqrtT);
  const exponent = clip((2 * mu * b) / (sigma * sigma), -700, 700);
  const p = normCdf(d1) + Math.exp(exponent) * normCdf(d2);
  return clip(p, 0, 1) * 100;
}

/** Full pipeline for one stock; null when there isn't enough data (no volatility
 *  forecast yet) to estimate sigma. */
export function predictTouch(
  entry: RankingEntry,
  dominantPhase: KitchinPhaseScore | null,
  targetPct: number,
  weights: PredictionWeights,
): number | null {
  const sigma = estimateSigmaAnnual(entry);
  if (sigma == null) return null;
  const mu = estimateDriftAnnual(entry, dominantPhase, weights);
  return touchProbabilityPercent(targetPct, mu, sigma);
}
