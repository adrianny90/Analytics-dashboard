"use client";

import { getLocale, useLang, type Translate } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { describeStage, waveName, waveStyle } from "@/lib/waveText";
import type { WaveDrawing, WaveLayers, WaveLeg, WaveTimeTarget } from "@/types/market";

/**
 * Panel pod wykresem Ichimoku: przyciski rysujące wytypowaną falę na wykresie (zygzak A-B-C-D, cele cenowe Hosody,
 * projekcje czasu) oraz liczenie świec wg teorii czasu Hosody. Odcinki są porównywane z liczbami podstawowymi
 * (9, 17, 26, ...), a projekcje równych liczb biorą faktyczną długość odcinka - jeśli impuls trwał 15 świec zamiast 9,
 * projekcja liczy 15.
 */

const ARROWS = { up: "↑", down: "↓" } as const;

export function drawingTag(d: WaveDrawing): string {
  return d.wave === "P" || d.wave === "Y" || !d.direction ? d.wave : `${d.wave}${ARROWS[d.direction]}`;
}

function legName(leg: WaveLeg, t: Translate): string {
  const end = leg.end === "now" ? t("teraz", "now", "jetzt") : leg.end || "·";
  return `${leg.start}→${end}`;
}

function legBars(d: WaveDrawing, start: string, end: string): number | null {
  return d.legs.find((l) => l.start === start && l.end === end)?.bars ?? null;
}

function ruleText(rule: string, d: WaveDrawing, t: Translate): string {
  const ab = legBars(d, "A", "B");
  const bc = legBars(d, "B", "C");
  const ac = ab != null && bc != null ? ab + bc : null;
  const n = (v: number | null) => (v == null ? "?" : String(v));
  switch (rule) {
    case "AB=CD":
      return t(`C→D trwa tyle co A→B (${n(ab)} świec)`, `C→D lasts as long as A→B (${n(ab)} bars)`, `C→D dauert so lange wie A→B (${n(ab)} Kerzen)`);
    case "AC=CD":
      return t(`C→D trwa tyle co A→C (${n(ac)} świec)`, `C→D lasts as long as A→C (${n(ac)} bars)`, `C→D dauert so lange wie A→C (${n(ac)} Kerzen)`);
    case "AB=BD":
      return t(`B→D trwa tyle co A→B (${n(ab)} świec)`, `B→D lasts as long as A→B (${n(ab)} bars)`, `B→D dauert so lange wie A→B (${n(ab)} Kerzen)`);
    case "BC=CD":
      return t(`C→D trwa tyle co B→C (${n(bc)} świec)`, `C→D lasts as long as B→C (${n(bc)} bars)`, `C→D dauert so lange wie B→C (${n(bc)} Kerzen)`);
    default: {
      const [anchor, count] = rule.split("+");
      return t(
        `${count} świec od ${anchor} (liczba podstawowa Hosody)`,
        `${count} bars from ${anchor} (Hosoda basic number)`,
        `${count} Kerzen ab ${anchor} (Hosoda-Grundzahl)`,
      );
    }
  }
}

function legNote(leg: WaveLeg, t: Translate): string {
  if (leg.end === "now") {
    return Math.abs(leg.diff) <= 2
      ? t(`teraz przy liczbie ${leg.nearest} - możliwy dzień zmiany`, `now at ${leg.nearest} - a possible day of change`, `jetzt bei ${leg.nearest} - möglicher Wendetag`)
      : leg.diff > 0
        ? t(`${leg.diff} św. po liczbie ${leg.nearest}`, `${leg.diff} bars past ${leg.nearest}`, `${leg.diff} K. nach ${leg.nearest}`)
        : t(`${-leg.diff} św. do liczby ${leg.nearest}`, `${-leg.diff} bars to ${leg.nearest}`, `${-leg.diff} K. bis ${leg.nearest}`);
  }
  if (Math.abs(leg.diff) <= 2) {
    return t(`zgodnie z liczbą ${leg.nearest}`, `matches ${leg.nearest}`, `entspricht ${leg.nearest}`);
  }
  const longer = leg.diff > 0;
  return t(
    `${longer ? "dłużej" : "krócej"} niż ${leg.nearest} o ${Math.abs(leg.diff)} - projekcje liczą faktyczne ${leg.bars}`,
    `${Math.abs(leg.diff)} ${longer ? "longer" : "shorter"} than ${leg.nearest} - projections use the actual ${leg.bars}`,
    `${Math.abs(leg.diff)} ${longer ? "länger" : "kürzer"} als ${leg.nearest} - Projektionen nutzen die tatsächlichen ${leg.bars}`,
  );
}

function timeNote(tt: WaveTimeTarget, t: Translate): string {
  const notes: string[] = [];
  if (tt.hit) notes.push(t("trafione - zwrot D w tym miejscu", "hit - D turned here", "Treffer - D drehte hier"));
  else if (tt.bars_ahead < 0) notes.push(t("minęło bez zwrotu", "passed without a turn", "ohne Wende vorbei"));
  if (tt.cluster > 0) {
    notes.push(
      t(
        `kumulacja z ${tt.cluster} inn${tt.cluster === 1 ? "ą projekcją" : "ymi projekcjami"} (±2 świece) - mocniejszy dzień zmiany`,
        `cluster with ${tt.cluster} other projection${tt.cluster === 1 ? "" : "s"} (±2 bars) - a stronger day of change`,
        `Häufung mit ${tt.cluster} weiteren Projektion${tt.cluster === 1 ? "" : "en"} (±2 Kerzen) - stärkerer Wendetag`,
      ),
    );
  }
  return notes.join("; ");
}

const BUTTON = "rounded-md border px-2.5 py-1 text-xs font-medium transition";
const BUTTON_OFF = "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80";
const BUTTON_ON = "border-amber-300 bg-amber-400/20 text-amber-200";

export function WavePanel({
  drawings,
  selected,
  onSelect,
  layers,
  onLayers,
  futureBars,
}: {
  drawings: WaveDrawing[];
  selected: number;
  onSelect: (index: number) => void;
  layers: WaveLayers;
  onLayers: (layers: WaveLayers) => void;
  /** Ile świec w przyszłość sięga oś wykresu - dalsze projekcje są tylko w tabeli. */
  futureBars: number;
}) {
  const { t } = useLang();
  const d = drawings[selected];
  if (!d) return null;
  const all = layers.path && layers.prices && layers.time;
  const toggle = (key: keyof WaveLayers) => onLayers({ ...layers, [key]: !layers[key] });
  const dPoint = d.points[d.points.length - 1];
  const stage = describeStage(d.stage, d.direction, t);
  const reached = (y: number) => (d.leg_direction === "up" ? dPoint.price >= y : dPoint.price <= y);

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-semibold">{t("Fala Hosody na wykresie", "Hosoda wave on the chart", "Hosoda-Welle im Chart")}</h2>
        <button type="button" onClick={() => toggle("path")} aria-pressed={layers.path} className={`${BUTTON} ${layers.path ? BUTTON_ON : BUTTON_OFF}`}
          title={t("Rysuje zygzak fali z punktami A, B, C i bieżącym D (przerywana linia - D jeszcze niepotwierdzone)", "Draws the wave zigzag with points A, B, C and the current D (dashed - D not yet confirmed)", "Zeichnet das Wellen-Zickzack mit A, B, C und dem aktuellen D (gestrichelt - D noch unbestätigt)")}>
          {t("Wyrysuj falę", "Draw the wave", "Welle zeichnen")}
        </button>
        <button type="button" onClick={() => toggle("prices")} aria-pressed={layers.prices} className={`${BUTTON} ${layers.prices ? BUTTON_ON : BUTTON_OFF}`}
          title={t("Cele Hosody E, V, N, NT dla odcinka C→D, poziom unieważnienia i zakres konsolidacji", "Hosoda targets E, V, N, NT for leg C→D, the invalidation level and the consolidation range", "Hosoda-Ziele E, V, N, NT für C→D, Invalidierungsmarke und Konsolidierungsspanne")}>
          {t("Zakresy cenowe", "Price ranges", "Preisspannen")}
        </button>
        <button type="button" onClick={() => toggle("time")} aria-pressed={layers.time} className={`${BUTTON} ${layers.time ? BUTTON_ON : BUTTON_OFF}`}
          title={t("Pionowe linie: projekcje dnia zmiany wg teorii czasu Hosody (równe liczby i liczby podstawowe)", "Vertical lines: day-of-change projections from Hosoda's time theory (equal and basic numbers)", "Senkrechte Linien: Wendetag-Projektionen nach Hosodas Zeittheorie (gleiche Zahlen und Grundzahlen)")}>
          {t("Czas Hosody", "Hosoda time", "Hosoda-Zeit")}
        </button>
        <button type="button" onClick={() => onLayers(all ? { path: false, prices: false, time: false } : { path: true, prices: true, time: true })} className={`${BUTTON} ${BUTTON_OFF}`}>
          {all ? t("Ukryj wszystko", "Hide all", "Alles ausblenden") : t("Pokaż wszystko", "Show all", "Alles zeigen")}
        </button>
      </div>

      {drawings.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
          {t("Odczyt:", "Reading:", "Lesart:")}
          {drawings.map((dr, i) => (
            <button key={dr.label} type="button" onClick={() => onSelect(i)}
              className={`rounded px-2 py-0.5 font-semibold ${waveStyle({ wave: dr.wave, direction: dr.direction, probability: dr.share, stage: dr.stage })} ${i === selected ? "ring-1 ring-white/60" : "opacity-60 hover:opacity-100"}`}
              title={t(`Zygzak ${dr.sensitivity} x ATR`, `Zigzag ${dr.sensitivity} x ATR`, `Zickzack ${dr.sensitivity} x ATR`)}>
              {drawingTag(dr)} {Math.round(dr.share * 100)}%
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-white/80">
        <span className="font-semibold">{drawingTag(d)}</span> - {waveName(d.wave, t)}
        {stage ? `. ${stage}` : ""}
      </p>
      <p className="mt-1 text-xs text-white/40">
        {t(
          `Punkty zwrotne z zygzaka ${d.sensitivity} x ATR(26). A, B, C - potwierdzone; D - bieżące ekstremum (${new Date(dPoint.timestamp).toLocaleDateString(getLocale())}), jeszcze niepotwierdzone.`,
          `Turning points from a ${d.sensitivity} x ATR(26) zigzag. A, B, C - confirmed; D - the current extreme (${new Date(dPoint.timestamp).toLocaleDateString(getLocale())}), not confirmed yet.`,
          `Wendepunkte aus einem ${d.sensitivity} x ATR(26)-Zickzack. A, B, C - bestätigt; D - aktuelles Extrem (${new Date(dPoint.timestamp).toLocaleDateString(getLocale())}), noch unbestätigt.`,
        )}
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{t("Liczenie świec (teoria czasu)", "Candle count (time theory)", "Kerzenzählung (Zeittheorie)")}</h3>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="py-1 pr-2 font-medium">{t("Odcinek", "Leg", "Abschnitt")}</th>
                <th className="py-1 pr-2 font-medium">{t("Świece", "Bars", "Kerzen")}</th>
                <th className="py-1 pr-2 font-medium">{t("Zmiana", "Change", "Änderung")}</th>
                <th className="py-1 font-medium">{t("Liczba Hosody", "Hosoda number", "Hosoda-Zahl")}</th>
              </tr>
            </thead>
            <tbody>
              {d.legs.map((leg) => (
                <tr key={`${leg.start}-${leg.end}`} className="border-b border-white/5 align-top">
                  <td className="py-1 pr-2 font-medium text-white/80">{legName(leg, t)}</td>
                  <td className="py-1 pr-2">{leg.bars}</td>
                  <td className={`py-1 pr-2 ${leg.change_pct >= 0 ? "text-rise" : "text-fall"}`}>
                    {leg.change_pct >= 0 ? "+" : ""}
                    {leg.change_pct.toFixed(1)}%
                  </td>
                  <td className={`py-1 ${Math.abs(leg.diff) <= 2 ? "text-emerald-300" : "text-white/60"}`}>{legNote(leg, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-4 text-sm font-semibold text-white/90">{t("Zakresy cenowe", "Price ranges", "Preisspannen")}</h3>
          {(d.wave === "P" || d.wave === "Y") && Object.keys(d.targets).length > 0 && (
            <p className="mt-1 text-xs text-white/40">
              {t(
                "W konsolidacji na wykresie rysowany jest tylko zakres; cele E/V/N/NT (liczone z A-B-C) zadziałają dopiero po wybiciu.",
                "In a consolidation only the range is drawn on the chart; the E/V/N/NT targets (from A-B-C) only apply after a breakout.",
                "In einer Konsolidierung wird im Chart nur die Spanne gezeichnet; die Ziele E/V/N/NT (aus A-B-C) gelten erst nach einem Ausbruch.",
              )}
            </p>
          )}
          <ul className="mt-1 space-y-0.5 text-xs text-white/70">
            {Object.entries(d.targets).map(([name, y]) => (
              <li key={name}>
                <span className="font-semibold text-emerald-300">{name}</span> {formatNumber(y as number)}
                {reached(y as number) && <span className="ml-1 text-white/40">({t("osiągnięty przez D", "reached by D", "von D erreicht")})</span>}
              </li>
            ))}
            {d.invalidation != null && (
              <li>
                <span className="font-semibold text-fall">{t("Unieważnienie", "Invalidation", "Invalidierung")}</span> {formatNumber(d.invalidation)}
              </li>
            )}
            {d.box_low != null && d.box_high != null && (
              <li>
                <span className="font-semibold text-white/80">{t("Zakres", "Range", "Spanne")}</span> {formatNumber(d.box_low)} - {formatNumber(d.box_high)}
              </li>
            )}
            {!Object.keys(d.targets).length && (
              <li className="text-white/40">{t("A-B-C nie układa się w impuls i korektę - brak celów Hosody.", "A-B-C is not an impulse and a correction - no Hosoda targets.", "A-B-C ist kein Impuls mit Korrektur - keine Hosoda-Ziele.")}</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/90">{t("Dzień zmiany - projekcje końca C→D", "Day of change - end of C→D projections", "Wendetag - Projektionen für das Ende von C→D")}</h3>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="py-1 pr-2 font-medium">{t("Reguła", "Rule", "Regel")}</th>
                <th className="py-1 pr-2 font-medium">{t("Kiedy", "When", "Wann")}</th>
                <th className="py-1 font-medium">{t("Uwagi", "Notes", "Hinweise")}</th>
              </tr>
            </thead>
            <tbody>
              {d.time_targets.map((tt) => (
                <tr key={tt.rule} className={`border-b border-white/5 align-top ${tt.cluster > 0 || tt.hit ? "text-violet-200" : "text-white/70"}`}>
                  <td className="py-1 pr-2">
                    <span className="font-semibold">{tt.rule}</span>
                    <div className="text-white/40">{ruleText(tt.rule, d, t)}</div>
                  </td>
                  <td className="whitespace-nowrap py-1 pr-2">
                    {new Date(tt.timestamp).toLocaleDateString(getLocale())}
                    <div className="text-white/40">
                      {tt.bars_ahead === 0
                        ? t("ostatnia świeca", "last candle", "letzte Kerze")
                        : tt.bars_ahead > 0
                          ? t(`za ${tt.bars_ahead} św.`, `in ${tt.bars_ahead} bars`, `in ${tt.bars_ahead} K.`)
                          : t(`${-tt.bars_ahead} św. temu`, `${-tt.bars_ahead} bars ago`, `vor ${-tt.bars_ahead} K.`)}
                      {tt.bars_ahead > futureBars ? t(" · poza wykresem", " · off the chart", " · außerhalb des Charts") : ""}
                    </div>
                  </td>
                  <td className="py-1">{timeNote(tt, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/40">
        {t(
          "Daty w przyszłości są szacowane (dni robocze, bez świąt). Teoria czasu Hosody i cele cenowe to narzędzia opisu - w naszych testach kształt fali nie zmieniał szans na kolejne 26 sesji, więc to nie jest prognoza.",
          "Future dates are estimates (weekdays, no holidays). Hosoda's time theory and price targets are descriptive tools - in our tests the wave shape did not change the odds for the next 26 sessions, so this is not a forecast.",
          "Zukünftige Daten sind Schätzungen (Werktage, ohne Feiertage). Hosodas Zeittheorie und Preisziele sind Beschreibungswerkzeuge - in unseren Tests änderte die Wellenform die Chancen für die nächsten 26 Sitzungen nicht, daher ist das keine Prognose.",
        )}
      </p>
    </section>
  );
}
