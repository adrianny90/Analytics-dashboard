"use client";

import { useState } from "react";

import { useLang } from "@/lib/i18n";

type Row = [string, string];

/** Collapsible guide: what every setting means, what it changes and how real the simulated trades are. */
export function SimHelp() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const settings: Row[] = [
    [
      t("Indeksy", "Indices", "Indizes"),
      t(
        "Z jakich spółek symulacja może kupować. S&P 500 ma skład z danego dnia (spółka jest brana tylko wtedy, gdy była wtedy w indeksie, także później wyrzucona). Nasdaq / NYSE / Russell 2000 to dzisiejsi członkowie i tylko płynne spółki - ich wyniki są zawyżone, bo brakuje upadłych. W backtestach metoda wyraźnie biła rynek tylko na S&P 500.",
        "Which stocks the simulation may buy. The S&P 500 uses the membership of each day (a stock is used only while it was in the index, including ones removed later). Nasdaq / NYSE / Russell 2000 are today's members, liquid only - their results are overstated because bankrupt stocks are missing. In the backtests the method clearly beat the market only on the S&P 500.",
        "Aus welchen Aktien die Simulation kaufen darf. Der S&P 500 nutzt die Zusammensetzung des jeweiligen Tages (auch später entfernte Aktien). Nasdaq / NYSE / Russell 2000 sind heutige Mitglieder, nur liquide - deren Ergebnisse sind überzeichnet, weil insolvente Aktien fehlen. In den Backtests schlug die Methode den Markt klar nur im S&P 500.",
      ),
    ],
    [
      t("Tylko wybrane spółki", "Only selected stocks", "Nur ausgewählte Aktien"),
      t(
        "Zawęża handel do wpisanych symboli (nadal muszą spełniać warunki i być w indeksie w dniu sygnału). Przy kilku spółkach transakcji będzie mało, a wynik zależy od szczęścia.",
        "Limits trading to the symbols you enter (they still must meet the rules and be in an index on the signal day). With a few stocks there will be few trades and the result depends on luck.",
        "Beschränkt den Handel auf die eingegebenen Symbole (sie müssen weiterhin die Regeln erfüllen und am Signaltag im Index sein). Bei wenigen Aktien gibt es wenige Trades, das Ergebnis hängt vom Glück ab.",
      ),
    ],
    [
      t("Okres", "Period", "Zeitraum"),
      t(
        "Ile lat wstecz od 18.09.2026 zaczyna się symulacja. Krótszy okres = mniej transakcji i większa przypadkowość. Danych analityków przed 2018 jest 3-4 razy mniej, więc w pierwszych latach 10-letniej symulacji sygnałów jest mniej i część kapitału stoi w gotówce.",
        "How many years back from 18 Sep 2026 the simulation starts. A shorter period = fewer trades and more randomness. There are 3-4 times fewer analyst targets before 2018, so the first years of a 10-year run have fewer signals and part of the capital sits in cash.",
        "Wie viele Jahre vor dem 18.09.2026 die Simulation beginnt. Kürzer = weniger Trades, mehr Zufall. Vor 2018 gibt es 3-4 mal weniger Analystenziele, daher in den ersten Jahren weniger Signale und mehr Bargeld.",
      ),
    ],
    [
      t("Kapitał start", "Starting capital", "Startkapital"),
      t(
        "Kwota na początku. Kupujemy całe akcje, więc przy małym kapitale drogie spółki (np. 5% z 1 000 USD = 50 USD) bywają nie do kupienia i są pomijane.",
        "The amount at the start. Whole shares only, so with small capital expensive stocks (e.g. 5% of 1,000 USD = 50 USD) may be unaffordable and are skipped.",
        "Betrag zu Beginn. Nur ganze Aktien - bei kleinem Kapital sind teure Aktien (z. B. 5% von 1.000 USD = 50 USD) evtl. nicht kaufbar und werden übersprungen.",
      ),
    ],
    [
      t("Wielkość pozycji", "Position size", "Positionsgröße"),
      t(
        "Jaki procent bieżącego kapitału idzie w nową spółkę. Większa pozycja = mniej spółek naraz, większe obsunięcie i większy rozrzut między losowaniami. W testach optimum to 5-10%; 20-50% często przegrywało z rynkiem.",
        "What percent of current equity goes into a new stock. Bigger = fewer stocks at once, deeper drawdown and wider spread between draws. Tests: 5-10% was best; 20-50% often lost to the market.",
        "Welcher Prozentsatz des aktuellen Kapitals in eine neue Aktie geht. Größer = weniger Aktien gleichzeitig, tieferer Drawdown, größere Streuung. Tests: 5-10% am besten; 20-50% oft schlechter als der Markt.",
      ),
    ],
    [
      t("Dokładka", "Add size", "Aufstockung"),
      t(
        "Jednorazowe dokupienie (procent kapitału), gdy trend się potwierdzi: cena nad chmurą i ocena 5 linii ≥ +2. Zwiększa zaangażowanie w spółki, które już idą w górę. 0 = bez dokładki.",
        "A one-time top-up (percent of equity) once the trend is confirmed: price above the cloud and 5-line score ≥ +2. Adds exposure to stocks already rising. 0 = no add.",
        "Einmaliger Zukauf (Prozent des Kapitals), sobald der Trend bestätigt ist: Kurs über der Wolke und Bewertung ≥ +2. 0 = keine Aufstockung.",
      ),
    ],
    [
      t("Maks. spółek naraz", "Max stocks at once", "Max. Aktien gleichzeitig"),
      t(
        "Górny limit otwartych pozycji. Nowe sygnały są pomijane, gdy limit jest pełny. Przy pozycji 5% gotówka i tak pozwala na ok. 20 spółek. 0 = bez limitu.",
        "Cap on open positions; new signals are skipped while it is full. With 5% positions, cash allows about 20 stocks anyway. 0 = no limit.",
        "Obergrenze offener Positionen; neue Signale werden übersprungen, solange sie voll ist. 0 = kein Limit.",
      ),
    ],
    [
      t("Maks. wejść w miesiącu", "Max entries per month", "Max. Einstiege pro Monat"),
      t(
        "Ile nowych spółek można kupić w jednym miesiącu kalendarzowym. Rozkłada wejścia w czasie - po korektach sygnałów jest dużo naraz i bez limitu kapitał szybko się wyczerpuje. 0 = bez limitu.",
        "How many new stocks may be bought in one calendar month. Spreads entries over time - after corrections many signals come at once. 0 = no limit.",
        "Wie viele neue Aktien in einem Kalendermonat gekauft werden dürfen. Verteilt Einstiege zeitlich. 0 = kein Limit.",
      ),
    ],
    [
      t("Stop loss", "Stop loss", "Stop-Loss"),
      t(
        "Sprzedaż ze stratą, gdy wartość pozycji po kosztach spadnie o X% poniżej wydanej kwoty (sprawdzane na zamknięciu, sprzedaż na otwarciu - przy luce strata może być większa). 0 = metodologia: bez stopu, ze stratą sprzedaje tylko wyjście awaryjne MA200. W testach stop -25% pogarszał wynik (sprzedaje na dołkach), -30% był neutralny.",
        "Sell at a loss when the position value after costs falls X% below the amount spent (checked on the close, sold at the open - a gap can make it worse). 0 = the methodology: no stop, only the MA200 emergency exit sells at a loss. In tests a -25% stop hurt (sells at lows), -30% was neutral.",
        "Verkauf mit Verlust, wenn der Positionswert nach Kosten um X% unter den investierten Betrag fällt (Prüfung zum Schluss, Verkauf zur Eröffnung - bei Lücken mehr Verlust). 0 = Methodik: kein Stop. In Tests schadete -25%, -30% war neutral.",
      ),
    ],
    [
      t("Wyjście awaryjne MA200", "MA200 emergency exit", "MA200-Notausstieg"),
      t(
        "Po tylu kolejnych zamknięciach pod MA200 pozycja jest sprzedawana nawet ze stratą. 60 sesji (ok. 3 miesiące) wypadło najlepiej; 20 tnie za dużo, a 0 (wyłączone) zostawia spółki, które nigdy nie wracają - część pozycji kończy się -50..-90%.",
        "After this many consecutive closes below the MA200 the position is sold even at a loss. 60 sessions (about 3 months) was best; 20 cuts too much, and 0 (off) keeps stocks that never recover.",
        "Nach so vielen Schlusskursen in Folge unter der MA200 wird auch mit Verlust verkauft. 60 Sitzungen (ca. 3 Monate) war am besten; 20 schneidet zu viel ab, 0 (aus) behält Aktien, die sich nie erholen.",
      ),
    ],
    [
      t("Losowanie i liczba losowań", "Draw and number of draws", "Ziehung und Anzahl"),
      t(
        "Gdy jednego dnia sygnałów jest więcej niż gotówki, kolejność kupowania jest losowa - to zmienia, które spółki trafią do portfela. To samo ziarno = zawsze ten sam wynik. Statystyka z wielu losowań (mediana, min, maks, % lepszych od ETF) pokazuje, czy wynik jest powtarzalny, czy to szczęście jednego losowania.",
        "When one day has more signals than cash, the buying order is random - it changes which stocks get in. The same seed always gives the same result. The statistics over many draws (median, min, max, % better than the ETF) show whether a result is repeatable or one lucky draw.",
        "Gibt es an einem Tag mehr Signale als Geld, ist die Kaufreihenfolge zufällig. Gleicher Seed = gleiches Ergebnis. Die Statistik über viele Ziehungen zeigt, ob ein Ergebnis wiederholbar ist.",
      ),
    ],
  ];

  const filters: Row[] = [
    [
      t("Min. potencjał analityków", "Min. analyst upside", "Min. Analystenpotenzial"),
      t(
        "O ile procent konsensus celów cenowych (mediana ostatnich celów każdej firmy z 180 dni) jest nad ceną w dniu sygnału. 20% = metodologia. Niżej = więcej, ale słabszych transakcji (na S&P 500 próg 10% dawał ok. 3 razy mniej niż 20%); wyżej = mniej transakcji i więcej gotówki bez pracy.",
        "How far the consensus target (median of each firm's latest target within 180 days) is above the price on the signal day. 20% = the methodology. Lower = more but weaker trades (on the S&P 500 a 10% threshold earned about 3 times less than 20%); higher = fewer trades and more idle cash.",
        "Wie weit das Konsensziel über dem Kurs am Signaltag liegt. 20% = Methodik. Niedriger = mehr, aber schwächere Trades; höher = weniger Trades, mehr Bargeld.",
      ),
    ],
    [
      t("Maks. potencjał", "Max. upside", "Max. Potenzial"),
      t(
        "Odrzuca sygnały z bardzo wysokim potencjałem - analitycy bywają najbardziej optymistyczni wobec spółek, które mocno spadły (np. spółki później wyrzucone z S&P 500). 0 = bez limitu.",
        "Rejects signals with a very high upside - analysts tend to be most optimistic about stocks that have fallen hard (e.g. stocks later removed from the S&P 500). 0 = no limit.",
        "Verwirft Signale mit sehr hohem Potenzial - Analysten sind oft bei stark gefallenen Aktien am optimistischsten. 0 = kein Limit.",
      ),
    ],
    [
      t("Min. liczba firm analitycznych", "Min. analyst firms", "Min. Analystenhäuser"),
      t(
        "Ile firm musi mieć aktualny cel cenowy, żeby konsensus się liczył. Więcej firm = bardziej wiarygodny konsensus, ale mniej spółek (głównie duże). Na S&P 500 min. 5 firm dawało wyższy wynik, ale z większym rozrzutem.",
        "How many firms must have a current target for the consensus to count. More firms = more reliable, but fewer (mostly large) stocks. On the S&P 500, min. 5 firms gave a higher result with a wider spread.",
        "Wie viele Häuser ein aktuelles Kursziel haben müssen. Mehr = verlässlicher, aber weniger (meist große) Aktien.",
      ),
    ],
    [
      t("Min. cena akcji", "Min. share price", "Min. Aktienkurs"),
      t(
        "Pomija tanie akcje (groszowe), zwykle bardziej zmienne. Liczona z zamknięcia skorygowanego tylko o splity - blisko notowania z tamtego dnia.",
        "Skips cheap (penny) stocks, usually more volatile. Uses the close adjusted for splits only - close to that day's quote.",
        "Überspringt billige (Penny-)Aktien. Schlusskurs nur splitbereinigt.",
      ),
    ],
    [
      t("Min. obrót dzienny", "Min. daily turnover", "Min. Tagesumsatz"),
      t(
        "Mediana dziennego obrotu z 60 sesji (cena × wolumen) w mln USD. Wyższy próg = większe, płynniejsze spółki. Na NYSE próg 50 mln wyraźnie poprawiał wynik.",
        "Median daily turnover over 60 sessions (price × volume), million USD. Higher = bigger, more liquid stocks. On the NYSE a 50M threshold clearly helped.",
        "Median des Tagesumsatzes über 60 Sitzungen in Mio. USD. Höher = größere, liquidere Aktien.",
      ),
    ],
    [
      t("Min. ocena 5 linii", "Min. 5-line score", "Min. 5-Linien-Bewertung"),
      t(
        "Ocena Ichimoku z tej aplikacji (chmura, Tenkan/Kijun, Chikou, momentum, przyszła chmura; od -5 do +5) w dniu sygnału. Wyższa = mocniej potwierdzony trend, ale wejście później.",
        "This app's Ichimoku score (cloud, Tenkan/Kijun, Chikou, momentum, future cloud; -5 to +5) on the signal day. Higher = stronger trend confirmation, but a later entry.",
        "Ichimoku-Bewertung dieser App (-5 bis +5) am Signaltag. Höher = stärker bestätigter Trend, aber späterer Einstieg.",
      ),
    ],
    [
      t("MA200 rośnie", "MA200 rising", "MA200 steigt"),
      t(
        "Średnia 200-sesyjna wyżej niż 20 sesji temu - długoterminowy trend spółki w górę. Na S&P 500 podnosiło wynik.",
        "The 200-session average higher than 20 sessions ago - the stock's long-term trend is up. Improved the S&P 500 result.",
        "Der 200-Tage-Durchschnitt höher als vor 20 Sitzungen - langfristiger Aufwärtstrend.",
      ),
    ],
    [
      t("Cena nad chmurą D1 / nad Kijun 52 W1", "Price above the D1 cloud / W1 Kijun 52", "Kurs über D1-Wolke / W1-Kijun-52"),
      t(
        "Dodatkowe potwierdzenie trendu na dziennym albo tygodniowym wykresie. Mniej wejść „z dołka”, więcej w trwającym trendzie.",
        "Extra trend confirmation on the daily or weekly chart. Fewer entries from a bottom, more within a running trend.",
        "Zusätzliche Trendbestätigung auf Tages- oder Wochenchart.",
      ),
    ],
    [
      t("Rynek: SPY nad MA200", "Market: SPY above MA200", "Markt: SPY über MA200"),
      t(
        "Kupuje tylko, gdy cały rynek (SPY) jest nad swoją MA200. W testach to pogarszało wynik - wycina wejścia tuż po korektach, które dają największe zyski.",
        "Buys only when the whole market (SPY) is above its MA200. In tests this hurt - it removes entries right after corrections, which earn the most.",
        "Kauft nur, wenn der Gesamtmarkt (SPY) über seiner MA200 liegt. In Tests schädlich.",
      ),
    ],
    [t("Sektory", "Sectors", "Sektoren"), t("Handel tylko w zaznaczonych sektorach. Nic nie zaznaczone = wszystkie.", "Trade only the ticked sectors. None ticked = all.", "Nur gewählte Sektoren. Nichts gewählt = alle.")],
  ];

  const results: Row[] = [
    [t("Saldo końcowe i ETF", "Final balance and ETF", "Endstand und ETF"), t("Kapitał na koniec (gotówka + pozycje po ostatniej cenie) obok kupna i trzymania ETF-u w tym samym okresie (SPY, QQQ dla samego Nasdaq, IWM dla samego Russell 2000).", "Equity at the end (cash + positions at the last price) next to buying and holding the ETF over the same period (SPY, QQQ for Nasdaq only, IWM for Russell 2000 only).", "Kapital am Ende neben Kaufen-und-Halten des ETF im selben Zeitraum.")],
    [t("Trafne", "Winners", "Gewinner"), t("Odsetek zamkniętych transakcji z zyskiem. Uwaga: metoda nie sprzedaje ze stratą (poza MA200 / stopem), więc trafność jest wysoka, a straty siedzą w pozycjach otwartych - patrz „Otwarte na koniec”.", "Share of closed trades in profit. Note: the method does not sell at a loss (except MA200 / stop), so the hit rate is high while losses sit in open positions - see \"Open at the end\".", "Anteil geschlossener Trades mit Gewinn. Verluste stecken oft in offenen Positionen.")],
    [t("Maks. obsunięcie", "Max drawdown", "Max. Drawdown"), t("Największy spadek kapitału od szczytu do dołka w trakcie symulacji.", "The largest peak-to-trough fall of equity during the simulation.", "Größter Rückgang vom Hoch zum Tief.")],
    [t("Otwarte na koniec", "Open at the end", "Am Ende offen"), t("Pozycje nadal trzymane w ostatnim dniu, ile z nich jest pod kreską i najgorsza z nich - to niezrealizowane straty strategii „trzymaj do odbicia”.", "Positions still held on the last day, how many are under water and the worst - the unrealised losses of the \"hold until it recovers\" strategy.", "Am letzten Tag gehaltene Positionen, wie viele im Minus sind und die schlechteste.")],
  ];

  const realism: Row[] = [
    [
      t("Co jest odwzorowane", "What is modelled", "Was abgebildet ist"),
      t(
        "Sygnał z zamknięcia, zakup i sprzedaż na otwarciu następnej sesji (bez zaglądania w przyszłość); całe akcje; zakup tylko za dostępną gotówkę (bez kredytu); koszty 0,05% (S&P 500) / 0,25% (reszta) na stronę; skład S&P 500 z danego dnia z 45 spółkami później wyrzuconymi; konsensus analityków odtworzony z historii celów dostępnej w danym dniu; wycofanie spółki = sprzedaż po ostatniej cenie. Logika sprawdzona z backtestem w Pythonie (te same wyniki w granicach losowania) i testem: księgowość zgadza się co do centa, żadna transakcja nie łamie reguł.",
        "Signal on the close, buy and sell at the next session's open (no look-ahead); whole shares; buying only with available cash (no margin); costs 0.05% (S&P 500) / 0.25% (others) per side; S&P 500 membership as of each day incl. 45 stocks later removed; analyst consensus rebuilt from the targets known on each day; delisting = sale at the last price. Checked against the Python backtest (same results within the draw spread) and by a test: the books balance to the cent and no trade breaks a rule.",
        "Signal zum Schluss, Kauf/Verkauf zur nächsten Eröffnung; ganze Aktien; nur verfügbares Geld; Kosten 0,05% / 0,25% je Seite; historische S&P-500-Zusammensetzung; Analystenkonsens point-in-time. Gegen den Python-Backtest geprüft.",
      ),
    ],
    [
      t("Czego nie ma", "What is not modelled", "Was fehlt"),
      t(
        "Ceny są skorygowane o splity i dywidendy (wynik procentowy zawiera dywidendy, ale cena na wykresie bywa niższa niż notowanie z tamtego dnia, np. KO 2018: 35,10 zamiast 45,54); brak podatków, poślizgu ponad koszty, odsetek od gotówki i częściowych zleceń; Nasdaq / NYSE / Russell bez spółek upadłych; 133 spółek wyrzuconych z S&P 500 (głównie przejęcia, kilka upadłości) nie ma w danych; dane kończą się 18.09.2026. Wynik to symulacja historyczna, nie gwarancja.",
        "Prices are adjusted for splits and dividends (the percent result includes dividends, but the chart price can be below that day's quote, e.g. KO 2018: 35.10 instead of 45.54); no taxes, slippage beyond costs, interest on cash or partial fills; Nasdaq / NYSE / Russell without bankrupt stocks; 133 stocks removed from the S&P 500 (mostly takeovers, a few bankruptcies) are missing; data ends 18 Sep 2026. A historical simulation, not a guarantee.",
        "Kurse split- und dividendenbereinigt (Chartkurs kann unter dem damaligen Kurs liegen); keine Steuern, kein Slippage über die Kosten hinaus, keine Zinsen; Nasdaq / NYSE / Russell ohne insolvente Aktien; 133 entfernte S&P-500-Aktien fehlen; Daten bis 18.09.2026.",
      ),
    ],
  ];

  const Block = ({ title, rows }: { title: string; rows: Row[] }) => (
    <div>
      <p className="mb-1 text-sm font-medium text-white/80">{title}</p>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 sm:grid-cols-[200px_1fr]">
            <dt className="font-medium text-amber-200/80">{k}</dt>
            <dd className="text-white/65">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white/80 hover:text-white">
        {t("Jak czytać ustawienia i wyniki - co znaczy każde pole i na co wpływa", "How to read the settings and results - what each field means and changes", "So liest man Einstellungen und Ergebnisse")}
        <span className="text-white/40">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/10 px-4 py-3">
          <Block title={t("Ustawienia", "Settings", "Einstellungen")} rows={settings} />
          <Block title={t("Filtry wejścia", "Entry filters", "Einstiegsfilter")} rows={filters} />
          <Block title={t("Wyniki", "Results", "Ergebnisse")} rows={results} />
          <Block title={t("Na ile to prawdziwe zagrania", "How real the trades are", "Wie realistisch die Trades sind")} rows={realism} />
        </div>
      )}
    </section>
  );
}
