import { Box, H2, H3, Table, code } from "@/components/ichimokuDoc";

export function IchimokuMethodologyPl() {
  return (
    <section className="mt-12 space-y-4 text-sm leading-relaxed text-white/70">
      <h2 className="text-2xl font-semibold text-white">Jak działa Ichimoku</h2>

      <Box title="Najważniejsze wnioski (streszczenie)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Metodologia źródłowa (Hosoda, Sasaki, praktycy polscy) opiera się na
            trzech teoriach: <strong>czasu</strong>, <strong>fal</strong> i{" "}
            <strong>ceny</strong>. Wykres z pięcioma liniami to tylko jej
            najprostsza część. Ocena trendu na tej stronie korzysta tylko z tej
            części i jest <em>syntezą</em> — sumą pięciu sygnałów, której nie ma
            w tej postaci w żadnym ze źródeł.
          </li>
          <li>
            Backtest na 504 spółkach S&amp;P 500 (3 ostatnie lata i 15 lat
            kontrolnie): stan „byczy/niedźwiedzi” <strong>nie przewiduje
            kierunku</strong> przyszłych stóp zwrotu, natomiast{" "}
            <strong>dobrze przewiduje zmienność</strong> (stan niedźwiedzi = ok.
            15–30% wyższa zmienność w kolejnych 21 sesjach).
          </li>
          <li>
            Pojedyncze reguły z książek (san&apos;yaku, wybicie Kijun z
            retestem, schemat „aktualnego SSB”, krzyże TK, skręt chmury) oraz
            cele fal i „liczby czasu” <strong>nie wykazują przewagi</strong>{" "}
            ponad losowość po uwzględnieniu zmienności.
          </li>
          <li>
            Praktyczne zastosowanie: filtr ryzyka (nie kupować w stanie
            niedźwiedzim), a nie generator sygnałów kupna/sprzedaży. Szczegóły
            i tabele — w sekcjach poniżej.
          </li>
        </ul>
      </Box>

      <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="mb-1 font-semibold text-white/80">Spis sekcji</p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>Pięć linii wykresu</li>
          <li>Trzy teorie: czas, fale, cena</li>
          <li>Sygnały i ocena trendu wg źródeł</li>
          <li>Scenariusze krok po kroku</li>
          <li>Ograniczenia i przestrogi autorów</li>
          <li>Jak to się ma do oceny trendu na tej stronie</li>
          <li>Backtest: 3 lata (i 15 lat kontrolnie)</li>
          <li>Ocena metodologii</li>
        </ol>
      </nav>

      {/* 1 */}
      <H2>1. Pięć linii wykresu</H2>
      <p>
        Ichimoku Kinko Hyo („wykres równowagi jednym spojrzeniem”) rysuje pięć
        linii wyprowadzonych wyłącznie z ceny. W książkach Hosody nazywane są
        też „spanami” (span = odległość między filarami łuku).
      </p>
      <Table
        head={["Linia (nazwa w książkach)", "Wzór", "Rola"]}
        rows={[
          [
            <strong key="a" className="text-sky-400">Tenkan-sen (linia zwrotna)</strong>,
            "(max + min) / 2 z 9 okresów",
            "Najszybsza; krótki trend i wyzwalacz sygnału.",
          ],
          [
            <strong key="b" className="text-orange-400">Kijun-sen (linia standardowa)</strong>,
            "(max + min) / 2 z 26 okresów",
            "Wg Hosody „najważniejszy element”: jej KIERUNEK jest wręcz trendem ceny. Poziom wsparcia/oporu; granica dołka.",
          ],
          [
            <strong key="c">Senkou Span A (span prowadzący 1)</strong>,
            "(Tenkan + Kijun) / 2, przesunięte o 26 okresów naprzód",
            "Jedna granica chmury (obszaru oporu).",
          ],
          [
            <strong key="d">Senkou Span B (span prowadzący 2, „SSB”)</strong>,
            "(max + min) / 2 z 52 okresów, przesunięte o 26 naprzód",
            "Druga granica chmury; płaski odcinek SSB to silny poziom S/R.",
          ],
          [
            <strong key="e" className="text-purple-400">Chikou Span (span opóźniony)</strong>,
            "zamknięcie dzisiejsze narysowane 26 okresów wstecz",
            "Wg Hosody „najlepsze z pięciu spanów” (razem z piątym); porównanie ceny dziś z ceną sprzed 26 dni.",
          ],
        ]}
      />
      <p>
        Obszar między Span A i Span B to <strong>chmura (Kumo, „obszar
        oporu”)</strong>. Chmura widoczna przed bieżącą świecą nie jest
        prognozą — jej kształt jest już znany, bo wynika z danych sprzed 26
        okresów. Hosoda dodaje, że dopóki cena trwa w silnym trendzie, chmurę
        „można pominąć” — staje się istotna przy reakcji/odwrocie. Ważna
        uwaga: 9, 26 i 52 to nie są parametry „magiczne”, lecz element teorii
        czasu (patrz niżej) — 9 to pierwszy cykl, 26 to segment.
      </p>

      {/* 2 */}
      <H2>2. Trzy teorie: czas, fale, cena</H2>
      <p>
        Hosoda pisze, że „czas jest kilkadziesiąt razy ważniejszy niż cena” i
        że cena jest tylko zakresem umieszczonym w czasie. Cały system składa
        się z trzech filarów: <strong>teorii czasu</strong> (kiedy),{" "}
        <strong>teorii fal</strong> (jaką strukturę tworzy ruch) i{" "}
        <strong>teorii ceny</strong> (dokąd). Wykres z pięcioma liniami opisuje
        „stan”, a trzy teorie mają prognozować „kiedy i dokąd”.
      </p>

      <H3>2.1 Teoria czasu</H3>
      <p>
        <strong>Liczby podstawowe</strong> (dni lub tygodnie od ważnego dołka
        lub szczytu, liczone włącznie z dniem początkowym): 9, 17, 26, 33, 42,
        (51), 65, 76, 129, 172, 200–257. Tworzą je proste sumy pomniejszone o
        1 dzień (bo dzień ekstremum jest wspólny dla dwóch fal):
      </p>
      <Table
        head={["Liczba", "Konstrukcja", "Uwagi"]}
        rows={[
          ["9", "pierwszy cykl", "„Pierwsza liczba podstawowa najważniejsza”; okolice 7–11."],
          ["17", "9 + 9 − 1", "drugi cykl; okolice 13–21."],
          ["26", "9 + 9 + 9 − 1", "segment; okolice 24–28. Trzecia liczba to podstawa („1 segment”)."],
          ["33", "17 + 17 − 1", "okolice 30–37."],
          ["42", "17 + 26 − 1", "okolice 39–46."],
          ["65", "33 + 33 − 1", "okolice 56–72."],
          ["76", "26 · 3 − 2", "„przedział” = 3 segmenty."],
          ["129", "65 + 65 − 1", "okolice 120–138."],
          ["172", "65 + 42 + 42 + 26 − 3", "okolice 163–179."],
          ["200–257", "129 + 129 − 1 = 257", "„element” ≈ 9 segmentów (226)."],
        ]}
        caption="Wartości są traktowane jako zakresy („symbol ujednolica pewien zakres”), a nie jako dokładne dni."
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Dzień zmiany</strong> to nie „dzień zwrotu”. Są trzy
          możliwości: natychmiastowe odwrócenie, przyspieszenie albo
          przedłużenie trendu. Według Hosody sedno polega na tym, że{" "}
          <em>do</em> tego dnia cena będzie wysoka (lub niska); dzień celuje
          się w dzień PRZED osiągnięciem dołka/szczytu. W trendzie wzrostowym
          częściej zdarza się przedłużenie, w spadkowym przyspieszenie.
        </li>
        <li>
          <strong>Liczby równorzędne</strong>: długości poprzednich fal
          (od ostatniego szczytu do dołka, dalej wstecz od dołka do szczytu)
          przenosi się w przyszłość od bieżącego ekstremum, także w sumach fal
          (1+2, 2+3, 1+2+3). Wybór właściwego dnia to „teza, antyteza i
          synteza” z liczbami podstawowymi.
        </li>
        <li>
          <strong>Relacje czasowe</strong> (dla odcinków A→B→C→D): AB = BD, AB =
          CD, AC = CD, BC = BD.
        </li>
        <li>
          <strong>Segmenty, okresy i cykle</strong>: 5 dni = krótka faza, 9 =
          faza, 3 fazy = okres (26), 3 okresy = cykl. W pierwszym okresie
          zwykle małe wahania, w trzecim duże; zakres ceny trzeciego okresu
          większy niż suma dwóch pierwszych (ekspansja) = „najwyraźniejszy znak
          rynku byka”.
        </li>
        <li>
          <strong>Wykresy tygodniowe</strong>: te same liczby, ale w
          tygodniach (25–27 tygodni = „praktycznie koniec trendu”). Sasaki
          zaznacza, że są mniej dokładne niż dzienne, ale pokazują kierunek
          trendu głównego; Hosoda pisze, że gdy nie ma czasu, używa „praktycznie
          tylko” wykresu tygodniowego.
        </li>
        <li>
          Zastrzeżenie autora: dziesięć symboli czasu „bardzo dobrze sprawdza
          się w trendzie wzrostowym”; w spadku ich stosowanie „nie jest tak
          proste”.
        </li>
      </ul>

      <H3>2.2 Teoria fal</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>I</strong> — fala pojedyncza (jeden ruch), <strong>V</strong>{" "}
          — podwójna (ruch i korekta), <strong>N</strong> — trójczłonowa
          (wzrost, spadek, wzrost; podstawa całej teorii), <strong>S</strong>{" "}
          — odwrócone N.
        </li>
        <li>
          Kombinacje: 5 fal = dwie fale N, 7 = trzy, 9 = cztery. Dziewięć fal
          to zwykle „nasycenie”; jeśli po siódmej cena w ósmej zaczyna nawet
          minimalny spadek, to sygnał wyczerpania. Hosoda: teoretycznie trend
          wzrostowy „może trwać w nieskończoność”.
        </li>
        <li>
          <strong>P</strong> — „wybrzuszenie wewnętrzne” (zawężenie, trójkąt;
          zapowiada słabszy scenariusz), <strong>Y</strong> — „wybrzuszenie
          zewnętrzne” (rozszerzenie: cena schodzi poniżej poprzednich dołków i
          wraca powyżej poprzednich szczytów; zapowiada ruch o dużym
          zasięgu), PP — P w P (trójkąt).
        </li>
        <li>
          <strong>Załamanie fali</strong>: w trendzie wzrostowym gdy cena
          schodzi poniżej minimum poprzedniej fali, w spadkowym gdy przewyższa
          jej maksimum. Kryterium trendu: wyższe szczyty i dołki = fala
          wzrostowa.
        </li>
        <li>
          <strong>Formacja głowy i ramion</strong> w czterech wariantach
          (standardowa, P, Y, N) — odgrywa rolę potwierdzenia szczytu/dołka.
        </li>
        <li>
          <strong>Linie graniczne</strong> (Sasaki): maksimum lub minimum
          danej konfiguracji świec; ich przebicie lub nieprzebicie rozstrzyga o
          kierunku.
        </li>
      </ul>

      <H3>2.3 Teoria ceny — cztery wartości obliczeniowe</H3>
      <p>
        Dla ruchu A→B (pierwsza fala), korekty B→C i celu D (w rynku spadkowym
        lustrzanie) Hosoda podaje cztery metody. Poniższe wzory zostały
        potwierdzone w kilku niezależnych fragmentach książek i sprawdzone
        liczbowo na przykładach autora (np. Dow: dołek 1020, szczyt 1588,
        korekta do 1250 → E = 2156, V = 1926; Kaneka: NT = 338 + (338 − 281) =
        395).
      </p>
      <Table
        head={["Wartość", "Wzór (rynek wzrostowy)", "Sens"]}
        rows={[
          [<strong key="e">E</strong>, <>{code("B + (B − A)")}</>, "zakres pierwszej fali dodany od szczytu B"],
          [<strong key="v">V</strong>, <>{code("B + (B − C)")}</>, "zakres korekty dodany od szczytu B (minimalny cel)"],
          [<strong key="n">N</strong>, <>{code("C + (B − A)")}</>, "pierwsza fala powtórzona od dna korekty"],
          [<strong key="nt">NT</strong>, <>{code("C + (C − A)")}</>, "odbicie symetryczne A względem C"],
        ]}
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Wartość poczwórna</strong>: czterokrotność pierwszego ruchu
          od dna jest „minimalnym celem długoterminowym” (w bessie raczej
          trzykrotność). Gdy się nie realizuje, autor bierze medianę między
          nią a E.
        </li>
        <li>
          Nakładanie warstw: trzy fale = B + 2(B − A), cztery = B + 3(B − A),
          osiem = B + 7(B − A). Dodatkowo poziomy 1/3, 1/2, 2/3 zakresu, gdy
          brak innego oparcia.
        </li>
        <li>
          Wartości „bierne” (z poprzednich fal) i „czynne” (z bieżącego
          ruchu); punkt S = zbieżność E i NT z różnych fal.
        </li>
        <li>
          Autor podkreśla: „nie można stwierdzić, czy wartość obliczeniowa
          pojawi się na pewno”; ważniejszy jest czas (dzień zmiany) niż sama
          cena — bardzo prawdopodobne jest, że wartość przybliżona wystąpi
          około obliczonego dnia zmiany.
        </li>
      </ul>

      {/* 3 */}
      <H2>3. Sygnały i ocena trendu wg źródeł</H2>

      <H3>3.1 Trzy sygnały (san&apos;yaku)</H3>
      <p>
        Klasyczne potwierdzenie trendu wymaga zgodności trzech elementów:
      </p>
      <Table
        head={["", "Sygnał wzrostowy (kouten)", "Sygnał spadkowy (gyakuten)"]}
        rows={[
          ["Tenkan / Kijun", "Tenkan przecina Kijun z dołu (lub jest nad nią)", "Tenkan przecina Kijun z góry"],
          ["Cena / chmura", "Cena nad chmurą (chmura staje się wsparciem)", "Cena pod chmurą (chmura blokuje powrót)"],
          ["Chikou", "Chikou nad ceną sprzed 26 okresów", "Chikou pod ceną sprzed 26 okresów"],
        ]}
      />
      <p>
        Hosoda nazywa takie „wyraźne okresy kupna” kolejnymi okresami: po
        każdym pozytywnym zwrocie w tym samym trendzie liczy się pierwszy,
        drugi, trzeci i czwarty okres kupna. Źródła Sasakiego nie używają
        terminów „złoty/martwy krzyż”, ale samo przecięcie linii zwrotnej i
        standardowej traktują jako sygnał.
      </p>

      <H3>3.2 Dwa warunki dla pojedynczych akcji (Hosoda, tom I)</H3>
      <p>
        Na pojedynczych spółkach zdarzają się „sztuczne, tymczasowe zmiany
        cen”, więc samo przecięcie nie wystarcza. Autor stawia dwa warunki:
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Czas / nowe ceny</strong>: zwrot trwa od dołka co najmniej
          kilka dni (np. ponad 9) albo pojawia się po serii nowych cen
          zamknięcia. Luki na wykresie są korzystne.
        </li>
        <li>
          <strong>Kijun</strong>: po zwrocie cena zamknięcia nie schodzi
          poniżej Kijun; idealnie w ciągu 9 dni Kijun nie spada nawet przez
          jedną sesję. Tenkan chwilowo poniżej Kijun przy rosnącym Kijun nie
          jest jeszcze sygnałem sprzedaży.
        </li>
      </ol>
      <p>
        Autor pisze, że spełnienie obu warunków „pozwala na spokojne kupno” —
        i przyznaje, że dla profesjonalistów to bywa zbyt mało rygorystyczne.
        Sygnały pojawiają się rzadko (ok. 30 z 100–200 instrumentów).
      </p>

      <H3>3.3 Etapy odwrócenia trendu spadkowego (Sasaki, wykład 53)</H3>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Cena przebija linię zwrotną, która blokowała wzrost — ostrożne „kupno na próbę”.</li>
        <li>Cena powyżej linii standardowej.</li>
        <li>Linia opóźniona daje sygnał wzrostu.</li>
        <li>Świece powyżej dolnej granicy chmury.</li>
        <li>Świece powyżej górnej granicy chmury.</li>
      </ol>
      <p>
        „Przeważnie już przy punktach 2 i 3 zaczyna się okres kupna.” Sygnał
        wzrostu z samego wykresu może być fałszywy, jeśli zignoruje się czas i
        fale; nie należy działać na podstawie jednego dowodu.
      </p>

      <H3>3.4 Trzy funkcje chmury i skręt (Sasaki)</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Świece wychodzą ponad chmurę — staje się wsparciem.</li>
        <li>Świece przecinają dolną granicę z góry — chmura powstrzymuje powrót do trendu wzrostowego.</li>
        <li>
          Dzień zamiany Span A i B (skręt) — prawdopodobna zmiana trendu.
          Szczyt bywa osiągany, gdy chmura blokuje Chikou i cena nie może z
          niej wyjść.
        </li>
        <li>
          Płaskie odcinki Kijun i SSB traktowane są jako konsolidacja i
          poziomy S/R (Sjack, Sobótka).
        </li>
      </ul>

      <H3>3.5 Wybicie Kijun z retestem (fala N) i schemat „aktualnego SSB”</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Wybicie i test Kijun</strong> (wg praktyków polskich): cena
          wybija Kijun, wraca do niej (retest) bez zamknięcia po drugiej
          stronie i rusza dalej. Interpretowane jako realizacja fali N.
        </li>
        <li>
          <strong>Schemat „aktualnego SSB”</strong> (Sjack): odwrócenie
          sygnalizuje cena przebijająca <em>aktualne</em> (nieprzesunięte)
          SSB, czyli środek zakresu z ostatnich 52 okresów, przy jednoczesnym
          Chikou po właściwej stronie ceny i nowym lokalnym ekstremum.
          Uwaga: nasz sygnał „cena vs chmura” porównuje cenę z chmurą
          przesuniętą o 26 okresów, czyli to jest inny poziom.
        </li>
        <li>
          <strong>Fałszywy sygnał TK</strong> (Sobótka): przecięcie Tenkan i
          Kijun bez potwierdzenia (brak wzrostu Kijun, cena po złej stronie
          chmury) traktowane jako słabe.
        </li>
      </ul>

      <H3>3.6 Konfiguracje świecowe (Sasaki, Hosoda „Moje konfiguracje”)</H3>
      <p>
        Ciągi co najmniej 5, 7 lub 9 świec tego samego koloru (z jedną, a przy
        9 dwiema „interwencjami” świecy przeciwnej; doji nie przerywa ciągu)
        traktowane są jako sygnały zmiany strategii inwestorów — po spadku
        trwającym co najmniej segment (26 dni) ciąg 5 białych świec to sygnał
        kupna (mniejszy zasięg wzrostu w ciągu = lepiej). Dodatkowo: podwojenie
        ceny w ciągu jednego segmentu bywa szczytem; ciąg spadkowy 5+
        bezpośrednio w dniu szczytu jest silniejszym ostrzeżeniem niż ten sam
        ciąg po pierwszej wyprzedaży. Hosoda w tomie o konfiguracjach opisuje
        katalog 30 konfiguracji i „zjawisko wysokiego ryzyka”. Autorzy
        zalecają łączyć je z Pięcioma Zasadami Sakaty (luka, krzyż, trzy
        kruki, 8 i 10 nowych cen) i wykresem równowagi.
      </p>

      <H3>3.7 Wykres tygodniowy Hosody</H3>
      <p>
        W tomie „Tygodnie” Hosoda używa świec tygodniowych z kształtami B, Y i
        P (B — wybicie poza poprzedni zakres, Y — świeca obejmująca zakres
        poprzedniej, P — świeca zawarta wewnątrz), średnią ceną tygodniową i
        „świecami z dziewięciu tygodni”. Wejście następuje przy „nałożeniu”
        (drugi B lub Y po pierwszym), nie kupuje się dopóki ciągną się czarne
        świece 9-tygodniowe, a kupuje się ok. 3.–4. świecy po zmianie koloru
        na biały. Metoda ma służyć do selekcji instrumentów i zawsze należy ją
        porównać z szerokim rynkiem (u Hosody: indeks Dow).
      </p>

      <H3>3.8 Ocena, w jakiej fazie trendu jesteśmy</H3>
      <Table
        head={["Faza", "Kryteria wg źródeł"]}
        rows={[
          [
            "Trend wzrostowy",
            "Tenkan > Kijun; Kijun rośnie; cena nad Kijun i nad chmurą; Chikou nad ceną; kolejne wyższe szczyty i dołki; ekspansja zakresu w trzecim okresie; serie nowych cen zamknięcia.",
          ],
          [
            "Trend spadkowy",
            "Tenkan < Kijun; Kijun spada; cena pod chmurą, zwyżki zatrzymują się na jej dolnej granicy (dawne wsparcie staje się oporem); Chikou pod ceną.",
          ],
          [
            "Konsolidacja",
            "Cena zamknięta w chmurze lub między liniami, płaski Kijun i SSB; wybicie z chmury to „duży punkt zwrotny”. Przy szerokim trendzie bocznym metoda tygodniowa nie ma zastosowania.",
          ],
          [
            "Przejście / odwrót",
            "Etapy z punktu 3.3, skręt chmury, dzień zmiany z teorii czasu, zwrot Kijun. Hosoda: wykres równowagi nie daje sygnału dokładnie na szczycie ani dnie — chroni to przed „łapaniem szczytów i den”.",
          ],
        ]}
      />

      {/* 4 */}
      <H2>4. Scenariusze krok po kroku (z książek)</H2>
      <p>
        Poniższe przykłady pochodzą z książek (notowania japońskie, lata
        1965–1993, ceny w JPY). Autorzy nie podają żadnych statystyk —
        wyłącznie wybrane przykłady. Część rysunków w tłumaczeniu jest
        nieczytelna, więc kilka liczb może być niepewnych.
      </p>

      <div className="space-y-4">
        <Box title="Scenariusz 1 — Takeda (Hosoda, tom I): wejście w okres kupna">
          <p>
            Dołek 4 marca: 291. Po zwrocie Tenkan nad Kijun cena zamknięcia
            320 (dzień 25), a Kijun rośnie — warunek II spełniony. Pierwszy
            cel ok. 370 (wzrost 43 od minimum 291 → 334). Rzeczywistość: 14
            kwietnia 374, korekta tylko do 350. Kolejne wyliczenia: E od
            szczytu 374 z zakresem 83 = 457, od minimum 312 = 524. Potem
            maksimum 418 (9 maja), a pasywne E 551 i maksimum 584 zrealizowały
            się dopiero po kilku miesiącach.
          </p>
          <p className="text-white/50">
            Lekcja: sygnał wejścia = zwrot + rosnący Kijun; cele to E/NT, a
            tempo wyznaczają liczby czasu (13., 17., 26. dzień).
          </p>
        </Box>

        <Box title="Scenariusz 2 — Matsumoto: cele E i V na kolejnych falach">
          <p>
            Fale: 320 → 486 → 418 → 495 → 431. E = 486 + (486 − 320) = 652;
            E = 495 + (495 − 418) = 572; V = 495 + (495 − 431) = 559. Po zwrocie
            17 marca kolejno osiągnięte 559, 572, 652; potem czynne 709, 722,
            810 i ostatecznie 834 (kupno trwało do 848). Zakończenie: formacja
            objęcia z dwiema czarnymi świecami na szczycie i spadek o 158.
          </p>
        </Box>

        <Box title="Scenariusz 3 — Dow, kwiecień–czerwiec 1969: cele i dzień zmiany">
          <p>
            Wyliczenia z różnych formacji: 1800, 1850, 1855 (rzeczywiście 12
            lutego zamknięcie 1859), później 1920, 1950, 2044 i 2050. Sesja
            poranna wyliczała 2044, zamknięcie 2029; autor ostrzegł na antenie
            o „dniu zmiany 9 czerwca”, po czym nastąpił spadek do 1866 (23
            czerwca) i odbicie do 1998 w ciągu dwóch tygodni.
          </p>
          <p className="text-white/50">
            Uwaga: rynek zatrzymał się w pobliżu obliczonych poziomów, ale
            autor sam mówi, że „wartość obliczeniowa niekoniecznie musi osiągnąć
            szczyt”.
          </p>
        </Box>

        <Box title="Scenariusz 4 — Dow z 21.09.1970: liczby równorzędne">
          <p>
            Od dołka 1929 (27 maja): kolejne fale trwają 9, 9, 17, 18 i 9 dni. Wzrost od
            2067 (26 lipca) do 2169 (5 sierpnia) plus dołek 12 sierpnia trwały
            24 dni, „prawie równe liczbie 26 — trzeci cykl”. Autor wskazał w
            gazecie dzień zmiany 10.09; szczyt (2176) wypadł 9.09. Później
            sam przyznaje, że dzień mógł się przesunąć na 21.09.
          </p>
        </Box>

        <Box title="Scenariusz 5 — Kaneka (1969–70): fale, głowa i ramiona, N kontra Y">
          <p>
            Minimum 246, wzrost 282 → 305 → 361 → 398; dołek 301 (2 maja)
            i 281/303 (26 maja); N = 432 „zrealizowała się”. Szczyt 398:
            korekta 388 → 365, wzrost do 398 (+33 w 5 dni), zejście poniżej
            365 w 12 dni i o 10 poniżej w 16 dni — pełna fala Y. Szczyt 433:
            analogiczna Y. Wartości: V = 343, N = 318, V = 317, NT od 433 =
            263. 12 listopada zrealizowano V = 343, 29 września zakończył się
            segment (26 dni) od 395.
          </p>
        </Box>

        <Box title="Scenariusz 6 — Sasaki: ciąg 5 świec po spadku (Japan Metals & Chemicals, 1992)">
          <p>
            Szczyt 656 (2 lipca) → dołek 342 (12 sierpnia; spadek ponad
            segment). Po doji 13 sierpnia: 3 białe, 1 czarna, 2 białe = ciąg 5
            z interwencją o małym zasięgu (80). Sygnał kupna; przed upływem
            pierwszego cyklu (9 dni) cena poszła do 851. Przykład trafiony.
            Kontrprzykład: Toyo Suisan — ciąg 6 świec 30 lipca „za wcześnie”,
            cena spadła do 1230.
          </p>
        </Box>

        <Box title="Scenariusz 7 — Isuzu (1992): linie graniczne i dzień zmiany">
          <p>
            Dołek 226 (14 sierpnia), ciąg 5 z interwencją, 24 sierpnia
            przebicie linii granicznej 270 → sygnał kupna; szczyt 448 (3
            września; podwojenie ceny w 15 dni = szczyt wg reguły „podwojenie
            w segmencie”). Spadek: E = B − (A − B) = 252, dołek 245 (12
            listopada). Dzień zmiany: 62. dzień od dołka 226 — 12 listopada.
          </p>
        </Box>

        <Box title="Scenariusz 8 — Nikkei 225, świece tygodniowe (1989–92)">
          <p>
            Szczyt 29.12.1989 (38 915) → dołek 2.04.1990 (28 002) w 15 tygodni.
            Oczekiwany powrót po ok. 15 tygodniach; 7 czerwca (10. tydzień)
            33 192. Następny dołek: 1.10.1990 (20 221), czyli 15 tygodni po
            średnim dołku z 25.06.1990. Powtarzające się odstępy: 15, 16, 17, 18,
            22–25, 29, 33 i 34 tygodnie.
          </p>
          <p className="text-white/50">
            Uwaga: przy tak wielu dopuszczalnych odstępach niemal każdy punkt
            zwrotny można „wyjaśnić” po fakcie — patrz test w punkcie 7.
          </p>
        </Box>

        <Box title="Scenariusz 9 — wielostopniowy (multiframe) workflow">
          <p>
            Wg praktyków: (1) wykres miesięczny/tygodniowy wyznacza poziomy
            i kierunek nadrzędny, (2) wykres dzienny — scenariusz (chmura,
            Kijun, fala N), (3) H4/H1 — punkt wejścia (retest Kijun po
            wybiciu), (4) stop za ostatnim ekstremum lokalnym lub za Kijun z
            wykresu wejścia. Hosoda dodatkowo zawsze porównuje instrument z
            szerokim rynkiem.
          </p>
        </Box>
      </div>

      <H3>Zasady zarządzania pozycją w źródłach</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>„Nie trzymać strat” w oczekiwaniu na dzień zmiany ani teorię fal.</li>
        <li>Nie uśredniać w dół; piramidowanie tylko zaplanowane od początku.</li>
        <li>Kupować w drugim ważnym dołku, nie w pierwszym.</li>
        <li>
          Początkujący: transakcje tylko w prawie idealnych sytuacjach, tak
          by po 4 dniach zysk pokrywał koszty w obie strony.
        </li>
        <li>
          Realizacja zysku na wartościach obliczeniowych (E/V/N/NT),
          po podwojeniu ceny w segmencie, przy świecach ostrzegawczych
          (odwrócony młot, nagrobek doji, krzyż, luka) i po ponad 10 nowych
          cenach zamknięcia z rzędu.
        </li>
        <li>
          Stop-loss: Hosoda nie podaje jawnych liczbowych reguł (poza zasadą
          „nie trzymać strat”); praktycy stawiają go za ostatnim lokalnym
          ekstremum lub przy zamknięciu po złej stronie Kijun.
        </li>
      </ul>

      {/* 5 */}
      <H2>5. Ograniczenia i przestrogi autorów</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Hosoda deklaruje, że metoda pozwala trafnie odczytać „ponad 90%”
          dni zmiany, ale bez żadnych danych; przyznaje, że wyjątków od
          standardowego przebiegu jest „wiele” i że metoda wymaga 2–3 lat
          praktyki. Sasaki przyznaje jeden przykład nietrafiony (Toyo Suisan).
        </li>
        <li>
          Definicje są subiektywne: „mały/duży zasięg”, „linia graniczna”,
          „dzień zmiany”, „średniookresowy ruch falowy”, „ciąg pośredni” bez
          progów liczbowych, dopasowywane po fakcie.
        </li>
        <li>
          Wszystkie przykłady są z jednego rynku (Japonia, lata 60.–90.),
          wybrane retrospektywnie (błąd selekcji).
        </li>
        <li>
          Autor: liczby czasu działają najlepiej w trendzie wzrostowym;
          wykres tygodniowy ma sens przy dużych zmianach trendu, nie przy
          szerokim trendzie bocznym.
        </li>
        <li>
          Hosoda przestrzega przed poleganiem na publikowanych sygnałach —
          powszechne stosowanie metody samo w sobie ogranicza jej skuteczność.
        </li>
      </ul>

      {/* 6 */}
      <H2>6. Jak to się ma do oceny trendu na tej stronie</H2>
      <p>
        Panel „Ocena trendu” pod wykresem sumuje pięć sygnałów (każdy +1, −1
        lub 0). Suma ≥ +2 to BYCZY, ≤ −2 NIEDŹWIEDZI, reszta NEUTRALNY.
      </p>
      <Table
        head={["Sygnał na stronie", "Odpowiednik w źródłach", "Zgodność"]}
        rows={[
          [
            "Cena vs chmura (przesunięta o 26)",
            "Trzy funkcje chmury (Sasaki), san’yaku, etapy 4–5",
            <span key="1" className="text-emerald-300">Zgodne z klasyką</span>,
          ],
          [
            "Tenkan vs Kijun",
            "Pozytywny zwrot / przecięcie (Hosoda tom I; Sasaki wyk. 48)",
            <span key="2" className="text-emerald-300">Zgodne; brak warunku „Kijun nie spada” i „nowe ceny”</span>,
          ],
          [
            "Chikou (zamknięcie vs zamknięcie 26 okresów temu)",
            "Span opóźniony (Hosoda: „najlepszy ze spanów”; Sasaki: sygnał wzrostu przy przecięciu ceny)",
            <span key="3" className="text-amber-300">Zgodne co do sensu; brak reguły względem chmury</span>,
          ],
          [
            "Momentum ok. 76 świec (±1%)",
            "Brak w źródłach (76 to liczba czasu, ale nie jako próg zmiany ceny)",
            <span key="4" className="text-fall">Dodatek własny</span>,
          ],
          [
            "Kolor chmury w oknie 17 świec naprzód",
            "Skręt chmury (Sasaki) jako zmiana trendu; kolor sam w sobie nie jest sygnałem",
            <span key="5" className="text-amber-300">Luźno związane</span>,
          ],
          [
            "Suma sygnałów, próg ±2",
            "Brak — źródła każą syntetyzować „warunki”, ale bez punktacji",
            <span key="6" className="text-fall">Synteza własna</span>,
          ],
        ]}
      />
      <H3>Czego brakuje w naszej implementacji względem źródeł</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Teoria czasu</strong> (liczby 9/17/26/33/42/65/76, dzień
          zmiany, liczby równorzędne) — całkowicie pominięta.
        </li>
        <li>
          <strong>Kierunek Kijun</strong> („jest wręcz trendem ceny”) — nie
          jest osobnym sygnałem.
        </li>
        <li>
          Rozpoznawanie <strong>konsolidacji</strong> (płaski Kijun/SSB, cena w
          chmurze) — brak; oceniamy tylko byk/niedźwiedź/neutral.
        </li>
        <li>
          <strong>Retest Kijun, schemat aktualnego SSB, konfiguracje
          świecowe, wielostopniowa analiza</strong> — brak.
        </li>
        <li>
          Kontekst: ocena względem szerokiego rynku (u Hosody Dow) — brak.
        </li>
      </ul>
      <Box tone="good" title="Cele fal zgodne ze źródłami">
        <p>
          Kod liczy dla punktów A → B → C dokładnie wzory Hosody: E = B + (B −
          A), V = B + (B − C), N = C + (B − A), NT = C + (C − A). Wzory
          działają tak samo w trendzie spadkowym (znaki wynikają z cen).
        </p>
      </Box>

      <H3>Cele fal — jak działa narzędzie na tej stronie</H3>
      <p>
        Zygzak na cenach zamknięcia oznacza nowy punkt zwrotny, gdy cena
        odwróci się o co najmniej „czułość fal” (%, suwak nad wykresem).
        Z trzech ostatnich punktów zwrotnych A → B → C liczone są cztery cele
        (E, V, N, NT — wzory z punktu 2.3). To arytmetyczne projekcje z heurystycznego detektora
        fal, a nie prognozy.
      </p>

      {/* 7 */}
      <H2>7. Backtest: 3 lata (i 15 lat kontrolnie)</H2>
      <Box title="Metoda" tone="info">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Dane: dzienne, skorygowane ceny 504 obecnych spółek S&amp;P 500
            (High/Low/Close). Okres główny: 19.09.2023–18.09.2026; kontrola:
            19.09.2011–18.09.2026 oraz pięć 3-letnich podokresów.
          </li>
          <li>
            Ocena trendu z tej strony odtworzona wektorowo i zweryfikowana z
            backendem (36 próbek, 0 rozbieżności). Sygnał znany na
            zamknięciu dnia t, stopa zwrotu liczona od t (pomiar informacji), a
            w symulacjach strategii z opóźnieniem 1 sesji i kosztem 5 pb na
            stronę.
          </li>
          <li>
            Horyzonty: 5, 10, 21 i 63 sesje. Nadwyżka = stopa zwrotu spółki
            minus średnia wszystkich spółek tego samego dnia. Istotność: t-stat
            Newey-Westa na szeregu dziennym (korelacja obserwacji w czasie).
            Wartość |t| &gt; 2 traktujemy jako istotną.
          </li>
          <li>
            <strong>Ważne ograniczenie</strong>: to obecni członkowie
            S&amp;P 500 (obciążenie przeżywalnością) — zawyża poziomy stóp
            zwrotu, ale nie porównania między stanami. Testy dotyczą wyłącznie
            wykresów dziennych i akcji amerykańskich, a źródła opisują
            głównie rynek japoński i walutowy z uznaniem dyskrecjonalnym.
          </li>
        </ul>
      </Box>

      <H3>7.1 Czy ocena „byczy / neutralny / niedźwiedzi” przewiduje kierunek?</H3>
      <Table
        head={["Stan (3 lata)", "Udział czasu", "Śr. zwrot 21 sesji", "Śr. zmienność kolejnych 21 sesji"]}
        rows={[
          [<span key="a" className="text-rise">BYCZY (≥ +2)</span>, "ok. 47–51%", "+1,55%", "28,6%"],
          ["NEUTRALNY", "ok. 24%", "+1,96%", "30,7%"],
          [<span key="b" className="text-fall">NIEDŹWIEDZI (≤ −2)</span>, "ok. 26–29%", "+2,13%", "32,9%"],
          ["Wszystkie", "100%", "+1,81%", "—"],
        ]}
        caption="Nadwyżka nad średnią rynku w każdym stanie ≈ 0. 15 lat: zmienność 25,0% / 28,4% / 32,3%."
      />
      <Table
        head={["Miara (byki minus niedźwiedzie)", "3 lata", "15 lat"]}
        rows={[
          ["Różnica zwrotów 21 sesji (t)", "+0,17% (t = 0,36)", "−0,28% (t = −1,53)"],
          ["Różnica zwrotów 63 sesje (t)", "−0,24% (t = −0,19)", "−0,68% (t = −1,69)"],
          ["Korelacja rang (IC) z wynikiem 21 sesji", "−0,006", "−0,0155"],
          ["Korelacja rang (IC) z wynikiem 63 sesji", "−0,028", "—"],
        ]}
      />
      <p>
        Wniosek: stan oceny <strong>nie przewiduje kierunku</strong> — spółki
        „niedźwiedzie” w kolejnych tygodniach rosły przeciętnie tak samo jak
        „byki” (efekt odbicia), a w 15 latach nawet nieco lepiej. Ocena za to{" "}
        <strong>mierzy reżim ryzyka</strong>: stan niedźwiedzi oznacza wyraźnie
        wyższą zmienność. Dodatkowo stan jest niestabilny: średnia długość serii
        w tym samym stanie to ok. 9,7 dnia (mediana 3 dni).
      </p>

      <H3>7.2 Pojedyncze reguły z książek (nadwyżka zwrotu w kierunku sygnału, 21 sesji)</H3>
      <Table
        head={["Reguła", "3 lata: nadwyżka (t)", "15 lat: nadwyżka (t)"]}
        rows={[
          ["San’yaku kouten (cena>chmura, TS>KS, Chikou>cena) — long", "+0,18% (−0,1)", "−0,10% (−1,4)"],
          ["Faza stabilnego wzrostu: cena>TS>KS>chmura — long", "+0,17% (−0,3)", "−0,10% (−1,9)"],
          ["Retest Kijun po wybiciu w górę — long", "−0,20% (−1,9)", "−0,03% (−0,5)"],
          ["Samo wybicie ceny nad Kijun — long", "−0,18% (−1,9)", "−0,02% (−0,4)"],
          ["Schemat Sjacka (aktualne SSB) w górę — long", "−0,00% (−1,6)", "+0,04% (0,3)"],
          ["Samo przebicie aktualnego SSB w górę — long", "−0,30% (−3,0)", "−0,02% (−0,2)"],
          ["Złoty krzyż TS/KS (dzień krzyża) — long", "−0,21% (−1,3)", "−0,03% (−0,1)"],
          ["Złoty krzyż „prawdziwy” (po 3 sesjach) — long", "−0,00% (−0,2)", "−0,03% (−1,1)"],
          ["Złoty krzyż „fałszywy” — long", "−0,03% (0,2)", "+0,07% (1,4)"],
          ["Skręt chmury na zielono — long", "−0,13% (−0,7)", "−0,21% (−2,4)"],
          ["Chikou nad ceną sprzed 26 sesji — long", "+0,09% (−0,1)", "−0,07% (−1,1)"],
          ["Cena>KS i KS rośnie (5 sesji) — long", "+0,24% (0,3)", "−0,08% (−1,6)"],
        ]}
        caption="Pokazano wersje long; pełny test obejmował ok. 40 reguł, także odpowiedniki short (sygnały spadkowe). Praktycznie wszystkie nadwyżki ≈ 0 i |t| < 2; pojedyncze wyniki z |t| > 2 w jednym okresie (np. przebicie aktualnego SSB w dół, 3 lata) nie powtarzają się w drugim, co przy tylu testach jest oczekiwane z samego przypadku. Odsetek trafień zazwyczaj nie przewyższał bazowego (ok. 57% dodatnich zwrotów 21-sesyjnych — dryf rynku). Rozróżnienie krzyży TK na fałszywe i prawdziwe, które Sobótka uznaje za istotne, nie daje różnicy."
      />

      <H3>7.3 Cele fal (E, V, N, NT) — czy cena je osiąga?</H3>
      <p>
        Dla każdego trzeciego punktu zygzaka (próg 5%) obliczono cele z
        wzorów Hosody i z wzorów tej strony, i sprawdzono czy cena (High/Low)
        osiągnęła cel w ciągu 21 lub 63 sesji. Surowy odsetek trafień bywa
        wysoki (N ma medianę dystansu 3–4,5%), ale trzeba go porównać z
        oczekiwanym: dla całego uniwersum w tym samym dystansie
        wyrażonym w odchyleniach standardowych.
      </p>
      <Table
        head={["Cel", "3 lata: trafił / oczekiwany (21 s.)", "15 lat: trafił / oczekiwany (21 s.)", "Różnica (15 lat, 63 s.)"]}
        rows={[
          ["E Hosody = B+(B−A)", "16,3% / 17,3%", "16,0% / 16,8%", "−1,6 pp"],
          ["V Hosody = B+(B−C)", "23,0% / 23,1%", "21,9% / 22,3%", "−1,2 pp"],
          ["N = C+(B−A)", "57,2% / 57,4%", "56,7% / 56,9%", "−0,8 pp"],
          ["NT Hosody = C+(C−A)", "41,2% / 41,5%", "40,6% / 41,0%", "−0,9 pp"],
          ["V dawnej wersji strony = C−(B−A)", "11,6% / 12,5%", "11,1% / 12,0%", "−1,1 pp"],
          ["E dawnej wersji strony = C+(C−B)", "11,6% / 12,3%", "11,1% / 11,9%", "−1,2 pp"],
        ]}
        caption="n ≈ 22 tys. zdarzeń (3 lata) i ≈ 100 tys. (15 lat) na cel. Po korekcie o zmienność wszystkie wzory osiągają się tak często, jak wynika z samego dystansu — bez przewagi."
      />
      <p>
        Wniosek: cele fal to po prostu poziomy w określonej odległości od
        ceny, osiągane z prawdopodobieństwem wynikającym ze zmienności. Nie
        wykazano, by wzory Hosody były lepsze niż losowy poziom w tej samej
        odległości. Wzory dawnej wersji tej strony (V, E — różne od Hosody, dlatego
        pokazane w tabeli osobno) również nie wypadły gorzej ani lepiej.
        Obecnie kod używa wzorów Hosody.
      </p>

      <H3>7.4 Teoria czasu — czy zwroty przypadają na liczby 9/17/26/33/42/51/65/76?</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Czasy trwania odcinków między kolejnymi punktami zygzaka (5%) na 15
          latach (ok. 30 tys. odcinków): stosunek liczby odcinków w oknie ±1
          wokół liczb podstawowych do sąsiednich długości = 0,95 (dla
          zamieszanej losowo serii 1,015). Przy 65 (0,85) i 76 (0,69) — mniej
          niż zwykle. W okresie 3-letnim 1,01 vs 1,00.
        </li>
        <li>
          Równość długości kolejnych fal (AB = CD, różnica ≤ 1 dzień) występuje
          w 13,1% trójek vs 11,05% dla losowego błądzenia — słaby efekt (ok.
          ×1,2 nad sąsiednimi długościami), dotyczący &lt; 1% trójek. Relacje
          AB = BD i AC = CD (×0,93–0,95) — bez efektu.
        </li>
      </ul>
      <p>
        Wniosek: nie ma dowodu, by liczby czasu z książek miały wyróżnioną
        rolę. Jedyny (mały) ślad to podobna długość kolejnych fal.
      </p>

      <H3>7.5 Konsolidacja — czy płaskie linie i cena w chmurze zapowiadają spokój?</H3>
      <Table
        head={["Warunek (3 lata)", "Udział czasu", "Zmienność kolejnych 21 sesji", "Współczynnik efektywności ruchu"]}
        rows={[
          ["Wszystkie obserwacje", "100%", "30,4%", "0,238"],
          ["Kijun i SSB płaskie (5 sesji)", "7,9%", "30,8%", "0,238"],
          ["Cena wewnątrz chmury", "12,8%", "30,9%", "0,237"],
          ["Cienka chmura (< 1% ceny)", "16,4%", "26,8%", "0,237"],
        ]}
        caption="Płaskie linie i cena w chmurze nie zmniejszają zakresu ani zmienności; tylko cienka chmura zapowiada niższą zmienność (efekt grupowania zmienności)."
      />

      <H3>7.6 Wariant tygodniowy oceny trendu</H3>
      <Table
        head={["Horyzont (spread byki − niedźwiedzie)", "3 lata (t)", "15 lat (t)"]}
        rows={[
          ["4 tygodnie", "+0,34% (0,80)", "−0,18% (−0,80)"],
          ["13 tygodni", "+1,85% (1,95)", "−0,48% (−0,84)"],
          ["26 tygodni", "+5,06% (4,07)", "−0,65% (−0,56)"],
        ]}
      />
      <p>
        W ostatnich 3 latach wersja tygodniowa daje istotne wyniki (okres
        silnego momentum), ale nie potwierdza się w 15 latach — efekt zależy
        od reżimu rynku, a nie od stałej przewagi metody.
      </p>

      <H3>7.7 Symulacja strategii (opóźnienie 1 sesji, koszt 5 pb na stronę)</H3>
      <p>Portfel równych wag z 504 spółek, dzienny rebalans:</p>
      <Table
        head={["Strategia", "3 lata: zwrot roczny / Sharpe", "15 lat: zwrot roczny / Sharpe"]}
        rows={[
          ["Kup wszystko (benchmark)", "+20,3% / 1,35", "+18,7% / 1,07"],
          ["Long tylko stany byczy", "+15,3% / 1,15", "—"],
          ["Long wszystko oprócz niedźwiedzi", "+17,4% / 1,30", "—"],
          ["Long byki, short niedźwiedzie", "−5,8% / −0,34", "−12,3% / −0,88 (maks. obsunięcie −86,8%)"],
          ["Long: san’yaku kouten", "+13,7% / 1,03", "—"],
        ]}
        caption="Strategia short niedźwiedzi traci, bo spółki w stanie niedźwiedzim odbijają, a rynek akcji ma dodatni dryf."
      />
      <p>
        Test na poziomie <strong>indeksu</strong> (równoważony indeks z 504
        spółek, wysokie/niskie przybliżone), gdzie ocena trendu służy jako
        filtr ekspozycji:
      </p>
      <Table
        head={["Strategia", "3 lata: zwrot / Sharpe / maks. obsunięcie", "15 lat: zwrot / Sharpe / maks. obsunięcie"]}
        rows={[
          ["Kup i trzymaj", "+20,3% / 1,35 / —", "+18,7% / 1,07 / −38,4%"],
          ["Long gdy nie-niedźwiedzi", "+17,6% / 1,51 / −10,1%", "+14,6% / 1,11 / −19,1%"],
          ["Long gdy byczy", "+12,5% / 1,27 / −7,8% (ekspozycja 0,73)", "+6,9% / 0,69 / —"],
          ["Long/short", "+9,0% / 0,71 / —", "+1,7% / 0,19 / —"],
        ]}
      />
      <p>
        Filtr „nie być w rynku, gdy indeks jest niedźwiedzi” obniża maksymalne
        obsunięcie (15 lat: z −38% do −19%) i lekko poprawia Sharpe’a, kosztem
        niższego zwrotu. Ocena trendu działa więc jako{" "}
        <strong>filtr ryzyka</strong>, nie jako narzędzie do zwiększania zwrotu.
      </p>

      {/* 8 */}
      <H2>8. Ocena metodologii</H2>
      <Box tone="good" title="Co działa">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Stan trendu (chmura, TK, Chikou, momentum) dobrze rozróżnia
            reżimy zmienności — jest sensownym wskaźnikiem ryzyka i filtrem
            ekspozycji (mniejsze obsunięcia).
          </li>
          <li>
            Wykres jest czytelną, spójną wizualizacją kontekstu (trend,
            wsparcie/opór, momentum) i pomaga w zarządzaniu pozycją (Kijun
            jako trailing stop).
          </li>
          <li>Cienka chmura zapowiada niższą zmienność; słaby ślad podobnych długości kolejnych fal.</li>
        </ul>
      </Box>
      <Box tone="warn" title="Czego nie potwierdzono">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Przewidywania kierunku ceny (byczy/niedźwiedzi, san’yaku, retest
            Kijun, schemat SSB, krzyże TK, skręt chmury) — zero przewagi w 3 i
            15 latach na akcjach S&amp;P 500.
          </li>
          <li>Przewagi celów fal E/V/N/NT ponad losowy poziom o tej samej odległości.</li>
          <li>
            Rzekomej „szczególnej roli” liczb czasu i „dnia zmiany” (brak
            wzbogacenia na 9/17/26/33/42/65/76).
          </li>
          <li>Redukcji zmienności i ruchu w konsolidacji (płaski Kijun/SSB, cena w chmurze).</li>
        </ul>
      </Box>
      <p>
        Trzeba pamiętać o tym, czego backtest nie sprawdza: źródła są
        dyskrecjonalne — łączą wiele elementów oceniane „na oko”,
        wielostopniowo (miesiąc → dzień → H1) i głównie na rynku japońskim i
        walutowym. Mechaniczne reguły na dziennych akcjach amerykańskich są
        tylko jednym uczciwym sposobem sprawdzenia; nie dowodzą, że metoda w
        rękach doświadczonego praktyka nie działa, ale też nie znajdują
        żadnego dowodu, że działa. Sami autorzy nie przedstawiają statystyk.
      </p>
      <p>
        Rekomendacja: traktować ocenę trendu na tej stronie jako opis reżimu i
        poziomu ryzyka (nie jako sygnał kupna/sprzedaży), a cele fal jako
        poziomy odniesienia. Ewentualne dalsze usprawnienia: dodać kierunek
        Kijun i wykrywanie konsolidacji jako osobne wskaźniki.
      </p>
    </section>
  );
}
