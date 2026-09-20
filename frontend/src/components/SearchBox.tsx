"use client";

export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

export function SearchBox({
  value,
  onChange,
  resultLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  resultLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="search-box" className="text-sm font-medium text-white/70">
        Znajdź
      </label>
      <div className="relative">
        <input
          id="search-box"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="symbol lub sektor, np. AAPL, Tech"
          autoComplete="off"
          spellCheck={false}
          className="w-64 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 pr-8 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Wyczyść wyszukiwanie"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            ×
          </button>
        )}
      </div>
      {value.trim() && resultLabel && <span className="text-xs text-white/40">{resultLabel}</span>}
    </div>
  );
}
