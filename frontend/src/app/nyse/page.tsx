import { RankingPage } from "@/components/RankingPage";

export default function NysePage() {
  return (
    <RankingPage
      universe="nyse"
      title="Ranking NYSE"
      description="Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla wszystkich spółek notowanych na NYSE (~2200 tickerów: akcje zwykłe, ADR-y, REIT-y; bez warrantów, praw, jednostek i akcji uprzywilejowanych) i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. Lista składu to zrzut z daty publikacji, więc kilka tickerów może być wycofanych z obrotu lub brakujących - te po prostu nie pokazują danych zamiast przerywać przebieg."
      startLabel="Start NYSE"
    />
  );
}
