import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";

const OK = <span className="text-rise">✓</span>;
const XX = <span className="text-fall">✗</span>;

// [ticker, data, cena, strefa wg autora, strefa modelu, LOO, opis]
const SIGNALS: [string, string, string, string, string, boolean, string][] = [
  ["APP", "09.2025", "745,61", "Strong Trim", "Strong Trim", true, "poziom = dokładny szczyt miesiąca"],
  ["APP", "10.2026", "225,19", "4X", "4X", true, "poziom = dokładny dołek miesiąca"],
  ["APP", "23.10.2026", "260,25", "4X", "4X", true, "post o zakupie LEAPS"],
  ["UBER", "06.2022", "20,46", "4X", "4X", true, "jedyne 4X w historii, +111% po 12 mies."],
  ["UBER", "28.10.2026", "65,27", "4X", "4X", false, "pudło w LOO"],
  ["MRVL", "04.2025", "55", "kupno (2X–4X)", "3X", true, ""],
  ["MRVL", "06.2026", "329,73", "trim", "Strong Trim", true, "„przebił wszystkie poziomy trim”"],
  ["MRVL", "10.2026", "196,40", "1X", "1X", true, "poziom = dokładne zamknięcie miesiąca"],
  ["AMD", "02.2025", "99", "kupno (2X–4X)", "4X", true, ""],
  ["AMD", "09.2026", "590", "Strong Trim", "Strong Trim", false, "pudło w LOO"],
  ["NBIS", "06.2026", "276,17", "Strong Trim", "Strong Trim", true, "poziom = zamknięcie miesiąca"],
  ["NBIS", "17.10.2026", "165,47", "jeszcze nie kupno", "1X", true, ""],
  ["NBIS", "13.11.2026", "123", "3X", "3X", true, ""],
  ["PLTR", "06.2026", "107", "kupno (2X–4X)", "4X", true, "„druga okazja w 4 lata”"],
  ["META", "27.10.2026", "620,19", "1X", "1X", true, "„not the Buy Zone”"],
  ["ORCL", "07.2026", "114,08", "4X", "4X", true, "„pierwsze 4X od bessy 2022”"],
  ["SOFI", "03.2026", "15", "3X", "3X", true, ""],
  ["CRWD", "10.2026", "285", "Strong Trim", "Strong Trim", true, "potem −20%"],
  ["RDDT", "20.08.2026", "150,31", "kupno (2X–4X)", "3X", true, ""],
  ["RDDT", "14.11.2026", "98,45", "4X", "4X", true, ""],
  ["BTC", "06.2026", "58 559", "4X", "4X", true, "potem +45%"],
  ["BTC", "22.10.2026", "81 312", "1X", "1X", true, "„z 4X do 1X”"],
  ["ETH", "06.2026", "1 506", "kupno (2X–4X)", "4X", true, "potem +65%"],
  ["NFLX", "10.11.2026", "63,26", "4X", "4X", true, ""],
];

export function DcaWskaznikPl() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Wskaźnik DCA (odtworzenie DCA Optimizer)</h1>
      <p className="mt-1 text-sm text-white/50">
        Próba odtworzenia płatnego wskaźnika DCA Optimizer (dcaoptimizer.com, autor: RonnieV), który dzieli wykres na strefy
        kupna 1X–4X oraz strefy częściowej realizacji zysków (Light / Strong Trim). Autor nie publikuje wzoru, więc
        odtwarzamy go z publicznych sygnałów. Stan na 18.11.2026 – model roboczy, do dalszej walidacji.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Status: hipoteza robocza">
          <p>
            Model trafia <Strong>24 z 24</Strong> znanych sygnałów, a w uczciwym teście (LOO, opis w sekcji 4){" "}
            <Strong>22 z 24 (92%)</Strong>. Baza jest jednak mała (24 sygnały z postów autora, który pokazuje głównie
            udane przypadki), a wiele podobnych wariantów wzoru pasuje równie dobrze. Na nowych spółkach zgodność jest
            prawdopodobnie niższa (szacunkowo 70–85%). Każda nowa obserwacja z prawdziwego wskaźnika pomoże to zweryfikować –
            sekcja 7.
          </p>
        </Box>

        <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="mb-1 font-semibold text-white/80">Spis sekcji</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li><a href="#oryginal" className="hover:text-white">Co robi oryginalny wskaźnik</a></li>
            <li><a href="#model" className="hover:text-white">Odtworzony wzór (aktualna wersja)</a></li>
            <li><a href="#dane" className="hover:text-white">Na jakich danych</a></li>
            <li><a href="#skutecznosc" className="hover:text-white">Skuteczność odtworzenia</a></li>
            <li><a href="#droga" className="hover:text-white">Jak do tego doszliśmy (co odrzuciliśmy)</a></li>
            <li><a href="#problemy" className="hover:text-white">Co poszło nie tak / ograniczenia</a></li>
            <li><a href="#walidacja" className="hover:text-white">Jak dodawać dane i walidować</a></li>
          </ol>
        </nav>

        <H2 id="oryginal">1. Co robi oryginalny wskaźnik</H2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Co miesiąc nadaje spółce (lub kryptowalucie) strefę: <Strong>4X</Strong> (najmocniejsze kupno), <Strong>3X</Strong>,{" "}
            <Strong>2X</Strong>, <Strong>1X</Strong> (normalna wpłata / trzymaj), <Strong>Light Trim</Strong> i{" "}
            <Strong>Strong Trim</Strong> (rozważ częściową sprzedaż). Mnożnik dotyczy twojej stałej wpłaty – przy 500 USD
            strefa 3X to 1 500 USD.
          </li>
          <li>
            Strefa jest potwierdzana na zamknięciu miesiąca (liczona z dziennych zamknięć, aktualizacja w dni robocze po 18:00
            czasu NY). W trakcie miesiąca pokazuje „dotknięcia” mocniejszej strefy. Ma też widok tygodniowy, kwartalny i roczny.
          </li>
          <li>
            Obok strefy są plakietki fundamentalne (przepływy pieniężne, dług, rosnący FCF, „stabilizacja tygodniowa”) – ale
            według naszych testów <Strong>nie wpływają one na samą strefę</Strong>.
          </li>
          <li>
            Działa także na BTC i ETH – to pierwszy mocny sygnał, że strefa wynika z ceny, a nie z wyników finansowych.
          </li>
        </ul>

        <H2 id="model">2. Odtworzony wzór (aktualna wersja)</H2>
        <Box tone="good" title="Wynik = 2/3 × RSI(14) miesięczny + 1/3 × Williams %R(14) tygodniowy">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Z dziennych notowań budujemy świece miesięczne i tygodniowe (bieżąca świeca może być niepełna).</li>
            <li>Liczymy RSI(14) na świecach miesięcznych i Williams %R(14) na tygodniowych.</li>
            <li>
              Każdą wartość zamieniamy na <Strong>percentyl „wyprzedania”</Strong> względem historii wszystkich spółek
              (0 = najbardziej wykupione w historii, 1 = najbardziej wyprzedane).
            </li>
            <li>Łączymy: 2/3 percentyla RSI + 1/3 percentyla %R, i wynik ponownie zamieniamy na percentyl.</li>
            <li>Strefę wyznaczają progi tego percentyla (tabela niżej).</li>
          </ol>
        </Box>
        <DocTable
          head={["Strefa", "Percentyl wyniku", "Typowy RSI(14) mies.", "Typowy %R(14) tyg.", "Udział miesięcy w historii"]}
          rows={[
            ["Strong Trim", "≤ 0,15", "~76", "~−11", "14%"],
            ["Light Trim", "0,15–0,20", "~69", "~−20", "5%"],
            ["1X / trzymaj", "0,20–0,70", "~57", "~−39", "47%"],
            ["2X", "0,70–0,75", "~48", "~−65", "5%"],
            ["3X", "0,75–0,92", "~44", "~−76", "16%"],
            ["4X", "≥ 0,92", "~38", "~−91", "7,5%"],
          ]}
          caption="Typowe wartości to mediany z historii ok. 60 spółek / instrumentów w danej strefie – orientacyjnie, bo strefa zależy od kombinacji obu wskaźników."
        />
        <p>
          W skrócie: <Strong>strefy kupna to miesięczny RSI poniżej ~50 przy tygodniowym %R w dolnej ćwiartce</Strong>, a
          strefy trim to RSI powyżej ~70 przy %R przy szczycie zakresu. To klasyczny wskaźnik powrotu do średniej na długim
          interwale – kupuje mocniej, im głębsza wyprzedaż.
        </p>

        <H2 id="dane">3. Na jakich danych</H2>
        <H3>Sygnały prawdziwego wskaźnika (baza do dopasowania)</H3>
        <p>
          24 sygnały z datą, ceną i strefą z postów autora na X (@TheRonnieVShow) i ich przedruków na KuCoin News, 10.2026–11.2026,
          dla 15 instrumentów. Daty postów z X odczytaliśmy z identyfikatorów wpisów. Wiele poziomów pokrywa się co do centa z
          maksimum, minimum lub zamknięciem miesiąca (np. APP 745,61 i 225,19), co potwierdza, że wskaźnik działa na świecach
          miesięcznych.
        </p>
        <p>Dodatkowo 3 ograniczenia częstotliwości z postów oraz 1 test poza próbą:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>UBER: 14 miesięcy w strefach kupna w całej historii, tylko jedno 4X (06.2022).</li>
          <li>PLTR: czerwiec 2026 był „drugą okazją do kupna w ciągu 4 lat”.</li>
          <li>ORCL: 4X w 07.2026 było „pierwszym od bessy 2022”.</li>
          <li>Test poza próbą (nieużywany do dopasowania): skan tematów z 05.10.2026 – uran 89% spółek w 3X–4X, solar 58%, półprzewodniki prawie wszystkie 1X.</li>
        </ul>
        <H3>Dane rynkowe i fundamentalne</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Notowania dzienne OHLCV z Yahoo Finance (yfinance), pełna historia, ok. 60 instrumentów (spółki z sygnałów, koszyki uranu, solarów, półprzewodników, BTC, ETH).</li>
          <li>Do testu wersji fundamentalnej: kwartalne przychody i zyski z SEC EDGAR (P/S, P/E z opóźnieniem 45 dni) oraz historia celów cenowych analityków.</li>
        </ul>

        <H2 id="skutecznosc">4. Skuteczność odtworzenia</H2>
        <DocTable
          head={["Miara", "Wynik", "Co znaczy"]}
          rows={[
            ["Dopasowanie (wszystkie sygnały)", "24/24 + 3/3 ograniczenia", "wzór i progi dobrane na tych samych danych – zawyżone"],
            [<Strong key="l">Zagnieżdżone LOO</Strong>, <Strong key="v">22/24 = 92%</Strong>, "dla każdego sygnału wagi i progi dobierane bez niego, potem sprawdzenie – uczciwa miara"],
            ["Test poza próbą – półprzewodniki", "0% w strefach kupna (cel: ~0%)", "zgodne; ale 40% w trim zamiast 1X"],
            ["Test poza próbą – uran", "71% w 3X–4X (cel: 89%)", "kierunek zgodny, za mało"],
            ["Test poza próbą – solar", "86% w 3X–4X (cel: 58%)", "kierunek zgodny, za dużo"],
          ]}
        />
        <H3>Sygnały a model</H3>
        <DocTable
          head={["Instrument", "Data", "Cena", "Autor", "Model", "LOO", "Uwagi"]}
          rows={SIGNALS.map(([t, d, p, a, m, loo, n]) => [t, d, p, a, m, loo ? OK : XX, <span key="n" className="text-white/50">{n}</span>])}
          caption="Kolumna „Model” – dopasowanie na wszystkich sygnałach (wszystkie zgodne). LOO – czy sygnał trafiony, gdy model dobrano bez niego."
        />

        <H2 id="droga">5. Jak do tego doszliśmy (co odrzuciliśmy)</H2>
        <DocTable
          head={["Etap", "Hipoteza", "Najlepsza trafność (LOO)", "Wniosek"]}
          rows={[
            ["1", "Fundamenty: P/E, P/S, potencjał wg analityków", "3–8 z 16–18", <span key="1" className="text-fall">odrzucone – nie odtwarza stref, nie działa na BTC/ETH</span>],
            ["1", "Cena: odchylenie od średniej 10/20/36/60 mies., spadek od szczytu, trend", "16–20 z 24", "rodzina pasuje (powrót do średniej)"],
            ["1", "RSI(14) miesięczny", "21/24, ograniczenia 2/3", "najlepszy pojedynczy"],
            ["2", "Inne oscylatory: stochastic, Williams %R 6–28, CCI, Bollinger %B, MACD, ROC, Ultimate", "do 22/24", "podobnie dobre: RSI 9, CCI, %R 21"],
            ["2", "Wolumen: MFI, Chaikin Money Flow, OBV, skoki wolumenu, RSI wolumenu", "6–12 z 24", <span key="2" className="text-fall">wolumen nie wpływa na strefę</span>],
            ["2", "VWAP 20 mies. (cena ważona wolumenem)", "16/20", "działa, ale to w praktyce miara ceny"],
            ["3", "Kombinacje ważone (665 zestawów wag × 8008 progów)", <Strong key="3">22/24, ograniczenia 3/3</Strong>, <span key="4" className="text-rise">RSI mies. + %R tyg. – obecny model</span>],
          ]}
        />

        <H2 id="problemy">6. Co poszło nie tak / ograniczenia</H2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Strong>Model nie jest jednoznaczny.</Strong> 79 różnych zestawów wag daje komplet trafień (zawsze RSI miesięczny +
            Williams %R, czasem z RSI 9 lub CCI). Wybraliśmy najprostszy. Do rozstrzygnięcia potrzeba więcej sygnałów.
          </li>
          <li>
            <Strong>Za dużo „trim” na półprzewodnikach</Strong> (40% wobec „prawie wszystkich w 1X” u autora) – albo jego 1X
            obejmuje część naszego Light Trim, albo progi trim są u niego wyżej.
          </li>
          <li>
            <Strong>UBER ma u nas za dużo miesięcy 4X w 2022</Strong> w prostszych wariantach – ograniczenie spełnia dopiero
            połączenie z %R tygodniowym.
          </li>
          <li>
            Pierwsze dopasowanie progów było zdegenerowane (strefa 2X od 12. percentyla – prawie wszystko było „kupnem”). Poprawka:
            wymaganie realistycznej częstości stref kupna (10–35% miesięcy, jak u UBER).
          </li>
          <li>
            Sygnały pochodzą od autora wskaźnika – to głównie udane przypadki. Nie znamy sygnałów, które się nie sprawdziły, ani
            pełnej historii stref.
          </li>
          <li>
            Część sygnałów ma przybliżoną datę (np. „BUY przy 55 USD” bez daty – przypisany miesiąc, w którym cena była w tej
            okolicy).
          </li>
          <li>
            Nie sprawdziliśmy jeszcze, czy wskaźnik <Strong>zarabia</Strong> – tylko czy odtwarza sygnały. Reklamowane „90% wygranych
            z DCA” nie podaje, czy porównanie jest przy tej samej łącznej kwocie wpłat.
          </li>
        </ul>

        <H2 id="walidacja">7. Jak dodawać dane i walidować</H2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Każdy nowy sygnał prawdziwego wskaźnika (zrzut ekranu z dcaoptimizer.com, post, okres próbny) dopisujemy do listy{" "}
            <code className="rounded bg-white/10 px-1">OBS</code> w <code className="rounded bg-white/10 px-1">backtests/t_dcaopt.py</code>:
            ticker, data, cena (lub puste = zamknięcie z tego dnia), strefa od–do, opis.
          </li>
          <li>
            <Strong>Najpierw walidacja</Strong>: sprawdzamy, czy obecny model (bez ponownego dopasowania) trafia nowe sygnały – to
            jedyna prawdziwa miara poza próbą. Cel: ≥ 90%.
          </li>
          <li>
            Potem ponowne dopasowanie: <code className="rounded bg-white/10 px-1">python backtests/t_dcaopt3.py</code> (wagi, progi,
            zagnieżdżone LOO, test tematów); wyniki w <code className="rounded bg-white/10 px-1">backtests/out_dcaopt3.txt</code>.
          </li>
          <li>
            Najcenniejsze dane: pełna historia stref (kolory świec miesięcznych) dla 20–30 spółek z różnych sektorów – pozwoli ustalić
            długości okien (RSI 14 czy 9, %R 14 czy 21) i progi trim.
          </li>
          <li>
            Kolejne kroki: kolumna ze strefą przy spółkach w aplikacji oraz backtest „wpłaty 1X–4X + trim” wobec zwykłego DCA przy tej
            samej łącznej kwocie.
          </li>
        </ol>
        <p className="text-xs text-white/40">
          Skrypty: backtests/t_dcaopt.py (dane, sygnały, modele cenowe i fundamentalne), t_dcaopt2.py (oscylatory, Williams %R,
          wolumen), t_dcaopt3.py (wagi i walidacja). Wyniki: backtests/out_dcaopt*.txt.
        </p>
      </div>
    </main>
  );
}
