import type { Translate } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import type { RankingEntry, WavePhase, WaveReading } from "@/types/market";

/**
 * Kolumna "Fala": fala Hosody na wykresie D1 (backend/app/services/indicators/wave_phase.py) + faza przemiany trendu
 * (M. Sobótka, zeszyt 3). Procent = ile z 5 czułości zygzaka (2-5 x ATR) widzi tę samą falę, czyli jak jednoznaczny jest
 * wykres - NIE szansa, że fala się dopełni. Backtest (backtests/t_wave*.py, out_wave_eval.txt) nie znalazł kształtu ani
 * fazy, które zmieniają szanse na kolejne 26 sesji; statystyki niżej są informacyjne.
 */

type Tri = [string, string, string];

const WAVE_NAMES: Record<WaveReading["wave"], Tri> = {
  N: ["fala N (trend)", "N wave (trend)", "N-Welle (Trend)"],
  V: ["fala V (odwrócenie)", "V wave (reversal)", "V-Welle (Umkehr)"],
  I: ["fala I (impuls)", "I wave (impulse)", "I-Welle (Impuls)"],
  P: ["fala P (konsolidacja)", "P wave (consolidation)", "P-Welle (Konsolidierung)"],
  Y: ["fala Y (rozszerzanie)", "Y wave (expanding)", "Y-Welle (Ausweitung)"],
};

const STAGES: Record<string, { up: Tri; down: Tri }> = {
  n_impulse: {
    up: [
      "Trzecia noga fali N (C→D): cena wyszła ponad poprzedni szczyt B - trend wzrostowy trwa.",
      "Third leg of the N wave (C→D): price is above the previous high B - the uptrend is running.",
      "Dritter Schenkel der N-Welle (C→D): Kurs über dem vorherigen Hoch B - der Aufwärtstrend läuft.",
    ],
    down: [
      "Trzecia noga fali N (C→D): cena zeszła poniżej poprzedniego dołka B - trend spadkowy trwa.",
      "Third leg of the N wave (C→D): price is below the previous low B - the downtrend is running.",
      "Dritter Schenkel der N-Welle (C→D): Kurs unter dem vorherigen Tief B - der Abwärtstrend läuft.",
    ],
  },
  n_leg3: {
    up: [
      "Odbicie od wyższego dołka C - cena jeszcze wyraźnie nie przebiła szczytu B (może go właśnie testować).",
      "Rebound from the higher low C - price has not yet clearly broken above high B (it may be testing it).",
      "Erholung vom höheren Tief C - der Kurs hat das Hoch B noch nicht klar überwunden (testet es eventuell).",
    ],
    down: [
      "Spadek od niższego szczytu C - cena jeszcze wyraźnie nie przebiła dołka B (może go właśnie testować).",
      "Decline from the lower high C - price has not yet clearly broken below low B (it may be testing it).",
      "Rückgang vom tieferen Hoch C - der Kurs hat das Tief B noch nicht klar unterschritten (testet es eventuell).",
    ],
  },
  n_correction: {
    up: [
      "Korekta (B→C) w trendzie wzrostowym - cena się cofa, ale trzyma się nad ostatnim wyższym dołkiem.",
      "Correction (B→C) in an uptrend - price is pulling back but holds above the last higher low.",
      "Korrektur (B→C) im Aufwärtstrend - der Kurs gibt nach, hält sich aber über dem letzten höheren Tief.",
    ],
    down: [
      "Odbicie (B→C) w trendzie spadkowym - cena rośnie, ale jest pod ostatnim niższym szczytem.",
      "Rebound (B→C) in a downtrend - price is rising but stays below the last lower high.",
      "Erholung (B→C) im Abwärtstrend - der Kurs steigt, bleibt aber unter dem letzten tieferen Hoch.",
    ],
  },
  v_reversal: {
    up: [
      "Odwrócenie: po niższym dołku cena przebiła szczyt, od którego zaczął się spadek.",
      "Reversal: after a lower low, price broke above the high where the decline began.",
      "Umkehr: nach einem tieferen Tief hat der Kurs das Hoch überwunden, an dem der Rückgang begann.",
    ],
    down: [
      "Odwrócenie: po wyższym szczycie cena zeszła poniżej dołka, od którego zaczął się wzrost.",
      "Reversal: after a higher high, price broke below the low where the rise began.",
      "Umkehr: nach einem höheren Hoch hat der Kurs das Tief unterschritten, an dem der Anstieg begann.",
    ],
  },
  v_retest: {
    up: [
      "Cofnięcie po odwróceniu w górę - test, czy nowy kierunek się utrzyma.",
      "Pullback after the upward reversal - testing whether the new direction holds.",
      "Rücksetzer nach der Aufwärtsumkehr - Test, ob die neue Richtung hält.",
    ],
    down: [
      "Odbicie po odwróceniu w dół - test, czy nowy kierunek się utrzyma.",
      "Rebound after the downward reversal - testing whether the new direction holds.",
      "Erholung nach der Abwärtsumkehr - Test, ob die neue Richtung hält.",
    ],
  },
  i_breakout: {
    up: [
      "Wybicie w górę z płaskiego zakresu - pierwszy impuls; fala N powstanie, jeśli po korekcie cena pójdzie wyżej.",
      "Breakout above a flat range - the first impulse; an N wave forms if price goes higher after a correction.",
      "Ausbruch über eine flache Spanne - der erste Impuls; eine N-Welle entsteht, wenn der Kurs nach einer Korrektur weiter steigt.",
    ],
    down: [
      "Wybicie w dół z płaskiego zakresu - pierwszy impuls spadkowy.",
      "Breakdown below a flat range - the first downward impulse.",
      "Ausbruch unter eine flache Spanne - der erste Abwärtsimpuls.",
    ],
  },
  i_pullback: {
    up: [
      "Cofnięcie po wybiciu w górę - cena wciąż nad dawnym zakresem.",
      "Pullback after the breakout - price is still above the old range.",
      "Rücksetzer nach dem Ausbruch - der Kurs liegt noch über der alten Spanne.",
    ],
    down: [
      "Odbicie po wybiciu w dół - cena wciąż pod dawnym zakresem.",
      "Rebound after the breakdown - price is still below the old range.",
      "Erholung nach dem Ausbruch nach unten - der Kurs liegt noch unter der alten Spanne.",
    ],
  },
};

const P_STAGES: Record<string, Tri> = {
  p_range: [
    "Konsolidacja: cena chodzi w poziomym zakresie, bez nowych szczytów i dołków - sygnały trendu są tu mało warte.",
    "Consolidation: price moves in a sideways range with no new highs or lows - trend signals mean little here.",
    "Konsolidierung: der Kurs bewegt sich seitwärts ohne neue Hochs oder Tiefs - Trendsignale sind hier wenig wert.",
  ],
  p_contracting: [
    "Trójkąt zbieżny: niższe szczyty i wyższe dołki - rynek czeka na wybicie.",
    "Contracting triangle: lower highs and higher lows - the market is waiting for a breakout.",
    "Symmetrisches Dreieck: tiefere Hochs und höhere Tiefs - der Markt wartet auf einen Ausbruch.",
  ],
  p_ascending: [
    "Konsolidacja z rosnącymi dołkami (przewaga kupujących), szczyty płaskie.",
    "Consolidation with rising lows (buyers in control) and flat highs.",
    "Konsolidierung mit steigenden Tiefs (Käufer im Vorteil) und flachen Hochs.",
  ],
  p_descending: [
    "Konsolidacja z opadającymi szczytami (przewaga sprzedających), dołki płaskie.",
    "Consolidation with falling highs (sellers in control) and flat lows.",
    "Konsolidierung mit fallenden Hochs (Verkäufer im Vorteil) und flachen Tiefs.",
  ],
  y_expanding: [
    "Rozszerzanie: kolejne wyższe szczyty i niższe dołki - rośnie zmienność, brak kierunku.",
    "Expanding: successive higher highs and lower lows - volatility grows, no direction.",
    "Ausweitung: aufeinanderfolgende höhere Hochs und tiefere Tiefs - die Volatilität steigt, keine Richtung.",
  ],
};

export const PHASE_NAMES: Record<WavePhase, Tri> = {
  stable_up: ["stabilny wzrost", "stable uptrend", "stabiler Aufwärtstrend"],
  end_up: ["koniec rynku wzrostów", "end of the uptrend", "Ende des Aufwärtstrends"],
  entry_down: ["wejście w rynek spadkowy", "entering a downtrend", "Eintritt in den Abwärtstrend"],
  stable_down: ["stabilny spadek", "stable downtrend", "stabiler Abwärtstrend"],
  end_down: ["koniec rynku spadków", "end of the downtrend", "Ende des Abwärtstrends"],
  entry_up: ["wejście w rynek wzrostowy", "entering an uptrend", "Eintritt in den Aufwärtstrend"],
};

/** Co działo się przez kolejne 26 sesji (S&P 500, 2008-2026, backtests/out_wave_eval.txt): % przypadków, gdy cena zamknęła się za poziomem unieważnienia. */
const INVALIDATED_PCT: Record<string, number> = { N_up: 15, N_down: 27, I_up: 28, I_down: 43, V_up: 5, V_down: 9 };
/** Jak wyżej: % przypadków, gdy cena po 26 sesjach była nadal w zakresie konsolidacji P. */
const P_STILL_IN_RANGE_PCT = 67;

const ARROWS = { up: "↑", down: "↓" } as const;

/** Krótki znacznik do tabeli: "N↑", "P", "Y". */
export function waveTag(w: WaveReading): string {
  return w.wave === "P" || w.wave === "Y" || !w.direction ? w.wave : `${w.wave}${ARROWS[w.direction]}`;
}

function altTag(key: string): string {
  const [wave, dir] = key.split("_");
  return dir ? `${wave}${ARROWS[dir as "up" | "down"]}` : wave;
}

/** Krótki opis etapu pod znacznikiem w tabeli. */
export function waveStageShort(w: WaveReading, t: Translate): string {
  const map: Record<string, Tri> = {
    n_impulse: ["trend trwa", "trend running", "Trend läuft"],
    n_leg3: ["przy szczycie B / przed wybiciem", "at B / before the break", "an B / vor dem Bruch"],
    n_correction: ["korekta", "correction", "Korrektur"],
    v_reversal: ["odwrócenie", "reversal", "Umkehr"],
    v_retest: ["test po odwróceniu", "retest", "Retest"],
    i_breakout: ["wybicie", "breakout", "Ausbruch"],
    i_pullback: ["cofnięcie po wybiciu", "pullback", "Rücksetzer"],
    p_range: ["zakres", "range", "Spanne"],
    p_contracting: ["trójkąt", "triangle", "Dreieck"],
    p_ascending: ["dołki rosną", "rising lows", "steigende Tiefs"],
    p_descending: ["szczyty opadają", "falling highs", "fallende Hochs"],
    y_expanding: ["rozszerzanie", "expanding", "Ausweitung"],
  };
  return map[w.stage] ? t(...map[w.stage]) : w.stage;
}

export function waveStyle(w: WaveReading): string {
  if (w.wave === "P") return "bg-amber-400/15 text-amber-300";
  if (w.wave === "Y" || !w.direction) return "bg-white/10 text-white/60";
  return w.direction === "up" ? "bg-rise/15 text-rise" : "bg-fall/15 text-fall";
}

/** Opis etapu fali (np. "Korekta (B→C) w trendzie wzrostowym ..."). */
export function describeStage(stage: string, direction: "up" | "down" | null | undefined, t: Translate): string | null {
  const entry = STAGES[stage];
  if (entry && direction) return t(...entry[direction]);
  return P_STAGES[stage] ? t(...P_STAGES[stage]) : null;
}

export function waveName(wave: WaveReading["wave"], t: Translate): string {
  return t(...WAVE_NAMES[wave]);
}

/** Pełny opis do podpowiedzi (title). */
export function describeWave(w: WaveReading, t: Translate): string {
  const votes = Math.round(w.probability * 5);
  const lines: string[] = [
    `${waveTag(w)} - ${t(...WAVE_NAMES[w.wave])}. ${t(
      `Pewność odczytu ${Math.round(w.probability * 100)}% (${votes} z 5 czułości zygzaka widzi tę falę).`,
      `Reading confidence ${Math.round(w.probability * 100)}% (${votes} of 5 zigzag sensitivities see this wave).`,
      `Sicherheit der Lesart ${Math.round(w.probability * 100)} % (${votes} von 5 Zickzack-Empfindlichkeiten sehen diese Welle).`,
    )}`,
  ];
  const stage = describeStage(w.stage, w.direction, t);
  if (stage) lines.push(stage);
  if (w.phase) {
    const since = w.phase_bars != null ? t(` (od ${w.phase_bars} sesji)`, ` (for ${w.phase_bars} sessions)`, ` (seit ${w.phase_bars} Sitzungen)`) : "";
    lines.push(`${t("Faza (Sobótka)", "Phase (Sobótka)", "Phase (Sobótka)")}: ${t(...PHASE_NAMES[w.phase])}${since}.`);
  }
  if (w.box_high != null && w.box_low != null && (w.wave === "P" || w.wave === "Y" || w.wave === "I")) {
    lines.push(`${t("Zakres", "Range", "Spanne")}: ${formatNumber(w.box_low)} - ${formatNumber(w.box_high)}.`);
  }
  if (w.target != null) lines.push(`${t("Cel fali N (C + (B - A))", "N wave target (C + (B - A))", "N-Wellen-Ziel (C + (B - A))")}: ${formatNumber(w.target)}.`);
  if (w.invalidation != null && w.direction) {
    lines.push(
      w.direction === "up"
        ? t(
            `Odczyt przestaje obowiązywać po zamknięciu poniżej ${formatNumber(w.invalidation)}.`,
            `The reading no longer holds after a close below ${formatNumber(w.invalidation)}.`,
            `Die Lesart gilt nicht mehr nach einem Schlusskurs unter ${formatNumber(w.invalidation)}.`,
          )
        : t(
            `Odczyt przestaje obowiązywać po zamknięciu powyżej ${formatNumber(w.invalidation)}.`,
            `The reading no longer holds after a close above ${formatNumber(w.invalidation)}.`,
            `Die Lesart gilt nicht mehr nach einem Schlusskurs über ${formatNumber(w.invalidation)}.`,
          ),
    );
  }
  const others = Object.entries(w.alternatives ?? {}).filter(([k]) => altTag(k) !== waveTag(w));
  if (others.length) {
    lines.push(`${t("Inne odczyty", "Other readings", "Andere Lesarten")}: ${others.map(([k, v]) => `${altTag(k)} ${Math.round(v * 100)}%`).join(", ")}.`);
  }
  const key = w.direction ? `${w.wave}_${w.direction}` : w.wave;
  if (w.wave === "P") {
    lines.push(
      t(
        `Historycznie (S&P 500, 2008-2026) po 26 sesjach cena była nadal w zakresie w ${P_STILL_IN_RANGE_PCT}% przypadków.`,
        `Historically (S&P 500, 2008-2026) price was still inside the range after 26 sessions in ${P_STILL_IN_RANGE_PCT}% of cases.`,
        `Historisch (S&P 500, 2008-2026) lag der Kurs nach 26 Sitzungen in ${P_STILL_IN_RANGE_PCT} % der Fälle noch in der Spanne.`,
      ),
    );
  } else if (INVALIDATED_PCT[key] != null) {
    lines.push(
      t(
        `Historycznie (S&P 500, 2008-2026) w ciągu 26 sesji cena przekroczyła poziom unieważnienia w ${INVALIDATED_PCT[key]}% przypadków.`,
        `Historically (S&P 500, 2008-2026) price crossed the invalidation level within 26 sessions in ${INVALIDATED_PCT[key]}% of cases.`,
        `Historisch (S&P 500, 2008-2026) überschritt der Kurs die Invalidierungsmarke innerhalb von 26 Sitzungen in ${INVALIDATED_PCT[key]} % der Fälle.`,
      ),
    );
  }
  lines.push(
    t(
      "To opis obecnego wykresu, nie prognoza.",
      "This describes the current chart, it is not a forecast.",
      "Das beschreibt den aktuellen Chart, keine Prognose.",
    ),
  );
  return lines.join("\n");
}

/** Kolejność sortowania: trendy wzrostowe na górze, konsolidacje w środku, spadkowe na dole; w grupie wg pewności. */
const WAVE_ORDER: Record<string, number> = { N_up: 7, I_up: 6, V_up: 5, P: 4, Y: 3, V_down: 2, I_down: 1, N_down: 0 };

export function waveRank(entry: RankingEntry): number | undefined {
  const w = entry.wave;
  if (!w) return undefined;
  const key = w.wave === "P" || w.wave === "Y" ? w.wave : `${w.wave}_${w.direction}`;
  return (WAVE_ORDER[key] ?? 3) + w.probability * 0.99;
}

export const WAVE_COLUMN_TITLE: Tri = [
  "Fala Hosody na D1 (N - trend, V - odwrócenie, I - impuls z zakresu, P - konsolidacja, Y - rozszerzanie) z fazą przemiany trendu (Sobótka). Procent = ile z 5 czułości zygzaka widzi tę falę (jednoznaczność wykresu), nie szansa na ruch. P przy 'Byk' w D1 oznacza, że mimo bycznych sygnałów spółka chodzi w bok. Najedź na znaczek po szczegóły; kliknij nagłówek, żeby sortować.",
  "Hosoda wave on D1 (N - trend, V - reversal, I - impulse out of a range, P - consolidation, Y - expanding) with the trend-change phase (Sobótka). Percent = how many of 5 zigzag sensitivities see this wave (how clear the chart is), not the odds of a move. P next to 'Bull' in D1 means the stock moves sideways despite bullish signals. Hover over the badge for details; click the header to sort.",
  "Hosoda-Welle auf D1 (N - Trend, V - Umkehr, I - Impuls aus einer Spanne, P - Konsolidierung, Y - Ausweitung) mit der Trendwechsel-Phase (Sobótka). Prozent = wie viele der 5 Zickzack-Empfindlichkeiten diese Welle sehen (Eindeutigkeit des Charts), keine Bewegungswahrscheinlichkeit. P neben 'Bulle' in D1 bedeutet, dass die Aktie trotz bullischer Signale seitwärts läuft. Für Details über das Abzeichen fahren; Kopfzeile klicken zum Sortieren.",
];
