import { fmtDate, fmtPct, fmtPx, fmtUsd } from "@/lib/forexText";
import type { StockChart } from "@/lib/simData";
import type { Translate } from "@/lib/i18n";
import type { SimArrays, SimIndex, SimMeta, SimParams, SimTrade } from "@/types/sim";

export const INDEX_LABEL: Record<SimIndex, string> = {
  SP500: "S&P 500",
  NASDAQ: "Nasdaq",
  NYSE: "NYSE",
  RUSSELL: "Russell 2000",
};

export function simRules(t: Translate, p: SimParams): string[] {
  const out = [
    t(
      `Sygnał (zamknięcie D1): cena przebija Kijun 52 od dołu (wczoraj pod, dziś nad), cena nad MA200, konsensus analityków ≥ +${Math.round(p.minUpside * 100)}% (mediana ostatnich celów co najmniej ${p.minFirms} firm z 180 dni). Kupno na otwarciu następnej sesji, całe akcje.`,
      `Signal (D1 close): price crosses above the Kijun 52 (below yesterday, above today), price above MA200, analyst consensus ≥ +${Math.round(p.minUpside * 100)}% (median of the latest targets of at least ${p.minFirms} firms within 180 days). Buy at the next session's open, whole shares.`,
      `Signal (D1-Schluss): Kurs kreuzt den Kijun 52 von unten (gestern darunter, heute darüber), Kurs über MA200, Analystenkonsens ≥ +${Math.round(p.minUpside * 100)}% (Median der letzten Kursziele von mindestens ${p.minFirms} Häusern aus 180 Tagen). Kauf zur Eröffnung der nächsten Sitzung, ganze Aktien.`,
    ),
    t(
      `Pozycja: ${(p.position * 100).toFixed(0)}% kapitału. ${p.add > 0 ? `Dokładka ${(p.add * 100).toFixed(0)}% kapitału (raz), gdy cena jest nad chmurą, a ocena 5 linii Ichimoku ≥ +2.` : "Bez dokładki."}`,
      `Position: ${(p.position * 100).toFixed(0)}% of equity. ${p.add > 0 ? `One add of ${(p.add * 100).toFixed(0)}% of equity when price is above the cloud and the 5-line Ichimoku score is ≥ +2.` : "No add."}`,
      `Position: ${(p.position * 100).toFixed(0)}% des Kapitals. ${p.add > 0 ? `Einmalige Aufstockung um ${(p.add * 100).toFixed(0)}% des Kapitals, wenn der Kurs über der Wolke liegt und die 5-Linien-Bewertung ≥ +2 ist.` : "Ohne Aufstockung."}`,
    ),
    t(
      `Wyjście (trzymaj do odbicia): pozycja musi się „uzbroić” (cena nad chmurą i ocena ≥ +2), potem ${p.nBelow} kolejnych zamknięć pod Kijun 52 i pozycja na plusie po kosztach - sprzedaż na otwarciu. Ze stratą nie sprzedajemy.`,
      `Exit (hold until it recovers): the position must "arm" (price above the cloud and score ≥ +2), then ${p.nBelow} consecutive closes below the Kijun 52 with the position in profit after costs - sell at the open. Never sold at a loss.`,
      `Ausstieg (halten bis zur Erholung): die Position muss „scharf“ werden (Kurs über der Wolke und Bewertung ≥ +2), dann ${p.nBelow} Schlusskurse in Folge unter dem Kijun 52 bei Gewinn nach Kosten - Verkauf zur Eröffnung. Kein Verkauf mit Verlust.`,
    ),
  ];
  out.push(
    p.maExit > 0
      ? t(
          `Wyjście awaryjne: ${p.maExit} kolejnych zamknięć pod MA200 - sprzedaż także ze stratą.`,
          `Emergency exit: ${p.maExit} consecutive closes below the MA200 - sold even at a loss.`,
          `Notausstieg: ${p.maExit} Schlusskurse in Folge unter der MA200 - Verkauf auch mit Verlust.`,
        )
      : t("Wyjście awaryjne MA200 wyłączone.", "MA200 emergency exit off.", "MA200-Notausstieg aus."),
  );
  if (p.stop > 0) {
    out.push(
      t(
        `Twój stop: gdy wartość pozycji po kosztach spadnie o ${(p.stop * 100).toFixed(0)}% poniżej wydanej kwoty (na zamknięciu) - sprzedaż na otwarciu.`,
        `Your stop: when the position's value after costs falls ${(p.stop * 100).toFixed(0)}% below the amount spent (on a close) - sell at the open.`,
        `Ihr Stop: fällt der Positionswert nach Kosten um ${(p.stop * 100).toFixed(0)}% unter den investierten Betrag (zum Schluss) - Verkauf zur Eröffnung.`,
      ),
    );
  }
  out.push(
    t(
      "Gdy sygnałów jest więcej niż gotówki lub limitów, kolejność jest losowana (losowanie = ziarno). Koszt 0,05% na stronę dla spółek S&P 500, 0,25% dla pozostałych.",
      "When there are more signals than cash or limits allow, the order is random (draw = seed). Cost 0.05% per side for S&P 500 stocks, 0.25% for the rest.",
      "Gibt es mehr Signale als Geld oder Limits, wird die Reihenfolge ausgelost (Ziehung = Seed). Kosten 0,05% je Seite für S&P-500-Aktien, 0,25% für die übrigen.",
    ),
  );
  return out;
}

export interface Condition {
  ok: boolean;
  text: string;
}

const val = (a: (number | null)[], i: number) => (i >= 0 && i < a.length ? a[i] : null);

/** Index (into the chart's daily series) of a sim-window day. */
export function chartIdx(meta: SimMeta, ch: StockChart, simDay: number): number {
  return ch.dayIndex[meta.sim_start + simDay];
}

export function entryConditions(t: Translate, meta: SimMeta, A: SimArrays, ch: StockChart, tr: SimTrade, p: SimParams): Condition[] {
  const i = chartIdx(meta, ch, tr.signal);
  const d = ch.file.d1;
  const f = (v: number | null) => fmtPx(v, 2);
  const c = val(d.c, i);
  const pc = val(d.c, i - 1);
  const k = val(d.k52, i);
  const pk = val(d.k52, i - 1);
  const ma = val(d.ma200, i);
  const sg = A.signals[tr.sig];
  const s = meta.stocks[tr.stock];
  const others = s.idx.filter((x) => x !== "SP500").map((x) => INDEX_LABEL[x]);
  const minUp = Math.round(p.minUpside * 100);
  const maxUp = Math.round(p.maxUpside * 100);
  const member = sg.spMember
    ? t("w składzie S&P 500 tego dnia", "in the S&P 500 on that day", "an diesem Tag im S&P 500")
    : t(
        `${others.join(", ")} - płynna (obrót ≥ 1 mln USD dziennie, cena ≥ 3 USD)`,
        `${others.join(", ")} - liquid (turnover ≥ 1M USD a day, price ≥ 3 USD)`,
        `${others.join(", ")} - liquide (Umsatz ≥ 1 Mio. USD täglich, Kurs ≥ 3 USD)`,
      );
  const out: Condition[] = [
    {
      ok: c != null && k != null && c > k && pc != null && pk != null && pc <= pk,
      text: t(
        `Przebicie Kijun 52: wczoraj ${f(pc)} ≤ ${f(pk)}, dziś ${f(c)} > ${f(k)}`,
        `Kijun 52 cross: yesterday ${f(pc)} ≤ ${f(pk)}, today ${f(c)} > ${f(k)}`,
        `Kijun-52-Durchbruch: gestern ${f(pc)} ≤ ${f(pk)}, heute ${f(c)} > ${f(k)}`,
      ),
    },
    {
      ok: c != null && ma != null && c > ma,
      text: t(`Cena ${f(c)} nad MA200 ${f(ma)}`, `Price ${f(c)} above MA200 ${f(ma)}`, `Kurs ${f(c)} über MA200 ${f(ma)}`),
    },
    {
      ok: sg.upside >= minUp && (p.maxUpside <= 0 || sg.upside <= maxUp),
      text: t(
        `Analitycy: konsensus ${sg.firms} firm daje +${sg.upside}% potencjału (próg ${minUp}%${p.maxUpside > 0 ? `, maks. ${maxUp}%` : ""})`,
        `Analysts: the consensus of ${sg.firms} firms implies +${sg.upside}% upside (threshold ${minUp}%${p.maxUpside > 0 ? `, max ${maxUp}%` : ""})`,
        `Analysten: der Konsens von ${sg.firms} Häusern ergibt +${sg.upside}% Potenzial (Schwelle ${minUp}%${p.maxUpside > 0 ? `, max. ${maxUp}%` : ""})`,
      ),
    },
    {
      ok: sg.firms >= p.minFirms,
      text: t(`Liczba firm analitycznych ${sg.firms} ≥ ${p.minFirms}`, `Analyst firms ${sg.firms} ≥ ${p.minFirms}`, `Analystenhäuser ${sg.firms} ≥ ${p.minFirms}`),
    },
    { ok: true, text: t(`Indeks: ${member}`, `Index: ${member}`, `Index: ${member}`) },
  ];
  if (p.minPrice > 0) {
    out.push({
      ok: sg.price >= p.minPrice,
      text: t(`Cena akcji ${sg.price.toFixed(2)} USD ≥ ${p.minPrice} USD`, `Share price ${sg.price.toFixed(2)} USD ≥ ${p.minPrice} USD`, `Aktienkurs ${sg.price.toFixed(2)} USD ≥ ${p.minPrice} USD`),
    });
  }
  if (p.minTurnover > 0) {
    const tv = sg.turnover == null ? null : `${sg.turnover.toFixed(1)}`;
    out.push({
      ok: sg.turnover == null || sg.turnover >= p.minTurnover,
      text: t(
        `Obrót dzienny ${tv == null ? "nieznany (spółka wyrzucona z S&P 500 - przepuszczona)" : `${tv} mln USD`} ≥ ${p.minTurnover} mln USD`,
        `Daily turnover ${tv == null ? "unknown (stock removed from the S&P 500 - let through)" : `${tv}M USD`} ≥ ${p.minTurnover}M USD`,
        `Tagesumsatz ${tv == null ? "unbekannt (aus dem S&P 500 entfernt - zugelassen)" : `${tv} Mio. USD`} ≥ ${p.minTurnover} Mio. USD`,
      ),
    });
  }
  if (p.maRising) {
    out.push({ ok: sg.maRising, text: t("MA200 rośnie (wyżej niż 20 sesji temu)", "MA200 rising (higher than 20 sessions ago)", "MA200 steigt (höher als vor 20 Sitzungen)") });
  }
  if (p.aboveCloud) out.push({ ok: sg.aboveCloud, text: t("Cena nad chmurą D1", "Price above the D1 cloud", "Kurs über der D1-Wolke") });
  if (p.aboveWk52) out.push({ ok: sg.aboveWk52, text: t("Cena nad Kijun 52 z W1", "Price above the W1 Kijun 52", "Kurs über dem W1-Kijun-52") });
  if (p.minScore != null) {
    out.push({
      ok: sg.score != null && sg.score >= p.minScore,
      text: t(`Ocena 5 linii ${sg.score ?? "-"} ≥ ${p.minScore}`, `5-line score ${sg.score ?? "-"} ≥ ${p.minScore}`, `5-Linien-Bewertung ${sg.score ?? "-"} ≥ ${p.minScore}`),
    });
  }
  if (p.marketUp) out.push({ ok: true, text: t("Rynek: SPY nad swoją MA200", "Market: SPY above its MA200", "Markt: SPY über seiner MA200") });
  if (p.sectors.length) out.push({ ok: true, text: t(`Sektor: ${s.sec ?? "-"}`, `Sector: ${s.sec ?? "-"}`, `Sektor: ${s.sec ?? "-"}`) });
  return out;
}

export function entryContext(t: Translate, meta: SimMeta, ch: StockChart, tr: SimTrade): string {
  const i = chartIdx(meta, ch, tr.signal);
  const d = ch.file.d1;
  const c = val(d.c, i);
  const top = (() => {
    const a = val(d.sa, i);
    const b = val(d.sb, i);
    return a != null && b != null ? Math.max(a, b) : null;
  })();
  const sc = val(ch.score, i);
  const wk = d.w_k52 ? val(d.w_k52, i) : null;
  const side = (x: number | null) =>
    x == null || c == null ? "-" : c > x ? t("nad", "above", "über") : t("pod", "below", "unter");
  return t(
    `Tło (nie jest warunkiem): cena ${side(top)} chmurą, ${side(val(d.ma100, i))} MA100, ${side(wk)} Kijun 52 W1; ocena 5 linii ${sc ?? "-"}.`,
    `Context (not a rule): price ${side(top)} the cloud, ${side(val(d.ma100, i))} MA100, ${side(wk)} the W1 Kijun 52; 5-line score ${sc ?? "-"}.`,
    `Kontext (keine Regel): Kurs ${side(top)} der Wolke, ${side(val(d.ma100, i))} MA100, ${side(wk)} dem W1-Kijun-52; 5-Linien-Bewertung ${sc ?? "-"}.`,
  );
}

export function addText(t: Translate, meta: SimMeta, ch: StockChart, tr: SimTrade): string | null {
  if (tr.add == null || tr.addSignal == null) return null;
  const i = chartIdx(meta, ch, tr.addSignal);
  const d = ch.file.d1;
  const a = val(d.sa, i);
  const b = val(d.sb, i);
  const top = a != null && b != null ? Math.max(a, b) : null;
  const date = (x: number) => fmtDate(meta.dates[meta.sim_start + x]);
  return t(
    `Dokładka ${date(tr.add)}: ${tr.addShares} szt. po ${fmtPx(tr.addPx, 2)}. Zamknięcie ${date(tr.addSignal)} ${fmtPx(val(d.c, i), 2)} nad chmurą (${fmtPx(top, 2)}), ocena 5 linii ${val(ch.score, i) ?? "-"} ≥ +2.`,
    `Add ${date(tr.add)}: ${tr.addShares} sh. at ${fmtPx(tr.addPx, 2)}. The ${date(tr.addSignal)} close ${fmtPx(val(d.c, i), 2)} was above the cloud (${fmtPx(top, 2)}), 5-line score ${val(ch.score, i) ?? "-"} ≥ +2.`,
    `Aufstockung ${date(tr.add)}: ${tr.addShares} St. zu ${fmtPx(tr.addPx, 2)}. Schluss am ${date(tr.addSignal)} ${fmtPx(val(d.c, i), 2)} über der Wolke (${fmtPx(top, 2)}), 5-Linien-Bewertung ${val(ch.score, i) ?? "-"} ≥ +2.`,
  );
}

export function exitText(t: Translate, meta: SimMeta, ch: StockChart, tr: SimTrade, p: SimParams): string {
  const date = (x: number) => fmtDate(meta.dates[meta.sim_start + x]);
  const d = ch.file.d1;
  const px = fmtPx(tr.exitPx, 2);
  const armed =
    tr.armed != null
      ? t(
          `Pozycja uzbroiła się ${date(tr.armed)} (cena nad chmurą, ocena ≥ +2).`,
          `The position armed on ${date(tr.armed)} (price above the cloud, score ≥ +2).`,
          `Die Position wurde am ${date(tr.armed)} scharf (Kurs über der Wolke, Bewertung ≥ +2).`,
        )
      : t("Pozycja nigdy się nie uzbroiła.", "The position never armed.", "Die Position wurde nie scharf.");
  switch (tr.reason) {
    case "kijun": {
      const i = chartIdx(meta, ch, tr.exitSignal ?? tr.exit - 1);
      return t(
        `${armed} Potem ${p.nBelow} zamknięć z rzędu pod Kijun 52 - ostatnie ${date(tr.exitSignal ?? tr.exit - 1)}: ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.k52, i), 2)}, a pozycja była na plusie po kosztach. Sprzedaż na otwarciu ${date(tr.exit)} po ${px}.`,
        `${armed} Then ${p.nBelow} closes in a row below the Kijun 52 - the last on ${date(tr.exitSignal ?? tr.exit - 1)}: ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.k52, i), 2)}, with the position in profit after costs. Sold at the ${date(tr.exit)} open at ${px}.`,
        `${armed} Danach ${p.nBelow} Schlusskurse in Folge unter dem Kijun 52 - der letzte am ${date(tr.exitSignal ?? tr.exit - 1)}: ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.k52, i), 2)}, bei Gewinn nach Kosten. Verkauf zur Eröffnung am ${date(tr.exit)} zu ${px}.`,
      );
    }
    case "ma200": {
      const s = tr.exitSignal ?? tr.exit - 1;
      const i = chartIdx(meta, ch, s);
      return t(
        `${armed} Cena zamykała się pod MA200 przez ${p.maExit} sesji z rzędu (od ${date(Math.max(s - p.maExit + 1, 0))}, ostatnio ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.ma200, i), 2)}) - wyjście awaryjne, także ze stratą. Sprzedaż ${date(tr.exit)} po ${px}.`,
        `${armed} Price closed below the MA200 for ${p.maExit} sessions in a row (from ${date(Math.max(s - p.maExit + 1, 0))}, last ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.ma200, i), 2)}) - emergency exit, even at a loss. Sold on ${date(tr.exit)} at ${px}.`,
        `${armed} Der Kurs schloss ${p.maExit} Sitzungen in Folge unter der MA200 (ab ${date(Math.max(s - p.maExit + 1, 0))}, zuletzt ${fmtPx(val(d.c, i), 2)} < ${fmtPx(val(d.ma200, i), 2)}) - Notausstieg, auch mit Verlust. Verkauf am ${date(tr.exit)} zu ${px}.`,
      );
    }
    case "stop":
      return t(
        `Wartość pozycji spadła o ${(p.stop * 100).toFixed(0)}% poniżej wydanej kwoty ${fmtUsd(tr.spent)} (zamknięcie ${date(tr.exitSignal ?? tr.exit - 1)}) - Twój stop. Sprzedaż ${date(tr.exit)} po ${px}.`,
        `The position's value fell ${(p.stop * 100).toFixed(0)}% below the ${fmtUsd(tr.spent)} spent (close of ${date(tr.exitSignal ?? tr.exit - 1)}) - your stop. Sold on ${date(tr.exit)} at ${px}.`,
        `Der Positionswert fiel ${(p.stop * 100).toFixed(0)}% unter die investierten ${fmtUsd(tr.spent)} (Schluss am ${date(tr.exitSignal ?? tr.exit - 1)}) - Ihr Stop. Verkauf am ${date(tr.exit)} zu ${px}.`,
      );
    case "delist":
      return t(
        `Spółka przestała być notowana (przejęcie / wycofanie) - pozycja rozliczona po ostatniej cenie ${px}.`,
        `The stock stopped trading (takeover / delisting) - settled at the last price ${px}.`,
        `Die Aktie wurde nicht mehr gehandelt (Übernahme / Delisting) - abgerechnet zum letzten Kurs ${px}.`,
      );
    case "open":
      return t(
        `${armed} Pozycja nadal otwarta na koniec symulacji (${date(tr.exit)}) - wycena po ${px} (${fmtPct(tr.ret * 100)}).`,
        `${armed} Still open at the end of the simulation (${date(tr.exit)}) - valued at ${px} (${fmtPct(tr.ret * 100)}).`,
        `${armed} Am Simulationsende (${date(tr.exit)}) noch offen - bewertet zu ${px} (${fmtPct(tr.ret * 100)}).`,
      );
  }
}

export function exitShort(t: Translate, r: SimTrade["reason"]): string {
  switch (r) {
    case "kijun":
      return t("Kijun 52 (zysk)", "Kijun 52 (profit)", "Kijun 52 (Gewinn)");
    case "ma200":
      return t("MA200 awaryjne", "MA200 emergency", "MA200-Notausstieg");
    case "stop":
      return t("stop", "stop", "Stop");
    case "delist":
      return t("wycofanie", "delisting", "Delisting");
    case "open":
      return t("otwarta", "open", "offen");
  }
}
