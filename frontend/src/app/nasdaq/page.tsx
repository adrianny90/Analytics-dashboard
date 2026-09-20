import { RankingPage } from "@/components/RankingPage";

export default function NasdaqPage() {
  return (
    <RankingPage
      universe="nasdaq"
      title="Ranking Nasdaq"
      description="Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla każdej spółki notowanej na Nasdaq Composite (~3400 tickerów) i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. To około 7x więcej niż przebieg dla S&P 500, więc potrwa znacznie dłużej - lepiej wrócić później niż czekać na tej stronie."
      startLabel="Start Nasdaq"
    />
  );
}
