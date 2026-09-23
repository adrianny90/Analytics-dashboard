import { RankingPage } from "@/components/RankingPage";

export default function NasdaqPage() {
  return (
    <RankingPage
      universe="nasdaq"
      title={[
        "Ranking Nasdaq",
        "Nasdaq Ranking",
        "Nasdaq-Ranking",
      ]}
      description={[
        "Start pobiera ceny, zmiany od 1 tygodnia do 1 roku oraz trendy Ichimoku D1/W1/H4/H1 dla każdej spółki notowanej na Nasdaq Composite (~3400 tickerów) i zapisuje je w bazie danych. Roczne cele cenowe analityków pobiera osobny przycisk „Pobierz prognozy”. To około 7x więcej niż przebieg dla S&P 500, więc potrwa znacznie dłużej - lepiej wrócić później niż czekać na tej stronie.",
        "Start downloads prices, changes from 1 week to 1 year and Ichimoku D1/W1/H4/H1 trends for every stock listed on the Nasdaq Composite (~3,400 tickers) and saves them to the database. One-year analyst price targets are downloaded separately with “Download forecasts”. That is about 7x more than an S&P 500 run, so it takes much longer – better to come back later than to wait on this page.",
        "Start lädt Kurse, Veränderungen von 1 Woche bis 1 Jahr sowie Ichimoku-Trends für D1/W1/H4/H1 für jede an der Nasdaq Composite notierte Aktie (ca. 3.400 Ticker) und speichert sie in der Datenbank. Die Analysten-Kursziele für das kommende Jahr lädt die separate Schaltfläche „Prognosen laden“. Das sind etwa 7-mal so viele wie bei einem S&P-500-Lauf, weshalb er deutlich länger dauert – kommen Sie besser später wieder, statt auf dieser Seite zu warten.",
      ]}
      startLabel={[
        "Start Nasdaq",
        "Start Nasdaq",
        "Nasdaq starten",
      ]}
    />
  );
}
