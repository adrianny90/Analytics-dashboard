import { RankingPage } from "@/components/RankingPage";

export default function Sp500Page() {
  return (
    <RankingPage
      universe="sp500"
      title={[
        "Ranking S&P 500",
        "S&P 500 Ranking",
        "S&P-500-Ranking",
      ]}
      description={[
        "Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla każdej spółki z S&P 500 i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. Spółki są punktowane ważonym głosowaniem czterech interwałów czasowych i sortowane od najbardziej byczych do najbardziej niedźwiedzich. Wyniki są zapisywane, więc ponowne otwarcie tej strony pokazuje ostatni ukończony przebieg bez ponownego skanowania.",
        "Start downloads prices, changes from 1 week to 1 year, Ichimoku D1/W1/H4/H1 trends and one-year analyst price targets for every S&P 500 stock and saves them to the database; H4/H1 are then refreshed automatically every hour. Stocks are scored by a weighted vote across four timeframes and sorted from most bullish to most bearish. Results are saved, so reopening this page shows the last completed run without rescanning.",
        "Start lädt Kurse, Veränderungen von 1 Woche bis 1 Jahr, Ichimoku-Trends für D1/W1/H4/H1 sowie Analysten-Kursziele für das kommende Jahr für jede Aktie im S&P 500 und speichert sie in der Datenbank; H4/H1 werden danach stündlich automatisch aktualisiert. Die Aktien werden per gewichteter Abstimmung über vier Zeitrahmen bewertet und von am bullischsten bis am bärischsten sortiert. Die Ergebnisse werden gespeichert, sodass beim erneuten Öffnen dieser Seite der letzte abgeschlossene Lauf ohne erneuten Scan angezeigt wird.",
      ]}
      startLabel={[
        "Start SP500",
        "Start S&P 500",
        "S&P 500 starten",
      ]}
    />
  );
}
