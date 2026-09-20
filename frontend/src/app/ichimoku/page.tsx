"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { IchimokuChart } from "@/components/IchimokuChart";
import { Spinner } from "@/components/Spinner";
import { getIchimoku, type Timeframe } from "@/lib/api";
import { TIMEFRAMES } from "@/lib/timeframes";
import type { IchimokuResponse } from "@/types/ichimoku";

function IchimokuPageContent() {
  const searchParams = useSearchParams();
  const initialSymbol = (searchParams.get("symbol") || "AAPL").toUpperCase();
  const [symbolInput, setSymbolInput] = useState(initialSymbol);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [thresholdPct, setThresholdPct] = useState(3);
  const [data, setData] = useState<IchimokuResponse | null>(null);
  // The timeframe actually fetched for `data`, kept separate from the live
  // `timeframe` state (which flips the instant a tab is clicked, before the
  // new request resolves) - IchimokuResponse carries no timeframe of its
  // own, so this is what lets the chart key/remount on the data that has
  // actually arrived instead of on the pending request.
  const [loadedTimeframe, setLoadedTimeframe] = useState<Timeframe>(timeframe);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    getIchimoku(symbol, timeframe, thresholdPct)
      .then((result) => {
        if (requestIdRef.current === requestId) {
          setData(result);
          setLoadedTimeframe(timeframe);
        }
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }, [symbol, timeframe, thresholdPct]);

  const timeframeLabel =
    TIMEFRAMES.find((tf) => tf.value === timeframe)?.label ?? timeframe;
  const showingStale = data !== null && (data.symbol !== symbol || loading);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Ichimoku Kinko Hyo</h1>
      <p className="mt-1 text-sm text-white/50">
        &ldquo;Wykres równowagi jednym spojrzeniem&rdquo; — system trendu, momentum i
        wsparcia/oporu zbudowany wyłącznie z ceny, opracowany przez Goichiego
        Hosody i opublikowany w 1968 roku.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSymbol(symbolInput.trim().toUpperCase());
        }}
        className="mt-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs text-white/50">Symbol</label>
          <input
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            disabled={loading}
            className="mt-1 w-28 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Wczytaj
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              type="button"
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                timeframe === tf.value
                  ? "bg-sky-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {tf.label}
            </button>
          ))}
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Spinner />
              wczytywanie {timeframeLabel}…
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50">
            Czułość fal ({thresholdPct}%)
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={thresholdPct}
            onChange={(event) => setThresholdPct(Number(event.target.value))}
            disabled={loading}
            className="mt-2 w-40 disabled:opacity-50"
          />
        </div>
      </form>

      {error && (
        <p className="mt-6 text-fall">
          Nie udało się wczytać {symbol}: {error}
        </p>
      )}

      {data && (
        <>
          <p className="mt-8 text-xs text-white/40">
            Pokazuję{" "}
            <span className="font-medium text-white/70">{data.symbol}</span> ·{" "}
            {timeframeLabel}
            {showingStale && " (odświeżanie…)"}
          </p>
          <div className="relative mt-2 min-h-[480px]">
            {/* Keyed on the *loaded* symbol+timeframe (data.symbol +
                loadedTimeframe), not the live selector state, so the chart
                only remounts once bars/points for that exact combination
                have actually arrived - otherwise a click's synchronous
                timeframe/symbol update remounts it immediately with the
                previous timeframe's still-in-props data, computing a
                zoom/pan state (array indices and a price range) against a
                dataset that's about to be swapped out from under it. */}
            <IchimokuChart
              key={`${data.symbol}-${loadedTimeframe}`}
              bars={data.bars}
              points={data.points}
              timeframe={loadedTimeframe}
            />
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Spinner size={16} />
                  Wczytywanie {symbol} · {timeframeLabel}…
                </div>
              </div>
            )}
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Ocena trendu</h2>
            <p className="mt-1 text-sm text-white/50">
              Na podstawie ostatnich {data.assessment.lookback_candles} świec,
              z perspektywą {data.assessment.forecast_candles} świec naprzód.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    data.assessment.outlook === "bullish"
                      ? "bg-rise/20 text-rise"
                      : data.assessment.outlook === "bearish"
                        ? "bg-fall/20 text-fall"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {data.assessment.outlook === "bullish"
                    ? "BYCZY"
                    : data.assessment.outlook === "bearish"
                      ? "NIEDŹWIEDZI"
                      : "NEUTRALNY"}
                </span>
                <span className="text-sm text-white/50">
                  {data.assessment.score > 0 ? "+" : ""}
                  {data.assessment.score} / {data.assessment.max_score} sygnałów
                </span>
              </div>
              <p className="mt-3 text-sm text-white/70">
                {data.assessment.summary}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {data.assessment.signals.map((signal, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-2 first:border-0 first:pt-0"
                  >
                    <span className="text-white/60">{signal.name}</span>
                    <span
                      className={
                        signal.bullish === true
                          ? "text-rise"
                          : signal.bullish === false
                            ? "text-fall"
                            : "text-white/40"
                      }
                    >
                      {signal.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Cele cenowe fal</h2>
            <p className="mt-1 text-sm text-white/50">
              Wyliczone z najnowszych punktów zwrotnych zygzaka (patrz &ldquo;Jak
              działa narzędzie zakresu&rdquo; poniżej). Najnowszy zestaw pierwszy.
            </p>
            {data.wave_targets.length === 0 ? (
              <p className="mt-4 text-sm text-white/40">
                Za mało punktów zwrotnych przy tej czułości — spróbuj obniżyć
                &ldquo;czułość fal&rdquo; albo wybrać dłuższy interwał czasowy.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {data.wave_targets.map((set, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs text-white/40">
                      {i === 0 ? "Bieżąca fala" : `${i + 1} fal temu`}
                    </p>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-white/50">Cel V</dt>
                        <dd>{set.v_target.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">Cel N</dt>
                        <dd>{set.n_target.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">Cel E</dt>
                        <dd>{set.e_target.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!data && loading && (
        <div className="mt-8 flex min-h-[480px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <Spinner size={16} />
            Wczytywanie {symbol} · {timeframeLabel}…
          </div>
        </div>
      )}

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-white/70">
        <h2 className="text-lg font-semibold text-white">Jak działa Ichimoku</h2>
        <p>
          Ichimoku Kinko Hyo rysuje pięć linii, wszystkie wyprowadzone wyłącznie z
          ceny (bez osobnego wzoru oscylatora):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-sky-400">Tenkan-sen</strong> (linia konwersji,
            niebieska) — środek zakresu wysoka/niska z 9 okresów. Reaguje
            najszybciej; miernik trendu krótkoterminowego.
          </li>
          <li>
            <strong className="text-orange-400">Kijun-sen</strong> (linia bazowa,
            pomarańczowa) — środek zakresu wysoka/niska z 26 okresów. Wolniejsza;
            często traktowana jako dynamiczny poziom wsparcia/oporu i przesuwany
            stop-loss. Przecięcie Tenkan powyżej/poniżej Kijun to klasyczny sygnał
            wejścia Ichimoku &ldquo;TK cross&rdquo;.
          </li>
          <li>
            <strong>Senkou Span A / B</strong> (chmura, zielona/czerwona) — średnia
            z Tenkan+Kijun (Span A) i środek zakresu wysoka/niska z 52 okresów
            (Span B), obie narysowane 26 okresów <em>naprzód</em> względem ceny.
            Zacieniowany obszar między nimi to &ldquo;Kumo&rdquo; (chmura): zielona
            gdy Span A jest powyżej Span B (nastawienie bycze), czerwona gdy
            odwrotnie (nastawienie niedźwiedzie). Cena powyżej chmury sugeruje
            trend wzrostowy; poniżej sugeruje trend spadkowy; wewnątrz sugeruje
            konsolidację/przejście. Gruba chmura sugeruje silniejsze
            wsparcie/opór; cienka (albo &ldquo;skręt&rdquo;, gdzie A przecina B)
            sygnalizuje potencjalną zmianę trendu.
          </li>
          <li>
            <strong className="text-purple-400">Chikou Span</strong> (linia
            opóźniona, fioletowa) — dzisiejsze zamknięcie narysowane 26 okresów{" "}
            <em>wstecz</em>. Chikou wyraźnie oddalone od przeszłej ceny w
            kierunku trendu potwierdza trend; Chikou splątane z przeszłą ceną
            sugeruje niezdecydowanie.
          </li>
        </ul>
        <p>
          Ponieważ Span A/B są rzutowane naprzód przy użyciu danych, które już
          istnieją dzisiaj, chmura widoczna przed bieżącą świecą nie jest
          prognozą — to znany, przyszły kształt wyliczony z ostatnich 26-52
          okresów.
        </p>

        <h2 className="text-lg font-semibold text-white">
          Jak działa ocena trendu
        </h2>
        <p>
          Panel powyżej celów fal punktuje pięć standardowych sygnałów Ichimoku
          — cenę względem chmury, Tenkan względem Kijun, Chikou span względem
          ceny sprzed 26 okresów, momentum ceny w oknie lookback oraz kolor
          samej chmury w oknie prognozy (już policzalny dzisiaj, bo zbudowany z
          przesuniętych danych z przeszłości) — każdy wnosi +1 (byczy), -1
          (niedźwiedzi) albo 0 (neutralny/za mało danych). Suma +2 lub więcej
          jest oznaczana jako Byczy, -2 lub mniej jako Niedźwiedzi, wszystko
          pomiędzy jako Neutralny. To prosta lista reguł, nie model
          statystyczny — traktuj to jako podsumowanie tego, co wykres już
          pokazuje, nie jako niezależną prognozę.
        </p>

        <h2 className="text-lg font-semibold text-white">
          Jak działa narzędzie zakresu / celów fal
        </h2>
        <p>
          Poza pięcioma liniami, klasyczna teoria Ichimoku (&ldquo;zasada
          fal&rdquo; Hosody) zawiera arytmetykę celów cenowych opartą na
          wielkości ostatnich wychyleń (&ldquo;fal&rdquo;). To narzędzie
          automatyzuje krok identyfikacji fal prostym zygzakiem: przechodzi
          przez ceny zamknięcia i oznacza nowy punkt zwrotny za każdym razem,
          gdy cena odwraca się o co najmniej wartość procentową &ldquo;czułości
          fal&rdquo; ustawioną powyżej (domyślnie 3%). Obniż ją, żeby złapać
          mniejsze wychylenia na spokojniejszych lub dłuższych interwałach;
          podnieś, żeby odfiltrować szum na zmiennych tickerach.
        </p>
        <p>
          Mając trzy kolejne punkty zwrotne A (najstarszy) → B (środkowy) → C
          (najnowszy), narzędzie wyznacza:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Wyliczenie N</strong> — <code>C + (B − A)</code>. Najczęściej
            używany cel: zakłada, że kolejny odcinek powtórzy wielkość odcinka
            A→B, kontynuując w kierunku B→C. Ogólnie uznawany za najbardziej
            wiarygodny z trzech.
          </li>
          <li>
            <strong>Wyliczenie V</strong> — <code>C − (B − A)</code>. Lustrzane
            odbicie N; cel dla ostrzejszego odwrócenia w C, jakby rysując kształt
            V lub W.
          </li>
          <li>
            <strong>Wyliczenie E</strong> — <code>C + (C − B)</code>. Cel
            rozszerzenia: zakłada, że bieżący odcinek B→C po prostu powtórzy się
            jeszcze raz od C.
          </li>
        </ul>
        <p>
          To dokładnie tyle, ile brzmi — arytmetyczne projekcje z heurystycznego
          detektora punktów zwrotnych, nie gwarancje. Praktycy Ichimoku
          traktują je jako jeden z elementów obok chmury, TK cross i
          potwierdzenia Chikou, nie jako samodzielny sygnał. Różne teksty o
          Ichimoku definiują też czwarte wyliczenie (&ldquo;NT&rdquo;) nieco
          inaczej w zależności od źródła, więc celowo zostało tu pominięte
          zamiast ryzykować podanie go błędnie — traktuj V/N/E jako punkt
          wyjścia do własnej analizy, nie jako poradę inwestycyjną.
        </p>
      </section>
    </main>
  );
}

export default function IchimokuPage() {
  return (
    <Suspense fallback={null}>
      <IchimokuPageContent />
    </Suspense>
  );
}
