import type { RankingStatus } from "@/types/market";

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="h-full rounded-full bg-rise transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Progress bar while a run is going, then the "Finished" label describing
 *  what was downloaded and saved, plus the hourly H1/H4 refresh. */
export function RankingRunStatus({ status }: { status: RankingStatus | null }) {
  if (!status) return null;

  const { summary } = status;
  const isRunning = status.status === "running";
  const bgRunning = status.background_status === "running";
  const outOf = (n: number) => `${n}/${summary?.symbols_total ?? 0}`;

  return (
    <div className="mt-4 space-y-3">
      {isRunning && (
        <ProgressBar
          label={
            status.phase === "targets"
              ? "Step 2/2 · Downloading analyst price targets (1 year)"
              : "Step 1/2 · Downloading prices, changes and D1 / W1 / H4 / H1 trends"
          }
          value={percent(status.processed, status.total)}
        />
      )}

      {status.status === "failed" && (
        <div className="rounded-xl border border-fall/30 bg-fall/10 p-4 text-sm">
          <span className="rounded bg-fall/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-fall">
            Failed
          </span>
          <p className="mt-2 text-white/70">
            The run stopped: {status.error ?? "unknown error"}. Nothing was overwritten - the previous saved ranking is
            still shown. Try again in a few minutes.
          </p>
        </div>
      )}

      {status.status === "finished" && summary && (
        <div className="rounded-xl border border-rise/30 bg-rise/5 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-rise/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-rise">
              Finished
            </span>
            <span className="text-xs text-white/50">{new Date(summary.finished_at).toLocaleString()}</span>
          </div>

          <p className="mt-3 text-xs font-semibold text-white/70">Downloaded and saved to the database:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-white/60">
            <li>
              <span className="text-white/80">Prices</span> (last close, day high/low, volume) -{" "}
              {outOf(summary.with_prices)} symbols
            </li>
            <li>
              <span className="text-white/80">Change and change %</span> for 1 day, 1 week, 1 month, 6 months and 1 year
              - {outOf(summary.with_changes)} symbols
            </li>
            <li>
              <span className="text-white/80">Ichimoku trends</span> D1 ({outOf(summary.with_trend_d1)}), W1 (
              {outOf(summary.with_trend_w1)}), H4 ({summary.with_trend_h4 != null ? outOf(summary.with_trend_h4) : "-"})
              and H1 ({summary.with_trend_h1 != null ? outOf(summary.with_trend_h1) : "-"})
            </li>
            <li>
              <span className="text-white/80">Analyst price targets</span> for the next year (low / median / high) -{" "}
              {outOf(summary.with_targets)} symbols with coverage; {summary.targets_fetched} downloaded now,{" "}
              {summary.targets_reused} reused from the database (cached for 12 hours)
            </li>
          </ul>

          <p className="mt-3 text-xs font-semibold text-white/70">Hourly H1 / H4 refresh:</p>
          {bgRunning ? (
            <div className="mt-2">
              <ProgressBar
                label="Refreshing H1 / H4 trends"
                value={percent(status.background_processed, status.background_total)}
              />
            </div>
          ) : status.background_status === "failed" ? (
            <p className="mt-1 text-xs text-fall">
              The last hourly refresh failed (usually Yahoo rate limiting); it will retry in an hour.
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/60">
              H1 and H4 are re-downloaded automatically every hour while the backend is running
              {status.intraday_updated_at
                ? ` (last: ${new Date(status.intraday_updated_at).toLocaleTimeString()}, next: about ${new Date(
                    new Date(status.intraday_updated_at).getTime() + 3600_000,
                  ).toLocaleTimeString()})`
                : ""}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
