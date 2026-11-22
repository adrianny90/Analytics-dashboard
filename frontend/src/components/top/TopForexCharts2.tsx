import { Arrow, MiniChart, Tag, flat, ramp } from "@/components/top/TopCharts";

/** Dodatkowe schematy dla "Top Forex": drzewo decyzji, wejście przy zmianie kierunku (W2), sygnał w chmurze (pomijasz). */

const C_TENKAN = "#f43f5e";
const C_KIJUN = "#f97316";
const C_STOP = "#f87171";
const C_ENTRY = "#facc15";
const C_GO = "#4ade80";
const C_MUTED = "#94a3b8";

/* ---------- Drzewo decyzji ---------- */
const FLOW: { q: string[]; right: { t: string; c: string }[]; down: string }[] = [
  { q: ["D1 i H4: ostatnie zamknięcie po tej samej", "stronie Kijun 52?"], right: [{ t: "NIE → nie handlujesz tą monetą", c: C_MUTED }], down: "TAK" },
  { q: ["Masz już otwartą pozycję na tej monecie?"], right: [{ t: "TAK → trzymasz, czekasz na wyjście", c: C_MUTED }], down: "NIE" },
  {
    q: ["Kierunek włączył się właśnie teraz (zamknięcie", "H4/D1), a na H1 Tenkan już po właściwej stronie", "Kijun 26 i cena po właściwej stronie chmury?"],
    right: [{ t: "TAK → WEJŚCIE W2", c: C_GO }],
    down: "NIE",
  },
  { q: ["Na zamkniętej świecy H1 Tenkan przeciął", "Kijun 26 w kierunku trendu?"], right: [{ t: "NIE → czekasz na kolejną świecę H1", c: C_MUTED }], down: "TAK" },
  {
    q: ["To zamknięcie H1 jest po właściwej stronie", "chmury H1?"],
    right: [{ t: "TAK → WEJŚCIE W1", c: C_GO }, { t: "NIE → pomijasz ten sygnał", c: C_MUTED }],
    down: "",
  },
];

export function DecisionFlow() {
  const W = 680, bx = 20, bw = 340, rowH = 84, boxH = 58;
  const H = FLOW.length * rowH;
  return (
    <figure className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Drzewo decyzji wejścia">
        {FLOW.map((s, i) => {
          const y = 8 + i * rowH;
          return (
            <g key={i}>
              <rect x={bx} y={y} width={bw} height={boxH} rx={8} fill="#0f172a" stroke="#334155" />
              {s.q.map((t, k) => (
                <text key={k} x={bx + 10} y={y + 18 + k * 15} fontSize={12} fill="#e2e8f0">
                  {k === 0 ? `${i + 1}. ${t}` : `    ${t}`}
                </text>
              ))}
              <line x1={bx + bw} y1={y + boxH / 2} x2={bx + bw + 20} y2={y + boxH / 2} stroke="#475569" />
              {s.right.map((r, k) => (
                <text key={k} x={bx + bw + 26} y={y + boxH / 2 + 4 + k * 17} fontSize={12.5} fill={r.c} fontWeight={r.c === C_GO ? 700 : 400}>
                  {r.t}
                </text>
              ))}
              {s.down && (
                <>
                  <line x1={bx + 30} y1={y + boxH} x2={bx + 30} y2={y + rowH} stroke="#475569" />
                  <text x={bx + 38} y={y + boxH + 18} fontSize={11} fill={C_MUTED}>
                    {s.down}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="px-2 pb-1 pt-1 text-xs text-white/50">
        Sprawdzasz po każdym zamknięciu świecy H1. Short – wszystko lustrzanie (pod Kijun 52, Tenkan od góry, pod chmurą H1).
      </figcaption>
    </figure>
  );
}

/* ---------- W2: kierunek właśnie się włączył, H1 już w trendzie ---------- */
const SW_CLOSES = [100.2, 100.8, 100.5, 101.3, 101.9, 101.6, 102.4, 102.9, 102.6, 103.4, 103.9, 103.6, 104.3, 104.8, 105.4, 105.1, 105.9, 106.6, 106.3, 107.1, 107.8, 108.4, 108.1, 108.9];

export function SwitchEntryChart() {
  const n = SW_CLOSES.length;
  const sw = 11;
  const stop = 101.2;
  return (
    <MiniChart
      closes={SW_CLOSES}
      min={95}
      max={111}
      height={250}
      cloud={{ top: ramp(n, 98.5, 102), bottom: ramp(n, 96.5, 99.5) }}
      lines={[
        { values: SW_CLOSES.map((c) => c - 0.4), color: C_TENKAN, label: "Tenkan" },
        { values: ramp(n, 99.5, 105.5), color: C_KIJUN, label: "Kijun 26" },
        { values: [...Array(sw + 1).fill(null), ...flat(n - sw - 1, stop)], color: C_STOP, label: "STOP", dash: "5 4" },
      ]}
      caption="W2 (wejście przy włączeniu kierunku): na H1 trend już trwa (Tenkan nad Kijun 26, cena nad chmurą), ale kierunek long był wyłączony. W chwili, gdy zamyka się świeca H4 lub D1, po której OBA interwały są nad Kijun 52 – wchodzisz od razu, bez czekania na nowe przecięcie. Stop jak zwykle: zamknięcie H1 − 3 ATR."
    >
      {({ x, y, h }) => (
        <>
          <line x1={x(sw)} x2={x(sw)} y1={14} y2={h - 22} stroke={C_ENTRY} strokeDasharray="4 4" />
          <Tag x={x(sw) - 6} y={28} text="tu H4/D1 zamyka się nad Kijun 52" color={C_ENTRY} anchor="end" />
          <Tag x={x(sw) - 6} y={43} text="→ kierunek long WŁĄCZONY" color={C_ENTRY} anchor="end" />
          <Arrow x1={x(sw + 1) + 46} y1={y(100)} x2={x(sw + 1) + 3} y2={y(103.4)} color={C_GO} />
          <Tag x={x(sw + 1) + 50} y={y(100) + 4} text="KUP na otwarciu następnej świecy H1" color={C_GO} />
          <Tag x={x(1)} y={y(106)} text="kierunek wyłączony – nic nie robisz" color={C_MUTED} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- Sygnał w chmurze – pomijasz ---------- */
const CL_CLOSES = [104, 103.2, 102.5, 101.8, 101.2, 100.9, 101.3, 100.8, 101, 101.6, 102.1, 101.7, 102.3, 102.8, 102.4, 102.9, 103.3, 102.8, 103.1, 102.6];

export function CloudSkipChart() {
  const n = CL_CLOSES.length;
  const sig = 10;
  return (
    <MiniChart
      closes={CL_CLOSES}
      min={97}
      max={107}
      height={220}
      cloud={{ top: flat(n, 104.2), bottom: flat(n, 100.3) }}
      lines={[
        { values: [103.8, 103.4, 102.9, 102.4, 102, 101.6, 101.3, 101.1, 101.1, 101.3, 101.7, 101.8, 102, 102.3, 102.5, 102.7, 102.9, 102.9, 102.9, 102.8], color: C_TENKAN, label: "Tenkan" },
        { values: flat(n, 101.6), color: C_KIJUN, label: "Kijun 26" },
      ]}
      caption="Tenkan przecina Kijun 26 od dołu, ale zamknięcie jest W chmurze H1 (nie nad nią) – sygnał pomijasz, nawet jeśli H4 i D1 pozwalają na long."
    >
      {({ x, y }) => (
        <>
          <circle cx={x(sig)} cy={y(101.7)} r={10} fill="none" stroke={C_STOP} strokeWidth={2} />
          <Arrow x1={x(sig) + 60} y1={y(98.6)} x2={x(sig) + 8} y2={y(101.2)} color={C_STOP} />
          <Tag x={x(sig) + 64} y={y(98.6) + 4} text="przecięcie w chmurze → POMIJASZ" color={C_STOP} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- Piramida: dokładanie co +1R, wspólny stop podciągany ---------- */
const PY_CLOSES = [
  99.2, 100, 100.6, 100.3, 101.4, 102.2, 103.1, 102.7, 103.6, 104.4, 105.2, 104.8, 105.9, 106.8, 106.3, 107.5, 108.4, 109.2,
  108.8, 110.1, 111.2, 112.3, 111.8, 113.1, 114.2, 113.7, 115.3, 116.1,
];
// wejścia (indeks świecy, cena) co +1R (R = 3)
const PY_ADDS: [number, number][] = [
  [1, 100],
  [7, 103],
  [12, 106],
  [17, 109],
  [21, 112],
];

export function PyramidChart() {
  const stop: (number | null)[] = PY_CLOSES.map((_, i) => {
    let s: number | null = null;
    for (const [k, px] of PY_ADDS) if (i >= k) s = px - 3;
    return s;
  });
  return (
    <MiniChart
      closes={PY_CLOSES}
      min={93}
      max={119}
      height={280}
      lines={[{ values: stop, color: C_STOP, label: "wspólny STOP" }]}
      caption="Piramida: R = odległość pierwszego stopu (tu 3). Za każdym razem, gdy zamknięcie H1 jest o +1R dalej niż ostatnie wejście, dokładasz jednostkę (maks. 5). Wspólny stop podciągasz pod nowe wejście (− 3 ATR H1) – wcześniejsze jednostki są wtedy mniej więcej na zero. Wyjście całości: stop albo zamknięcie D1 po złej stronie Kijun 52."
    >
      {({ x, y }) => (
        <>
          {PY_ADDS.map(([k, px], j) => (
            <g key={k}>
              <circle cx={x(k)} cy={y(px)} r={7} fill="none" stroke={C_GO} strokeWidth={2} />
              <Tag x={x(k)} y={y(px) - 12} text={String(j + 1)} color={C_GO} anchor="middle" />
            </g>
          ))}
          <Tag x={x(1) + 6} y={y(116)} text="1–5 = kolejne jednostki, każda ryzykuje 0,5% konta" color={C_GO} />
          <Tag x={x(9)} y={y(96)} text="stop podnoszony schodkami, nigdy w dół" color={C_STOP} />
        </>
      )}
    </MiniChart>
  );
}
