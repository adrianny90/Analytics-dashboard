import type { ChangePeriod, PeriodChange, RankingEntry, TrendOutlook } from "@/types/market";

export type TimeframeKey = "day" | "h4" | "week" | "h1";
export type TimeframeWeights = Record<TimeframeKey, number>;

// Same weights the backend scan uses, so a fresh page matches the saved ranking.
export const DEFAULT_WEIGHTS: TimeframeWeights = { day: 4, h4: 3, week: 2, h1: 1 };

// Price-change rules: a stock whose change over the period is at least `min`
// percent earns `weight` extra points. Weight 0 = rule switched off.
export type RuleKey = "1w" | "1m" | "1y";
export type ChangeRule = { min: number; weight: number };
export type ChangeRules = Record<RuleKey, ChangeRule>;

export const DEFAULT_RULES: ChangeRules = {
  "1w": { min: 0, weight: 0 },
  "1m": { min: 0, weight: 0 },
  "1y": { min: 0, weight: 0 },
};

const RULE_FIELDS: { key: RuleKey; label: string }[] = [
  { key: "1w", label: "Weekly change" },
  { key: "1m", label: "Monthly change" },
  { key: "1y", label: "Yearly change" },
];

const OUTLOOK_SIGN: Record<TrendOutlook, number> = { bullish: 1, neutral: 0, bearish: -1 };

const FIELDS: { key: TimeframeKey; label: string; hint: string }[] = [
  { key: "day", label: "D1", hint: "Daily trend" },
  { key: "h4", label: "H4", hint: "4-hour trend" },
  { key: "week", label: "W1", hint: "Weekly trend" },
  { key: "h1", label: "H1", hint: "1-hour trend" },
];

/** Periods whose change data the current rules need (weight > 0). */
export function activeRulePeriods(rules: ChangeRules): RuleKey[] {
  return RULE_FIELDS.filter(({ key }) => rules[key].weight > 0).map(({ key }) => key);
}

export function scoreEntry(
  entry: RankingEntry,
  weights: TimeframeWeights,
  rules: ChangeRules,
  changeFor: (entry: RankingEntry, period: ChangePeriod) => PeriodChange | null,
): number {
  let score = FIELDS.reduce((sum, { key }) => {
    const outlook = entry[key];
    return sum + weights[key] * (outlook ? OUTLOOK_SIGN[outlook] : 0);
  }, 0);
  for (const { key } of RULE_FIELDS) {
    const rule = rules[key];
    if (rule.weight <= 0) continue;
    const change = changeFor(entry, key);
    if (change && change.change_percent >= rule.min) score += rule.weight;
  }
  return score;
}

function parseNumber(raw: string, allowNegative = false) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return allowNegative ? value : Math.max(0, value);
}

const INPUT_CLASS = "w-24 rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white";

export function RankingWeights({
  weights,
  onChange,
  rules,
  onRulesChange,
}: {
  weights: TimeframeWeights;
  onChange: (weights: TimeframeWeights) => void;
  rules: ChangeRules;
  onRulesChange: (rules: ChangeRules) => void;
}) {
  const isDefault =
    FIELDS.every(({ key }) => weights[key] === DEFAULT_WEIGHTS[key]) &&
    RULE_FIELDS.every(
      ({ key }) => rules[key].min === DEFAULT_RULES[key].min && rules[key].weight === DEFAULT_RULES[key].weight,
    );

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Ranking weights</h2>
        <button
          onClick={() => {
            onChange(DEFAULT_WEIGHTS);
            onRulesChange(DEFAULT_RULES);
          }}
          disabled={isDefault}
          className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset to defaults
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold text-white/70">Trend weights</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="flex flex-col gap-1 text-xs text-white/60">
            <span>
              <span className="font-semibold text-white">{label}</span> · {hint}
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={weights[key]}
              onChange={(e) => onChange({ ...weights, [key]: parseNumber(e.target.value) })}
              className={INPUT_CLASS}
            />
            <span className="text-white/30">default {DEFAULT_WEIGHTS[key]}</span>
          </label>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-white/70">Price change bonus</p>
      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
        {RULE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 text-xs text-white/60">
            <span className="font-semibold text-white">{label}</span>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1">
                <span>Min change %</span>
                <input
                  type="number"
                  step={0.5}
                  value={rules[key].min}
                  onChange={(e) =>
                    onRulesChange({ ...rules, [key]: { ...rules[key], min: parseNumber(e.target.value, true) } })
                  }
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Points</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={rules[key].weight}
                  onChange={(e) =>
                    onRulesChange({ ...rules, [key]: { ...rules[key], weight: parseNumber(e.target.value) } })
                  }
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <span className="text-white/30">
              default min {DEFAULT_RULES[key].min}%, points {DEFAULT_RULES[key].weight} (off)
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/50">
        <p>
          <span className="font-semibold text-white/70">How the ranking works:</span> every stock gets an Ichimoku trend
          for each timeframe (D1, H4, W1, H1). Each trend counts as <span className="text-rise">Bull = +1</span>,{" "}
          <span className="text-white/70">Neutral = 0</span>, <span className="text-fall">Bear = −1</span>, multiplied
          by that timeframe&apos;s weight, and the results are summed into the{" "}
          <span className="font-semibold text-white/70">Score</span>.
        </p>
        <p>
          Score = D1×{weights.day} + H4×{weights.h4} + W1×{weights.week} + H1×{weights.h1}
          {activeRulePeriods(rules).map((key) => (
            <span key={key}>
              {" "}
              + {rules[key].weight} if {key === "1w" ? "weekly" : key === "1m" ? "monthly" : "yearly"} change ≥{" "}
              {rules[key].min}%
            </span>
          ))}
          . Stocks are ranked by highest score first (ties alphabetically), so a higher weight makes that factor matter
          more. A weight of 0 ignores it.
        </p>
        <p>
          Price change bonus: a stock earns the points only if its change over that period is at least the minimum (use
          a negative minimum to also reward small drops). Stocks without enough history for the period get no bonus.
          Enabled periods are downloaded from Yahoo when first used (throttled like the scan), so the ranking may take a
          moment to update. Changes apply instantly otherwise - no new scan needed.
        </p>
      </div>
    </section>
  );
}
