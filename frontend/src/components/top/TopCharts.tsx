import type { ReactNode } from "react";

/** Schematyczne wykresy (dane wymyślone, tylko do pokazania warunków) dla zakładki "Top". */

const W = 680;
const PAD_L = 10;
const PAD_R = 92;
const PAD_T = 18;
const PAD_B = 22;

const C_KIJUN = "#a855f7";
const C_MA = "#38bdf8";
const C_ENTRY = "#facc15";
const C_UP = "#16a34a";
const C_DOWN = "#dc2626";

type Line = { values: (number | null)[]; color: string; label: string; dash?: string };
export type Scale = { x: (i: number) => number; y: (v: number) => number; step: number; h: number };

export function MiniChart({
  closes,
  lines = [],
  cloud,
  min,
  max,
  height = 260,
  fadeFrom,
  children,
  caption,
}: {
  closes: number[];
  lines?: Line[];
  cloud?: { top: number[]; bottom: number[] };
  min: number;
  max: number;
  height?: number;
  fadeFrom?: number;
  children?: (s: Scale) => ReactNode;
  caption: string;
}) {
  const n = closes.length;
  const step = (W - PAD_L - PAD_R) / n;
  const x = (i: number) => PAD_L + step * (i + 0.5);
  const y = (v: number) => PAD_T + ((max - v) / (max - min)) * (height - PAD_T - PAD_B);
  const s: Scale = { x, y, step, h: height };
  const bw = Math.max(3, step * 0.55);

  const path = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");

  const lastIdx = (vals: (number | null)[]) => {
    for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i;
    return -1;
  };

  return (
    <figure className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={caption}>
        {cloud && (
          <polygon
            points={[
              ...cloud.top.map((v, i) => `${x(i)},${y(v)}`),
              ...cloud.bottom.map((v, i) => `${x(i)},${y(v)}`).reverse(),
            ].join(" ")}
            fill="#22c55e"
            fillOpacity={0.14}
            stroke="#22c55e"
            strokeOpacity={0.35}
          />
        )}
        {cloud && (
          <text x={x(cloud.top.length - 1) + 6} y={y(cloud.top[cloud.top.length - 1]) - 6} fontSize={11} fill="#4ade80">
            chmura
          </text>
        )}

        {lines.map((l) => {
          const li = lastIdx(l.values);
          return (
            <g key={l.label}>
              <polyline points={path(l.values)} fill="none" stroke={l.color} strokeWidth={2} strokeDasharray={l.dash} />
              {li >= 0 && (
                <text x={x(li) + 6} y={y(l.values[li] as number) + 4} fontSize={11} fill={l.color} fontWeight={600}>
                  {l.label}
                </text>
              )}
            </g>
          );
        })}

        {closes.map((c, i) => {
          const o = i === 0 ? c : closes[i - 1];
          const hi = Math.max(o, c) + 0.8;
          const lo = Math.min(o, c) - 0.8;
          const color = c >= o ? C_UP : C_DOWN;
          const faded = fadeFrom != null && i >= fadeFrom;
          return (
            <g key={i} opacity={faded ? 0.25 : 1}>
              <line x1={x(i)} x2={x(i)} y1={y(hi)} y2={y(lo)} stroke={color} strokeWidth={1} />
              <rect
                x={x(i) - bw / 2}
                y={y(Math.max(o, c))}
                width={bw}
                height={Math.max(1.5, y(Math.min(o, c)) - y(Math.max(o, c)))}
                fill={color}
              />
            </g>
          );
        })}

        {children?.(s)}
      </svg>
      <figcaption className="px-2 pb-1 pt-1 text-xs text-white/50">{caption}</figcaption>
    </figure>
  );
}

export function Tag({ x, y, text, color = "#fff", anchor = "start" }: { x: number; y: number; text: string; color?: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={12}
      fontWeight={600}
      fill={color}
      textAnchor={anchor}
      stroke="#020617"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

export function Arrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  const p1 = `${x2 - h * Math.cos(a - 0.45)},${y2 - h * Math.sin(a - 0.45)}`;
  const p2 = `${x2 - h * Math.cos(a + 0.45)},${y2 - h * Math.sin(a + 0.45)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.8} />
      <polygon points={`${x2},${y2} ${p1} ${p2}`} fill={color} />
    </g>
  );
}

export const flat = (n: number, v: number) => Array.from({ length: n }, () => v);
export const ramp = (n: number, a: number, b: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/* ---------- 1. Wejście ---------- */
const ENTRY_CLOSES = [
  108, 106, 104, 101, 99, 97, 95, 96, 94, 93, 95, 96, 94, 95, 97, 96, 98, 97, 99, 98, 102.5, 103.5, 104, 106, 105, 107, 108,
  107, 109, 110,
];

export function EntryChart() {
  const n = ENTRY_CLOSES.length;
  const sig = 20;
  return (
    <MiniChart
      closes={ENTRY_CLOSES}
      min={84}
      max={114}
      lines={[
        { values: flat(n, 100), color: C_KIJUN, label: "Kijun 52" },
        { values: ramp(n, 88, 91.5), color: C_MA, label: "MA200" },
      ]}
      caption="Wejście: świeca zamyka się nad Kijun 52 (dzień wcześniej zamknięcie było pod), cała akcja dzieje się nad MA200. Kupno na otwarciu następnej sesji."
    >
      {({ x, y }) => (
        <>
          <circle cx={x(sig - 1)} cy={y(98)} r={9} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" />
          <Tag x={x(sig - 1) - 4} y={y(98) + 26} text="wczoraj: pod Kijun" color="#94a3b8" anchor="end" />
          <circle cx={x(sig)} cy={y(102.5)} r={10} fill="none" stroke={C_ENTRY} strokeWidth={2} />
          <Arrow x1={x(sig) - 70} y1={y(112)} x2={x(sig) - 9} y2={y(103.5)} color={C_ENTRY} />
          <Tag x={x(sig) - 74} y={y(112) - 2} text="1. zamknięcie NAD Kijun 52" color={C_ENTRY} anchor="end" />
          <Arrow x1={x(sig + 1) + 40} y1={y(94)} x2={x(sig + 1) + 4} y2={y(102.3)} color="#4ade80" />
          <Tag x={x(sig + 1) + 44} y={y(94) + 4} text="2. KUP na otwarciu następnej sesji" color="#4ade80" />
          <Arrow x1={x(6)} y1={y(91.5)} x2={x(6)} y2={y(88.9)} color={C_MA} />
          <Tag x={x(6) + 6} y={y(91.5) + 2} text="3. cena nad MA200" color={C_MA} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 2. Dokładka ---------- */
const ADD_CLOSES = [
  102, 103, 102.5, 104, 105, 104.5, 106, 106.5, 108.5, 110, 111, 110.5, 112, 113, 112, 114, 115, 114.5, 116, 117, 116, 118,
  119, 118.5, 120, 121, 120, 122, 121, 123,
];

export function AddChart() {
  const n = ADD_CLOSES.length;
  const top = ramp(n, 107, 105.5);
  const bottom = ramp(n, 101, 104);
  const at = 8;
  return (
    <MiniChart
      closes={ADD_CLOSES}
      min={88}
      max={126}
      cloud={{ top, bottom }}
      lines={[
        { values: ramp(n, 100, 102.5), color: C_KIJUN, label: "Kijun 52" },
        { values: ramp(n, 92, 95), color: C_MA, label: "MA200" },
      ]}
      caption="Dokładka: pierwszy raz po wejściu zamknięcie NAD chmurą i ocena 5 linii ≥ +2. Dokładasz +5% kapitału na kolejnym otwarciu. Od tej chwili pozycja jest „uzbrojona” (można ją zamknąć regułą wyjścia)."
    >
      {({ x, y }) => (
        <>
          <Tag x={x(0)} y={y(110)} text="wejście (z kroku 1)" color="#94a3b8" />
          <circle cx={x(at)} cy={y(108.5)} r={10} fill="none" stroke={C_ENTRY} strokeWidth={2} />
          <Arrow x1={x(at) + 70} y1={y(98)} x2={x(at) + 8} y2={y(107.5)} color={C_ENTRY} />
          <Tag x={x(at) + 74} y={y(98) + 4} text="zamknięcie NAD chmurą + ocena ≥ +2" color={C_ENTRY} />
          <Tag x={x(at) + 74} y={y(98) + 20} text="→ DOKŁADKA +5% + pozycja „uzbrojona”" color="#4ade80" />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 3. Wyjście normalne ---------- */
const EXIT_CLOSES = [126, 128, 130, 131, 129, 130, 128, 127, 125, 124, 119.5, 122.5, 120, 118, 117.5, 116, 115, 114, 113, 115, 112, 110];

export function ExitChart() {
  const n = EXIT_CLOSES.length;
  const counts: [number, string][] = [
    [12, "1"],
    [13, "2"],
    [14, "3"],
    [15, "4"],
    [16, "5"],
  ];
  return (
    <MiniChart
      closes={EXIT_CLOSES}
      min={98}
      max={136}
      fadeFrom={18}
      lines={[
        { values: flat(n, 121), color: C_KIJUN, label: "Kijun 52" },
        { values: flat(n, 102), color: C_ENTRY, label: "cena wejścia", dash: "5 4" },
      ]}
      caption="Wyjście: pozycja „uzbrojona”, 5 KOLEJNYCH zamknięć pod Kijun 52 i cena wciąż nad ceną wejścia (zysk) → sprzedaż na następnym otwarciu. Jedno zamknięcie z powrotem nad Kijun zeruje licznik."
    >
      {({ x, y }) => (
        <>
          <Tag x={x(10)} y={y(117)} text="1" color="#94a3b8" anchor="middle" />
          <Arrow x1={x(11) - 20} y1={y(130)} x2={x(11)} y2={y(124)} color="#94a3b8" />
          <Tag x={x(11) - 22} y={y(130) - 2} text="wróciła nad Kijun → licznik od nowa" color="#94a3b8" anchor="end" />
          {counts.map(([i, t]) => (
            <Tag key={i} x={x(i)} y={y(EXIT_CLOSES[i]) + 20} text={t} color={C_DOWN} anchor="middle" />
          ))}
          <Arrow x1={x(17) + 36} y1={y(129)} x2={x(17) + 3} y2={y(117)} color="#f87171" />
          <Tag x={x(17) + 6} y={y(131)} text="SPRZEDAJ na otwarciu" color="#f87171" anchor="middle" />
          <Tag x={x(3)} y={y(108)} text="pozycja na plusie (cena nad wejściem)" color={C_ENTRY} />
        </>
      )}
    </MiniChart>
  );
}

/* ---------- 4. Wyjście awaryjne ---------- */
const EMERG_CLOSES = [
  109, 108, 107, 105.5, 104, 103, 102.5, 101.5, 98, 97, 95, 96, 94, 93, 94.5, 92, 91, 93, 92.5, 90, 91.5, 92, 90.5, 89, 91,
  92, 93, 92, 94, 93.5, 95, 94, 96, 95, 96.5, 97, 96, 95.5, 95, 96,
];

export function EmergencyChart() {
  const n = EMERG_CLOSES.length;
  return (
    <MiniChart
      closes={EMERG_CLOSES}
      min={84}
      max={114}
      fadeFrom={38}
      lines={[
        { values: ramp(n, 100.8, 99), color: C_MA, label: "MA200" },
        { values: flat(n, 110), color: C_ENTRY, label: "cena wejścia", dash: "5 4" },
      ]}
      caption="Wyjście awaryjne: 60 kolejnych zamknięć pod MA200 (ok. 3 miesiące) → sprzedajesz także ze stratą. Na rysunku okres jest skrócony."
    >
      {({ x, y }) => (
        <>
          <line x1={x(8)} x2={x(37)} y1={y(87)} y2={y(87)} stroke="#f87171" strokeWidth={1.5} />
          <line x1={x(8)} x2={x(8)} y1={y(86)} y2={y(88)} stroke="#f87171" strokeWidth={1.5} />
          <line x1={x(37)} x2={x(37)} y1={y(86)} y2={y(88)} stroke="#f87171" strokeWidth={1.5} />
          <Tag x={(x(8) + x(37)) / 2} y={y(87) + 16} text="60 kolejnych zamknięć pod MA200" color="#f87171" anchor="middle" />
          <Arrow x1={x(38) + 10} y1={y(106)} x2={x(38)} y2={y(97)} color="#f87171" />
          <Tag x={x(38) + 2} y={y(107)} text="SPRZEDAJ (ze stratą)" color="#f87171" anchor="middle" />
        </>
      )}
    </MiniChart>
  );
}
