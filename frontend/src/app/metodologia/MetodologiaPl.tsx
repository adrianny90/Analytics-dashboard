import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";

export function MetodologiaPl() {
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
            przeżywalnością. Metoda nie została potwierdzona poza próbą. Traktuj ją jako hipotezę do dalszej weryfikacji.{" "}
            <Strong>Sekcja 10 na końcu strony zawiera późniejszy test kontrolny, który osłabia wnioski z sekcji 1–9</Strong>{" "}
            (poza próbą, z listą członków indeksu w danym dniu, na Nasdaq i Russell 2000).
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
            <li>Test kontrolny (21.09.2026): poza próbą, Nasdaq i Russell 2000, limit obsunięcia 10%, 10 000 USD</li>
            <li>Test dodatkowy (22.09.2026): NYSE, odporność dokładki na S&amp;P 500, test samych indeksów</li>
            <li>Zaktualizowana procedura: jak stosować wszystkie wskaźniki krok po kroku (wejście, stop, wyjście)</li>
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

        {/* 10 */}
        <H2 id="test-kontrolny">10. Test kontrolny (21.09.2026): poza próbą, Nasdaq i Russell 2000, limit obsunięcia 10%, 10 000 USD</H2>
        <p>
          Sekcje 1–9 opisują wyniki z jednego okresu i tylko z S&amp;P 500. Ta sekcja to kolejny przebieg testów, który sprawdza,
          czy te wyniki się utrzymują. Wszystkie liczby dotyczą backtestów, nie prognoz.
        </p>
        <Box tone="warn" title="Najważniejszy wniosek">
          <p>
            Wynik z sekcji 8 (<Strong>4819 USD z 1000 USD</Strong>) był po części artefaktem sposobu jego wyboru. Po
            uwzględnieniu składu indeksu w danym dniu ten sam wariant daje w latach 2021–2026 ok. 3229 USD zamiast 4819 USD
            (pozycja 5%), a poza próbą (2014–2021) tylko <Strong>1356 USD, czyli poniżej rynku</Strong>. Metoda nie spełnia
            kryteriów z sekcji 9. Domyślnym wyborem pozostaje ETF na indeks.
          </p>
        </Box>

        <H3>10.1 Co dodano do testów</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Skład indeksu w danym dniu</Strong>: spółkę można kupić tylko w okresie, gdy naprawdę była w S&amp;P 500.
            Wcześniej testy kupowały od pierwszego dnia spółki, które weszły do indeksu później (zwykle takie, które urosły).
            To obniża wyniki o 17–38%.
          </li>
          <li>
            <Strong>Okres poza próbą 2014–2021</Strong> (analitycy są w danych od 2013 r.), dane od 2006 r. (bessa 2008–2009)
            i 118 spółek, które wypadły z indeksu (z 280; reszta nie ma danych).
          </li>
          <li>
            <Strong>Nasdaq i Russell 2000</Strong>: 4157 spółek, ale kupowane tylko płynne (mediana dziennego obrotu z 60
            sesji od 1 mln USD, cena od 3 USD); koszt 25 pb na stronę dla małych spółek; historię analityków pobrano dla 3000
            spółek spoza S&amp;P 500. Bez filtra płynności wyniki są bezwartościowe (szum i błędne ticki).
          </li>
          <li>
            <Strong>Uczciwsze porównanie</Strong>: nie tylko z rynkiem, ale też z rynkiem o tej samej ekspozycji (strategia
            trzyma często 30–70% w akcjach), z SPY, RSP, QQQ i IWM oraz z rynkiem pomniejszonym do obsunięcia 10%; korekta
            White&apos;a na wielokrotne testowanie, walk-forward i losowe wejścia.
          </li>
          <li>
            <Strong>Nowe warianty</Strong>: ryzyko na transakcję (0,25–1% kapitału) z twardym stopem, budżet obsunięcia 10%,
            filtr R:R z celów fal Ichimoku oraz wejścia na H4.
          </li>
          <li>
            <Strong>Kapitał 10 000 USD, tylko całe akcje.</Strong> Symulator liczy procentowo, więc kapitał nie zmienia
            wyników: różnica względem 1000 USD wynosi +0,1%. Dlatego kwoty poniżej to po prostu dziesięciokrotność.
          </li>
        </ul>

        <H3>10.2 S&amp;P 500 poza próbą: czarny koń (analitycy ≥ 20% + Kijun 52 + MA200 + dokładka)</H3>
        <DocTable
          head={["Okres", "Rynek (koszyk równoważony)", "Czarny koń, pozycja 2%", "Pozycja 5%", "Sharpe: czarny koń wobec rynku"]}
          rows={[
            ["2014-01 – 2016-08", "13 470 USD", "10 490 USD", "10 920 USD", "0,34 wobec 0,87"],
            ["2016-09 – 2019-04", "14 760 USD", "11 100 USD", "11 220 USD", "0,70 wobec 1,30"],
            ["2019-05 – 2021-09", "15 760 USD", "17 060 USD", "19 530 USD", "1,90 wobec 0,85"],
            [<Strong key="a">2014 – 2021 (całość)</Strong>, "31 330 USD (SPY 27 660)", "19 490 USD", "23 580 USD", "1,06 wobec 0,90"],
            ["2021-09 – 2026-09", "17 190 USD (SPY 18 450)", "22 760 USD", "21 800 USD", "1,11 wobec 0,75"],
          ]}
          caption="Koszt 5 pb na stronę, start 10 000 USD (przeliczone z wyników procentowych), średnia z 8 losowań kolejności transakcji."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Poza próbą kapitał jest <Strong>poniżej rynku</Strong> w całym okresie i w 2 z 3 podokresów. Przewaga w 2019–2021
            wynika głównie z uniknięcia krachu 2020 (obsunięcie −7% wobec −39%).
          </li>
          <li>
            Alfa względem rynku o tej samej ekspozycji: −2,0%, −0,2%, +11,1%, +2,6% (całość) i +9,2% rocznie w 2021–2026, przy
            statystykach t poniżej 1,5. Żadna nie jest istotna statystycznie. Korekta White&apos;a dla 64 wariantów: p = 0,10
            w okresie, z którego wybrano metodę, i 0,33–0,995 w pozostałych.
          </li>
          <li>
            Wariant z potwierdzeniem 5 sesji (z sekcji 8) poza próbą: 1356 USD wobec 1528 USD dla rynku o tej samej
            ekspozycji. Typowy objaw dopasowania do próby: wybrano go jako najlepszy z ok. 300 wariantów.
          </li>
          <li>
            Parametry: Kijun 40–65, MA 150–300, minimalna liczba firm i dokładka dają podobne wyniki (odporne), natomiast{" "}
            <Strong>próg analityków jest kruchy</Strong>: w 2021–2026 przy 15% wychodzi 17 050 USD (poziom rynku), przy 20%
            22 840 USD, przy 25% 15 230 USD.
          </li>
          <li>
            Sygnał (przebicie Kijun 52 i wyjście pod Kijun) bije losowe wejścia w tym samym filtrze (percentyl 85–100%), ale
            skromnie: +1,3% na transakcję wobec +1,0% losowo. Największą część wyniku daje filtr analitycy + MA200 i sama
            ekspozycja.
          </li>
        </ul>

        <H3>10.3 Nasdaq i Russell 2000: czarny koń nie działa</H3>
        <DocTable
          head={["Okres", "Russell: czarny koń", "Russell: rynek", "Nasdaq: czarny koń", "Nasdaq: rynek"]}
          rows={[
            ["2014-01 – 2016-08", "8 590 USD", "11 120 USD", "9 580 USD", "11 790 USD"],
            ["2016-09 – 2019-04", "9 860 USD", "13 740 USD", "10 120 USD", "14 650 USD"],
            ["2019-05 – 2021-09", "23 090 USD", "16 420 USD", "21 730 USD", "16 690 USD"],
            ["2014 – 2021 (całość)", "19 780 USD", "25 100 USD", "22 130 USD", "28 810 USD"],
            ["2021-09 – 2026-09", "7 310 USD", "12 670 USD", "8 910 USD", "8 860 USD"],
          ]}
          caption="Płynne spółki (od 1 mln USD dziennie), koszt 25 pb, pozycja 2%, K52. Rynek: równoważony koszyk rebalansowany raz w miesiącu."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Czarny koń wygrywa z rynkiem <Strong>tylko w 2019–2021</Strong> (alfa +15–19% rocznie, t około 1). W 2014–2019
            i w 2021–2026 (Russell 2000: −10%/rok) jest równy lub gorszy. Przewaga z sekcji 1–9 dotyczy więc tylko S&amp;P 500.
          </li>
          <li>
            <Strong>Filtr analityków nie przewiduje zwrotów</Strong> na Nasdaq i Russell 2000 (różnica zwrotów spółek z
            potencjałem ≥ 20% i poniżej: około 0, |t| poniżej 1), a pokrycie konsensusem płynnych spółek to tylko 13–30% w
            latach 2014–2021 (S&amp;P 500: 77–97%).
          </li>
          <li>
            <Strong>Przebicie Kijun 52</Strong> jest zwykle gorsze od losowego dnia (po 63 sesjach −0,35% do −0,53%; na Nasdaq
            i spoza S&amp;P istotnie). W latach 2021–2026 wartość daje stan &bdquo;cena powyżej MA200 + konsensus&rdquo;, a nie
            samo przebicie.
          </li>
          <li>Kijun 26 jest wyraźnie gorszy od 52 (w Russell 6220 transakcji wobec 3787, wynik gorszy w większości okresów).</li>
          <li>
            Bez analityków przy realistycznych kosztach (25 pb) żadna metoda (K52/K26 + MA200, sama MA200) nie pobija rynku w
            latach 2014–2021. Bessa 2008–2009: filtry MA200 i Kijun nie ochroniły kapitału (obsunięcie −37% do −50% wobec −52%).
          </li>
        </ul>

        <H3>10.4 Ostatnie 6 lat (21.09.2020 – 18.09.2026), start 10 000 USD</H3>
        <DocTable
          head={["Rynek", "Metoda", "Kapitał", "Maks. obsunięcie", "Sharpe"]}
          rows={[
            ["S&P 500", "Czarny koń K26, pozycja 20%", "49 640 USD", "−27%", "1,38"],
            ["S&P 500", "Potwierdzenie 5 sesji K52 (wyjście K52), pozycja 5%", "36 432 USD", "−15%", "1,49"],
            ["S&P 500", "Czarny koń K52, pozycja 2%", "33 213 USD", "−18%", "1,36"],
            ["S&P 500", "Potwierdzenie 5 sesji + wyjście Tenkan poniżej Kijun, pozycja 2%", "22 241 USD", "−7%", "1,64"],
            ["S&P 500", "Limit obsunięcia 10% (stop na Kijun 52, analitycy, ryzyko 1%)", "18 713 USD", "−10%", "1,06"],
            ["Nasdaq", "Czarny koń K52, pozycja 5% (najlepszy)", "17 510 USD", "−56%", "0,42"],
            ["Russell 2000", "Donchian 55/20, pozycja 20% (rozrzut losowań 7 079–53 178 USD)", "31 505 USD", "−53%", "0,58"],
            ["Russell 2000", "Sama MA200, pozycja 2%", "21 525 USD", "−32%", "0,68"],
            [<Strong key="b">Odniesienie</Strong>, "SPY / QQQ / IWM / RSP", "24 977 / 27 974 / 19 980 / 21 338 USD", "−24% / −35% / −32% / −21%", "1,00 / 0,88 / 0,63 / 0,87"],
            ["Odniesienie", "Rynek pomniejszony do obsunięcia 10% (S&P 500)", "15 753 USD", "−10%", "1,00"],
          ]}
          caption="Średnia z 5 losowań kolejności transakcji. Pełne zestawienie wszystkich metod, pozycji 2/5/10/20% oraz wykresy: plik raport.html w repozytorium."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Największe zyski dają metody z Kijun-sen + filtr MA200 + analitycy, ale tylko na S&amp;P 500.</Strong> Tam
            wszystkie warianty z dokładką kończą wyraźnie powyżej SPY (24 977 USD) i QQQ (27 974 USD). Na Nasdaq i Russell 2000
            wynik jest niższy niż w ETF-ach albo okupiony obsunięciem 45–55%.
          </li>
          <li>
            Największy wynik (K26, pozycja 20%: 49 640 USD) jest mocno zależny od jednej fazy: kapitał wzrósł o ok. 49% w
            samym marcu–czerwcu 2026 (z 35,5 tys. do 52,8 tys. USD), gdy SPY zyskał ok. 20%. Rozrzut losowań to 43,9–56,2 tys.
            USD. Bezpieczniejsze są mniejsze pozycje (2–5%).
          </li>
        </ul>

        <H3>10.5 Limit obsunięcia 10%, cięcie strat i filtr R:R z fal Ichimoku</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Konstrukcja</Strong>: pozycja = ryzyko na transakcję (0,25–1% kapitału) podzielone przez odległość do stopu
            (maks. 10% kapitału na spółkę); stop wewnątrzdzienny na Kijun 52 (ciągnięty tylko w górę) albo pod dołkiem
            korekty fali (opcjonalnie wyjście na celu fali); budżet obsunięcia zmniejsza pozycje w miarę spadku kapitału, a przy
            −9% wyłącznik zamyka wszystko na 21 sesji. Limit nie jest gwarantowany (luki cenowe), więc podano rzeczywiste
            obsunięcie.
          </li>
          <li>
            <Strong>R:R z fal</Strong>: zygzak 5% po zamknięciach, cel N = C + (B − A) z ostatniej fali wzrostowej (A dołek,
            B szczyt, C dołek korekty; to samo co w kodzie wykresu Ichimoku). R:R = (cel − cena) / (cena − stop); filtr od 2, 3
            lub 4.
          </li>
          <li>
            <Strong>Wynik</Strong>: limit 10% da się utrzymać (na S&amp;P 500 wszystkie konfiguracje z analitykami), ale
            kapitał to zwykle 1,0–1,9 kapitału początkowego w 6 lat (najlepszy: 18 713 USD), podobnie lub gorzej niż rynek
            pomniejszony do tego samego obsunięcia. Nadwyżkę nad takim rynkiem widać tylko na S&amp;P 500 w latach 2019–2021
            i 2021–2026.
          </li>
          <li>
            <Strong>Filtr R:R ≥ 3:1 nie poprawia wyników.</Strong> Na S&amp;P 500 pogarsza średni wynik względem rynku
            pomniejszonego o 470–700 USD (z 10 000 USD) i zmniejsza liczbę transakcji o 45–70%; na Nasdaq i Russell 2000 lekko
            zmniejsza stratę, ale też nie bije rynku.
          </li>
        </ul>
        <DocTable
          head={["Planowane R:R", "Jak często cel fali osiągany przed stopem", "Komentarz"]}
          rows={[
            ["poniżej 1 (plan 0,5–0,6)", "60–83%", "cel blisko, mały zysk"],
            ["2 do 3 (plan 2,4–2,5)", "19–39%", ""],
            ["3 do 5 (plan 3,8–4,1)", "8–31%", ""],
            ["3 i więcej (plan średnio 7,5–9,3)", "15–20%", "zaplanowane R:R się nie realizuje"],
          ]}
          caption="Zdarzenia wejścia (przebicie Kijun 52 + MA200, z i bez analityków, S&P 500, Russell 2000 i Nasdaq, 2014–2026; stop = Kijun 52 z chwili sygnału)."
        />
        <p>
          Cel fali N jest więc osiągany przed stopem tylko w 15–30% przypadków, a im wyższe planowane R:R, tym rzadziej. Wysokie
          R:R wynika głównie z bliskiego stopu i odległego celu. Cel z fal Ichimoku nie jest wiarygodnym punktem realizacji
          zysku.
        </p>

        <H3>10.6 Wejścia na H4</H3>
        <p>
          Dane godzinowe sięgają ok. 2,8 roku (12.2023–09.2026), 480 spółek S&amp;P 500, start 10 000 USD. Rynek w tym oknie:
          ok. 15 680 USD, SPY ok. 17 310 USD. Najlepsze warianty dzienne i H4 kończą w podobnym przedziale (ok. 19 400–19 800 USD
          przy pozycji 5%), różnice mieszczą się w szumie losowań. <Strong>H4 nie poprawia wyniku</Strong> ponad wejścia dzienne,
          za to daje więcej transakcji i kosztów. Wyższą trafność (36–44%) daje głównie szybsze wyjście, kosztem kapitału.
        </p>

        <H3>10.7 Starsze dane (2014–2020): ostrożnie</H3>
        <p>
          Dla lat 2014–2020 wyniki są niespójne: najlepsze warianty zmieniają się z okresu na okres (np. na S&amp;P 500 najlepsza
          jest sama MA200, 22 199 USD przy pozycji 20% wobec SPY 20 431 USD, a czarny koń z analitykami nie jest w czołówce).
          Powody, dla których te dane trzeba traktować ostrożnie: historia celów analityków jest rzadka (w małych spółkach
          pokrycie 13–26%), listy Nasdaq i Russell 2000 to obecni członkowie (przeżywalność), a dla spółek wycofanych nie ma
          ani cen, ani celów. Traktuj je jako sprawdzian, nie dowód.
        </p>

        <H3>10.8 Odpowiedź na pytanie: która metodologia daje największe zyski?</H3>
        <DocTable
          head={["Cel", "Metodologia", "Uwagi"]}
          rows={[
            ["Największy zysk (6 lat, S&P 500)", "Czarny koń z Kijun 26, pozycja 20%; wśród pozostałych najlepsze są potwierdzenie 5 sesji K52 i czarny koń K52", "Wysokie obsunięcie (−27%), silna zależność od jednej fazy 2026, słaba na Nasdaq i Russell 2000"],
            ["Najlepszy stosunek zysku do ryzyka", "Potwierdzenie 5 sesji K52 z wyjściem Tenkan poniżej Kijun, pozycja 2%: obsunięcie −7%, Sharpe 1,64", "Poza próbą wypada poniżej rynku"],
            ["Obsunięcie nie więcej niż 10%", "Stop na Kijun 52 (ciągnięty), analitycy ≥ 20%, MA200, ryzyko 1% na transakcję", "Ok. 11% rocznie; lepiej niż rynek pomniejszony do 10%, ale wiele razy mniej niż pełne pozycje"],
            ["Nasdaq, Russell 2000", "Brak metody lepszej niż ETF (QQQ, IWM)", "Żadna metoda nie jest stabilna"],
            ["Domyślny wybór", "ETF na indeks (SPY lub RSP)", "Kryteria z sekcji 9 nie są spełnione"],
          ]}
        />
        <Box tone="info" title="Co to znaczy dla aplikacji">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Sekcja Setup trendowy w rankingach (Kijun 52, potencjał wg analityków, cena powyżej MA) jest sensownym filtrem
              selekcji na S&amp;P 500, ale to <Strong>hipoteza, a nie potwierdzona przewaga</Strong>. Na Nasdaq i Russell 2000
              nie ma poparcia w testach.
            </li>
            <li>
              Domyślny interwał Setup warto ustawić na D1 i MA200, bo takie były backtesty; wejścia na H4 niczego nie
              poprawiły. Filtr R:R z fal nie został dodany do aplikacji, bo nie poprawia wyników.
            </li>
          </ul>
        </Box>

        <Box tone="warn" title="Zastrzeżenia do sekcji 10">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Prognozy analityków są odtworzone z historii zmian celów (Yahoo: upgrades/downgrades: mediana ostatnich celów
              firm z 180 dni, min. 3 firmy). Nie ma niezależnej weryfikacji, historia zaczyna się w 2013 r., a cele wycofanych
              spółek nie istnieją w danych.
            </li>
            <li>
              Przeżywalność zawyża wyniki: listy Nasdaq i Russell 2000 to obecni członkowie, w S&amp;P 500 brakuje większości
              wycofanych spółek (pokrycie członków indeksu danymi: 75–90% w 2014–2021, 61–70% w 2007–2011).
            </li>
            <li>
              Koszty: 5 pb (S&amp;P 500) i 25 pb (Nasdaq, Russell 2000) na stronę; bez podatków i poślizgu ponad to.
              Najlepsze konfiguracje wybrano po obejrzeniu wyników, więc mają obciążenie doborem.
            </li>
            <li>
              Nadal nie sprawdzono: innych rynków (Europa, Japonia), rewizji celów analityków zamiast poziomu celu, wykresu
              tygodniowego Hosody oraz wyników z pełną listą upadłych spółek.
            </li>
          </ul>
        </Box>

        {/* 11 */}
        <H2 id="test-nyse">11. Test dodatkowy (22.09.2026): NYSE, odporność dokładki na S&amp;P 500, test samych indeksów</H2>
        <p>
          Kolejny przebieg testów, uzupełniający sekcję 10: NYSE jako czwarty rynek (obok S&amp;P 500, Nasdaq, Russell 2000),
          sprawdzenie, czy wariant z dokładką pozycji na S&amp;P 500 jest odporny na zmianę szczegółów wykonania, oraz czysty
          punkt odniesienia — samo kupno i trzymanie indeksów/ETF-ów, bez żadnej strategii.
        </p>

        <H3>11.1 Co przetestowano</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>NYSE</Strong>: 2181 spółek (dane cenowe 2011–2026 i historia prognoz analityków pobrane specjalnie do tego
            testu; koszt założony 10 pb na stronę — więcej niż S&amp;P 500, mniej niż Nasdaq/Russell, bo NYSE to głównie duże i
            średnie spółki; ten sam filtr płynności co w sekcji 10). Cztery rodziny testów: (a) czarny koń + limit obsunięcia
            10% — te same warianty co w sekcji 10.3 dla Nasdaq/Russell; (b) dokładka do wagi docelowej (pierwsze wejście 20%
            kapitału, potem dokładanie do 25/50/100%); (c) &bdquo;all-in tylko gdy analitycy ≥ 30/50/70%&rdquo;.
          </li>
          <li>
            <Strong>Odporność dokładki na S&amp;P 500</Strong>: wersja bazowa (pierwsze wejście 20% kapitału, dokładka do 50%
            lub 100% od razu po sygnale, bez limitu liczby pozycji, bez wyłącznika) i osobno każda zmiana: inna wielkość
            pierwszego wejścia (10% / 30%), maks. 1 pozycja naraz, dokładka dopiero po 5 lub 21 sesjach trzymania, twardy stop
            <em> wewnątrz sesji</em> pod Kijun-sen 52 (zamiast czekać na zamknięcie), wyłącznik po obsunięciu −20% (21 sesji
            przerwy), oraz wszystkie te zmiany naraz. 10 losowań kolejności na wariant, 10 000 USD, dwa niezależne okna:
            2014-01 – 2020-09 i 2020-09 – 2026-09.
          </li>
          <li>
            <Strong>Test samych indeksów</Strong>: kupno i trzymanie SPY, RSP, QQQ, IWM, VTI (z dywidendami) na wszystkich
            okresach użytych w testach sekcji 10 i 11, bez żadnej reguły wejścia/wyjścia — punkt odniesienia dla reszty.
          </li>
        </ul>

        <H3>11.2 Wyniki NYSE</H3>
        <DocTable
          head={["Wariant", "6 lat (2020-09–2026-09)", "2014-01–2020-09"]}
          rows={[
            ["Rynek: SPY", "24 977 USD, DD −24%", "20 431 USD, DD −34%"],
            ["Rynek: koszyk NYSE (równoważony)", "22 678 USD, DD −26%", "15 063 USD, DD −44%"],
            ["Czarny koń K52 (jak w sekcji 3), pozycja 20%", "24 659 USD, DD −39%", "18 068 USD, DD −29%"],
            ["Najlepszy wariant rodziny A (K26, pozycja 20%)", "54 518 USD", "— (najlepszy w OLD: filtr MA200+analitycy, 19 541 USD)"],
            ["Limit obsunięcia 10% (rodzina B), najlepszy wariant", "14 425 USD, DD −11%", "11 063 USD, DD −8%"],
            ["Dokładka do wagi docelowej, najlepszy wariant (do 50%)", "79 411 USD (zakres 41–106 tys.)", "20 085 USD (zakres 18,2–21,9 tys.)"],
            ["All-in, gdy analitycy ≥ 50%", "22 779 USD, DD −37%", "15 162 USD, DD −30%"],
            ["All-in, gdy analitycy ≥ 70%", "23 866 USD, DD −36%", "14 955 USD, DD −30%"],
          ]}
          caption="Start 10 000 USD. „Rodzina A” = warianty jak w sekcji 10.3 (czarny koń i pochodne); „rodzina B” = limit obsunięcia ~10% jak w sekcji 10.5."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>NYSE zachowuje się jak Nasdaq i Russell 2000, nie jak S&amp;P 500.</Strong> Czarny koń K52 ledwie dogania
            SPY w nowszym oknie i wyraźnie przegrywa w starszym; limit obsunięcia 10% ledwo bije rynek przeskalowany do tego
            samego ryzyka; podniesienie progu analityków (30% → 70%) nie daje spójnej poprawy i w obu oknach zostaje poniżej
            SPY.
          </li>
          <li>
            Wariant z dokładką (K26 + wszystkie 5 linii byczych) dał w nowszym oknie 3,2× wynik SPY, ale w starszym oknie
            ledwie go dogonił — <Strong>ten sam wzorzec co w sekcji 10</Strong>: spektakularne wyniki tylko w łatwiejszej
            hossie 2020–2026, znikające w trudniejszym okresie 2014–2020. Rozrzut wyników z samego losowania kolejności
            (41–106 tys. USD) jest bardzo duży, co dodatkowo osłabia wiarygodność.
          </li>
        </ul>

        <H3>11.3 Odporność dokładki na S&amp;P 500: która wersja jest najlepsza</H3>
        <DocTable
          head={["Zmiana względem wersji bazowej (dokładka do 50%)", "2020-09–2026-09", "2014-01–2020-09"]}
          rows={[
            ["Wersja bazowa (pierwsze wejście 20%, dokładka do 50% od razu, bez ograniczeń)", "44 636 USD, DD −35%", "11 928 USD, DD −36%"],
            [<Strong key="hs">+ twardy stop wewnątrz sesji pod Kijun 52 (= metoda opisana w sekcji 12)</Strong>, <Strong key="hs1">76 116 USD, DD −19%</Strong>, <Strong key="hs2">31 983 USD, DD −15%</Strong>],
            ["Dla porównania: to samo, ale dokładka do 100% (all-in) zamiast 50%", "76 280 USD, DD −21%", "25 868 USD, DD −19%"],
            ["Pierwsze wejście 10% zamiast 20%", "34 386 USD, DD −28%", "10 553 USD, DD −38%"],
            ["Pierwsze wejście 30% zamiast 20%", "48 396 USD, DD −35%", "10 640 USD, DD −42%"],
            ["Maks. 1 pozycja naraz", "16 486 USD, DD −25%", "11 542 USD, DD −23%"],
            ["Dokładka dopiero po 5 sesjach trzymania", "65 412 USD, DD −32%", "12 938 USD, DD −32%"],
            ["Wyłącznik po obsunięciu −20% (21 sesji przerwy)", "20 928 USD, DD −24%", "10 899 USD, DD −24%"],
            ["Wszystkie zmiany naraz", "20 486 USD, DD −18%", "15 401 USD, DD −12%"],
          ]}
          caption="Pozycja z Kijun 52 + analitycy ≥ 20% + MA200, dokładka gdy cena nad chmurą i ocena 5 linii byczą, 10 000 USD, 10 losowań kolejności."
        />
        <Box tone="info" title="Najlepsza znaleziona metoda z całego programu testów">
          <p>
            Dokładka do wagi docelowej <Strong>50%</Strong> kapitału (nie 100%/all-in) razem z{" "}
            <Strong>twardym stopem wewnątrz sesji pod Kijun 52</Strong> (wyjście, gdy minimum dnia spadnie poniżej Kijun-sen
            52 z dnia poprzedniego, zamiast czekać na zamknięcie) dała najwyższy i jednocześnie najbardziej odporny wynik ze
            wszystkich testów w sekcjach 3–11: <Strong>76 116 USD</Strong> w oknie 2020–2026 i <Strong>31 983 USD</Strong> w
            oknie 2014–2020 (z 10 000 USD), obie wartości powyżej SPY (24 977 i 20 431 USD) i z niższym obsunięciem niż SPY
            (−19%/−15% wobec −24%/−34%). To jedyny wariant z całej serii, który bije SPY w obu niezależnych oknach naraz{" "}
            <em>i</em> ma niższe obsunięcie niż SPY w obu naraz — nawet lepszy niż ta sama metoda z dokładką do pełnych 100%
            (all-in). Pozostałe zmiany (mniejsza/większa baza, limit 1 pozycji, wyłącznik) obniżają wynik bardziej, niż
            obniżają ryzyko. Ten wynik <Strong>nie był jeszcze testowany poza próbą</Strong> (na okresie, którego nie widziano
            przy jego doborze) — pełny opis krok po kroku w sekcji 12.
          </p>
        </Box>

        <H3>11.4 Test samych indeksów (kupno i trzymanie, z dywidendami, start 1000 USD)</H3>
        <DocTable
          head={["Okres", "SPY", "RSP", "QQQ", "IWM", "VTI"]}
          rows={[
            ["2014-01 – 2016-08", "1237", "1223", "1365", "1107", "1220"],
            ["2016-09 – 2019-04", "1427", "1350", "1669", "1330", "1421"],
            ["2019-05 – 2021-09", "1567", "1476", "2001", "1446", "1582"],
            ["2014 – 2021 (całość)", "2766", "2438", "4559", "2129", "2742"],
            ["2021-09 – 2026-09", "1845", "1508", "1989", "1363", "1758"],
            ["OLD: 2014-01 – 2020-09", "2043", "1722", "3241", "1452", "1995"],
            ["6L: 2020-09 – 2026-09", "2498", "2134", "2797", "1998", "2416"],
          ]}
          caption="QQQ (Nasdaq 100) wygrywa konsekwentnie we wszystkich okresach; IWM (Russell 2000) konsekwentnie najsłabszy. To surowy punkt odniesienia — żadna strategia z sekcji 3–11 nie bije QQQ w każdym okresie naraz."
        />

        {/* 12 */}
        <H2 id="procedura-krok-po-kroku">
          12. Zaktualizowana procedura: jak stosować wszystkie wskaźniki krok po kroku
        </H2>
        <p>
          Wyłącznie dla <Strong>jednej, najlepszej metody</Strong> znalezionej w całym programie testów (sekcja 11.3): S&amp;P
          500, Kijun 52 + analitycy ≥ 20% + MA200, dokładka do wagi docelowej 50% kapitału, z twardym stopem wewnątrz sesji
          pod Kijun 52. Wynik: 76 116 USD (2020–2026) i 31 983 USD (2014–2020) z 10 000 USD, oba powyżej SPY i z niższym
          obsunięciem niż SPY. To wciąż hipoteza z backtestów na jednej próbie, nie gotowa strategia — patrz zastrzeżenie na
          końcu.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Uniwersum</Strong>: tylko spółki S&amp;P 500. To jedyny z czterech przetestowanych rynków (S&amp;P 500,
            Nasdaq, Russell 2000, NYSE — sekcje 10.3 i 11.2), na którym ta metoda pokazała ślad przewagi. Na pozostałych
            trzech nie stosować tej procedury.
          </li>
          <li>
            <Strong>Filtr fundamentalny</Strong>: konsensus analityków (mediana ostatnich celów cenowych z 180 dni, min. 3
            firmy) co najmniej <Strong>20%</Strong> powyżej bieżącej ceny. Nie podnosić progu — 25–70% dawało gorsze wyniki
            we wszystkich testach (sekcje 4, 10.2, 11.2).
          </li>
          <li>
            <Strong>Filtr trendu</Strong>: cena zamknięcia powyżej <Strong>MA200</Strong> (dzienna, interwał D1). Wejścia na
            H4 nie poprawiły wyniku (sekcja 10.6) — zostać przy D1.
          </li>
          <li>
            <Strong>Sygnał wejścia</Strong>: cena zamyka się powyżej Kijun-sen <Strong>52</Strong> okresów (D1), po
            zamknięciu na lub poniżej niego dzień wcześniej.
          </li>
          <li>
            <Strong>Kupno (pierwsze wejście)</Strong>: na otwarciu następnej sesji, za <Strong>20%</Strong> bieżącego
            kapitału (gotówka + wartość pozycji) na tę spółkę.
          </li>
          <li>
            <Strong>Dokładka</Strong> (jednorazowo na pozycję): gdy cena jest powyżej chmury Ichimoku <em>i</em> ocena 5
            linii jest byczą (≥ +2), na otwarciu następnej sesji dokup akcje tej samej spółki tak, by pozycja doszła do{" "}
            <Strong>50%</Strong> bieżącego kapitału. 50% wypadło lepiej niż pełny all-in (100%) w obu oknach czasowych
            (sekcja 11.3) — nie dokładać ponad tę wagę.
          </li>
          <li>
            <Strong>Stop loss</Strong>: twardy stop <em>wewnątrz sesji</em>, nie dopiero na zamknięciu — jeśli minimum dnia
            (Low) spadnie poniżej poziomu Kijun-sen 52 z poprzedniej sesji, zamknij całą pozycję (po tym poziomie lub po
            cenie otwarcia, jeśli jest niższa). To element, który w testach podniósł kapitał i obniżył obsunięcie
            jednocześnie w obu niezależnych oknach naraz (sekcja 11.3) — jedyny taki przypadek w całej serii.
          </li>
          <li>
            <Strong>Wyjście na zamknięciu (jeśli stop z kroku 7 nie zadziałał)</Strong>: gdy cena zamknie się poniżej
            Kijun-sen 52, sprzedaj całą pozycję na otwarciu następnej sesji.
          </li>
          <li>
            <Strong>Kolejność przy nadmiarze sygnałów</Strong>: gdy sygnałów jest więcej niż wolnej gotówki, wybieraj losowo.
            Nie ma jednej najlepszej kolejności — sam wybór kolejności zmieniał wynik o kilkanaście do kilkudziesięciu
            procent między losowaniami (zakres 63–90 tys. i 30–34 tys. USD w tabeli sekcji 11.3).
          </li>
          <li>
            <Strong>Czego nie robić</Strong> (potwierdzone testami): nie stosować na NYSE, Nasdaq ani Russell 2000 (krok 1);
            nie podnosić progu analityków powyżej 20–25%; nie dodawać filtra R:R z celów fal Ichimoku (pogarsza wynik,
            sekcja 10.5); nie ograniczać do 1 pozycji naraz ani nie dodawać wyłącznika po −20% obsunięcia — w testach to
            pogarszało wynik bardziej, niż obniżało ryzyko (sekcja 11.3); nie wchodzić na H4 zamiast D1; nie dokładać do
            100% (all-in) — gorsze niż dokładka do 50%.
          </li>
          <li>
            <Strong>Koszty i realizm</Strong>: w testach 5 punktów bazowych (0,05%) za stronę transakcji, bez podatków i bez
            poślizgu ponad to. Rzeczywiste koszty (podatek Belki, większy poślizg) obniżą wynik.
          </li>
        </ol>
        <Box tone="warn" title="Zastrzeżenie do całej procedury">
          <p>
            To synteza wyników backtestów na jednej historycznej próbie (S&amp;P 500, obecni członkowie, 2014–2026), nie
            potwierdzona przewaga i nie porada inwestycyjna. Krok 7 (twardy stop pod Kijun 52) jest najnowszym i najmniej
            sprawdzonym elementem — dobrany i testowany tylko na tych samych dwóch oknach czasowych, na których oceniano
            resztę procedury, bez odrębnego testu poza próbą ani korekty na wielokrotne testowanie. Kryteria uznania metody
            za lepszą od zwykłego ETF-a na indeks (sekcja 9) nadal nie są w pełni spełnione. Domyślnym, bezpieczniejszym
            wyborem pozostaje kupno ETF-a na indeks (np. SPY lub RSP).
          </p>
        </Box>
      </div>
    </main>
  );
}
