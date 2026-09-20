import { evaluateSetup, type SetupConfig } from "@/lib/rankingSetup";
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
  { key: "1w", label: "Zmiana tygodniowa" },
  { key: "1m", label: "Zmiana miesięczna" },
  { key: "1y", label: "Zmiana roczna" },
];

const OUTLOOK_SIGN: Record<TrendOutlook, number> = { bullish: 1, neutral: 0, bearish: -1 };

const FIELDS: { key: TimeframeKey; label: string; hint: string }[] = [
  { key: "day", label: "D1", hint: "Trend dzienny" },
  { key: "h4", label: "H4", hint: "Trend 4-godzinny" },
  { key: "week", label: "W1", hint: "Trend tygodniowy" },
  { key: "h1", label: "H1", hint: "Trend 1-godzinny" },
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
  setup?: SetupConfig | null,
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
  if (setup && setup.weight > 0 && evaluateSetup(entry, setup).met) score += setup.weight;
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
        <h2 className="text-sm font-semibold">Wagi rankingu</h2>
        <button
          onClick={() => {
            onChange(DEFAULT_WEIGHTS);
            onRulesChange(DEFAULT_RULES);
          }}
          disabled={isDefault}
          className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Przywróć domyślne
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold text-white/70">Wagi trendu</p>
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
            <span className="text-white/30">domyślnie {DEFAULT_WEIGHTS[key]}</span>
          </label>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-white/70">Bonus za zmianę ceny</p>
      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
        {RULE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 text-xs text-white/60">
            <span className="font-semibold text-white">{label}</span>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1">
                <span>Min. zmiana %</span>
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
                <span>Punkty</span>
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
              domyślnie min {DEFAULT_RULES[key].min}%, punkty {DEFAULT_RULES[key].weight} (wyłączone)
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/50">
        <p>
          <span className="font-semibold text-white/70">Jak działa ranking:</span> każda spółka dostaje trend Ichimoku
          dla każdego interwału (D1, H4, W1, H1). Każdy trend liczy się jako <span className="text-rise">Byk = +1</span>,{" "}
          <span className="text-white/70">Neutralny = 0</span>, <span className="text-fall">Niedźwiedź = −1</span>,
          mnożone przez wagę danego interwału, a wyniki są sumowane w{" "}
          <span className="font-semibold text-white/70">Wynik</span>.
        </p>
        <p>
          Wynik = D1×{weights.day} + H4×{weights.h4} + W1×{weights.week} + H1×{weights.h1}
          {activeRulePeriods(rules).map((key) => (
            <span key={key}>
              {" "}
              + {rules[key].weight} jeśli zmiana {key === "1w" ? "tygodniowa" : key === "1m" ? "miesięczna" : "roczna"}{" "}
              ≥ {rules[key].min}%
            </span>
          ))}
          . Spółki są sortowane od najwyższego wyniku (remisy alfabetycznie), więc wyższa waga sprawia, że dany
          czynnik liczy się bardziej. Waga 0 pomija go całkowicie.
        </p>
        <p>
          Bonus za zmianę ceny: spółka dostaje punkty tylko jeśli jej zmiana w danym okresie jest co najmniej równa
          minimum (użyj ujemnego minimum, żeby nagradzać też małe spadki). Spółki bez wystarczającej historii dla
          danego okresu nie dostają bonusu. Włączone okresy są pobierane z Yahoo przy pierwszym użyciu (z tym samym
          ograniczeniem co skan), więc aktualizacja rankingu może chwilę potrwać. Poza tym zmiany działają
          natychmiast - bez potrzeby nowego skanu.
        </p>
      </div>
    </section>
  );
}
