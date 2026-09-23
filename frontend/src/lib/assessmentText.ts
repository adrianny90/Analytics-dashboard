import type { Lang } from "@/lib/i18n";

// The backend builds the trend-assessment sentences in English (see
// backend/app/services/indicators/assessment.py). They come from a fixed set
// of templates, so they are translated here on the client - English is passed
// through untouched, and anything unrecognised falls back to the original.

type Tr = { pl: string; de: string };

const EXACT: Record<string, Tr> = {
  "Price vs cloud": { pl: "Cena a chmura", de: "Kurs vs. Wolke" },
  "Price is above the cloud": { pl: "Cena jest nad chmurą", de: "Der Kurs liegt über der Wolke" },
  "Price is below the cloud": { pl: "Cena jest pod chmurą", de: "Der Kurs liegt unter der Wolke" },
  "Price is inside the cloud (range/transition)": {
    pl: "Cena jest wewnątrz chmury (konsolidacja/przejście)",
    de: "Der Kurs liegt innerhalb der Wolke (Seitwärtsphase/Übergang)",
  },
  "Not enough history to compute the cloud yet": {
    pl: "Za mało historii, żeby policzyć chmurę",
    de: "Noch nicht genug Historie, um die Wolke zu berechnen",
  },
  "Tenkan vs Kijun": { pl: "Tenkan a Kijun", de: "Tenkan vs. Kijun" },
  "Tenkan-sen is above Kijun-sen": { pl: "Tenkan-sen jest nad Kijun-sen", de: "Die Tenkan-sen liegt über der Kijun-sen" },
  "Tenkan-sen is below Kijun-sen": { pl: "Tenkan-sen jest pod Kijun-sen", de: "Die Tenkan-sen liegt unter der Kijun-sen" },
  "Tenkan-sen and Kijun-sen are level": {
    pl: "Tenkan-sen i Kijun-sen są na tym samym poziomie",
    de: "Tenkan-sen und Kijun-sen liegen auf gleicher Höhe",
  },
  "Not enough history yet": { pl: "Za mało historii", de: "Noch nicht genug Historie" },
  "Chikou span": { pl: "Chikou Span", de: "Chikou Span" },
  "Current close is above the close from 26 periods ago": {
    pl: "Obecne zamknięcie jest powyżej zamknięcia sprzed 26 okresów",
    de: "Der aktuelle Schlusskurs liegt über dem Schlusskurs von vor 26 Perioden",
  },
  "Current close is below the close from 26 periods ago": {
    pl: "Obecne zamknięcie jest poniżej zamknięcia sprzed 26 okresów",
    de: "Der aktuelle Schlusskurs liegt unter dem Schlusskurs von vor 26 Perioden",
  },
  "Unchanged versus 26 periods ago": { pl: "Bez zmian względem 26 okresów temu", de: "Unverändert gegenüber vor 26 Perioden" },
  Momentum: { pl: "Momentum", de: "Momentum" },
  "Cloud is twisting - no clear color majority ahead": {
    pl: "Chmura się skręca - brak wyraźnej przewagi jednego koloru w przyszłości",
    de: "Die Wolke dreht sich – keine klare Farbmehrheit in der Zukunft",
  },
};

type Pattern = { re: RegExp; pl: (m: RegExpMatchArray) => string; de: (m: RegExpMatchArray) => string };

const PATTERNS: Pattern[] = [
  {
    re: /^(\d+)-candle momentum$/,
    pl: (m) => `Momentum z ${m[1]} świec`,
    de: (m) => `${m[1]}-Kerzen-Momentum`,
  },
  {
    re: /^Cloud over next (\d+) candles$/,
    pl: (m) => `Chmura w kolejnych ${m[1]} świecach`,
    de: (m) => `Wolke über die nächsten ${m[1]} Kerzen`,
  },
  {
    re: /^Up ([\d.,]+)% over the window$/,
    pl: (m) => `Wzrost o ${m[1]}% w badanym oknie`,
    de: (m) => `Plus von ${m[1]} % im betrachteten Fenster`,
  },
  {
    re: /^Down ([\d.,]+)% over the window$/,
    pl: (m) => `Spadek o ${m[1]}% w badanym oknie`,
    de: (m) => `Minus von ${m[1]} % im betrachteten Fenster`,
  },
  {
    re: /^Roughly flat \(([+-]?[\d.,]+)%\) over the window$/,
    pl: (m) => `Mniej więcej bez zmian (${m[1]}%) w badanym oknie`,
    de: (m) => `Ungefähr unverändert (${m[1]} %) im betrachteten Fenster`,
  },
  {
    re: /^Green \(bullish\) for (\d+)\/(\d+) projected candles$/,
    pl: (m) => `Zielona (bycza) w ${m[1]}/${m[2]} przyszłych świec`,
    de: (m) => `Grün (bullisch) bei ${m[1]}/${m[2]} projizierten Kerzen`,
  },
  {
    re: /^Red \(bearish\) for (\d+)\/(\d+) projected candles$/,
    pl: (m) => `Czerwona (niedźwiedzia) w ${m[1]}/${m[2]} przyszłych świec`,
    de: (m) => `Rot (bärisch) bei ${m[1]}/${m[2]} projizierten Kerzen`,
  },
  {
    re: /^(Bullish|Bearish|Neutral) bias: ([+-]?\d+) of (\d+) Ichimoku signals point (up|down|in mixed directions) over the last (\d+) candles, with the already-projected cloud (reinforcing|not clearly confirming) that view for the next (\d+) candles\.$/,
    pl: (m) => {
      const bias = { Bullish: "Przewaga byków", Bearish: "Przewaga niedźwiedzi", Neutral: "Układ neutralny" }[m[1]];
      const dir = { up: "w górę", down: "w dół", "in mixed directions": "w różnych kierunkach" }[m[4]];
      const cloud = { reinforcing: "potwierdza", "not clearly confirming": "nie potwierdza wyraźnie" }[m[6]];
      return `${bias}: ${m[2]} z ${m[3]} sygnałów Ichimoku wskazuje ${dir} w ostatnich ${m[5]} świecach, a już wyliczona chmura ${cloud} ten obraz w kolejnych ${m[7]} świecach.`;
    },
    de: (m) => {
      const bias = { Bullish: "Bullische Tendenz", Bearish: "Bärische Tendenz", Neutral: "Neutrale Tendenz" }[m[1]];
      const dir = { up: "nach oben", down: "nach unten", "in mixed directions": "in unterschiedliche Richtungen" }[m[4]];
      const cloud = { reinforcing: "bestätigt", "not clearly confirming": "bestätigt nicht eindeutig" }[m[6]];
      return `${bias}: ${m[2]} von ${m[3]} Ichimoku-Signalen deuten in den letzten ${m[5]} Kerzen ${dir}, und die bereits berechnete Wolke ${cloud} dieses Bild für die nächsten ${m[7]} Kerzen.`;
    },
  },
];

export function translateAssessment(text: string, lang: Lang): string {
  if (lang === "en") return text;
  const exact = EXACT[text];
  if (exact) return exact[lang];
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.re);
    if (match) return pattern[lang](match);
  }
  return text;
}
