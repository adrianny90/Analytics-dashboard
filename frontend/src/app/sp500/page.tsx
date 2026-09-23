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
        "Start pobiera ceny, zmiany od 1 tygodnia do 1 roku oraz trendy Ichimoku D1/W1/H4/H1 dla każdej spółki z S&P 500 i zapisuje je w bazie danych. Roczne cele cenowe analityków pobiera osobny przycisk „Pobierz prognozy”. Spółki są punktowane ważonym głosowaniem czterech interwałów czasowych i sortowane od najbardziej byczych do najbardziej niedźwiedzich. Wyniki są zapisywane, więc ponowne otwarcie tej strony pokazuje ostatni ukończony przebieg bez ponownego skanowania.",
        "Start downloads prices, changes from 1 week to 1 year and Ichimoku D1/W1/H4/H1 trends for every S&P 500 stock and saves them to the database. One-year analyst price targets are downloaded separately with “Download forecasts”. Stocks are scored by a weighted vote across four timeframes and sorted from most bullish to most bearish. Results are saved, so reopening this page shows the last completed run without rescanning.",
        "Start lädt Kurse, Veränderungen von 1 Woche bis 1 Jahr sowie Ichimoku-Trends für D1/W1/H4/H1 für jede Aktie im S&P 500 und speichert sie in der Datenbank. Die Analysten-Kursziele für das kommende Jahr lädt die separate Schaltfläche „Prognosen laden“. Die Aktien werden per gewichteter Abstimmung über vier Zeitrahmen bewertet und von am bullischsten bis am bärischsten sortiert. Die Ergebnisse werden gespeichert, sodass beim erneuten Öffnen dieser Seite der letzte abgeschlossene Lauf ohne erneuten Scan angezeigt wird.",
      ]}
      startLabel={[
        "Start SP500",
        "Start S&P 500",
        "S&P 500 starten",
      ]}
    />
  );
}
