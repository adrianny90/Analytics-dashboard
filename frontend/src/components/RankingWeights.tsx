import { useLang } from "@/lib/i18n";
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

const RULE_FIELDS: { key: RuleKey; label: [string, string, string]; adj: [string, string, string] }[] = [
  { key: "1w", label: ["Zmiana tygodniowa", "Weekly change", "Wöchentliche Änderung"], adj: ["tygodniowa", "weekly", "wöchentlicher"] },
  { key: "1m", label: ["Zmiana miesięczna", "Monthly change", "Monatliche Änderung"], adj: ["miesięczna", "monthly", "monatlicher"] },
  { key: "1y", label: ["Zmiana roczna", "Annual change", "Jährliche Änderung"], adj: ["roczna", "annual", "jährlicher"] },
];

const OUTLOOK_SIGN: Record<TrendOutlook, number> = { bullish: 1, neutral: 0, bearish: -1 };

const FIELDS: { key: TimeframeKey; label: string; hint: [string, string, string] }[] = [
  { key: "day", label: "D1", hint: ["Trend dzienny", "Daily trend", "Tagestrend"] },
  { key: "h4", label: "H4", hint: ["Trend 4-godzinny", "4-hour trend", "4-Stunden-Trend"] },
  { key: "week", label: "W1", hint: ["Trend tygodniowy", "Weekly trend", "Wochentrend"] },
  { key: "h1", label: "H1", hint: ["Trend 1-godzinny", "1-hour trend", "1-Stunden-Trend"] },
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
  const { t } = useLang();
  const isDefault =
    FIELDS.every(({ key }) => weights[key] === DEFAULT_WEIGHTS[key]) &&
    RULE_FIELDS.every(
      ({ key }) => rules[key].min === DEFAULT_RULES[key].min && rules[key].weight === DEFAULT_RULES[key].weight,
    );

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("Wagi rankingu", "Ranking weights", "Ranking-Gewichtungen")}</h2>
        <button
          onClick={() => {
            onChange(DEFAULT_WEIGHTS);
            onRulesChange(DEFAULT_RULES);
          }}
          disabled={isDefault}
          className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("Przywróć domyślne", "Restore defaults", "Standardwerte wiederherstellen")}
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold text-white/70">{t("Wagi trendu", "Trend weights", "Trendgewichtungen")}</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="flex flex-col gap-1 text-xs text-white/60">
            <span>
              <span className="font-semibold text-white">{label}</span> · {t(...hint)}
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={weights[key]}
              onChange={(e) => onChange({ ...weights, [key]: parseNumber(e.target.value) })}
              className={INPUT_CLASS}
            />
            <span className="text-white/30">
              {t(`domyślnie ${DEFAULT_WEIGHTS[key]}`, `default ${DEFAULT_WEIGHTS[key]}`, `Standard: ${DEFAULT_WEIGHTS[key]}`)}
            </span>
          </label>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-white/70">{t("Bonus za zmianę ceny", "Price change bonus", "Bonus für Kursänderung")}</p>
      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
        {RULE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 text-xs text-white/60">
            <span className="font-semibold text-white">{t(...label)}</span>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1">
                <span>{t("Min. zmiana %", "Min. change %", "Min. Änderung %")}</span>
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
                <span>{t("Punkty", "Points", "Punkte")}</span>
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
              {t(
                `domyślnie min ${DEFAULT_RULES[key].min}%, punkty ${DEFAULT_RULES[key].weight} (wyłączone)`,
                `default min ${DEFAULT_RULES[key].min}%, points ${DEFAULT_RULES[key].weight} (off)`,
                `Standard: Min. ${DEFAULT_RULES[key].min} %, Punkte ${DEFAULT_RULES[key].weight} (aus)`,
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/50">
        <p>
          {t(
            <>
              <span className="font-semibold text-white/70">Jak działa ranking:</span> każda spółka dostaje trend
              Ichimoku dla każdego interwału (D1, H4, W1, H1). Każdy trend liczy się jako{" "}
              <span className="text-rise">Byk = +1</span>, <span className="text-white/70">Neutralny = 0</span>,{" "}
              <span className="text-fall">Niedźwiedź = −1</span>, mnożone przez wagę danego interwału, a wyniki są
              sumowane w <span className="font-semibold text-white/70">Wynik</span>.
            </>,
            <>
              <span className="font-semibold text-white/70">How the ranking works:</span> every stock gets an Ichimoku
              trend for each timeframe (D1, H4, W1, H1). Each trend counts as{" "}
              <span className="text-rise">Bull = +1</span>, <span className="text-white/70">Neutral = 0</span>,{" "}
              <span className="text-fall">Bear = −1</span>, multiplied by that timeframe&apos;s weight, and the results
              are summed into the <span className="font-semibold text-white/70">Score</span>.
            </>,
            <>
              <span className="font-semibold text-white/70">So funktioniert das Ranking:</span> Jede Aktie erhält für
              jeden Zeitrahmen (D1, H4, W1, H1) einen Ichimoku-Trend. Jeder Trend zählt als{" "}
              <span className="text-rise">Bulle = +1</span>, <span className="text-white/70">Neutral = 0</span>,{" "}
              <span className="text-fall">Bär = −1</span>, multipliziert mit der Gewichtung des jeweiligen Zeitrahmens;
              die Ergebnisse werden zum <span className="font-semibold text-white/70">Score</span> summiert.
            </>,
          )}
        </p>
        <p>
          {t("Wynik", "Score", "Score")} = D1×{weights.day} + H4×{weights.h4} + W1×{weights.week} + H1×{weights.h1}
          {activeRulePeriods(rules).map((key) => {
            const adj = RULE_FIELDS.find((f) => f.key === key)!.adj;
            return (
              <span key={key}>
                {" "}
                {t(
                  `+ ${rules[key].weight} jeśli zmiana ${adj[0]} ≥ ${rules[key].min}%`,
                  `+ ${rules[key].weight} if ${adj[1]} change ≥ ${rules[key].min}%`,
                  `+ ${rules[key].weight} bei ${adj[2]} Änderung ≥ ${rules[key].min} %`,
                )}
              </span>
            );
          })}
          {t(
            ". Spółki są sortowane od najwyższego wyniku (remisy alfabetycznie), więc wyższa waga sprawia, że dany czynnik liczy się bardziej. Waga 0 pomija go całkowicie.",
            ". Stocks are sorted from the highest score (ties alphabetically), so a higher weight makes that factor count for more. A weight of 0 skips it entirely.",
            ". Die Aktien werden nach dem höchsten Score sortiert (bei Gleichstand alphabetisch); eine höhere Gewichtung lässt den jeweiligen Faktor also stärker zählen. Eine Gewichtung von 0 lässt ihn komplett weg.",
          )}
        </p>
        <p>
          {t(
            "Bonus za zmianę ceny: spółka dostaje punkty tylko jeśli jej zmiana w danym okresie jest co najmniej równa minimum (użyj ujemnego minimum, żeby nagradzać też małe spadki). Spółki bez wystarczającej historii dla danego okresu nie dostają bonusu. Włączone okresy są pobierane z Yahoo przy pierwszym użyciu (z tym samym ograniczeniem co skan), więc aktualizacja rankingu może chwilę potrwać. Poza tym zmiany działają natychmiast - bez potrzeby nowego skanu.",
            "Price change bonus: a stock earns points only if its change over the given period is at least the minimum (use a negative minimum to also reward small declines). Stocks without enough history for a period get no bonus. Enabled periods are fetched from Yahoo on first use (with the same throttling as the scan), so updating the ranking may take a moment. Otherwise, changes take effect immediately – no new scan is needed.",
            "Bonus für Kursänderung: Eine Aktie erhält nur dann Punkte, wenn ihre Änderung im jeweiligen Zeitraum mindestens dem Minimum entspricht (verwenden Sie ein negatives Minimum, um auch kleine Rückgänge zu belohnen). Aktien ohne ausreichende Historie für einen Zeitraum erhalten keinen Bonus. Aktivierte Zeiträume werden bei der ersten Verwendung von Yahoo geladen (mit derselben Drosselung wie beim Scan), sodass die Aktualisierung des Rankings einen Moment dauern kann. Ansonsten wirken sich Änderungen sofort aus – ein neuer Scan ist nicht nötig.",
          )}
        </p>
      </div>
    </section>
  );
}
