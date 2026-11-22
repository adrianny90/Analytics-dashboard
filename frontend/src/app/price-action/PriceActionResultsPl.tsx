import { Box, DocTable, H3, Strong } from "@/components/DocBlocks";

import R from "./paResults.json";

type Cell = { exit: string; median: number; plus: number; both: number; win: number; avgR: number; n: number; mdd: number };
type Row = {
  strat: string; exit: string; fam: string; median: number; plus: number; both: number;
  mdd: number; n: number; win: number; avgR: number; h1: number; h2: number; pairs: number;
};

const usd = (v: number) => Math.round(v).toLocaleString("pl-PL");
const sign = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
const tone = (v: number, base = 10000) => (v > base ? "text-rise" : v < base ? "text-fall" : "");

const EXIT_LABEL: Record<string, string> = { r2: "2R", r3: "3R", lvl: "poziom", trail: "trailing" };

const STRAT_LABEL = (s: string) =>
  s
    .replace(/^pa:all:/, "PA wszystkie: ")
    .replace(/^pa:/, "PA ")
    .replace(/^ichi:/, "Ichimoku ")
    .replace(/^xpa:/, "Ichimoku + PA: ")
    .replace(/^combo:/, "PA + ")
    .replaceAll(":", " ");

function rowCells(r: Row) {
  return [
    <span key="s" className="font-mono text-xs">{STRAT_LABEL(r.strat)}</span>,
    EXIT_LABEL[r.exit] ?? r.exit,
    <span key="m" className={tone(r.median)}>{usd(r.median)}</span>,
    `${r.plus}/${r.pairs}`,
    `${r.both}`,
    `${r.win.toFixed(0)}%`,
    sign(r.avgR),
    `${r.mdd.toFixed(0)}%`,
    r.n.toFixed(0),
    <span key="h" className="text-white/50">{usd(r.h1)} / {usd(r.h2)}</span>,
  ];
}
const ROW_HEAD = ["Strategia", "Wyjście", "Mediana 10 lat", "Pary na +", "Zysk w obu połówkach", "Trafność", "Śr. R", "Maks. DD", "Transakcji", "2016-21 / 2021-26"];

function cmp(c: Cell) {
  return (
    <span>
      <span className={tone(c.median)}>{usd(c.median)}</span>{" "}
      <span className="text-white/40">
        ({EXIT_LABEL[c.exit]}, {c.plus} par na +, {c.win.toFixed(0)}%, R {sign(c.avgR)}, n {c.n.toFixed(0)})
      </span>
    </span>
  );
}

export function PriceActionResultsPl() {
  const fams = R.best_by_fam as Record<string, Row[]>;
  const pairs = R.pairs as Record<string, { pair: string; y10: number; h1: number; h2: number; win: number; mdd: number; n: number }[]>;
  return (
    <div className="space-y-4">
      <p>
        Dane: Dukascopy (bid), świece H1 złożone w D1 z zamknięciem o 17:00 NY. Okres <Strong>18.11.2016 – 18.11.2026</Strong>{" "}
        (10 lat) oraz osobno obie połówki (2016-21 i 2021-26, każda od 10 000 USD) jako test stabilności. 32 pary walutowe
        (wszystkie kombinacje USD, EUR, GBP, JPY, CHF, AUD, NZD, CAD + SEK/NOK z pełną historią) + EURPLN i USDPLN pokazane
        osobno. Każda para testowana oddzielnie: 10 000 USD, ryzyko 5% bieżącego kapitału na transakcję, long i short.
        Przetestowano 45 strategii × 4 wyjścia = 180 wariantów na parę ({R.n_tested.toLocaleString("pl-PL")} kombinacji
        para × strategia).
      </p>

      <Box tone="warn" title="Najważniejsze wnioski">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Strong>Na koszyku walut żadna metoda nie ma przewagi.</Strong> Średni wynik transakcji (śr. R) dla najlepszych
            wariantów to ok. −0,05 do +0,07 R, czyli zero po kosztach. Mediana par po 10 latach jest poniżej 10 000 USD
            praktycznie dla wszystkich wariantów, a przy ryzyku 5% typowe obsunięcie na parze to −25% do −60%.
          </li>
          <li>
            <Strong>Sam price action wypada gorzej niż Ichimoku.</Strong> Wszystkie formacje razem z filtrem Fullera:
            mediana ok. 4 tys. USD (−60%); najlepsza formacja to <Strong>fakey z trendem</Strong> (ok. 9,2 tys., R +0,02).
            Pin bary mają ujemne oczekiwanie (−0,11 do −0,16 R) w każdej wersji. Filtr kontekstu Fullera (trend + poziom /
            strefa EMA) nie poprawia wyników względem formacji bez filtra.
          </li>
          <li>
            <Strong>Dołożenie price action do Ichimoku lekko pomaga.</Strong> Przy 7 z 8 przecięć potwierdzenie formacją PA
            w ciągu 5 świec podnosi medianę (z ok. 7–9 tys. do 9–10 tys.), zmienia śr. R z ok. −0,03 na ok. +0,03, zmniejsza
            obsunięcie i liczbę par na minusie. Trafność rośnie jednak tylko o 1–3 pkt proc. (35% → 37%). Główny efekt to
            mniej transakcji (ok. połowa) i odsianie słabszych sygnałów – nie powstaje z tego zyskowna strategia.
          </li>
          <li>
            <Strong>Odwrotnie (Ichimoku jako filtr do PA) – nie pomaga</Strong>, z wyjątkiem fakey (minimalnie).
          </li>
          <li>
            <Strong>Pary z JPY znów są najlepsze</Strong> i tu Ichimoku działa: przecięcie Chikou z wyjściem 3R – mediana
            14,6 tys. USD, 5 z 7 par na plusie, 4 z 7 zyskowne w obu połówkach, śr. R +0,22. Najczęściej wygrywająca para we
            wszystkich rodzinach strategii to <Strong>AUDJPY</Strong>, potem EURJPY, CHFJPY, USDJPY. Najgorsze: krzyżówki GBP,
            EURGBP, CADCHF, pary z NOK/SEK.
          </li>
          <li>
            <Strong>Ryzyko 5% jest za duże dla tych metod.</Strong> Portfel wszystkich par (5% na transakcję, do 4 pozycji
            naraz) w praktyce się zeruje w każdym wariancie poza jednym. Te same transakcje przy 2% dają podobne lub lepsze
            mediany przy o połowę mniejszych obsunięciach (tabela niżej).
          </li>
        </ul>
      </Box>

      <H3>Najlepsze warianty w każdej rodzinie (32 pary, 10 lat)</H3>
      <DocTable
        head={ROW_HEAD}
        rows={(["Ichimoku", "Ichimoku+PA", "PA+Ichimoku", "PA"] as const).flatMap((f) => (fams[f] ?? []).slice(0, 3).map(rowCells))}
        caption="Sortowanie: liczba par z zyskiem w obu połówkach, potem mediana. „Ichimoku+PA” = przecięcie + potwierdzenie formacją PA (xpa); „PA+Ichimoku” = formacja PA z filtrem / poziomem Ichimoku. Mediana = kapitał po 10 latach z 10 000 USD na typowej parze."
      />

      <H3>Czy price action poprawia Ichimoku?</H3>
      <DocTable
        head={["Przecięcie", "Samo Ichimoku (najlepsze wyjście)", "Ichimoku + potwierdzenie PA"]}
        rows={R.ichi_vs_xpa.map((r) => [<span key="x" className="font-mono text-xs">{r.cross}</span>, cmp(r.ichi), cmp(r.xpa)])}
        caption="Mediana kapitału 32 par po 10 latach; w nawiasie: wyjście, liczba par z zyskiem, trafność, średni wynik w R, mediana liczby transakcji."
      />

      <H3>Czy Ichimoku (lub filtr Fullera) poprawia price action?</H3>
      <DocTable
        head={["Formacja", "Bez filtra", "Trend EMA", "Filtr Fullera", "Filtr Ichimoku"]}
        rows={R.pa_vs_ichi.map((r) => [
          <span key="s" className="font-mono text-xs">{r.setup}</span>,
          cmp(r.raw), cmp(r.trend), cmp(r.fuller), cmp(r.ichi_filter),
        ])}
      />

      <H3>Pary z JPY (7 par)</H3>
      <DocTable head={ROW_HEAD} rows={(R.top_jpy as Row[]).slice(0, 10).map(rowCells)} />

      <H3>Na jakich parach – wynik 10 lat dla wybranych strategii</H3>
      {Object.entries(pairs).map(([key, list]) => {
        const [st, ex] = key.split("|");
        const top = list.slice(0, 6);
        const bottom = list.slice(-4);
        return (
          <div key={key} className="rounded-lg border border-white/10 p-3">
            <p className="font-mono text-xs text-white/80">
              {STRAT_LABEL(st)} · wyjście {EXIT_LABEL[ex]}
            </p>
            <p className="mt-1 text-xs">
              <span className="text-white/50">najlepsze: </span>
              {top.map((p) => (
                <span key={p.pair} className="mr-3 inline-block">
                  {p.pair.toUpperCase()} <span className={tone(p.y10)}>{usd(p.y10)}</span>
                  <span className="text-white/40"> ({usd(p.h1)} / {usd(p.h2)})</span>
                </span>
              ))}
            </p>
            <p className="mt-1 text-xs">
              <span className="text-white/50">najgorsze: </span>
              {bottom.map((p) => (
                <span key={p.pair} className="mr-3 inline-block">
                  {p.pair.toUpperCase()} <span className={tone(p.y10)}>{usd(p.y10)}</span>
                </span>
              ))}
            </p>
          </div>
        );
      })}
      <p className="text-xs text-white/40">W nawiasie: wynik 2016-21 / 2021-26 (każda połówka od 10 000 USD).</p>

      <H3>Najlepsze pojedyncze kombinacje para × strategia</H3>
      <DocTable
        head={["Para", "Strategia", "Wyjście", "10 lat", "2016-21", "2021-26", "Trafność", "Śr. R", "Maks. DD", "n"]}
        rows={R.top_combos.slice(0, 15).map((r) => [
          r.pair.toUpperCase(),
          <span key="s" className="font-mono text-xs">{STRAT_LABEL(r.strat)}</span>,
          EXIT_LABEL[r.exit],
          <span key="y" className="text-rise">{usd(r.y10)}</span>,
          usd(r.h1), usd(r.h2), `${r.win.toFixed(0)}%`, sign(r.avgR), `${r.mdd.toFixed(0)}%`, r.n,
        ])}
        caption={`Tylko kombinacje z zyskiem w obu połówkach i min. 20 transakcjami. Uwaga: z ${R.n_tested.toLocaleString("pl-PL")} kombinacji ${R.n_stable} (${Math.round((R.n_stable / R.n_tested) * 100)}%) ma zysk w obu połówkach – część najlepszych to przypadek (dopasowanie po fakcie). Wiarygodniejsze jest to, co się powtarza w wielu strategiach: AUDJPY i inne pary z JPY.`}
      />

      <H3>Portfele (5% ryzyka na transakcję, maks. 4 pozycje naraz)</H3>
      <DocTable
        head={["Strategia", "Wyjście", "32 pary: 10 lat", "DD", "JPY: 10 lat", "DD", "JPY 2016-21 / 2021-26"]}
        rows={R.portfolios.map((p) => [
          <span key="s" className="font-mono text-xs">{STRAT_LABEL(p.strat)}</span>,
          EXIT_LABEL[p.exit],
          <span key="a" className={tone(p["pary_10y"].final)}>{usd(p["pary_10y"].final)}</span>,
          `${p["pary_10y"].mdd.toFixed(0)}%`,
          <span key="b" className={tone(p.JPY_10y.final)}>{usd(p.JPY_10y.final)}</span>,
          `${p.JPY_10y.mdd.toFixed(0)}%`,
          `${usd(p["JPY_16-21"].final)} / ${usd(p["JPY_21-26"].final)}`,
        ])}
        caption="Do 4 pozycji × 5% = do 20% kapitału ryzykowanego naraz. Przy strategiach bez przewagi takie ryzyko prowadzi do bankructwa portfela wszystkich par; na koszyku JPY najlepiej wypada Chikou (Ichimoku i Ichimoku + PA)."
      />

      <H3>Ryzyko 5% vs 2% (te same transakcje)</H3>
      <DocTable
        head={["Strategia", "Pary", "5%: mediana", "5%: DD", "2%: mediana", "2%: DD"]}
        rows={[
          ["Ichimoku Chikou, 3R", "JPY", "14 589", "−38%", "12 233", "−17%"],
          ["Ichimoku + PA: Chikou, 3R", "JPY", "11 149", "−29%", "10 711", "−12%"],
          ["Ichimoku + PA: tk_strong, 2R", "JPY", "11 637", "−21%", "10 740", "−9%"],
          ["Ichimoku tk_strong, 2R", "32 pary", "8 678", "−39%", "9 665", "−17%"],
          ["Ichimoku + PA: tk_strong, 2R", "32 pary", "9 996", "−21%", "10 097", "−9%"],
          ["PA wszystkie, filtr Fullera, 2R", "32 pary", "4 053", "−79%", "7 528", "−43%"],
          ["PA fakey z trendem, poziom", "32 pary", "9 206", "−42%", "9 936", "−19%"],
        ]}
        caption="Przy strategii bez przewagi większe ryzyko nie zwiększa zysku, tylko zmienność i straty (efekt składania). Tylko tam, gdzie przewaga jest (JPY + Ichimoku), 5% daje więcej niż 2% – kosztem dwukrotnie głębszych obsunięć."
      />

      <Box tone="info" title="Ograniczenia testu">
        <ul className="list-disc space-y-1 pl-5">
          <li>Price action zapisany sztywnymi regułami – doświadczony trader odrzuca część „brzydkich” setupów, czego reguły nie oddają.</li>
          <li>Brak punktów swapowych: zaniża wyniki long na parach z JPY (dodatni carry), zawyża shorty na nich.</li>
          <li>Wynik w USD liczony jako zwrot z nominału pozycji (bez przeliczania waluty kwotowanej).</li>
          <li>Wyjścia 2R / 3R / poziom mają limit 120 świec (ok. 6 miesięcy).</li>
          <li>Wiele wariantów na tych samych danych – najlepsze pojedyncze wyniki są zawyżone przez dobór.</li>
          <li>Skrypty: backtests/pa_core.py, backtests/t_pa.py, backtests/t_pa_report.py; pełne tabele: backtests/out_pa.txt.</li>
        </ul>
      </Box>
    </div>
  );
}
