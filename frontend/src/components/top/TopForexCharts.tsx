import { Arrow, MiniChart, Tag, flat, ramp } from "@/components/top/TopCharts";

/** Schematy (dane wymyślone) dla zakładki "Top Forex": TK na H1 + wyjście na dziennym Kijun 52. */

const C_TENKAN = "#f43f5e";
const C_KIJUN = "#f97316";
const C_K52 = "#a855f7";
const C_STOP = "#f87171";
const C_ENTRY = "#facc15";
const C_GO = "#4ade80";

/* ---------- 1. Wejście H1 ---------- */
const H1_CLOSES = [
  101, 101.8, 102.6, 102.2, 103.3, 104, 104.4, 103.7, 102.9, 102, 101.3, 100.8, 100.6, 101, 100.7, 101.2, 101.6, 102.1, 103.2,
  104, 104.7, 105.5, 106.2, 106.8, 107.5, 108.3, 108, 109, 109.7, 110.3, 110, 111,
];
const H1_TENKAN = [
  101.5, 102, 102.4, 102.6, 103, 103.3, 103.5, 103.6, 103.2, 102.6, 102.3, 101.9, 101.6, 101.5, 101.5, 101.5, 101.7, 102.3,
  102.9, 103.3, 104, 104.6, 105.1, 105.6, 106.2, 106.8, 107.2, 107.6, 108, 108.5, 109, 109.4,
];
const H1_KIJUN = H1_CLOSES.map((_, i) => (i < 23 ? 102.5 : i < 28 ? 104 : 105.5));

export function TfEntryChart() {
  const n = H1_CLOSES.length;
  const sig = 18;
  const stop = 100.2;
  return (
    <MiniChart
      closes={H1_CLOSES}
      min={93}
      max={113}
      height={280}
      cloud={{ top: ramp(n, 97, 98), bottom: ramp(n, 95, 96.2) }}
      lines={[
        { values: H1_TENKAN, color: C_TENKAN, label: "Tenkan" },
        { values: H1_KIJUN, color: C_KIJUN, label: "Kijun 26" },
        { values: [...Array(sig + 1).fill(null), ...flat(n - sig - 1, stop)], color: C_STOP, label: "STOP", dash: "5 4" },
      ]}
      caption="H1, long: po cofnięciu Tenkan przecina Kijun 26 od dołu, a cała świeca jest nad chmurą. Kupno na otwarciu następnej świecy H1, stop = zamknięcie świecy sygnału − 3 × ATR(14) z H1. Brak take profit."
    >
      {({ x, y }) => (
        <>
          <circle cx={x(sig)} cy={y(102.7)} r={11} fill="none" stroke={C_ENTRY} strokeWidth={2} />
          <Arrow x1={x(sig) - 60} y1={y(108.5)} x2={x(sig) - 8} y2={y(103.6)} color={C_ENTRY} />
          <Tag x={x(sig) - 64} y={y(109)} text="1. Tenkan przecina Kijun 26 od dołu" color={C_ENTRY} anchor="end" />
          <Tag x={x(sig) - 64} y={y(109) + 15} text="   cena nad chmurą" color={C_ENTRY} anchor="end" />
          <Arrow x1={x(sig + 1) + 50} y1={y(96.5)} x2={x(sig + 1) + 3} y2={y(103)} color={C_GO} />
          <Tag x={x(sig + 1) + 54} y={y(96.5) + 4} text="2. KUP na otwarciu następnej świecy H1" color={C_GO} />
          <Tag x={x(sig + 2)} y={y(stop) - 6} text="3. stop = − 3 ATR (H1)" color={C_STOP} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 2. Filtr H4 i D1 ---------- */
const FILTER_CLOSES = [100, 101.5, 101, 103, 104.5, 104, 106, 105, 107, 108.5, 108, 110, 109.2, 111, 112.5, 112, 113.5, 115, 114.2, 116, 117.5, 117, 118.5, 120];

export function TfFilterChart() {
  const n = FILTER_CLOSES.length;
  return (
    <MiniChart
      closes={FILTER_CLOSES}
      min={92}
      max={123}
      height={220}
      lines={[{ values: ramp(n, 96, 110), color: C_K52, label: "Kijun 52" }]}
      caption="Filtr: na H4 i na D1 ostatnia ZAMKNIĘTA świeca jest nad swoim Kijun 52 (przy short – pod). Wystarczy, że jeden interwał jest po złej stronie, i sygnał z H1 pomijasz."
    >
      {({ x, y }) => (
        <>
          <Tag x={x(1)} y={y(118)} text="H4 i D1: zamknięcie NAD Kijun 52 → wolno kupować" color={C_GO} />
          <Tag x={x(1)} y={y(118) + 16} text="(pod Kijun 52 → wolno tylko sprzedawać)" color="#94a3b8" />
          <circle cx={x(n - 1)} cy={y(120)} r={9} fill="none" stroke={C_GO} strokeWidth={2} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 3. Stop (strata) ---------- */
const STOP_CLOSES = [101.5, 102.2, 103, 103.2, 102.6, 101.9, 101.2, 101.6, 100.9, 100.4, 99.6, 99.2, 99.5, 98.8, 98.3];

export function TfStopChart() {
  const n = STOP_CLOSES.length;
  const stop = 100.2;
  return (
    <MiniChart
      closes={STOP_CLOSES}
      min={96}
      max={106}
      height={200}
      fadeFrom={11}
      lines={[
        { values: [null, null, null, null, ...flat(n - 4, 103.2)], color: C_ENTRY, label: "wejście", dash: "5 4" },
        { values: [null, null, null, null, ...flat(n - 4, stop)], color: C_STOP, label: "STOP", dash: "5 4" },
      ]}
      caption="Najczęstszy scenariusz (ok. 3 na 4 transakcje): cena wraca i dotyka stopu. Zlecenie stop zamyka pozycję od razu, w trakcie świecy. Strata = 1R = Twoje ryzyko, np. 1% kapitału (plus koszty)."
    >
      {({ x, y }) => (
        <>
          <circle cx={x(10)} cy={y(stop)} r={9} fill="none" stroke={C_STOP} strokeWidth={2} />
          <Tag x={x(10) + 14} y={y(stop) + 22} text="stop dotknięty → strata −1R (np. −1% kapitału)" color={C_STOP} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 4. Wyjście D1 ---------- */
const D1_CLOSES = [100, 102, 104, 103, 106, 109, 111, 110, 114, 118, 121, 119, 124, 128, 131, 129, 133, 136, 134, 130, 127, 124.5, 119.5, 118, 117];

export function TfExitChart() {
  const n = D1_CLOSES.length;
  return (
    <MiniChart
      closes={D1_CLOSES}
      min={86}
      max={142}
      height={280}
      fadeFrom={23}
      lines={[
        { values: ramp(n, 90, 123), color: C_K52, label: "Kijun 52 D1" },
        { values: [null, ...flat(21, 97)], color: C_STOP, label: "stop z H1", dash: "5 4" },
      ]}
      caption="Wyjście (wykres D1): trzymasz pozycję, dopóki dzienne zamknięcie jest nad Kijun 52 z D1. Pierwsze zamknięcie dnia POD Kijun 52 → sprzedaż od razu na otwarciu kolejnej świecy. Stop z H1 stoi w miejscu i działa cały czas."
    >
      {({ x, y }) => (
        <>
          <Arrow x1={x(1) + 30} y1={y(118)} x2={x(1) + 2} y2={y(103)} color={C_GO} />
          <Tag x={x(1) + 32} y={y(119)} text="wejście (z H1)" color={C_GO} />
          <Tag x={x(9)} y={y(140)} text="brak take profit – zysk rośnie, dopóki trwa trend" color="#94a3b8" />
          <circle cx={x(22)} cy={y(119.5)} r={10} fill="none" stroke={C_STOP} strokeWidth={2} />
          <Arrow x1={x(22) - 60} y1={y(104)} x2={x(22) - 9} y2={y(117)} color={C_STOP} />
          <Tag x={x(22) - 62} y={y(104) + 12} text="zamknięcie D1 pod Kijun 52 → SPRZEDAJ" color={C_STOP} anchor="end" />
        </>
      )}
    </MiniChart>
  );
}
