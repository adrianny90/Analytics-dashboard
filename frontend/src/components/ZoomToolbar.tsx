"use client";

import { MAX_ZOOM, MIN_ZOOM } from "@/hooks/useTableZoom";
import { useLang } from "@/lib/i18n";

const btn = "rounded px-2 py-0.5 text-white/80 hover:bg-white/10 hover:text-white";

/** The −/slider/+/Fit/100% controls shared by every zoomable table (see
 *  useTableZoom). Fades in on hover/focus, like RankingTable's own toolbar,
 *  except on touch screens where it stays visible. */
export function ZoomToolbar({
  zoom,
  onZoomChange,
  onFit,
}: {
  zoom: number;
  onZoomChange: (next: number) => void;
  onFit: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-xs opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
      <button
        type="button"
        className={btn}
        onClick={() => onZoomChange(zoom - 0.1)}
        aria-label={t("Pomniejsz", "Zoom out", "Verkleinern")}
        title={t("Pomniejsz (Shift + scroll w dół)", "Zoom out (Shift + scroll down)", "Verkleinern (Umschalt + Scrollen nach unten)")}
      >
        −
      </button>
      <input
        type="range"
        min={MIN_ZOOM * 100}
        max={MAX_ZOOM * 100}
        step={5}
        value={Math.round(zoom * 100)}
        onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
        className="w-20 accent-sky-400 sm:w-28"
        aria-label={t("Powiększenie tabeli", "Table zoom", "Tabellenzoom")}
      />
      <button
        type="button"
        className={btn}
        onClick={() => onZoomChange(zoom + 0.1)}
        aria-label={t("Powiększ", "Zoom in", "Vergrößern")}
        title={t(
          "Powiększ (Shift + scroll w górę, lub rozsunięcie dwóch palców)",
          "Zoom in (Shift + scroll up, or pinch out with two fingers)",
          "Vergrößern (Umschalt + Scrollen nach oben oder Zwei-Finger-Zoom)",
        )}
      >
        +
      </button>
      <span className="w-9 text-center tabular-nums text-white/60">{Math.round(zoom * 100)}%</span>
      <button type="button" className={btn} onClick={onFit} title={t("Dopasuj szerokość tabeli do ekranu", "Fit the table width to the screen", "Tabellenbreite an den Bildschirm anpassen")}>
        {t("Dopasuj", "Fit", "Anpassen")}
      </button>
      <button type="button" className={btn} onClick={() => onZoomChange(1)} title={t("Powrót do 100%", "Back to 100%", "Zurück auf 100 %")}>
        100%
      </button>
    </div>
  );
}
