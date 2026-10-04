import { getLocale, type Translate } from "@/lib/i18n";
import type { ExitReason, ForexStrategy, ForexStrategyParams, ForexTrade, StopReason } from "@/types/forex";

const CURRENCIES: Record<string, [string, string, string]> = {
  usd: ["dolar amerykański", "US dollar", "US-Dollar"],
  eur: ["euro", "euro", "Euro"],
  jpy: ["jen japoński", "Japanese yen", "Japanischer Yen"],
  gbp: ["funt brytyjski", "British pound", "Britisches Pfund"],
  chf: ["frank szwajcarski", "Swiss franc", "Schweizer Franken"],
  aud: ["dolar australijski", "Australian dollar", "Australischer Dollar"],
  nzd: ["dolar nowozelandzki", "New Zealand dollar", "Neuseeland-Dollar"],
  cad: ["dolar kanadyjski", "Canadian dollar", "Kanadischer Dollar"],
  nok: ["korona norweska", "Norwegian krone", "Norwegische Krone"],
  sek: ["korona szwedzka", "Swedish krona", "Schwedische Krone"],
  pln: ["złoty", "Polish zloty", "Polnischer Zloty"],
  xau: ["złoto (uncja)", "gold (ounce)", "Gold (Unze)"],
  xag: ["srebro (uncja)", "silver (ounce)", "Silber (Unze)"],
};

export function pairLabel(pair: string): string {
  return `${pair.slice(0, 3).toUpperCase()}/${pair.slice(3).toUpperCase()}`;
}

export function pairDigits(pair: string): number {
  if (pair === "xauusd") return 2;
  return pair.endsWith("jpy") ? 3 : 5;
}

/** "GBP/JPY - funt brytyjski / jen japoński" plus what a long or short means. */
export function pairDescription(t: Translate, pair: string, dir: number): { name: string; meaning: string } {
  const base = pair.slice(0, 3);
  const quote = pair.slice(3);
  const bn = CURRENCIES[base] ? t(...CURRENCIES[base]) : base.toUpperCase();
  const qn = CURRENCIES[quote] ? t(...CURRENCIES[quote]) : quote.toUpperCase();
  const B = base.toUpperCase();
  const Q = quote.toUpperCase();
  const meaning =
    dir > 0
      ? t(
          `Long: kupujemy ${B} (${bn}) za ${Q} (${qn}) - zarabiamy, gdy ${B} drożeje względem ${Q}.`,
          `Long: buying ${B} (${bn}) against ${Q} (${qn}) - profits when ${B} rises against ${Q}.`,
          `Long: Kauf von ${B} (${bn}) gegen ${Q} (${qn}) - Gewinn, wenn ${B} gegenüber ${Q} steigt.`,
        )
      : t(
          `Short: sprzedajemy ${B} (${bn}) za ${Q} (${qn}) - zarabiamy, gdy ${B} tanieje względem ${Q}.`,
          `Short: selling ${B} (${bn}) against ${Q} (${qn}) - profits when ${B} falls against ${Q}.`,
          `Short: Verkauf von ${B} (${bn}) gegen ${Q} (${qn}) - Gewinn, wenn ${B} gegenüber ${Q} fällt.`,
        );
  return { name: `${pairLabel(pair)} - ${bn} / ${qn}`, meaning };
}

export function fmtPx(v: number | null | undefined, digits: number): string {
  if (v == null || !Number.isFinite(v)) return "-";
  return v.toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtUsd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "-";
  return `${v < 0 ? "-" : ""}${Math.abs(v).toLocaleString(getLocale(), { maximumFractionDigits: 0 })} USD`;
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "-";
  return `${v > 0 ? "+" : ""}${v.toLocaleString(getLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString(getLocale(), { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function strategyName(t: Translate, s: ForexStrategy): string {
  switch (s.id) {
    case "rekord-2020":
      return t("Rekord 2020-2026 (Ichimoku D1 + Kijun 52 W1, ryzyko 4%)", "Record 2020-2026 (Ichimoku D1 + W1 Kijun 52, 4% risk)", "Rekord 2020-2026 (Ichimoku D1 + Kijun 52 W1, 4% Risiko)");
    case "rekord-2013":
      return t("Te same reguły od 2013 (bankructwo w 2018)", "Same rules from 2013 (wiped out in 2018)", "Gleiche Regeln ab 2013 (Totalverlust 2018)");
    case "zrownowazona-2013":
      return t("Zrównoważona 2013-2026 (przebicie Kijun 52 + chmura W1, ryzyko 2%)", "Balanced 2013-2026 (Kijun 52 cross + W1 cloud, 2% risk)", "Ausgewogen 2013-2026 (Kijun-52-Durchbruch + W1-Wolke, 2% Risiko)");
    default:
      return s.id;
  }
}

function wfText(t: Translate, wf: ForexStrategyParams["wf"]): string {
  switch (wf) {
    case "k52":
      return t("tygodniowe zamknięcie (W1) nad Kijun 52 z W1", "weekly (W1) close above the W1 Kijun 52", "Wochenschluss (W1) über dem W1-Kijun-52");
    case "cloud":
      return t("tygodniowe zamknięcie (W1) nad chmurą Ichimoku z W1", "weekly (W1) close above the W1 Ichimoku cloud", "Wochenschluss (W1) über der W1-Ichimoku-Wolke");
    case "kj":
      return t("tygodniowe zamknięcie (W1) nad Kijun 26 z W1", "weekly (W1) close above the W1 Kijun 26", "Wochenschluss (W1) über dem W1-Kijun-26");
    default:
      return t("brak filtra tygodniowego", "no weekly filter", "kein Wochenfilter");
  }
}

/** Rules of a strategy as a short numbered list. */
export function strategyRules(t: Translate, p: ForexStrategyParams): string[] {
  const entry =
    p.entry === "ichi"
      ? t(
          "Wejście D1: pierwszy dzień, w którym jednocześnie cena zamyka się nad chmurą, Tenkan > Kijun i Chikou nad ceną (zamknięcie wyżej niż 26 sesji temu). Kupno na otwarciu następnego dnia.",
          "D1 entry: the first day on which the close is above the cloud, Tenkan > Kijun and Chikou is above price (close higher than 26 sessions ago). Buy at the next day's open.",
          "D1-Einstieg: erster Tag, an dem der Schluss über der Wolke liegt, Tenkan > Kijun und Chikou über dem Kurs (Schluss höher als vor 26 Sitzungen). Kauf zur Eröffnung des Folgetags.",
        )
      : p.entry === "k52"
        ? t(
            "Wejście D1: zamknięcie przebija Kijun 52 z D1 od dołu (wczoraj pod, dziś nad). Kupno na otwarciu następnego dnia.",
            "D1 entry: the close crosses above the D1 Kijun 52 (below yesterday, above today). Buy at the next day's open.",
            "D1-Einstieg: der Schluss kreuzt den D1-Kijun-52 von unten (gestern darunter, heute darüber). Kauf zur Eröffnung des Folgetags.",
          )
        : t("Wejście D1: wybicie maksimum 20 dni.", "D1 entry: 20-day high breakout.", "D1-Einstieg: Ausbruch über das 20-Tage-Hoch.");
  return [
    t(`Filtr trendu: ${wfText(t, p.wf)}. Tylko long.`, `Trend filter: ${wfText(t, p.wf)}. Long only.`, `Trendfilter: ${wfText(t, p.wf)}. Nur Long.`),
    entry,
    t(
      `Wielkość: stop ${p.stop_k}×ATR(20) pod wejściem, pozycja tak duża, by stop kosztował ${p.risk * 100}% kapitału.`,
      `Size: stop ${p.stop_k}×ATR(20) below the entry, position sized so the stop costs ${p.risk * 100}% of equity.`,
      `Größe: Stop ${p.stop_k}×ATR(20) unter dem Einstieg, Position so groß, dass der Stop ${p.risk * 100}% des Kapitals kostet.`,
    ),
    t(
      `Dokładki: co +${p.step} ATR od ostatniego wejścia kolejna część (${p.risk * 100}% ryzyka), maks. ${p.max_units} części; stop całości przesuwa się na ostatnią dokładkę − ${p.stop_k}×ATR.`,
      `Pyramiding: another unit (${p.risk * 100}% risk) every +${p.step} ATR from the last entry, up to ${p.max_units} units; the whole position's stop moves to the last add − ${p.stop_k}×ATR.`,
      `Aufstocken: alle +${p.step} ATR ab dem letzten Einstieg eine weitere Einheit (${p.risk * 100}% Risiko), max. ${p.max_units} Einheiten; der Stop der Gesamtposition rückt auf letzte Aufstockung − ${p.stop_k}×ATR.`,
    ),
    p.trail
      ? t(
          "Stop dodatkowo podciągany pod Kijun 26 z D1 (tylko w górę i tylko gdy Kijun jest pod ceną).",
          "The stop is also trailed under the D1 Kijun 26 (only upwards and only while the Kijun is below price).",
          "Der Stop wird zusätzlich unter den D1-Kijun-26 nachgezogen (nur nach oben und nur, solange der Kijun unter dem Kurs liegt).",
        )
      : t("Stop nie jest podciągany między dokładkami.", "The stop is not trailed between adds.", "Der Stop wird zwischen den Aufstockungen nicht nachgezogen."),
    t(
      "Wyjście: trafienie stopu w ciągu dnia albo zamknięcie tygodnia poniżej filtra W1 (sprzedaż na otwarciu w poniedziałek). Swapy doliczane, dźwignia portfela maks. x100.",
      "Exit: stop hit intraday or a weekly close below the W1 filter (sold at Monday's open). Swaps included, portfolio leverage capped at x100.",
      "Ausstieg: Stop intraday getroffen oder Wochenschluss unter dem W1-Filter (Verkauf zur Montagseröffnung). Swaps berücksichtigt, Portfoliohebel max. x100.",
    ),
  ];
}

export interface Condition {
  ok: boolean;
  text: string;
}

/** Entry conditions with the actual values on the signal day. */
export function entryConditions(t: Translate, tr: ForexTrade, p: ForexStrategyParams, digits: number): Condition[] {
  const s = tr.entry_snapshot;
  if (!s) return [];
  const f = (v: number | null) => fmtPx(v, digits);
  const gt = (a: number | null, b: number | null) => a != null && b != null && a > b;
  const out: Condition[] = [];
  if (p.wf === "k52") {
    out.push({
      ok: gt(s.w_close, s.w_k52),
      text: t(
        `W1: zamknięcie tygodnia ${f(s.w_close)} nad Kijun 52 W1 ${f(s.w_k52)}`,
        `W1: weekly close ${f(s.w_close)} above W1 Kijun 52 ${f(s.w_k52)}`,
        `W1: Wochenschluss ${f(s.w_close)} über W1-Kijun-52 ${f(s.w_k52)}`,
      ),
    });
  } else if (p.wf === "cloud") {
    out.push({
      ok: gt(s.w_close, s.w_cloud_top),
      text: t(
        `W1: zamknięcie tygodnia ${f(s.w_close)} nad chmurą W1 (górna krawędź ${f(s.w_cloud_top)})`,
        `W1: weekly close ${f(s.w_close)} above the W1 cloud (top ${f(s.w_cloud_top)})`,
        `W1: Wochenschluss ${f(s.w_close)} über der W1-Wolke (Oberkante ${f(s.w_cloud_top)})`,
      ),
    });
  }
  if (p.entry === "ichi") {
    out.push(
      {
        ok: gt(s.close, s.cloud_top),
        text: t(
          `D1: zamknięcie ${f(s.close)} nad chmurą (górna krawędź ${f(s.cloud_top)})`,
          `D1: close ${f(s.close)} above the cloud (top ${f(s.cloud_top)})`,
          `D1: Schluss ${f(s.close)} über der Wolke (Oberkante ${f(s.cloud_top)})`,
        ),
      },
      {
        ok: gt(s.tenkan, s.kijun),
        text: t(
          `D1: Tenkan ${f(s.tenkan)} nad Kijun ${f(s.kijun)}`,
          `D1: Tenkan ${f(s.tenkan)} above Kijun ${f(s.kijun)}`,
          `D1: Tenkan ${f(s.tenkan)} über Kijun ${f(s.kijun)}`,
        ),
      },
      {
        ok: gt(s.close, s.close_26),
        text: t(
          `D1: Chikou nad ceną - zamknięcie ${f(s.close)} wyżej niż 26 sesji temu (${f(s.close_26)})`,
          `D1: Chikou above price - close ${f(s.close)} higher than 26 sessions ago (${f(s.close_26)})`,
          `D1: Chikou über dem Kurs - Schluss ${f(s.close)} höher als vor 26 Sitzungen (${f(s.close_26)})`,
        ),
      },
    );
  } else if (p.entry === "k52") {
    out.push({
      ok: gt(s.close, s.k52) && !gt(s.prev_close, s.prev_k52),
      text: t(
        `D1: przebicie Kijun 52 - wczoraj ${f(s.prev_close)} ≤ ${f(s.prev_k52)}, dziś ${f(s.close)} > ${f(s.k52)}`,
        `D1: Kijun 52 cross - yesterday ${f(s.prev_close)} ≤ ${f(s.prev_k52)}, today ${f(s.close)} > ${f(s.k52)}`,
        `D1: Kijun-52-Durchbruch - gestern ${f(s.prev_close)} ≤ ${f(s.prev_k52)}, heute ${f(s.close)} > ${f(s.k52)}`,
      ),
    });
  }
  return out;
}

/** Context only (not part of the rules): where price stood against MA100/MA200 and the D1 Kijun 52. */
export function entryContext(t: Translate, tr: ForexTrade, digits: number): string {
  const s = tr.entry_snapshot;
  if (!s || s.close == null) return "";
  const f = (v: number | null) => fmtPx(v, digits);
  const side = (a: number | null) =>
    a == null ? "-" : s.close! > a ? t("nad", "above", "über") : t("pod", "below", "unter");
  return t(
    `Tło (nie jest warunkiem): cena ${side(s.ma100)} MA100 (${f(s.ma100)}), ${side(s.ma200)} MA200 (${f(s.ma200)}), ${side(s.k52)} Kijun 52 D1 (${f(s.k52)}).`,
    `Context (not a rule): price ${side(s.ma100)} MA100 (${f(s.ma100)}), ${side(s.ma200)} MA200 (${f(s.ma200)}), ${side(s.k52)} D1 Kijun 52 (${f(s.k52)}).`,
    `Kontext (keine Regel): Kurs ${side(s.ma100)} MA100 (${f(s.ma100)}), ${side(s.ma200)} MA200 (${f(s.ma200)}), ${side(s.k52)} D1-Kijun-52 (${f(s.k52)}).`,
  );
}

export function stopReasonText(t: Translate, why: StopReason, p: ForexStrategyParams): string {
  switch (why) {
    case "init":
      return t(`stop początkowy: wejście − ${p.stop_k}×ATR`, `initial stop: entry − ${p.stop_k}×ATR`, `Anfangsstop: Einstieg − ${p.stop_k}×ATR`);
    case "add":
      return t(`po dokładce: ostatnie wejście − ${p.stop_k}×ATR`, `after an add: last entry − ${p.stop_k}×ATR`, `nach Aufstockung: letzter Einstieg − ${p.stop_k}×ATR`);
    case "trail":
      return t("podciągnięty pod Kijun 26 D1", "trailed to the D1 Kijun 26", "an den D1-Kijun-26 nachgezogen");
  }
}

export function exitReasonShort(t: Translate, r: ExitReason): string {
  switch (r) {
    case "w1":
      return t("filtr W1", "W1 filter", "W1-Filter");
    case "stop":
      return t("stop", "stop", "Stop");
    case "stop_gap":
      return t("stop (luka)", "stop (gap)", "Stop (Lücke)");
    case "ruin":
      return t("bankructwo", "wipe-out", "Totalverlust");
    case "end":
      return t("koniec testu", "end of test", "Testende");
  }
}

export function exitDescription(t: Translate, tr: ForexTrade, p: ForexStrategyParams, digits: number): string {
  const f = (v: number | null | undefined) => fmtPx(v ?? null, digits);
  const lastStop = tr.stops.length ? tr.stops[tr.stops.length - 1] : null;
  switch (tr.exit_reason) {
    case "w1": {
      const s = tr.exit_snapshot;
      const lvl = p.wf === "cloud" ? s?.w_cloud_top : p.wf === "kj" ? s?.w_kijun : s?.w_k52;
      const name =
        p.wf === "cloud" ? t("chmurą W1", "the W1 cloud", "der W1-Wolke") : p.wf === "kj" ? "Kijun 26 W1" : "Kijun 52 W1";
      return t(
        `Tydzień zakończony ${tr.exit_signal_date ? fmtDate(tr.exit_signal_date) : ""} zamknął się na ${f(s?.w_close)}, poniżej ${name} (${f(lvl)}) - trend tygodniowy przestał obowiązywać. Cała pozycja sprzedana na otwarciu ${fmtDate(tr.exit_date)} po ${f(tr.exit_px)}.`,
        `The week ending ${tr.exit_signal_date ? fmtDate(tr.exit_signal_date) : ""} closed at ${f(s?.w_close)}, below ${name} (${f(lvl)}) - the weekly trend no longer held. The whole position was sold at the ${fmtDate(tr.exit_date)} open at ${f(tr.exit_px)}.`,
        `Die Woche bis ${tr.exit_signal_date ? fmtDate(tr.exit_signal_date) : ""} schloss bei ${f(s?.w_close)}, unter ${name} (${f(lvl)}) - der Wochentrend galt nicht mehr. Die gesamte Position wurde zur Eröffnung am ${fmtDate(tr.exit_date)} zu ${f(tr.exit_px)} verkauft.`,
      );
    }
    case "stop":
      return t(
        `${fmtDate(tr.exit_date)} cena spadła do stopu ${f(lastStop?.[1])} (${lastStop ? stopReasonText(t, lastStop[2], p) : ""}) - cała pozycja zamknięta po ${f(tr.exit_px)}.`,
        `On ${fmtDate(tr.exit_date)} price fell to the stop at ${f(lastStop?.[1])} (${lastStop ? stopReasonText(t, lastStop[2], p) : ""}) - the whole position closed at ${f(tr.exit_px)}.`,
        `Am ${fmtDate(tr.exit_date)} fiel der Kurs auf den Stop bei ${f(lastStop?.[1])} (${lastStop ? stopReasonText(t, lastStop[2], p) : ""}) - die gesamte Position wurde zu ${f(tr.exit_px)} geschlossen.`,
      );
    case "stop_gap":
      return t(
        `${fmtDate(tr.exit_date)} rynek otworzył się poniżej stopu ${f(lastStop?.[1])} (luka) - pozycja zamknięta po cenie otwarcia ${f(tr.exit_px)}, gorzej niż stop.`,
        `On ${fmtDate(tr.exit_date)} the market opened below the stop at ${f(lastStop?.[1])} (gap) - the position closed at the open price ${f(tr.exit_px)}, worse than the stop.`,
        `Am ${fmtDate(tr.exit_date)} eröffnete der Markt unter dem Stop bei ${f(lastStop?.[1])} (Lücke) - Schließung zum Eröffnungskurs ${f(tr.exit_px)}, schlechter als der Stop.`,
      );
    case "ruin":
      return t(
        `${fmtDate(tr.exit_date)} kapitał całego rachunku spadł do zera (inne pozycje i ta jednocześnie) - wszystko zamknięte po ${f(tr.exit_px)}.`,
        `On ${fmtDate(tr.exit_date)} the whole account's equity fell to zero (this and the other positions together) - everything closed at ${f(tr.exit_px)}.`,
        `Am ${fmtDate(tr.exit_date)} fiel das Kapital des gesamten Kontos auf null (diese und die anderen Positionen zusammen) - alles zu ${f(tr.exit_px)} geschlossen.`,
      );
    case "end":
      return t(
        `Pozycja wciąż otwarta na koniec testu (${fmtDate(tr.exit_date)}) - wycena po ${f(tr.exit_px)}.`,
        `The position was still open at the end of the test (${fmtDate(tr.exit_date)}) - valued at ${f(tr.exit_px)}.`,
        `Die Position war am Testende (${fmtDate(tr.exit_date)}) noch offen - bewertet zu ${f(tr.exit_px)}.`,
      );
  }
}

export function addDescription(t: Translate, tr: ForexTrade, i: number, p: ForexStrategyParams, digits: number): string {
  const a = tr.adds[i];
  const f = (v: number | null) => fmtPx(v, digits);
  if (i === 0) {
    return t(
      `Wejście ${fmtDate(a.date)} po ${f(a.px)} (sygnał z zamknięcia ${fmtDate(a.signal_date)}), ATR ${f(a.atr)}, nominał ${fmtUsd(a.nominal)}.`,
      `Entry ${fmtDate(a.date)} at ${f(a.px)} (signal on the ${fmtDate(a.signal_date)} close), ATR ${f(a.atr)}, notional ${fmtUsd(a.nominal)}.`,
      `Einstieg ${fmtDate(a.date)} zu ${f(a.px)} (Signal zum Schluss am ${fmtDate(a.signal_date)}), ATR ${f(a.atr)}, Nominal ${fmtUsd(a.nominal)}.`,
    );
  }
  return t(
    `Dokładka ${i}: ${fmtDate(a.date)} po ${f(a.px)} - zamknięcie ${fmtDate(a.signal_date)} było ≥ ${p.step} ATR nad poprzednim wejściem (${f(a.prev_px)}). Nominał ${fmtUsd(a.nominal)}${a.capped ? t(" (ucięty limitem dźwigni x100)", " (cut by the x100 leverage cap)", " (durch das x100-Hebellimit gekürzt)") : ""}.`,
    `Add ${i}: ${fmtDate(a.date)} at ${f(a.px)} - the ${fmtDate(a.signal_date)} close was ≥ ${p.step} ATR above the previous entry (${f(a.prev_px)}). Notional ${fmtUsd(a.nominal)}${a.capped ? " (cut by the x100 leverage cap)" : ""}.`,
    `Aufstockung ${i}: ${fmtDate(a.date)} zu ${f(a.px)} - der Schluss am ${fmtDate(a.signal_date)} lag ≥ ${p.step} ATR über dem vorherigen Einstieg (${f(a.prev_px)}). Nominal ${fmtUsd(a.nominal)}${a.capped ? " (durch das x100-Hebellimit gekürzt)" : ""}.`,
  );
}
