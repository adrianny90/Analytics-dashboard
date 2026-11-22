import type { ReactNode } from "react";

import { Box, DocTable, H2, Strong } from "@/components/DocBlocks";
import { AddChart, EmergencyChart, EntryChart, ExitChart } from "@/components/top/TopCharts";

const Check = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2">
    <span className="mt-0.5 text-rise">☐</span>
    <span>{children}</span>
  </li>
);

export function TopPl() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Top: najlepsza metoda z backtestów</h1>
      <p className="mt-1 text-sm text-white/50">
        „Czarny koń – trzymaj do odbicia + MA200 60”. Tylko spółki z S&P 500, wykres dzienny (D1). 10 lat (2016–2026), start z
        10 000 USD: <Strong>ok. 82 900 USD</Strong> wobec 41 800 USD dla SPY (mediana 20 losowań, obsunięcie −26%).
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Najpierw zastrzeżenie">
          <p>
            To najlepsza hipoteza z naszych testów, a nie potwierdzona przewaga. Poza okresem testu (2013–2016) metoda
            przegrała z SPY (11 400 wobec 13 400 USD), a w danych brakuje części spółek usuniętych z indeksu, więc wynik jest
            zawyżony. Na Nasdaq, NYSE i Russell 2000 metoda nie bije ETF. To nie jest porada inwestycyjna.
          </p>
        </Box>

        <H2 id="wykres">0. Co ustawić na wykresie (TradingView lub nasz wykres)</H2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Interwał <Strong>1D</Strong> (świece dzienne).
          </li>
          <li>
            <Strong>Kijun 52</Strong> = (najwyższe maksimum + najniższe minimum z 52 sesji) / 2. W TradingView: wskaźnik{" "}
            <em>Donchian Channels</em> z długością 52 – jego środkowa linia (Basis) to dokładnie Kijun 52. Na naszym wykresie
            jest to linia „Kijun 52 D1”.
          </li>
          <li>
            <Strong>MA200</Strong> – zwykła średnia (SMA) z 200 zamknięć.
          </li>
          <li>
            <Strong>Ichimoku</Strong> standardowe 9 / 26 / 52 / 26 – potrzebne tylko do chmury (dokładka i „uzbrojenie”).
          </li>
        </ul>

        <H2 id="wejscie">1. Wejście – warunki na wykresie</H2>
        <EntryChart />
        <ul className="space-y-1.5">
          <Check>
            <Strong>Dziś</Strong> świeca D1 <Strong>zamknęła się nad Kijun 52</Strong>, a <Strong>wczoraj</Strong> zamknięcie było
            pod nim (liczy się zamknięcie, nie knot).
          </Check>
          <Check>
            To samo zamknięcie jest <Strong>nad MA200</Strong>.
          </Check>
          <Check>
            Kupujesz <Strong>na otwarciu następnej sesji</Strong>. Nie czekaj na potwierdzenie – czekanie 3–10 sesji pogarszało
            wynik. Jeśli dzień przebicia minął, sygnał przepadł (czekasz na następne przebicie).
          </Check>
        </ul>

        <H2 id="analitycy">2. Wejście – warunki poza wykresem</H2>
        <ul className="space-y-1.5">
          <Check>
            Spółka jest w <Strong>S&P 500</Strong>. (Poza nim – NYSE: tylko 500 największych według obrotu; Nasdaq i Russell –
            zamiast tego ETF.)
          </Check>
          <Check>
            <Strong>Średni / medianowy cel cenowy analityków jest co najmniej 20% nad obecną ceną</Strong>:{" "}
            <code className="text-white/80">cel / cena − 1 ≥ 20%</code>. Przykład: cena 100 USD → cel min. 120 USD.
          </Check>
          <Check>
            Cel wystawiły <Strong>co najmniej 3 firmy</Strong> analityczne (najlepiej z ostatnich ~6 miesięcy).
          </Check>
        </ul>
        <p>
          Nie podnoś progu „dla pewności”: przy progu 30% wynik spadał do ok. 36 900 USD, przy 10% do ok. 28 200 USD (próg 20%:
          ok. 81 800 USD).
        </p>

        <DocTable
          head={["Skąd wziąć cel", "Gdzie", "Uwagi"]}
          rows={[
            [
              <Strong key="a">Ta aplikacja</Strong>,
              "Ranking S&P 500 → kolumna Alert (GO = przebicie dziś + MA200 + analitycy ≥ 20%)",
              "Liczone dokładnie jak w backteście: mediana ostatniego celu każdej firmy z 180 dni, min. 3 firmy.",
            ],
            [
              "TradingView",
              "Strona spółki → zakładka Forecast / Prognoza → Price target (średnia, liczba analityków)",
              "Dobre źródło. Pokazuje średnią z 3 miesięcy.",
            ],
            [
              "Investing.com",
              "Strona spółki → Konsensus / Consensus Estimates → średni cel, liczba analityków",
              "Też średnia. Bywa nieaktualne dla małej liczby analityków.",
            ],
            ["Yahoo Finance", "Analysis → Analyst Price Targets (Average / Median)", "Stąd pochodzą nasze dane historyczne."],
          ]}
        />
        <p>
          Tak – <Strong>TradingView i Investing.com się nadają</Strong>. Pokazują średnią wszystkich analityków, a backtest używał
          mediany, więc wynik różni się zwykle o kilka punktów procentowych (pojedynczy bardzo wysoki cel podnosi średnią). Jeśli
          wychodzi 18–24%, sprawdź drugie źródło albo kolumnę Alert w aplikacji. Jeśli wychodzi np. 35% – nie ma wątpliwości.
        </p>

        <H2 id="ile">3. Ile kupić + dokładka</H2>
        <ul className="space-y-1.5">
          <Check>
            Pierwsza pozycja: <Strong>5% kapitału</Strong> (maks. 10%). Przy 20–50% wynik był gorszy, a obsunięcie dochodziło do
            −40..−55%.
          </Check>
          <Check>
            <Strong>Dokładka +5% kapitału, tylko raz</Strong>: gdy pierwszy raz po wejściu zamknięcie jest{" "}
            <Strong>nad chmurą</Strong> i <Strong>ocena 5 linii ≥ +2</Strong> (w aplikacji: „BYCZY”).
          </Check>
          <Check>Nowe wejście tylko, gdy masz gotówkę na pełne 5%. Kolejność sygnałów nieistotna – bierzesz, co przychodzi.</Check>
        </ul>
        <AddChart />
        <p className="text-xs text-white/50">
          Ocena 5 linii (każda +1 / −1): cena nad chmurą · Tenkan nad Kijun · zamknięcie wyżej niż 26 sesji temu (Chikou) · cena
          wyżej niż na początku okna (momentum) · przyszła chmura zielona. W aplikacji widoczna jako ocena trendu.
        </p>

        <H2 id="wyjscie">4. Wyjście normalne (z zyskiem)</H2>
        <ExitChart />
        <p>Sprzedajesz na otwarciu następnej sesji, gdy spełnione są <Strong>wszystkie trzy</Strong> warunki:</p>
        <ul className="space-y-1.5">
          <Check>
            Pozycja jest <Strong>„uzbrojona”</Strong> – po wejściu choć raz była nad chmurą z oceną ≥ +2 (moment dokładki z
            kroku 3).
          </Check>
          <Check>
            <Strong>5 KOLEJNYCH zamknięć pod Kijun 52</Strong>. Jedno zamknięcie nad Kijun zeruje licznik.
          </Check>
          <Check>
            Pozycja jest <Strong>na plusie</Strong> (po kosztach). Jeśli jest na minusie – <Strong>nie sprzedajesz</Strong>,
            trzymasz dalej (chyba że zadziała wyjście awaryjne).
          </Check>
        </ul>

        <H2 id="awaryjne">5. Wyjście awaryjne (także ze stratą)</H2>
        <EmergencyChart />
        <ul className="space-y-1.5">
          <Check>
            <Strong>60 kolejnych zamknięć pod MA200</Strong> (ok. 3 miesiące) → sprzedajesz na następnym otwarciu, nawet ze
            stratą. Bez tego najgorsza pozycja w teście sięgała −75%, z nim −41%.
          </Check>
          <Check>
            <Strong>Bez stop lossa procentowego</Strong> – stop −25% pogarszał wynik (sprzedawał na dołkach).
          </Check>
        </ul>

        <H2 id="nie">6. Czego nie dodawać</H2>
        <p>
          Kitchin, formacje price action (pin bar, fakey, inside bar), RSI, fale, filtr „SPY nad MA200”, dźwignia, interwały
          H1/H4 i waluty – w testach nic nie poprawiły albo pogorszyły wynik.
        </p>

        <Box tone="good" title="Ściągawka">
          <ol className="list-decimal space-y-1 pl-5">
            <li>S&P 500, wykres D1.</li>
            <li>Dziś zamknięcie nad Kijun 52, wczoraj pod.</li>
            <li>Zamknięcie nad MA200.</li>
            <li>Cel analityków ≥ +20%, min. 3 firmy.</li>
            <li>Kup 5% kapitału na jutrzejszym otwarciu.</li>
            <li>Nad chmurą + ocena ≥ +2 → dokup 5% (raz), pozycja uzbrojona.</li>
            <li>Uzbrojona + 5 kolejnych zamknięć pod Kijun 52 + na plusie → sprzedaj.</li>
            <li>60 kolejnych zamknięć pod MA200 → sprzedaj zawsze.</li>
          </ol>
        </Box>

        <H2 id="wyniki">7. Wyniki w backteście</H2>
        <DocTable
          head={["Okres (z 10 000 USD)", "Metoda", "SPY"]}
          rows={[
            ["10 lat (2016–2026)", <Strong key="1">82 856</Strong>, "41 793"],
            ["2016–2021", "33 575", "22 652"],
            ["2021–2026", "26 916", "18 763"],
            ["Poza próbą 2013–2016", <span key="2" className="text-fall">11 364</span>, "13 375"],
          ]}
        />
        <p className="text-xs text-white/50">
          Pozycja 5% + 5%, koszt 5 pb na stronę, 20 losowań kolejności, obsunięcie −26%, Sharpe 1,17. Ok. 71% transakcji na plusie,
          średnio +10,9%, mediana trzymania ok. 4 miesięcy. Szczegóły: summary.txt, sekcje 43–52, oraz zakładka Symulacja.
        </p>
      </div>
    </main>
  );
}
