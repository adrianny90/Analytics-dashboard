import type { ReactNode } from "react";

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-6 pt-8 text-xl font-semibold text-white">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-3 text-base font-semibold text-white/90">{children}</h3>;
}

export function Box({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "good";
  title: string;
  children: ReactNode;
}) {
  const color =
    tone === "warn"
      ? "border-amber-400/30 bg-amber-400/5"
      : tone === "good"
        ? "border-emerald-400/30 bg-emerald-400/5"
        : "border-sky-400/30 bg-sky-400/5";
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

export function DocTable({
  head,
  rows,
  caption,
}: {
  head: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/50">
            {head.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <p className="mt-1 text-xs text-white/40">{caption}</p>}
    </div>
  );
}

export const Strong = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-white">{children}</strong>
);
