import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";
import { PaChart, type Ohlc } from "@/components/priceAction/PaChart";
import { PriceActionResultsPl } from "./PriceActionResultsPl";

// ---------------------------------------------------------------- przykładowe wykresy (szkice, nie dane rynkowe)
const TREND_PIN: Ohlc[] = [
  [100, 101.5, 99.5, 101], [101, 102.8, 100.6, 102.5], [102.5, 104, 102, 103.6], [103.6, 105.5, 103.2, 105.2],
  [105.2, 107, 104.8, 106.6], [106.6, 108.5, 106.2, 108.2], [108.2, 110, 107.8, 109.6], [109.6, 110.4, 108.2, 108.6],
  [108.6, 109, 107, 107.4], [107.4, 107.9, 106.2, 106.6], [106.4, 107.4, 103.8, 107.1], [107.2, 109.4, 107, 109.2],
  [109.2, 111.2, 108.9, 110.9], [110.9, 113, 110.5, 112.6], [112.6, 114.6, 112.2, 114.3],
];

const INSIDE_BAR: Ohlc[] = [
  [100, 101, 99.5, 100.6], [100.6, 101.8, 100.2, 101.4], [101.4, 102.2, 100.9, 101.1], [101.1, 102, 100.5, 101.7],
  [101.7, 103, 101.3, 102.6], [102.6, 103.4, 102, 102.8], [102.8, 106.6, 102.5, 106.2], [106, 106.3, 104.6, 105.3],
  [105.3, 107.8, 105, 107.5], [107.5, 109, 107.1, 108.7], [108.7, 110.2, 108.2, 109.9], [109.9, 111.5, 109.5, 111.2],
];

const FAKEY: Ohlc[] = [
  [104, 105.6, 103.6, 105.2], [105.2, 106, 104.5, 104.8], [104.8, 105.1, 103, 103.3], [103.3, 103.8, 101.6, 102],
  [102, 102.6, 100.3, 100.8], [100.8, 102.8, 100.2, 102.4], [102.2, 102.5, 101.2, 101.6], [101.6, 102.3, 99.2, 102.1],
  [102.1, 103.8, 101.9, 103.6], [103.6, 105.2, 103.3, 104.9], [104.9, 106.1, 104.6, 105.8],
];

const COUNTER_PIN: Ohlc[] = [
  [100, 101.4, 99.6, 101.2], [101.2, 102.9, 100.9, 102.6], [102.6, 104.6, 102.3, 104.3], [104.3, 106, 103.9, 105.7],
  [105.7, 107.5, 105.2, 107.2], [107.2, 108.6, 106.6, 108.3], [108.3, 112.4, 108.1, 108.6], [108.5, 108.8, 106.4, 106.7],
  [106.7, 107, 104.6, 105], [105, 105.4, 103, 103.4], [103.4, 103.8, 101.2, 101.6],
];

const ENGULF: Ohlc[] = [
  [106, 106.4, 104.8, 105], [105, 105.3, 103.6, 103.9], [103.9, 104.2, 102.4, 102.7], [102.7, 103, 101.2, 101.6],
  [101.6, 101.9, 100.3, 100.7], [100.6, 103.1, 100.1, 102.9], [102.9, 104.2, 102.6, 104], [104, 105.4, 103.8, 105.1],
  [105.1, 106.3, 104.7, 106],
];

const CHOP: Ohlc[] = [
  [103, 104.2, 102.6, 103.9], [103.9, 104.4, 102.9, 103.1], [103.1, 104, 102.7, 103.8], [103.8, 104.5, 103, 103.2],
  [103.2, 103.9, 102.4, 103.6], [103.6, 104.1, 102.2, 103.9], [103.9, 104.3, 103.1, 103.4], [103.4, 104.6, 103, 104.2],
  [104.2, 104.4, 102.9, 103.1], [103.1, 103.8, 102.5, 103.5],
];

const RANGE: Ohlc[] = [
  [102, 104, 101.6, 103.7], [103.7, 105.8, 103.4, 105.5], [105.5, 106.2, 104.4, 104.6], [104.6, 104.9, 102.6, 102.9],
  [102.9, 103.2, 100.9, 101.2], [101.2, 102.6, 99.6, 102.4], [102.4, 104.6, 102.1, 104.4], [104.4, 106.6, 104.1, 106],
  [106, 107.3, 104.4, 104.7], [104.7, 105, 103.1, 103.4], [103.4, 103.7, 101.7, 102],
];

const FALSE_BREAK: Ohlc[] = [
  [101, 102.4, 100.6, 102.2], [102.2, 103.6, 101.9, 103.4], [103.4, 104.8, 103, 104.5], [104.5, 104.9, 103.6, 103.9],
  [103.9, 104.6, 103.2, 104.4], [104.4, 106.3, 104.2, 104.5], [104.5, 104.7, 103, 103.2], [103.2, 103.5, 101.6, 101.9],
  [101.9, 102.2, 100.4, 100.7],
];

// Ichimoku: cofnięcie do Kijun w rynku nad chmurą + pin bar na Kijun
const ICHI_PIN: Ohlc[] = [
  [100, 101.5, 99.5, 101], [101, 102.8, 100.6, 102.5], [102.5, 104, 102, 103.6], [103.6, 105.5, 103.2, 105.2],
  [105.2, 107, 104.8, 106.6], [106.6, 108.5, 106.2, 108.2], [108.2, 110, 107.8, 109.6], [109.6, 110.4, 108.2, 108.6],
  [108.6, 109, 107, 107.4], [107.4, 107.9, 106.2, 106.6], [106.4, 107.4, 104.9, 107.1], [107.2, 109.4, 107, 109.2],
  [109.2, 111.2, 108.9, 110.9], [110.9, 113, 110.5, 112.6],
];
const ICHI_KIJUN = [100.5, 101.2, 101.8, 102.5, 103.2, 104, 104.75, 104.75, 105.1, 105.1, 105.4, 105.4, 106.3, 107.4];

export function PriceActionPl() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Price Action (metoda Nial Fullera)</h1>
      <p className="mt-1 text-sm text-white/50">
        Czytanie „gołego” wykresu dziennego: kontekst rynku, kluczowe poziomy i kilka powtarzalnych formacji świecowych
        (pin bar, inside bar, fakey, objęcie). Poniżej dokładny opis metody z przykładami, scenariusze rynkowe, sposób
        przełożenia jej na sztywne reguły oraz wyniki backtestu na parach walutowych (D1, 10 lat, ryzyko 5% na transakcję)
        w porównaniu z Ichimoku i z połączeniem obu metod.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Ważne zastrzeżenie">
          <p>
            Price action jest w oryginale metodą <Strong>uznaniową</Strong> – trader ocenia, czy formacja jest „ładna” i czy
            stoi w dobrym miejscu. Backtest wymaga reguł liczbowych, więc testujemy <Strong>przybliżenie</Strong> metody
            (sekcja 9), a nie decyzje doświadczonego tradera. Ryzyko 5% na transakcję jest kilka razy wyższe niż to, co
            zaleca sam Fuller (1–2%) – przy serii strat obsunięcia są bardzo głębokie. Wykresy na tej stronie to szkice
            ilustracyjne, nie dane rynkowe.
          </p>
        </Box>

        <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="mb-1 font-semibold text-white/80">Spis sekcji</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li><a href="#filozofia" className="hover:text-white">Filozofia metody</a></li>
            <li><a href="#kontekst" className="hover:text-white">Kontekst rynku: trend, konsolidacja, chaos</a></li>
            <li><a href="#poziomy" className="hover:text-white">Kluczowe poziomy i strefy</a></li>
            <li><a href="#setupy" className="hover:text-white">Setupy: pin bar, inside bar, fakey, objęcie, kombinacje</a></li>
            <li><a href="#wejscia" className="hover:text-white">Wejście, stop i cel</a></li>
            <li><a href="#scenariusze" className="hover:text-white">Scenariusze rynkowe (dobre i złe sytuacje)</a></li>
            <li><a href="#konfluencja" className="hover:text-white">Lista kontrolna konfluencji</a></li>
            <li><a href="#ryzyko" className="hover:text-white">Zarządzanie ryzykiem i psychologia</a></li>
            <li><a href="#reguly" className="hover:text-white">Reguły w backteście (definicje liczbowe)</a></li>
            <li><a href="#ichimoku" className="hover:text-white">Price action + Ichimoku: jak łączymy</a></li>
            <li><a href="#wyniki" className="hover:text-white">Wyniki backtestu (D1, 10 lat, 32 pary + PLN, ryzyko 5%)</a></li>
          </ol>
        </nav>

        {/* 1 */}
        <H2 id="filozofia">1. Filozofia metody</H2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Strong>Czysty wykres.</Strong> Bez oscylatorów (RSI, MACD, stochastic). Decyzja wynika z samych świec, poziomów
            i struktury rynku. Jedyne „wskaźniki” dopuszczane przez Fullera to średnie wykładnicze <Strong>EMA 8 i 21</Strong>{" "}
            jako dynamiczna strefa wsparcia/oporu w trendzie.
          </li>
          <li>
            <Strong>Wykres dzienny (D1) jako podstawa.</Strong> Świeca dzienna filtruje szum, a sygnały z D1 są
            najbardziej wiarygodne. Trader sprawdza rynek raz dziennie po zamknięciu świecy (u brokerów FX – 17:00 czasu
            nowojorskiego), stąd określenie <em>end-of-day trading</em>. W1 służy do wyznaczenia głównych poziomów, H4 –
            co najwyżej do precyzji.
          </li>
          <li>
            <Strong>Mniej znaczy więcej.</Strong> Kilka dobrych transakcji w miesiącu zamiast wielu przeciętnych.
            Większość dni to dni „bez sygnału” i to jest normalne.
          </li>
          <li>
            <Strong>Ustaw i zapomnij (set and forget).</Strong> Po otwarciu pozycji stop i cel są ustawione z góry, nie
            poprawia się ich pod wpływem emocji.
          </li>
          <li>
            <Strong>Kontekst ważniejszy niż formacja.</Strong> Ta sama świeca jest świetnym sygnałem na kluczowym poziomie w
            trendzie i bezwartościowym w środku chaotycznej konsolidacji.
          </li>
        </ul>

        {/* 2 */}
        <H2 id="kontekst">2. Kontekst rynku: trend, konsolidacja, chaos</H2>
        <p>Zanim spojrzymy na świecę, określamy, w jakim stanie jest rynek:</p>
        <DocTable
          head={["Stan rynku", "Jak rozpoznać", "Co robimy"]}
          rows={[
            [
              <Strong key="a">Trend wzrostowy</Strong>,
              "Coraz wyższe szczyty i dołki (HH/HL), cena nad EMA 21, EMA 8 nad EMA 21, EMA 21 rośnie",
              "Szukamy sygnałów kupna po korektach do poziomu lub strefy EMA 8–21; sprzedaż tylko na bardzo ważnym oporze",
            ],
            [
              <Strong key="b">Trend spadkowy</Strong>,
              "Coraz niższe szczyty i dołki (LH/LL), cena pod EMA 21, EMA 8 pod EMA 21, EMA 21 spada",
              "Lustrzanie: sygnały sprzedaży po odbiciach do oporu / strefy EMA",
            ],
            [
              <Strong key="c">Konsolidacja (range)</Strong>,
              "Cena odbija się między wyraźnym wsparciem a oporem, EMA płaskie i splecione",
              "Handel od krawędzi do krawędzi: kupno na wsparciu, sprzedaż na oporze, najlepiej po fakey / pin barze",
            ],
            [
              <Strong key="d">Rynek chaotyczny</Strong>,
              "Duże, nakładające się świece w obie strony, brak wyraźnych poziomów",
              "Nie handlujemy – to tu powstaje najwięcej fałszywych sygnałów",
            ],
          ]}
        />

        {/* 3 */}
        <H2 id="poziomy">3. Kluczowe poziomy i strefy</H2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Strong>Poziomy poziome (S/R).</Strong> Wyraźne szczyty i dołki widoczne „na pierwszy rzut oka” na D1 i W1.
            Liczą się te, od których cena wyraźnie odbijała – im więcej dotknięć, tym ważniejszy poziom.
          </li>
          <li>
            <Strong>Zmiana roli.</Strong> Przebity opór staje się wsparciem (i odwrotnie). Powrót do przebitego poziomu to
            jeden z najlepszych momentów na wejście z trendem.
          </li>
          <li>
            <Strong>Strefy wydarzeń (event areas).</Strong> Miejsca, gdzie zaczął się duży ruch albo powstała duża
            formacja (np. pin bar, który zawrócił rynek). Rynek ma „pamięć” takich miejsc.
          </li>
          <li>
            <Strong>Strefa dynamiczna EMA 8–21.</Strong> W silnym trendzie korekty często kończą się między EMA 8 a EMA 21.
          </li>
          <li>
            <Strong>Poziom 50% ruchu.</Strong> Połowa ostatniej fali – częste miejsce zakończenia korekty (Fuller używa go
            zamiast wielu poziomów Fibonacciego).
          </li>
          <li>
            Poziom to <Strong>strefa</Strong>, a nie jedna cena – ogon świecy może ją przebić o kilka pipsów.
          </li>
        </ul>

        {/* 4 */}
        <H2 id="setupy">4. Setupy</H2>

        <H3>4.1 Pin bar (świeca odrzucenia)</H3>
        <p>
          Długi ogon (cień) i mały korpus na przeciwnym końcu świecy. Ogon pokazuje, że cena próbowała iść w jedną stronę i
          została mocno odrzucona. <Strong>Byczy pin bar</Strong> ma długi dolny ogon, korpus w górnej części świecy.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ogon co najmniej 2/3 całej świecy, korpus (otwarcie i zamknięcie) w przeciwnej 1/3.</li>
          <li>Ogon „wystaje” poza sąsiednie świece – to on odrzuca poziom.</li>
          <li>Świeca wyraźna (większa niż przeciętna), a nie mała „doji” w szumie.</li>
          <li>Najlepiej: z trendem, na poziomie lub w strefie EMA 8–21; pod prąd – tylko z bardzo ważnego poziomu.</li>
          <li>Kolor korpusu ma mniejsze znaczenie, ale zamknięcie w kierunku sygnału jest silniejsze.</li>
        </ul>
        <PaChart
          candles={TREND_PIN}
          emas={[8, 21]}
          levels={[
            { y: 110, label: "opór → wsparcie", kind: "sr" },
            { y: 107.1, label: "wejście (zamkn.)", kind: "entry", from: 10 },
            { y: 105.6, label: "wejście 50%", kind: "entry", from: 10 },
            { y: 103.5, label: "stop", kind: "stop", from: 10 },
            { y: 114.3, label: "cel 2R", kind: "target", from: 10 },
          ]}
          mark={[10]}
          markLabel="byczy pin bar"
          caption="Trend wzrostowy, korekta do strefy EMA 8–21, byczy pin bar z ogonem przebijającym strefę i zamknięciem w górnej części. Wejście na zamknięciu lub zleceniem limit na 50% świecy, stop pod ogonem, cel 2R lub kolejny opór."
          height={230}
        />

        <H3>4.2 Inside bar (świeca wewnętrzna)</H3>
        <p>
          Świeca, której cały zakres (high–low) mieści się w zakresie poprzedniej świecy (<Strong>świecy matki</Strong>).
          Oznacza chwilową równowagę i „ściśniętą sprężynę” przed kolejnym ruchem.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Najlepsza w trendzie, po wybiciu poziomu albo po silnej świecy kierunkowej – gramy w kierunku trendu.</li>
          <li>Wejście: zlecenie stop tuż za szczytem matki (long) albo dołkiem matki (short).</li>
          <li>Stop: za drugim końcem matki; przy bardzo dużej matce – za jej połową (50%).</li>
          <li>Kilka inside barów z rzędu = mocniejsza kompresja („coiled spring”).</li>
          <li>W konsolidacji i pod prąd inside bary są zawodne – Fuller ich tam unika.</li>
        </ul>
        <PaChart
          candles={INSIDE_BAR}
          levels={[
            { y: 103.4, label: "opór → wsparcie", kind: "sr" },
            { y: 106.7, label: "wejście (stop)", kind: "entry", from: 6 },
            { y: 104.5, label: "stop 50% matki", kind: "stop", from: 6 },
            { y: 102.4, label: "stop za matką", kind: "stop", from: 6 },
          ]}
          mark={[6, 7]}
          markLabel="matka + inside bar"
          caption="Silna świeca wybija opór 103,4, następna jest inside barem. Kupno, gdy cena przebije szczyt matki; stop pod matką (lub pod jej połową)."
          height={220}
        />

        <H3>4.3 Fakey (fałszywe wybicie inside bara)</H3>
        <p>
          Inside bar, po którym kolejna świeca wybija jego zakres w jedną stronę, ale <Strong>zamyka się z powrotem</Strong>{" "}
          w zakresie świecy matki. Traderzy, którzy weszli w wybicie, zostają „złapani” i muszą zamykać pozycje – co napędza
          ruch w przeciwną stronę. Fakey często wygląda jak pin bar i jest jednym z ulubionych setupów Fullera.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Najsilniejszy na kluczowym poziomie (fałszywe wybicie wsparcia/oporu) lub z trendem po korekcie.</li>
          <li>Wejście: na zamknięciu świecy fakey albo przy przebiciu jej ekstremum w kierunku sygnału.</li>
          <li>Stop: za ekstremum świecy fakey (za jej ogonem).</li>
        </ul>
        <PaChart
          candles={FAKEY}
          levels={[
            { y: 100.2, label: "wsparcie", kind: "sr" },
            { y: 106, label: "opór (cel)", kind: "target" },
            { y: 102.1, label: "wejście", kind: "entry", from: 7 },
            { y: 99.1, label: "stop", kind: "stop", from: 7 },
          ]}
          mark={[5, 6, 7]}
          markLabel="matka, IB, fakey"
          caption="Konsolidacja 100–106. Inside bar przy wsparciu, kolejna świeca przebija w dół i matkę, i wsparcie, ale zamyka się wysoko – fałszywe wybicie. Kupno, stop pod ogonem, cel: górna krawędź konsolidacji."
          height={210}
        />

        <H3>4.4 Objęcie (engulfing / outside bar)</H3>
        <p>
          Świeca, której korpus obejmuje korpus poprzedniej świecy przeciwnego koloru, z zamknięciem blisko ekstremum.
          Pokazuje gwałtowną zmianę przewagi. Fuller traktuje ją jako sygnał drugiego rzędu – dobry tylko na poziomie
          i najlepiej z trendem.
        </p>
        <PaChart
          candles={ENGULF}
          levels={[
            { y: 100.2, label: "wsparcie", kind: "sr" },
            { y: 102.9, label: "wejście", kind: "entry", from: 5 },
            { y: 99.9, label: "stop", kind: "stop", from: 5 },
          ]}
          mark={[5]}
          markLabel="bycze objęcie"
          caption="Spadki dochodzą do wsparcia, bycza świeca obejmuje poprzednią spadkową i zamyka się przy szczycie."
          height={190}
        />

        <H3>4.5 Kombinacje</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Pin bar + inside bar</Strong> (pin bar jako matka, potem inside bar) – podwójne potwierdzenie
            odrzucenia; wejście przy wybiciu matki.
          </li>
          <li>
            <Strong>Inside pin bar</Strong> – pin bar, który jest jednocześnie inside barem; często na końcu korekty w trendzie.
          </li>
          <li>
            <Strong>Fakey z pin barem</Strong> – świeca fakey ma kształt pin bara: najsilniejsza wersja fałszywego wybicia.
          </li>
        </ul>

        {/* 5 */}
        <H2 id="wejscia">5. Wejście, stop i cel</H2>
        <DocTable
          head={["Element", "Warianty", "Kiedy"]}
          rows={[
            ["Wejście na zamknięciu", "Zlecenie rynkowe tuż po zamknięciu świecy sygnału (otwarcie następnej)", "Domyślne, nie przegapia ruchu"],
            ["Wejście limit 50%", "Zlecenie z limitem na połowie pin bara", "Duże pin bary: lepszy stosunek zysku do ryzyka, ale część sygnałów się nie wypełni"],
            ["Wejście stop (wybicie)", "Zlecenie stop za ekstremum świecy sygnału / matki", "Inside bar, potwierdzenie pin bara"],
            ["Stop", "Za ogonem pin bara / fakey, za drugim końcem matki (lub 50% matki)", "Zawsze w miejscu, które unieważnia setup"],
            ["Cel", "Najbliższy poziom S/R, stały 2R–3R, albo podążanie za trendem (trailing)", "Konsolidacja: poziom; silny trend: trailing"],
          ]}
        />
        <p>
          <Strong>R</Strong> = odległość od wejścia do stopa. Cel 2R oznacza zysk równy dwukrotności ryzyka. Fuller
          podkreśla, że cel musi być realny – jeśli najbliższy opór jest bliżej niż ok. 1,5–2R, setup lepiej pominąć.
        </p>

        {/* 6 */}
        <H2 id="scenariusze">6. Scenariusze rynkowe</H2>

        <H3>A. Trend + korekta + pin bar w strefie EMA (najczęstszy dobry setup)</H3>
        <p>
          Wykres z sekcji 4.1. Trend jest wyraźny, korekta płytka, pin bar odrzuca strefę EMA i dawny opór. To setup
          z najwyższą konfluencją: trend + poziom + strefa dynamiczna + wyraźna formacja.
        </p>

        <H3>B. Trend + inside bar po wybiciu</H3>
        <p>
          Wykres z sekcji 4.2. Rynek wybija opór silną świecą i „odpoczywa” w inside barze. Wejście w kierunku wybicia.
          Gdy cena zamiast tego wyjdzie dołem matki – zlecenie się anuluje, nie handlujemy.
        </p>

        <H3>C. Konsolidacja – handel od krawędzi do krawędzi</H3>
        <PaChart
          candles={RANGE}
          levels={[
            { y: 106.3, label: "opór", kind: "sr" },
            { y: 100.2, label: "wsparcie", kind: "sr" },
          ]}
          mark={[5, 8]}
          markLabel="pin przy wsparciu, odrzucenie oporu"
          caption="W konsolidacji kupujemy przy wsparciu (pin bar / fakey) i sprzedajemy przy oporze. Cel to przeciwna krawędź, a nie 3R."
          height={190}
        />

        <H3>D. Pod prąd z ważnego poziomu</H3>
        <PaChart
          candles={COUNTER_PIN}
          levels={[
            { y: 110, label: "opór tygodniowy", kind: "sr" },
            { y: 108.6, label: "wejście (short)", kind: "entry", from: 6 },
            { y: 112.6, label: "stop", kind: "stop", from: 6 },
            { y: 100.6, label: "cel 2R", kind: "target", from: 6 },
          ]}
          mark={[6]}
          markLabel="niedźwiedzi pin bar"
          caption="Wzrosty dochodzą do ważnego oporu z W1, powstaje duży niedźwiedzi pin bar wybijający poziom i zamykający się pod nim. Dozwolone tylko na bardzo ważnych poziomach (wiele dotknięć) – i z mniejszym zaufaniem."
          height={220}
        />

        <H3>E. Fałszywe wybicie poziomu (bez fakey)</H3>
        <PaChart
          candles={FALSE_BREAK}
          levels={[{ y: 104.9, label: "opór", kind: "sr" }]}
          mark={[5]}
          markLabel="wybicie i powrót"
          caption="Świeca przebija opór, ale zamyka się pod nim z długim górnym ogonem – kupujący w wybicie zostają złapani. Sygnał sprzedaży, szczególnie gdy wcześniejszy trend słabnie."
          height={190}
        />

        <H3>F. Złe sytuacje – czego unikać</H3>
        <PaChart
          candles={CHOP}
          mark={[5]}
          markLabel="pin bar „znikąd”"
          caption="Pin bar w środku chaotycznej konsolidacji, bez poziomu i bez trendu – formalnie poprawna świeca, ale bez kontekstu. Fuller ją pomija."
          height={170}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>Setup w środku zakresu, daleko od jakiegokolwiek poziomu.</li>
          <li>Pin bar z krótkim ogonem lub mała świeca porównywalna z szumem.</li>
          <li>Inside bar pod prąd silnego trendu albo w chaosie.</li>
          <li>Cel bliżej niż 1,5–2R (opór tuż nad wejściem).</li>
          <li>Seria strat → „odegranie się” większą pozycją. Wielkość ryzyka się nie zmienia.</li>
          <li>Wejście przed zamknięciem świecy D1 – świeca może się jeszcze zmienić w zupełnie inną formację.</li>
        </ul>

        {/* 7 */}
        <H2 id="konfluencja">7. Lista kontrolna konfluencji</H2>
        <DocTable
          head={["#", "Pytanie", "Waga"]}
          rows={[
            ["1", "Czy rynek ma wyraźny trend (struktura HH/HL lub LH/LL, EMA 8/21 ułożone i nachylone)?", "wysoka"],
            ["2", "Czy setup jest w kierunku trendu?", "wysoka"],
            ["3", "Czy setup stoi na kluczowym poziomie S/R, w strefie wydarzeń lub w strefie EMA 8–21?", "wysoka"],
            ["4", "Czy formacja jest wyraźna (duża, dobrze uformowana, ogon wystaje poza sąsiednie świece)?", "średnia"],
            ["5", "Czy do najbliższego przeszkadzającego poziomu jest co najmniej 2R?", "średnia"],
            ["6", "Czy W1 nie stoi tuż przed ważnym poziomem przeciwnym?", "średnia"],
            ["7", "Czy rynek nie jest chaotyczny (nakładające się duże świece)?", "warunek konieczny"],
          ]}
          caption="Fuller: im więcej odpowiedzi „tak”, tym lepszy setup. Pod prąd tylko przy bardzo ważnym poziomie."
        />

        {/* 8 */}
        <H2 id="ryzyko">8. Zarządzanie ryzykiem i psychologia</H2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Stałe ryzyko na transakcję jako % kapitału. Fuller zaleca <Strong>1–2%</Strong>. W tym teście, na życzenie, używamy{" "}
            <Strong>5%</Strong> – 10 strat z rzędu to wtedy ok. −40% kapitału (przy 2% – ok. −18%).
          </li>
          <li>Wielkość pozycji wynika z odległości stopa: szerszy stop = mniejsza pozycja, ryzyko w USD bez zmian.</li>
          <li>Zysk z metody przychodzi z kilku dużych wygranych przy 35–45% trafności – trzeba wytrzymać serie strat.</li>
          <li>Dziennik transakcji, brak handlu z nudów, brak przesuwania stopa dalej od ceny.</li>
        </ul>

        {/* 9 */}
        <H2 id="reguly">9. Reguły w backteście (definicje liczbowe)</H2>
        <p>
          Żeby metodę uznaniową dało się przetestować, każdy element zapisaliśmy jako regułę. Wszystko liczone na
          zamknięciu świecy D1 (17:00 Nowy Jork) wyłącznie z danych dostępnych w tamtym momencie; zlecenia od następnej świecy.
        </p>
        <DocTable
          head={["Element", "Reguła"]}
          rows={[
            ["ATR", "ATR 14 (Wilder) – miara „normalnego” zakresu świecy"],
            ["Pin bar", "zakres ≥ 0,8 ATR; ogon ≥ 2/3 zakresu (korpus w przeciwnej 1/3); ekstremum ogona poza 3 poprzednimi świecami"],
            ["Inside bar", "high ≤ high matki i low ≥ low matki; matka ≥ 0,7 ATR. Kierunek: z trendem EMA (wersja „surowa”: wybicie w dowolną stronę)"],
            ["Fakey", "matka (t−2), inside bar (t−1), świeca t przebija inside bar w jedną stronę, zamyka się z powrotem w jego zakresie i nie wychodzi poza drugi koniec matki"],
            ["Objęcie", "zakres ≥ 0,8 ATR i ≥ zakres poprzedniej; korpus obejmuje korpus poprzedniej przeciwnej świecy; zamknięcie w 30% przy ekstremum"],
            ["Trend", "EMA 8 > EMA 21, zamknięcie > EMA 21 i EMA 21 wyżej niż 5 świec wcześniej (spadkowy – lustrzanie)"],
            ["Poziom S/R", "szczyty i dołki fraktalne (5 świec z każdej strony, znane dopiero 5 świec później) z ostatnich 250 świec. Dotknięcie: poziom między (low − 0,3 ATR) a dołem korpusu i zamknięcie nad nim"],
            ["Ważny poziom", "poziom S/R, przy którym w promieniu 0,3 ATR są co najmniej 2 szczyty/dołki"],
            ["Strefa EMA", "low ≤ EMA 8 i zamknięcie ≥ EMA 21 (long)"],
            ["Filtr „raw”", "każda formacja, bez kontekstu (kontrola)"],
            ["Filtr „trend”", "tylko z trendem EMA"],
            ["Filtr „level”", "tylko na poziomie S/R (z trendem lub pod prąd)"],
            ["Filtr „Fuller”", "(z trendem I (poziom LUB strefa EMA)) LUB (pin bar / fakey pod prąd na ważnym poziomie)"],
            ["Wejście", "otwarcie następnej świecy; inside bar – zlecenie stop za matką ważne 3 świece (anulowane, gdy cena wcześniej przebije drugi koniec matki); wariant „50%” – limit na połowie pin bara ważny 3 świece"],
            ["Stop", "za ekstremum świecy sygnału (pin / fakey / objęcie) lub matki (inside bar) + 0,1 ATR"],
            ["Wyjścia (4 warianty)", "2R; 3R; najbliższy poziom S/R ≥ 1,5R (max 4R, brak poziomu → 3R); trailing – zamknięcie po złej stronie EMA 21 (Ichimoku: Kijun)"],
            ["Wielkość pozycji", "ryzyko 5% bieżącego kapitału na odległość stopa, dźwignia maks. 30:1; jedna pozycja na parę naraz"],
            ["Koszty", "główne pary 1 pb, krzyżówki 2,5 pb, SEK/NOK/PLN 5 pb na stronę; bez punktów swapowych"],
            ["Wewnątrz świecy", "gdy w jednej świecy padłby i stop, i cel – liczymy stratę; luka za stopem – realizacja po otwarciu"],
          ]}
        />

        {/* 10 */}
        <H2 id="ichimoku">10. Price action + Ichimoku: jak łączymy</H2>
        <p>Ichimoku (9/26/52) testujemy w ośmiu wariantach przecięć, każdy long i short (lustrzanie):</p>
        <DocTable
          head={["Przecięcie", "Sygnał kupna"]}
          rows={[
            ["tk_any", "Tenkan przecina Kijun od dołu (gdziekolwiek)"],
            ["tk_strong", "Tenkan przecina Kijun od dołu, cena nad chmurą (silne przecięcie)"],
            ["kumo", "zamknięcie wybija górną krawędź chmury"],
            ["price_kijun", "zamknięcie przecina Kijun od dołu, cena nad chmurą"],
            ["chikou", "Chikou przecina cenę sprzed 26 świec od dołu, cena nad chmurą"],
            ["twist", "Senkou A przecina Senkou B (zmiana koloru przyszłej chmury), cena nad chmurą"],
            ["kijun52", "zamknięcie przecina Kijun 52 od dołu i cena > MA200 (dawny „czarny koń”)"],
            ["full5", "pierwsza świeca, w której wszystkie 5 warunków jest spełnionych naraz (nad chmurą, Tenkan > Kijun, cena > Kijun, Chikou wolny, przyszła chmura bycza)"],
          ]}
          caption="Stop Ichimoku: pod Kijun / dołkiem świecy sygnału − 0,1 ATR, odległość ograniczona do 1–3,5 ATR. Wyjścia jak dla price action (2R, 3R, poziom, trailing po Kijun)."
        />
        <p>Trzy sposoby połączenia metod:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <Strong>ichi_filter</Strong> – setup price action tylko w kierunku Ichimoku (cena nad chmurą, Tenkan ≥ Kijun,
            Chikou nad ceną). Ichimoku zastępuje trend z EMA 8/21.
          </li>
          <li>
            <Strong>ichi_level</Strong> – jak wyżej, ale formacja musi odrzucić Kijun albo krawędź chmury (dynamiczne
            wsparcie Ichimoku zamiast poziomu poziomego). To klasyczne „cofnięcie do Kijun z pin barem”.
          </li>
          <li>
            <Strong>xpa</Strong> – najpierw przecięcie Ichimoku, potem w ciągu 5 świec setup price action w tym samym
            kierunku jako potwierdzenie (wejście dopiero na sygnale PA, ze stopem za formacją).
          </li>
          <li>
            <Strong>fuller_ichi</Strong> – rezim Ichimoku + (poziom S/R lub strefa EMA lub Kijun/chmura).
          </li>
        </ul>
        <PaChart
          candles={ICHI_PIN}
          zones={[{ top: 103.5, bottom: 101, kind: "cloud", label: "chmura", from: 6 }]}
          lines={[{ values: ICHI_KIJUN, label: "Kijun 26", color: "#c084fc" }]}
          levels={[
            { y: 107.1, label: "wejście", kind: "entry", from: 10 },
            { y: 104.6, label: "stop", kind: "stop", from: 10 },
          ]}
          mark={[10]}
          markLabel="pin bar na Kijun"
          caption="ichi_level: rynek nad chmurą, korekta do Kijun, pin bar odrzuca Kijun – wejście na zamknięciu, stop pod ogonem."
          height={220}
        />

        {/* 11 */}
        <H2 id="wyniki">11. Wyniki backtestu</H2>
        <PriceActionResultsPl />
      </div>
    </main>
  );
}
