import { RankingPage } from "@/components/RankingPage";

export default function NysePage() {
  return (
    <RankingPage
      universe="nyse"
      title={[
        "Ranking NYSE",
        "NYSE Ranking",
        "NYSE-Ranking",
      ]}
      description={[
        "Start pobiera ceny, zmiany od 1 tygodnia do 1 roku oraz trendy Ichimoku D1/W1/H4/H1 dla wszystkich spółek notowanych na NYSE (~2200 tickerów: akcje zwykłe, ADR-y, REIT-y; bez warrantów, praw, jednostek i akcji uprzywilejowanych) i zapisuje je w bazie danych. Roczne cele cenowe analityków pobiera osobny przycisk „Pobierz prognozy”. Lista składu to zrzut z daty publikacji, więc kilka tickerów może być wycofanych z obrotu lub brakujących - te po prostu nie pokazują danych zamiast przerywać przebieg.",
        "Start downloads prices, changes from 1 week to 1 year and Ichimoku D1/W1/H4/H1 trends for all stocks listed on the NYSE (~2,200 tickers: common stock, ADRs, REITs; excluding warrants, rights, units and preferred shares) and saves them to the database. One-year analyst price targets are downloaded separately with “Download forecasts”. The list is a snapshot as of its publication date, so a few tickers may be delisted or missing – they simply show no data instead of interrupting the run.",
        "Start lädt Kurse, Veränderungen von 1 Woche bis 1 Jahr sowie Ichimoku-Trends für D1/W1/H4/H1 für alle an der NYSE gelisteten Aktien (ca. 2.200 Ticker: Stammaktien, ADRs, REITs; ohne Warrants, Bezugsrechte, Units und Vorzugsaktien) und speichert sie in der Datenbank. Die Analysten-Kursziele für das kommende Jahr lädt die separate Schaltfläche „Prognosen laden“. Die Liste ist ein Snapshot zum Veröffentlichungsdatum, weshalb einzelne Ticker vom Handel genommen worden oder nicht enthalten sein können – für diese werden einfach keine Daten angezeigt, der Lauf wird dadurch nicht unterbrochen.",
      ]}
      startLabel={[
        "Start NYSE",
        "Start NYSE",
        "NYSE starten",
      ]}
    />
  );
}
