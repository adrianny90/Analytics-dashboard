import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";

export const metadata = { title: "Metodologia" };

export default function MetodologiaPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Metodologia</h1>
      <p className="mt-1 text-sm text-white/50">
        Co przetestowaliśmy, co wyszło najlepiej (Ichimoku + Kijun 52 + prognozy analityków + MA200 + dokładka), jak to
        zoptymalizować pod większą trafność i jak dojść do prawie 5000 USD z 1000 USD w backteście. Stan na wrzesień 2026.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Ważne zastrzeżenie">
          <p>
            To wyniki <Strong>backtestów</Strong> (symulacji na danych historycznych), a nie prognozy ani porada
            inwestycyjna. Wszystkie liczby dotyczą jednego okresu (20.09.2021–18.09.2026), obecnych członków S&amp;P 500 i
            wariantów wybranych po obejrzeniu wyników spośród kilkuset przetestowanych, więc mają obciążenie doborem i
            przeżywalnością. Metoda nie została potwierdzona poza próbą. Traktuj ją jako hipotezę do dalszej weryfikacji.
          </p>
        </Box>

        <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="mb-1 font-semibold text-white/80">Spis sekcji</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Streszczenie</li>
            <li>Jak testowaliśmy (dane, okres, symulator)</li>
            <li>Najlepsza metodologia: Ichimoku + Kijun 52 + analitycy + MA200 + dokładka</li>
            <li>Wyniki tej metodologii z backtestów</li>
            <li>Co jeszcze testowaliśmy (historia testów)</li>
            <li>Porównanie z innymi metodami (Bollinger, Fibonacci, MACD, RSI i inne)</li>
            <li>Optymalizacja pod większą trafność (do 46% i ponad 50% zyskownych pozycji)</li>
            <li>Jak dojść do prawie 5000 USD z 1000 USD: krok po kroku</li>
            <li>Ograniczenia i co jeszcze trzeba sprawdzić</li>
          </ol>
        </nav>

        {/* 1 */}
        <H2>1. Streszczenie</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Najlepsza znaleziona metoda to połączenie: <Strong>prognoza analityków ≥ 20% wzrostu</Strong> +{" "}
            <Strong>cena powyżej MA200</Strong> + wejście, gdy cena przebija w górę <Strong>Kijun-sen z 52 okresów</Strong> +{" "}
            <Strong>dokładka 5% kapitału</Strong>, gdy cena jest nad chmurą Ichimoku i ocena 5 linii jest byczą, wyjście po
            zamknięciu ceny poniżej Kijun-sen 52. Na S&amp;P 500 (483 spółki, 5 lat, 1000 USD) dało średnio{" "}
            <Strong>2694–3374 USD</Strong> wobec 1851 USD dla kupna całego rynku, przy takim samym obsunięciu (−19%) i
            wyższym Sharpe (1,2 wobec 0,83). Zyskownych transakcji było tylko ok. 25%.
          </li>
          <li>
            Sam Ichimoku (bez analityków i MA200) <Strong>nie bił rynku</Strong>. Największą część przewagi dają filtr
            analityków + MA200 i dokładka, a nie sama linia Ichimoku.
          </li>
          <li>
            Trafność można podnieść z ok. 24% do <Strong>ok. 46%</Strong> prawie bez straty kapitału (potwierdzenie
            wybicia przez 5 sesji + wyjście przy przecięciu Tenkan pod Kijun), a do <Strong>ok. 51%</Strong> kosztem
            części zysku (dodatkowo sprzedaż połowy pozycji po +8%): 1968–2448 USD.
          </li>
          <li>
            Najwyższy kapitał dała wersja z potwierdzeniem wybicia przez 5 sesji i wyjściem pod Kijun 52 (bez realizacji
            zysku), pozycja bazowa 5%: <Strong>4819 USD</Strong> (zakres 4567–5099 USD w 6 losowaniach), obsunięcie −21%,
            Sharpe 1,72, trafność 35%. To opisane w sekcji 8 &bdquo;prawie 5000 USD&rdquo;.
          </li>
        </ul>

        {/* 2 */}
        <H2>2. Jak testowaliśmy</H2>
        <DocTable
          head={["Element", "Ustawienie w backteście"]}
          rows={[
            ["Okres testu", "20.09.2021–18.09.2026 (ok. 5 lat, 1255 sesji). Wskaźniki liczone od 2019 r. (rozgrzewka)."],
            ["Spółki", "483 obecne spółki S&P 500 (dla nich są historyczne prognozy analityków). Wcześniejsze testy: 295 spółek Nasdaq/Russell 2000, 881 i 1214 spółek (bez analityków)."],
            ["Dane cenowe", "Yahoo Finance, dzienne OHLC skorygowane o splity i dywidendy."],
            ["Kapitał startowy", "1000 USD, bez dźwigni, gotówka nie jest oprocentowana."],
            ["Wielkość pozycji", "Pozycja bazowa = 1%, 2%, 5%, 10% lub 20% aktualnego kapitału na spółkę (kapitał liczony na bieżąco); dokładka +5% kapitału, raz na pozycję. Akcje ułamkowe."],
            ["Wykonanie", "Sygnał na zamknięciu sesji t, kupno po cenie otwarcia sesji t+1. Wyjście na sygnale: sprzedaż po otwarciu następnej sesji."],
            ["Koszty", "5 punktów bazowych (0,05%) za każdą stronę transakcji."],
            ["Nadmiar sygnałów", "Gdy sygnałów jest więcej niż gotówki, spółki wybierane są losowo. Wynik podajemy jako średnią z 6–10 losowań kolejności (i zakres min–maks)."],
            ["Benchmark", "Kup i trzymaj równymi wagami wszystkie 483 spółki: 1851 USD, obsunięcie −19,4%, Sharpe 0,83."],
            ["Miary", "Kapitał końcowy, maksymalne obsunięcie (z zamknięć dziennych), Sharpe, liczba i trafność transakcji, średni zysk i strata, współczynnik zysku do strat (PF)."],
          ]}
        />
        <H3>Jak odtworzono prognozy analityków (bez podglądania przyszłości)</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Źródło: historia 155 tys. zmian rekomendacji i celów cenowych (2011–2026) dla S&amp;P 500 z Yahoo Finance.
          </li>
          <li>
            Konsensus danego dnia = mediana ostatniego celu każdej firmy z ostatnich 180 dni, przy co najmniej 3 firmach.
            Używane są wyłącznie cele opublikowane do tego dnia.
          </li>
          <li>
            Cele są nominalne z dnia publikacji, więc korygowano je o późniejsze splity (np. Amazon 3500 USD tuż przed
            splitem 20:1). Odrzucono 5037 z 127 tys. celów (cel powyżej 4× lub poniżej 0,25× ceny) jako artefakty.
          </li>
          <li>Potencjał wzrostu = konsensus / cena zamknięcia − 1. Warunek: co najmniej 20%.</li>
        </ul>
        <H3>Jak liczone są elementy Ichimoku</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Kijun-sen 52</Strong> = środek zakresu (najwyższy High + najniższy Low) z ostatnich 52 świec dziennych.
            Sygnał wejścia: zamknięcie powyżej Kijun 52 przy zamknięciu poprzedniej sesji na lub poniżej niego.
          </li>
          <li>
            <Strong>Chmura</Strong>: Senkou A = (Tenkan 9 + Kijun 26) / 2, Senkou B = środek zakresu z 52 świec, oba
            przesunięte o 26 świec naprzód. &bdquo;Cena nad chmurą&rdquo; = zamknięcie powyżej wyższej z dwóch granic.
          </li>
          <li>
            <Strong>Ocena 5 linii</Strong> = dokładnie ta sama funkcja, co w rankingu na stronie (cena vs chmura, Tenkan vs
            Kijun, zamknięcie vs zamknięcie sprzed 26 świec, zmiana ceny w 76 świecach &gt; ±1%, kolor chmury w kolejnych
            17 świecach). Suma ≥ +2 to ocena bycza. Zweryfikowana z backendem (0 rozbieżności na 36 próbkach).
          </li>
          <li>
            <Strong>MA200</Strong> = zwykła średnia z 200 zamknięć dziennych.
          </li>
        </ul>

        {/* 3 */}
        <H2>3. Najlepsza metodologia: Ichimoku + Kijun 52 + analitycy + MA200 + dokładka</H2>
        <p>Reguły w kolejności, w jakiej działają w symulacji (wersja bazowa):</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Filtr wejścia</Strong> (wszystkie warunki jednocześnie): prognoza analityków ≥ 20% wzrostu{" "}
            <em>i</em> cena zamknięcia powyżej MA200 (długoterminowy trend wzrostowy).
          </li>
          <li>
            <Strong>Sygnał wejścia</Strong>: cena zamyka się powyżej Kijun-sen 52 (przebicie w górę z poziomu na lub poniżej).
          </li>
          <li>
            <Strong>Kupno</Strong>: po cenie otwarcia następnej sesji, pozycja bazowa (np. 1–5% kapitału). Bez dokładania do
            pozycji poza punktem 4.
          </li>
          <li>
            <Strong>Dokładka</Strong>: jednorazowo +5% kapitału do otwartej pozycji, gdy cena jest powyżej chmury Ichimoku
            <em> i</em> ocena 5 linii jest byczą (≥ +2). Zwiększa ekspozycję na spółki w potwierdzonym trendzie.
          </li>
          <li>
            <Strong>Wyjście</Strong>: zamknięcie ceny poniżej Kijun-sen 52 zamyka całą pozycję po otwarciu następnej sesji.
            Nie ma osobnego stop-lossa cenowego.
          </li>
          <li>
            Ponowne wejście w tę samą spółkę jest możliwe po nowym sygnale (te same warunki od nowa). Nie dokłada się do
            pozycji ponad dokładkę.
          </li>
        </ol>

        {/* 4 */}
        <H2>4. Wyniki tej metodologii z backtestów</H2>
        <p>
          Średnia z 10 losowań kolejności wyboru spółek, 483 spółki S&amp;P 500, 20.09.2021–18.09.2026, 1000 USD. Rynek
          (kup i trzymaj): 1851 USD, obsunięcie −19,4%, Sharpe 0,83.
        </p>
        <DocTable
          head={["Pozycja bazowa (+5% dokładka)", "Kapitał końcowy (średnia, zakres)", "Maks. obsunięcie", "Sharpe", "Transakcji", "Trafnych"]}
          rows={[
            ["1%", "2694 USD (2584–2816)", "−19%", "1,22", "962", "24%"],
            ["2%", "2725 USD (2599–2896)", "−21%", "1,18", "878", "25%"],
            ["5%", "2905 USD (2628–3240)", "−22%", "1,14", "594", "25%"],
            ["10%", "2887 USD (2098–4216)", "−26%", "1,07", "397", "28%"],
            ["20%", "3374 USD (2847–3841)", "−29%", "1,10", "221", "30%"],
          ]}
          caption="Wersja bez dokładki: 1290 (obsunięcie −5%), 1638 (−9%), 2141 (−21%), 2688 (−26%), 2648 USD (−29%) odpowiednio dla pozycji 1–20%."
        />
        <H3>Skąd bierze się wynik: dodawanie elementów po kolei</H3>
        <DocTable
          head={["Konfiguracja (S&P 500, pozycja 1% / 2%)", "Kapitał końcowy"]}
          rows={[
            ["Sam Ichimoku: przebicie Kijun 52 + dokładka + wyjście pod Kijun 52", "1333 / 1381 USD (poniżej rynku)"],
            ["+ prognoza analityków ≥ 20%", "1940 / 1680 USD"],
            ["+ analitycy + cena > MA100 + dokładka", "2380 / 2333 USD"],
            ["+ analitycy + cena > MA200 + dokładka (metoda bazowa)", "2694 / 2725 USD"],
            ["Bez analityków, z MA200 + dokładka", "1577 / 1435 USD"],
          ]}
          caption="Najważniejszy element to filtr analityków; MA200 i dokładka poprawiają wynik dalej."
        />
        <H3>Stabilność w czasie</H3>
        <p>
          Podział okresu na połowy (pozycja bazowa 1%): w pierwszej połowie (09.2021–03.2024) kapitał ×1,47 wobec ×1,28 dla
          rynku, w drugiej (03.2024–09.2026) ×1,83 wobec ×1,45. Przewaga utrzymuje się w obu połowach, ale to nadal jedna
          próba.
        </p>
        <Box tone="warn" title="Uczciwa uwaga: Kijun 52 kontra zwykły Kijun 26">
          <p>
            W pełnej kombinacji (analitycy + MA200 + dokładka) zwykły Kijun 26 wypadł co najmniej tak samo dobrze jak 52:
            2664 / 2870 / 3306 / 4014 / 6115 USD dla pozycji 1–20% (obsunięcie −13% do −28%, Sharpe 1,4–1,6, przy 20% duży
            rozrzut 4908–7051 USD). Przewagę Kijun 52 widać dopiero w słabszych konfiguracjach (bez analityków i MA200).
            Zapis &bdquo;Kijun 52&rdquo; w metodologii wynika z założenia badania, a nie z jego jednoznacznego wyniku.
          </p>
        </Box>
        <H3>Wpływ wielkości pozycji</H3>
        <p>
          Większa pozycja bazowa zwiększa średni wynik tylko umiarkowanie (2694 → 3374 USD od 1% do 20%), ale obsunięcie rośnie
          z −19% do −29% (do −33% w najgorszym losowaniu), Sharpe maleje, a rozrzut wyników rośnie wielokrotnie. Rozsądniejsze
          są małe pozycje z dokładką przy potwierdzonym trendzie.
        </p>

        {/* 5 */}
        <H2>5. Co jeszcze testowaliśmy (historia testów)</H2>
        <DocTable
          head={["Test", "Próba i okres", "Wynik"]}
          rows={[
            ["Ocena trendu strony (5 sygnałów, byczy/niedźwiedzi)", "504 spółki S&P 500, 3 lata i 15 lat", "Nie przewiduje kierunku ceny; przewiduje zmienność (niedźwiedzi: o 15–30% wyższa). Użyteczna jako filtr ryzyka (obsunięcie indeksu −19% zamiast −38%)."],
            ["Reguły z książek Ichimoku (san'yaku, wybicie i retest Kijun, schemat SSB, krzyże TK, skręt chmury, konfiguracje świecowe)", "504 spółki, 3 i 15 lat", "Brak przewagi ponad losowość (nadwyżki ≈ 0, |t| < 2)."],
            ["Cele fal (E, V, N, NT), teoria czasu (liczby 9/17/26/33/42/65/76), konsolidacja", "504 spółki, 3 i 15 lat", "Brak przewagi po korekcie o zmienność; brak wzbogacenia na liczbach czasu; płaskie linie nie zmniejszają zmienności."],
            ["Fazy cyklu Kitchina jako filtr", "295 spółek Nasdaq/Russell 2000, 5 lat", "Nie działa jako sygnał kupna (fazy zmieniają się co ok. 6 dni)."],
            ["System 1000 USD: wejście na san'yaku, wyjście pod Kijun / Tenkan pod Kijun, stop pod chmurą", "295 spółek, 5 lat", "1105–1400 USD wobec 1749 USD rynku; profil klasyczny (34–40% trafnych)."],
            ["Filtr RSI ≤ 30 i Predykcja ze strony", "295 spółek, 5 lat", "RSI ≤ 30 wyklucza się z wejściem nad chmurą (0 transakcji); Predykcja ≥ 60% nic nie wnosi."],
            ["Kijun tygodniowy 26 kontra 52 tyg.", "881 spółek, 5 lat", "52 tyg. lepszy (1703 wobec 1497 USD), ale oba poniżej rynku (1769 USD)."],
            ["Filtr prognoz analityków 20% / 25% / 30% / 40% / 50%", "483 spółki S&P 500, 5 lat", "≥ 20%: 1921–2112 USD (rynek 1859 USD); wyższe progi zostawiają za mało okazji (≥ 30%: 1378–1394 USD)."],
            ["Masowe testy: 6300 wariantów (wejścia, wyjścia, RSI, stałe czasy, wielkości pozycji, wyłącznik po −8%) z limitem obsunięcia 10%", "1214 spółek, 5 lat", "Żaden wariant z obsunięciem ≤ 10% nie pobił rynku; najlepsze 1346–1418 USD ≈ rynek z częścią w gotówce."],
            ["Test końcowy: analitycy + Kijun 52 + MA100/MA200 + dokładka; pozycje 1–20%", "483 spółki, 5 lat", "Najlepszy wynik: 2694–3374 USD (sekcja 4)."],
            ["Metody wysokiej trafności (RSI2, IBS, RSI14, cel +1–3%)", "1214 spółek, 5 lat", "Trafność do 84%, ale oczekiwanie ≈ 0 (średnia strata 4–6× większa od zysku)."],
            ["Inne metodologie (Bollinger, Fibonacci, MACD, Stochastic, Donchian, MA)", "483 spółki, 5 lat", "Sekcja 6."],
            ["Optymalizacja pod trafność (ok. 300 wariantów)", "483 spółki, 5 lat", "Sekcja 7."],
          ]}
        />

        {/* 6 */}
        <H2>6. Porównanie z innymi metodami</H2>
        <p>
          Ten sam symulator i te same zasady wykonania. Kapitał końcowy z 1000 USD przy pozycji 2% / 5%, trafność przy
          pozycji 2%. &bdquo;Filtr&rdquo; = analitycy ≥ 20% + cena &gt; MA200. Rynek: 1851 USD.
        </p>
        <DocTable
          head={["Metoda", "Bez filtra", "Z filtrem", "Trafnych (z filtrem)"]}
          rows={[
            [<Strong key="k">Czarny koń: Kijun 52 + filtr + dokładka</Strong>, "—", "2693 / 2954 (Sharpe 1,18)", "24%"],
            ["Ichimoku Kijun 52, samo przebicie", "1283 / 1157", "1638 / 2162", "30%"],
            ["Ichimoku Kijun 26, samo przebicie", "1261 / 1093", "1483 / 2621", "31%"],
            ["Ichimoku san'yaku (świeże)", "1386 / 1640", "1301 / 1870", "45%"],
            ["MA200 (kup nad, sprzedaj pod)", "1961 / 2117", "2016 / 2253", "22%"],
            ["MA50", "1317 / 1289", "1693 / 2665 (obs. −6%, Sharpe 1,33)", "28%"],
            ["MA20/50, złoty krzyż MA50/200", "1670 / 1681, 1692 / 1847", "1375 / 2047, 1401 / 2146", "43%, 41%"],
            ["Wstęgi Bollingera (20,2), wybicie", "1439 / 1266", "1221 / 1598 (obs. −3%, Sharpe 1,29)", "45%"],
            ["Wstęgi Bollingera (20,2), odwrócenie", "1316 / 1302", "1208 / 1424", "59%"],
            ["Fibonacci 61,8% / 50% / 38,2% (odbicie w trendzie)", "975–1053", "1010–1077", "30–35%"],
            ["Donchian 55/20 (Turtle)", "1698 / 1503", "1130 / 1342", "50% (135 transakcji)"],
            ["MACD (przecięcie pod zerem)", "1430 / 1429", "1109 / 1346", "37%"],
            ["Stochastic (14,3,3) < 20", "1640 / 1664", "1279 / 1503", "64%"],
            ["Connors RSI2 < 10 + MA200", "1590 / 1543", "1280 / 1626", "63%"],
            ["RSI14 < 30 + MA200", "1191 / 1378", "1105 / 1261", "62%"],
          ]}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>Fibonacci wypadł najgorzej (współczynnik zysku do strat ok. 1,0), więc nie ma przewagi.</li>
          <li>
            Metody z wysoką trafnością (Bollinger, Stochastic, RSI) mają kapitał poniżej rynku, bo trzymają gotówkę przez
            większość czasu, a średnia strata jest większa niż zysk.
          </li>
          <li>
            Filtr analitycy + MA200 poprawia niemal wszystkie metody trendowe (Sharpe z ok. 0,4–0,8 do 1,0–1,4). Przewaga
            czarnego konia wynika więc głównie z filtra i dokładki, a nie z samego Ichimoku.
          </li>
        </ul>

        {/* 7 */}
        <H2>7. Optymalizacja pod większą trafność</H2>
        <p>
          Cel: podnieść odsetek zyskownych pozycji z ok. 24% do co najmniej 50%. Przetestowano ok. 300 wariantów (wszystkie z
          filtrem analitycy + MA200 i dokładką 5%): potwierdzenie wybicia (cena nad Kijun 52 przez 3 lub 5 kolejnych sesji),
          inne wyjścia (Tenkan pod Kijun, cena pod Kijun 26 / MA10 / MA20 / Tenkan), cele +6…+15%, przesunięcie stopu na cenę
          wejścia po +5%, limit 40 sesji, filtr rynku (indeks powyżej MA200), siła względna, RSI 50–70, analitycy ≥ 30%,
          wejście po cofnięciu do Kijun 26 oraz częściowa realizacja zysku (sprzedaż połowy lub 1/3 pozycji po +5…+15%).
        </p>
        <DocTable
          head={["Wariant", "Kapitał (pozycja 2% / 5%)", "Trafnych", "Obsunięcie", "Sharpe"]}
          rows={[
            ["Dotychczasowy czarny koń", "2693 / 2954 USD", "24–25%", "−20% / −22%", "1,18"],
            [<Strong key="a">A. Potwierdzenie 5 sesji + wyjście pod Kijun 52 (max kapitał)</Strong>, "3163 / 4819 USD", "32–35%", "−15% / −21%", "1,58 / 1,72"],
            ["B. Potwierdzenie 5 sesji + wyjście Tenkan pod Kijun (zrównoważona)", "2624 / 2827 USD", "45–46%", "−12% / −19%", "1,69 / 1,47"],
            [<Strong key="c">C. B + sprzedaż połowy pozycji po +8% (≥ 50% trafnych)</Strong>, "1968 / 2448 USD", "51%", "−8% / −15%", "1,68 / 1,59"],
            ["D. B z celem +8% dla całej pozycji", "1339 / 1467 USD", "56–57%", "−8% / −14%", "—"],
            ["Potwierdzenie 5 sesji + wyjście pod Kijun 26", "2284 / 2982 USD", "36%", "−7% / −10%", "1,80 / 1,78"],
            ["san'yaku świeże + rynek > MA200, wyjście pod Kijun 52", "2900 / 3397 USD", "36–37%", "−15% / −16%", "1,5"],
          ]}
          caption="Średnia z 6 losowań kolejności, 483 spółki S&P 500, 20.09.2021–18.09.2026. Wszystkie warianty z dokładką 5%."
        />
        <Box tone="info" title="Wnioski z optymalizacji">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Potwierdzenie wybicia przez 5 sesji</Strong> odsiewa fałszywe wybicia: przy tym samym wyjściu podnosi
              kapitał z 2693 do 3163 USD (pozycja 2%) i z 2954 do 4819 USD (5%), a Sharpe z 1,18 do 1,6–1,7.
            </li>
            <li>
              <Strong>Szybsze wyjście</Strong> (Tenkan pod Kijun zamiast ceny pod Kijun 52) podnosi trafność z 32–35% do
              45–46% prawie bez zmiany kapitału względem dotychczasowego czarnego konia, ale mniej niż wariant A.
            </li>
            <li>
              <Strong>≥ 50% trafności</Strong> wymaga częściowej realizacji zysku. Z 144 wariantów tylko 4 przekroczyły 50%,
              a żaden nie dał kapitału powyżej 2500 USD. Każda zmiana podnosząca trafność zmniejsza średni zysk i kapitał.
            </li>
            <li>
              Dodatkowe filtry (indeks powyżej MA200, siła względna 63 dni względem rynku) poprawiły Sharpe i obniżyły
              obsunięcie do −6…−12%, ale zmniejszyły kapitał.
            </li>
          </ul>
        </Box>
        <H3>Co dokładnie zmienić względem wersji bazowej</H3>
        <DocTable
          head={["Cel", "Wejście", "Wyjście", "Realizacja zysku"]}
          rows={[
            ["Więcej trafnych pozycji (ok. 46%)", "Filtr analitycy + MA200; cena zamknęła się nad Kijun 52 przez 5 kolejnych sesji (kupno na otwarciu po pierwszym dniu spełnienia)", "Tenkan spada poniżej Kijun (26) na zamknięciu, sprzedaż na otwarciu następnej sesji", "Brak"],
            ["Ponad 50% trafnych pozycji", "Jak wyżej", "Jak wyżej", "Sprzedaż połowy pozycji po osiągnięciu +8% od ceny zakupu (zlecenie limit), reszta do wyjścia"],
            ["Najwyższy kapitał", "Jak wyżej", "Zamknięcie poniżej Kijun 52", "Brak"],
          ]}
          caption="Dokładka +5% (cena nad chmurą i ocena byczą) we wszystkich wersjach jak w sekcji 3."
        />

        {/* 8 */}
        <H2>8. Jak dojść do prawie 5000 USD z 1000 USD: krok po kroku</H2>
        <p>
          Najlepszy wynik z backtestów: wersja A (potwierdzenie 5 sesji, wyjście pod Kijun 52, bez realizacji zysku),
          pozycja bazowa 5%.
        </p>
        <DocTable
          head={["Miara", "Wynik (średnia z 6 losowań)"]}
          rows={[
            ["Kapitał końcowy z 1000 USD po 5 latach", "4819 USD (zakres losowań 4567–5099 USD)"],
            ["Rynek (kup i trzymaj S&P 500, równe wagi)", "1851 USD"],
            ["Maksymalne obsunięcie", "−21% (rynek: −19%)"],
            ["Sharpe", "1,72 (rynek: 0,83)"],
            ["Transakcji w 5 lat", "282 (ok. 56 rocznie)"],
            ["Trafnych", "35%"],
            ["Średni zysk / średnia strata na transakcję", "+23,3% / −4,6% (współczynnik zysku do strat 2,75)"],
            ["Średni wynik na transakcję", "+5,2% po kosztach"],
          ]}
          caption="Dla porównania pozycja bazowa 2%: 3163 USD (obsunięcie −15%, Sharpe 1,58)."
        />
        <H3>Procedura (codziennie po zamknięciu sesji USA)</H3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Uniwersum</Strong>: spółki S&amp;P 500 (w teście 483 spółki z pełną historią). Dla mniejszych spółek nie ma
            historii prognoz, więc nie zostały przetestowane z tym filtrem.
          </li>
          <li>
            <Strong>Filtr fundamentalny</Strong>: mediana ostatnich celów cenowych analityków (ostatnie 180 dni, min. 3 firmy)
            co najmniej 20% powyżej ceny. W aplikacji to pole „Min. potencjał wg analityków” w sekcji Setup trendowy.
          </li>
          <li>
            <Strong>Filtr trendu</Strong>: cena zamknięcia powyżej MA200 dziennej (w Setupie: MA200 z interwału D1).
          </li>
          <li>
            <Strong>Sygnał</Strong>: cena zamknęła się nad Kijun-sen (52) na D1 przez 5 kolejnych sesji, a wcześniej zamykała
            się na lub pod nim. Sygnał jest w piątym dniu.
          </li>
          <li>
            <Strong>Kupno</Strong>: na otwarciu następnej sesji za 5% aktualnego kapitału na spółkę (kapitał = gotówka +
            wartość pozycji). Jeśli spółek jest więcej niż gotówki, wybierz losowo (w teście losowanie); nie kupuj, gdy brak
            gotówki.
          </li>
          <li>
            <Strong>Dokładka</Strong>: jednorazowo +5% kapitału do pozycji, gdy cena jest powyżej chmury Ichimoku i ocena 5 linii
            (strona Ichimoku / kolumny trendu) jest byczą (≥ +2). Robić to na otwarciu następnej sesji.
          </li>
          <li>
            <Strong>Wyjście</Strong>: gdy cena zamknie się poniżej Kijun-sen 52, sprzedaj całą pozycję na otwarciu następnej
            sesji. Bez dodatkowego stop-lossa cenowego i bez sztywnego celu zysku.
          </li>
          <li>
            <Strong>Kapitał</Strong>: wielkość pozycji zawsze od bieżącego kapitału (procent składany). Gotówka nie jest
            oprocentowana. Koszty w teście: 0,05% za stronę.
          </li>
        </ol>
        <Box tone="warn" title="Czego się spodziewać i ryzyka">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              65% transakcji kończy się stratą (średnio −4,6%). Wynik robią nieliczne duże zyski (średnio +23%), więc
              strategia wymaga cierpliwości i trzymania się reguł.
            </li>
            <li>Maksymalne obsunięcie w teście to −21%; w bessie mogłoby być większe (okres testu to głównie hossa z jedną bessą w 2022 r.).</li>
            <li>
              Wynik zależy od losowej kolejności wyboru spółek (w teście 4567–5099 USD) i od wariantów wybranych po
              obejrzeniu wyników (ok. 300 przetestowanych). Wersja A ma obciążenie doborem.
            </li>
            <li>Nie uwzględniono podatków, poślizgu ponad 0,05% i płynności; testowano tylko obecne spółki S&amp;P 500.</li>
          </ul>
        </Box>
        <H3>Co w aplikacji jest, a czego brakuje do tej procedury</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Jest</Strong>: sekcja Setup trendowy (Kijun-sen 52 z wybranego interwału, minimalny potencjał wg analityków,
            cena powyżej MA z wybranego interwału, waga w rankingu); ocena 5 linii i kolumny trendu; ranking S&amp;P 500.
          </li>
          <li>
            <Strong>Trzeba ustawić</Strong>: interwał Kijun-sen i MA na D1 (domyślnie H4), potencjał 20%, MA200.
          </li>
          <li>
            <Strong>Brakuje</Strong>: warunku &bdquo;5 kolejnych sesji nad Kijun 52&rdquo;, sygnału dokładki (cena nad chmurą +
            ocena byczą) jako osobnej informacji, wyjścia (cena pod Kijun 52) oraz automatycznego liczenia wielkości pozycji.
            Dziś aplikacja pomaga wybrać spółki, a reguły wejścia i wyjścia stosuje się ręcznie.
          </li>
        </ul>

        {/* 9 */}
        <H2>9. Ograniczenia i co jeszcze trzeba sprawdzić</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Przeżywalność</Strong>: testowane są obecne spółki S&amp;P 500; spółki wycofane nie mają danych (także
            prognoz), co zawyża wynik metody opartej na prognozach.
          </li>
          <li>
            <Strong>Jeden okres</Strong> (2021–2026) i wybór wariantów po obejrzeniu wyników: konieczny test poza próbą, np.
            na latach 2012–2021 (dane analityków są), oraz na spółkach wycofanych z indeksu.
          </li>
          <li>
            <Strong>Wielokrotne testowanie</Strong>: przetestowano tysiące wariantów; potrzebna korekta statystyczna i
            walk-forward (parametry wybrane na jednym okresie, oceniane na następnym).
          </li>
          <li>
            <Strong>Dane analityków</Strong>: z Yahoo Finance, bez niezależnej weryfikacji; brak historii dla Nasdaq i Russell
            2000; do sprawdzenia wrażliwość na okno 180 dni i minimum 3 firm.
          </li>
          <li>
            <Strong>Realizm</Strong>: koszty 0,05% za stronę, brak podatków i poślizgu; wejście po otwarciu zakłada wypełnienie.
          </li>
          <li>
            <Strong>Nie sprawdzono jeszcze</Strong>: wejść na H4 (Yahoo daje dane godzinowe tylko z 730 dni), innych rynków
            (Europa, Japonia) i okresów z długą bessą.
          </li>
          <li>
            Kryterium uznania metody za lepszą od kupna indeksu (ustalone z góry): przewaga po kosztach i podatku w co
            najmniej 2 z 3 niezależnych okresów, po korekcie na wielokrotne testowanie i w teście walk-forward, w próbie bez
            obciążenia przeżywalnością i odporna na zmianę parametrów o ±20%. Dopóki nie jest spełnione, domyślnym wyborem
            pozostaje ETF na indeks.
          </li>
        </ul>
      </div>
    </main>
  );
}
