import { RankingPage } from "@/components/RankingPage";

export default function Russell2000Page() {
  return (
    <RankingPage
      universe="russell2000"
      title={[
        "Ranking Russell 2000",
        "Russell 2000 Ranking",
        "Russell-2000-Ranking",
      ]}
      description={[
        "Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla uniwersum małych spółek Russell 2000 (~1970 tickerów) i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. Lista składu to zrzut best-effort, a nie transmisja na żywo, więc kilka tickerów może być wycofanych z obrotu lub brakujących - te po prostu nie pokazują danych zamiast przerywać przebieg.",
        "Start downloads prices, changes from 1 week to 1 year, Ichimoku D1/W1/H4/H1 trends and one-year analyst price targets for the Russell 2000 small-cap universe (~1,970 tickers) and saves them to the database; H4/H1 are then refreshed automatically every hour. The constituent list is a best-effort snapshot, not a live feed, so a few tickers may be delisted or missing – they simply show no data instead of interrupting the run.",
        "Start lädt Kurse, Veränderungen von 1 Woche bis 1 Jahr, Ichimoku-Trends für D1/W1/H4/H1 sowie Analysten-Kursziele für das kommende Jahr für das Small-Cap-Universum des Russell 2000 (ca. 1.970 Ticker) und speichert sie in der Datenbank; H4/H1 werden danach stündlich automatisch aktualisiert. Die Bestandsliste ist ein Best-Effort-Snapshot und kein Live-Feed, weshalb einzelne Ticker vom Handel genommen worden oder nicht enthalten sein können – für diese werden einfach keine Daten angezeigt, der Lauf wird dadurch nicht unterbrochen.",
      ]}
      startLabel={[
        "Start Russell 2000",
        "Start Russell 2000",
        "Russell 2000 starten",
      ]}
    />
  );
}
