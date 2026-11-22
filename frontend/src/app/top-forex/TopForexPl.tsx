import type { ReactNode } from "react";

import { Box, DocTable, H2, Strong } from "@/components/DocBlocks";
import { TfEntryChart, TfExitChart, TfFilterChart, TfStopChart } from "@/components/top/TopForexCharts";
import { CloudSkipChart, DecisionFlow, PyramidChart, SwitchEntryChart } from "@/components/top/TopForexCharts2";

const H3 = ({ children }: { children: ReactNode }) => <h3 className="pt-3 text-base font-semibold text-white/90">{children}</h3>;

const Check = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2">
    <span className="mt-0.5 text-rise">☐</span>
    <span>{children}</span>
  </li>
);
const Yes = <span className="font-semibold text-rise">WCHODZISZ</span>;
const No = <span className="font-semibold text-fall">NIE WCHODZISZ</span>;
const Wait = <span className="font-semibold text-amber-300">CZEKASZ</span>;
const Hold = <span className="font-semibold text-sky-300">TRZYMASZ</span>;

export function TopForexPl() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Top Forex: najlepsza metoda z backtestów (BTC / ETH, H1)</h1>
      <p className="mt-1 text-sm text-white/50">
        Ichimoku na trzech interwałach: <Strong>D1 + H4</Strong> wyznaczają kierunek, <Strong>H1</Strong> daje moment wejścia i
        stop, <Strong>D1</Strong> daje wyjście. Instrumenty: BTCUSD i ETHUSD (u brokerów forex jako CFD, na giełdach krypto jako
        spot). Na 32 parach walutowych żadna metoda nie zarabiała – wariant dla par z JPY jest na dole strony.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Najpierw zastrzeżenie">
          <p>
            Wynik pochodzi z wyboru spośród ok. 300 konfiguracji na 2 instrumentach (01.2018–10.2026), a sam rok 2020 dał
            kilkukrotność kapitału. Metoda przeszła kontrolę na niezależnych danych (Binance), przy 2–3× wyższych kosztach i przy innej
            godzinie zamknięcia dnia, ale nie była testowana na innych kryptowalutach. Tylko ok. 20% transakcji jest zyskownych – serie
            10–15 strat z rzędu są normalne. To nie jest porada inwestycyjna.
          </p>
        </Box>

        <H2 id="skrot">Long i short w skrócie</H2>
        <DocTable
          head={["", "LONG (kupno)", "SHORT (sprzedaż)"]}
          rows={[
            [<Strong key="1">D1 – kierunek</Strong>, "ostatnie zamknięcie NAD Kijun 52 z D1", "ostatnie zamknięcie POD Kijun 52 z D1"],
            [<Strong key="2">H4 – kierunek</Strong>, "ostatnie zamknięcie NAD Kijun 52 z H4", "ostatnie zamknięcie POD Kijun 52 z H4"],
            [<Strong key="3">H1 – sygnał (W1)</Strong>, "Tenkan przecina Kijun 26 OD DOŁU", "Tenkan przecina Kijun 26 OD GÓRY"],
            [<Strong key="4">H1 – chmura</Strong>, "zamknięcie NAD chmurą H1", "zamknięcie POD chmurą H1"],
            [<Strong key="5">Chmura D1 / H4</Strong>, "nie ma znaczenia (wymóg pogarszał wynik)", "nie ma znaczenia"],
            [<Strong key="6">Stop</Strong>, "zamknięcie sygnału − 3 × ATR(14) H1", "zamknięcie sygnału + 3 × ATR(14) H1"],
            [<Strong key="7">Wyjście</Strong>, "zamknięcie D1 POD Kijun 52 z D1", "zamknięcie D1 NAD Kijun 52 z D1"],
            [<Strong key="8">Sygnał w drugą stronę</Strong>, "ignorujesz", "ignorujesz"],
          ]}
        />

        <H2 id="wykres">0. Co ustawić na wykresie (TradingView)</H2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>H1:</Strong> Ichimoku 9 / 26 / 52 / 26 (Tenkan, Kijun 26, chmura) i ATR(14).
          </li>
          <li>
            <Strong>H4 i D1:</Strong> Kijun 52 = (najwyższe maksimum + najniższe minimum z 52 świec) / 2. W TradingView: wskaźnik{" "}
            <em>Donchian Channels</em> o długości 52 – środkowa linia (Basis).
          </li>
          <li>
            Zamknięcie dnia: test liczył dzień kończący się o 17:00 Nowy Jork (23:00 w Polsce). Domyślne w TradingView 00:00 UTC też
            działa (tabela w sekcji 8) – ważne, żeby zawsze używać tej samej godziny.
          </li>
        </ul>

        <H2 id="warstwy">1. Trzy warstwy – każda robi co innego</H2>
        <DocTable
          head={["Warstwa", "Interwał", "Co to jest", "Kiedy sprawdzasz"]}
          rows={[
            [<Strong key="a">Kierunek</Strong>, "D1 + H4", "STAN, nie sygnał. Mówi tylko, czy wolno kupować, czy sprzedawać. Może trwać dniami.", "po zamknięciu każdej świecy H4 i D1"],
            [<Strong key="b">Wejście</Strong>, "H1", "Jedyny moment wejścia: przecięcie TK (W1) albo włączenie kierunku (W2).", "po zamknięciu każdej świecy H1"],
            [<Strong key="c">Wyjście</Strong>, "H1 + D1", "Stop z H1 leży jako zlecenie. Kijun 52 z D1 decyduje o wyjściu z zyskiem.", "stop – cały czas; D1 – raz dziennie"],
          ]}
        />
        <p>
          <Strong>Nie czekasz, aż cena zbliży się do Kijun 52 na H4 czy D1.</Strong> To, że cena jest nad nim od dawna, jest
          normalne. Cofnięcie, na które czekasz, jest już wbudowane w sygnał H1: Tenkan musi najpierw zejść pod Kijun 26 (małe
          cofnięcie), a potem wrócić nad niego. W teście wejścia „blisko Kijun 52 na D1” wypadły najgorzej.
        </p>
        <TfFilterChart />

        <H2 id="decyzja">2. Schemat decyzji – po każdym zamknięciu H1</H2>
        <DecisionFlow />

        <H2 id="w1">3. Wejście W1 (główne): przecięcie TK na H1</H2>
        <TfEntryChart />
        <ul className="space-y-1.5">
          <Check>Kierunek long jest włączony (H4 i D1 nad Kijun 52).</Check>
          <Check>
            Na zamkniętej świecy H1 <Strong>Tenkan przecina Kijun 26 od dołu</Strong> (na poprzedniej świecy był pod albo równo).
          </Check>
          <Check>
            To samo zamknięcie jest <Strong>nad chmurą H1</Strong> (nad wyższą z linii Senkou A / B).
          </Check>
          <Check>
            Kupujesz <Strong>na otwarciu następnej świecy H1</Strong>.
          </Check>
        </ul>

        <H2 id="w2">4. Wejście W2: kierunek właśnie się włączył, a H1 już jest w trendzie</H2>
        <SwitchEntryChart />
        <ul className="space-y-1.5">
          <Check>
            Zamyka się świeca H4 albo D1, po której <Strong>oba</Strong> interwały są po tej samej stronie Kijun 52 (wcześniej nie
            były).
          </Check>
          <Check>
            Na ostatniej zamkniętej świecy H1 Tenkan jest <Strong>już</Strong> po właściwej stronie Kijun 26, a zamknięcie po
            właściwej stronie chmury H1.
          </Check>
          <Check>
            Wchodzisz <Strong>od razu</Strong> (otwarcie następnej świecy H1), bez czekania na nowe przecięcie. Stop jak w W1.
          </Check>
          <Check>
            W2 działa tylko w chwili włączenia kierunku. Jeśli ten moment minął, a nie weszłeś – czekasz na W1.
          </Check>
        </ul>
        <p>
          W teście dodanie W2 podniosło wynik na wszystkich 3 zestawach danych (np. ryzyko 1%: 803 tys. → 1,13 mln przy podobnym
          obsunięciu) – bez W2 często przegapia się początek trendu.
        </p>

        <H2 id="stop">5. Stop loss i take profit</H2>
        <ul className="space-y-1.5">
          <Check>
            <Strong>Stop</Strong> = zamknięcie świecy sygnału <Strong>− 3 × ATR(14) z H1</Strong> (short: +). Zwykle 1,2–5% od
            ceny, mediana 2,6%. Stawiasz go od razu jako zlecenie stop i <Strong>nie przesuwasz</Strong>.
          </Check>
          <Check>
            <Strong>Take profit: brak.</Strong> Zysk robi kilka transakcji, które trwają tygodniami (+20R do +300R). Stały cel
            ucinałby właśnie je.
          </Check>
        </ul>
        <TfStopChart />

        <H2 id="wyjscie">6. Wyjście z zyskiem: tylko dzienny Kijun 52</H2>
        <TfExitChart />
        <ul className="space-y-1.5">
          <Check>
            Raz dziennie, zaraz po zamknięciu dnia: jeśli <Strong>zamknięcie D1 jest pod Kijun 52 z D1</Strong> (short: nad) –
            zamykasz pozycję.
          </Check>
          <Check>Stop z punktu 5 działa cały czas. Co pierwsze – stop albo zamknięcie D1 po złej stronie Kijun 52.</Check>
          <Check>
            <Strong>Wyjście nie zależy od H1 ani H4.</Strong> Gdy H1 spada pod Kijun 26 albo H4 pod Kijun 52 – trzymasz dalej.
          </Check>
          <Check>Po wyjściu albo stopie możesz wejść ponownie przy kolejnym sygnale W1 / W2.</Check>
        </ul>

        <H2 id="sytuacje">7. Sytuacje – co robić</H2>
        <DocTable
          head={["Sytuacja", "Decyzja", "Dlaczego (test)"]}
          rows={[
            ["Trend trwa od dawna, cena daleko nad Kijun 52 D1, na H1 cofnięcie i Tenkan wraca nad Kijun 26 nad chmurą", Yes, "typowy sygnał W1; wejścia daleko od Kijun 52 D1 (2–4 ATR) były najlepsze"],
            ["H4 lub D1 właśnie zamknęły się nad Kijun 52, a na H1 Tenkan już nad Kijun 26 i cena nad chmurą", Yes, "W2 – poprawia wynik na wszystkich danych"],
            ["Kierunek włączony od dawna, nie masz pozycji, H1 w trendzie, ale bez nowego przecięcia", Wait, "na cofnięcie i nowe przecięcie (W1)"],
            ["Przecięcie TK na H1, ale zamknięcie w chmurze H1 albo po złej stronie", No, "reguła; patrz rysunek niżej"],
            ["D1 nad Kijun 52, H4 pod (albo odwrotnie)", No, "kierunek wyłączony; otwartą pozycję trzymasz"],
            ["Sygnał w drugą stronę niż kierunek (np. przecięcie w dół pod chmurą przy kierunku long)", No, "ignorujesz"],
            ["Stop wybity, po kilku godzinach nowy sygnał", Yes, "pauza po seriach stopów nie poprawiała wyniku"],
            ["H1 w konsolidacji: płaski Kijun 26, cienka chmura, małe świece", Yes, "filtry konsolidacji nie pomagały (do 4–5× mniej)"],
            ["Cena na D1 tuż nad Kijun 52 – „może poczekać, aż się odbije?”", Yes, "czekanie na bliskość Kijun 52 dawało 6–40× mniej"],
            ["Cena na D1 w chmurze albo pod chmurą D1, ale nad Kijun 52", Yes, "wymóg ceny nad chmurą D1 dawał 2,5–9× mniej"],
            ["Noc w Europie / weekend", Yes, "filtry godzinowe pogarszały wynik; krypto handluje 24/7"],
            ["W trakcie pozycji H4 przechodzi pod Kijun 52", Hold, "wyjście tylko z D1"],
          ]}
        />
        <CloudSkipChart />

        <H2 id="ile">8. Ile kupić i wyniki</H2>
        <ul className="space-y-1.5">
          <Check>
            Ryzyko <Strong>1% kapitału</Strong> na transakcję (2% = ok. 2× większe obsunięcie). Wartość pozycji = (ryzyko ×
            kapitał) / odległość stopu w %.
          </Check>
          <Check>
            Pozycja na jedną monetę <Strong>maks. 100% kapitału</Strong> (bez dźwigni). BTC i ETH naraz – razem maks. 2× kapitału.
            Przy ryzyku 1% pozycja to zwykle ok. 0,4× kapitału.
          </Check>
        </ul>
        <DocTable
          head={["Przykład", "Wartość"]}
          rows={[
            ["Kapitał", "10 000 USD"],
            ["Ryzyko 1%", "100 USD"],
            ["BTC: zamknięcie 60 000, ATR(14) H1 = 400", "stop = 60 000 − 3 × 400 = 58 800 (−2,0%)"],
            ["Wartość pozycji", "100 / 2,0% = 5 000 USD = 0,083 BTC"],
            ["Strata przy stopie", "−100 USD (−1%) + koszty"],
          ]}
        />
        <DocTable
          head={["BTC + ETH, start 10 000 USD, 01.2018–10.2026", "Ryzyko 1%", "Ryzyko 2%"]}
          rows={[
            ["Dukascopy, dzień do 17:00 NY", <Strong key="a">1 127 965 (DD −26%)</Strong>, "4 770 465 (DD −44%)"],
            ["Binance, dzień do 17:00 NY", "1 048 921 (DD −24%)", "5 288 008 (DD −42%)"],
            ["Dukascopy, dzień do 00:00 UTC (TradingView)", "945 466 (DD −27%)", "3 536 536 (DD −45%)"],
            ["Kup i trzymaj BTC / ETH", "43 582 / 21 518 (DD −82% / −94%)", ""],
          ]}
        />
        <DocTable
          head={["Rok", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]}
          rows={[
            ["Ryzyko 1%", "+41%", "+126%", "+421%", "+14%", "0%", "+102%", "+23%", "+37%", "+85%"],
            ["Ryzyko 2%", "+62%", "+179%", "+746%", "+24%", <span key="x" className="text-fall">−6%</span>, "+133%", "+33%", "+62%", "+131%"],
          ]}
        />
        <p className="text-xs text-white/50">
          358 transakcji (ok. 20 rocznie na monetę), 21% zyskownych, średnio +2,1R na transakcję; bez 5 najlepszych transakcji suma
          nadal +275R. Koszt 10 pb na stronę, finansowanie stopa USD + 5,5% rocznie (CFD). Mediana trzymania ok. 2 dni.
        </p>

        <H2 id="nie">9. Sprawdzone i NIE pomaga (nie czekaj na to)</H2>
        <DocTable
          head={["Filtr", "Wynik vs metoda (ryzyko 2%, 3 zestawy danych)"]}
          rows={[
            ["Przeczekaj konsolidację H1 (płaski Kijun 26 / cienka chmura / mały zakres)", "nie pomaga: gorzej w 2–3 z 3, do 4–5× mniej"],
            ["Cena nad chmurą D1", "gorzej 3/3, 2,5–9× mniej"],
            ["Wejście tylko blisko Kijun 52 D1", "gorzej 3/3, 6–40× mniej"],
            ["Tylko godziny Europy i USA / bez nocy", "gorzej 3/3"],
            ["Pauza 24h po 3 lub 5 stopach z rzędu", "bez wyraźnej różnicy"],
            ["Tylko long (bez short)", "niższe obsunięcie, ale 2–4× mniej; shorty ratują lata spadków (2018, 2022)"],
            ["Cena nad chmurą H4", "obsunięcie −37..−40% zamiast −42..−45%, wynik niższy w 2 z 3 – opcjonalnie"],
          ]}
        />

        <Box tone="good" title="Ściągawka">
          <ol className="list-decimal space-y-1 pl-5">
            <li>BTCUSD / ETHUSD. Na H4 i D1: Kijun 52, na H1: Ichimoku i ATR(14).</li>
            <li>Kierunek: H4 i D1 nad Kijun 52 → tylko long; pod → tylko short; różnie → nic.</li>
            <li>W1: na H1 Tenkan przecina Kijun 26 w kierunku trendu, zamknięcie po właściwej stronie chmury H1.</li>
            <li>W2: w chwili włączenia kierunku, jeśli H1 już jest w trendzie – wejście od razu.</li>
            <li>Wejście na otwarciu następnej świecy H1. Jedna pozycja na monetę.</li>
            <li>Stop = zamknięcie ∓ 3 × ATR(14) H1, nie przesuwasz. Bez take profit.</li>
            <li>Ryzyko 1% kapitału, pozycja maks. 100% kapitału.</li>
            <li>Wyjście: pierwsze zamknięcie D1 po złej stronie Kijun 52 (albo stop). H1 i H4 nie mają wpływu na wyjście.</li>
          </ol>
        </Box>

        <H2 id="jpy">10. Wariant dla par walutowych (tylko pary z JPY)</H2>
        <p>Na 32 parach walutowych żadna metoda nie zarabiała. Jedyny wynik dodatni dały pary z JPY – dużo słabszy niż krypto:</p>
        <ul className="space-y-1.5">
          <Check>Pary: USDJPY, EURJPY, CHFJPY, AUDJPY, NZDJPY, GBPJPY, CADJPY. Wykres D1.</Check>
          <Check>
            Sygnał D1: zamknięcie przecina cenę sprzed 26 świec (Chikou), cena nad chmurą (short: pod). Tylko w stronę wyższej stopy
            procentowej (dziś: long XXX/JPY).
          </Check>
          <Check>Wejście na otwarciu następnej świecy. Stop za Kijun 26 D1 albo świecą sygnału, 1–3,5 ATR D1.</Check>
          <Check>
            Wyjście: pierwsze zamknięcie <Strong>H4 pod Kijun 52 z H4</Strong> (short: nad). Bez take profit. Ryzyko 1–2%.
          </Check>
        </ul>
        <p>
          Wynik (10 lat, 7 par, ryzyko 2%): <Strong>20 421 USD</Strong> z 10 000 (+7,4% rocznie, maxDD −17%). Pary wybrane po
          fakcie, a zysk zależy od słabnącego jena.
        </p>
        <p className="text-xs text-white/50">Szczegóły testów: summary2.txt, sekcje 9–12; backtests/t_crypto_filters.py, t_crypto_filters2.py.</p>

        <H2 id="max">11. Maksymalizacja zysku: piramida z dźwignią (konto np. 1000 USD)</H2>
        <Box tone="warn" title="Dla kogo">
          <p>
            Wersja agresywniejsza: te same wejścia i wyjścia, ale do zyskownej pozycji dokładasz do 5 jednostek. W teście dawała ok.
            105–120% rocznie zamiast 74–77% przy obsunięciu −40..−45% (zamiast −36..−41%). Wymaga dźwigni ok. 3–5×. W UE CFD na
            krypto dla klienta detalicznego mają limit 1:2, przy którym piramida prawie nic nie daje (tabela wyników niżej). Potrzebne
            jest konto z wyższą dźwignią na krypto (np. kontrakty futures) – sprawdź, co jest legalnie dostępne w Twoim kraju.
          </p>
        </Box>

        <H3>Reguły krok po kroku (long; short – lustrzanie)</H3>
        <ul className="space-y-1.5">
          <Check>
            <Strong>Jednostka 1:</Strong> wejście W1 albo W2 jak wyżej. Stop = zamknięcie sygnału − 3 × ATR(14) H1. Zapisz{" "}
            <Strong>R</Strong> = cena wejścia − stop (w USD za 1 BTC / ETH). Wielkość: strata przy stopie ={" "}
            <Strong>0,5% konta</Strong>.
          </Check>
          <Check>
            <Strong>Dokładka:</Strong> gdy zamknięcie H1 jest co najmniej <Strong>+1R</Strong> powyżej ostatniego wejścia – na
            otwarciu następnej świecy H1 kupujesz kolejną jednostkę.
          </Check>
          <Check>
            <Strong>Nowy wspólny stop</Strong> dla całej pozycji = zamknięcie, które dało sygnał dokładki − 3 × ATR(14) H1. Stop
            tylko podnosisz, nigdy nie obniżasz.
          </Check>
          <Check>
            <Strong>Wielkość dokładki:</Strong> strata tej jednostki przy nowym wspólnym stopie = 0,5% aktualnego konta (razem z
            niezrealizowanym zyskiem).
          </Check>
          <Check>
            Maks. <Strong>5 jednostek</Strong> na monetę i maks. <Strong>3× konta</Strong> wartości pozycji na monetę (BTC + ETH
            razem maks. 6×). Jeśli dokładka przekroczyłaby limit – bierzesz tyle, ile się mieści.
          </Check>
          <Check>
            <Strong>Wyjście całości</Strong> (wszystkie jednostki naraz): wspólny stop albo zamknięcie D1 po złej stronie Kijun 52.
            Po takim zamknięciu dnia już nie dokładasz.
          </Check>
        </ul>
        <PyramidChart />

        <H3>Ile to procent konta</H3>
        <DocTable
          head={["Sytuacja", "Strata przy stopie (% konta)"]}
          rows={[
            ["Tylko jednostka 1", "0,5%"],
            ["Po dokładce: wcześniejsze jednostki (stop podciągnięty mniej więcej do ich ceny wejścia)", "ok. 0% (zwykle chronione na zero)"],
            ["Po dokładce: nowa jednostka", "0,5%"],
            ["Cała pozycja na jednej monecie – typowo", "ok. 0,5–1,5%"],
            ["BTC i ETH naraz – typowo", "ok. 1–3%"],
            ["Seria 15 strat z rzędu (normalne przy ok. 20% trafności)", "ok. −7%"],
            ["Największe obsunięcie w teście", "−40..−45% (z 1000 USD chwilowo ok. 550–600 USD)"],
          ]}
        />

        <H3>Przykład: konto 1000 USD (ceny z 20.11.2026)</H3>
        <DocTable
          head={["", "BTC (58 750 USD)", "ETH (1 615 USD)"]}
          rows={[
            ["ATR(14) H1 – typowo z ostatnich 60 dni", "444 USD", "18,2 USD"],
            ["Stop = 3 × ATR", "1 332 USD (−2,3%)", "54,5 USD (−3,4%)"],
            ["Ryzyko jednostki 0,5% konta", "5 USD", "5 USD"],
            ["Jednostka = 5 / odległość stopu", <Strong key="b">0,0038 BTC ≈ 220 USD</Strong>, <Strong key="e">0,092 ETH ≈ 148 USD</Strong>],
            ["5 jednostek (w trendzie, ceny wyżej)", "ok. 1 100–1 500 USD", "ok. 750–1 000 USD"],
            ["Limit 3× konta na monetę", "3 000 USD ≈ 0,051 BTC", "3 000 USD ≈ 1,86 ETH"],
          ]}
        />
        <p>
          <Strong>Ważne – minimalny wolumen u brokera.</Strong> Jeśli broker pozwala handlować najmniej 0,01 BTC (≈ 590 USD), jedna
          jednostka ryzykowałaby ok. 13 USD = 1,3% konta zamiast 0,5%. Przy 1000 USD potrzebny jest krok 0,001 BTC albo handel samym
          ETH. Sprawdź też spread: test zakładał koszt 0,1% na stronę transakcji.
        </p>

        <H3>Dźwignia 1:100 czy 1:30?</H3>
        <p>
          Dźwignia u brokera <Strong>nie zmienia wyniku</Strong> – wielkość pozycji wynika z ryzyka 0,5% i stopu, nie z dźwigni.
          Dźwignia decyduje tylko, ile depozytu blokuje pozycja i jak dużą pozycję w ogóle da się (np. przez pomyłkę) otworzyć.
        </p>
        <DocTable
          head={["Wartość pozycji", "Depozyt 1:100", "1:30", "1:10", "1:2 (UE detal)"]}
          rows={[
            ["1 jednostka BTC (220 USD)", "2,2 USD", "7,3 USD", "22 USD", "110 USD"],
            ["Limit na monetę (3 000 USD)", "30 USD", "100 USD", "300 USD", "1 500 USD – nie zmieści się"],
            ["BTC + ETH na limicie (6 000 USD)", "60 USD", "200 USD", "600 USD", "3 000 USD – nie zmieści się"],
          ]}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Metoda potrzebuje najwyżej ok. 6× (dwie monety po 3×). <Strong>Wystarczy 1:10; 1:30 jest w porządku</Strong> – zostawia
            duży zapas depozytu, a ogranicza skutki pomyłki.
          </li>
          <li>
            <Strong>1:100 nic nie daje</Strong>, a zwiększa skutki błędu (np. pomyłka o jedno zero w wolumenie). W teście największa
            użyta dźwignia to 4,6×, likwidacji nie było.
          </li>
          <li>Przy dźwigni na krypto płacisz finansowanie (w teście stopa USD + 5,5% rocznie od wartości pozycji) – jest w wynikach.</li>
        </ul>

        <H3>Wyniki backtestu piramidy (BTC + ETH, start 10 000 USD, 01.2018–10.2026)</H3>
        <DocTable
          head={["Wariant (limit 3× na monetę)", "Dukascopy", "Binance", "Dzień 00:00 UTC", "Rocznie", "maxDD"]}
          rows={[
            ["Bez dokładania, ryzyko 1%", "1,51 mln", "1,59 mln", "1,32 mln", "74–77%", "−36..−41%"],
            [<Strong key="p">Piramida +1R, 5 jedn., 0,5%</Strong>, "10,6 mln", "5,7 mln", "10,3 mln", <Strong key="c">105–120%</Strong>, "−40..−45%"],
            ["Piramida +2R, 3 jedn., 0,5% (ostrożniej)", "2,24 mln", "1,49 mln", "2,54 mln", "76–87%", "−34..−37%"],
            ["Piramida +1R, 5 jedn., 1% (za dużo)", "119 mln", "122 mln", "129 mln", "189–192%", "−63..−69%"],
            ["Piramida +1R, 5 jedn., 0,5%, limit 1× (UE 1:2)", "1,38 mln", "1,63 mln", "1,49 mln", "75–78%", "−40..−45%"],
          ]}
        />
        <DocTable
          head={["Rok (Dukascopy)", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]}
          rows={[
            ["Bez dokładania, 1%", "+58%", "+115%", "+256%", "+113%", "+4%", "+122%", "+21%", "+36%", "+53%"],
            ["Piramida +1R, 0,5%", "+180%", "+329%", "+330%", "+91%", "+3%", "+113%", "+86%", "+67%", "+58%"],
          ]}
        />
        <p className="text-xs text-white/50">
          Kwoty powyżej kilku mln USD są nierealne (płynność, limity brokera) – porównuj procenty. Wybrano najlepszy z 8 sposobów
          dokładania, więc przyszły wynik będzie raczej niższy. Lata 2022–10.2026 osobno: z 10 000 USD ok. 91–107 tys. (bez
          dokładania 51–82 tys.). Szczegóły: summary2.txt, sekcja 13; backtests/t_crypto_pyramid.py.
        </p>

        <Box tone="good" title="Ściągawka – konto 1000 USD">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Dźwignia u brokera 1:10–1:30 (nie 1:100). Wolumen z krokiem 0,001 BTC / 0,01 ETH.</li>
            <li>Wejście W1 / W2, stop 3 × ATR(14) H1, jednostka ryzykuje 5 USD (0,5%).</li>
            <li>Co +1R (zamknięcie H1 o R dalej niż ostatnie wejście) – dokładasz jednostkę 0,5%, stop całości podciągasz.</li>
            <li>Maks. 5 jednostek i 3 000 USD wartości pozycji na monetę.</li>
            <li>Wyjście całości: wspólny stop albo zamknięcie D1 po złej stronie Kijun 52.</li>
            <li>Licz się z obsunięciem do ok. −45% i seriami 10–15 strat po 5 USD.</li>
          </ol>
        </Box>
      </div>
    </main>
  );
}
