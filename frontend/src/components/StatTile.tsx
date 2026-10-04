export function StatTile({ label, value, tone, hint }: { label: string; value: string; tone?: "rise" | "fall"; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" title={hint}>
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone === "rise" ? "text-rise" : tone === "fall" ? "text-fall" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
