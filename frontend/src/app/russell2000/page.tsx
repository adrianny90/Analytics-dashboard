import { RankingPage } from "@/components/RankingPage";

export default function Russell2000Page() {
  return (
    <RankingPage
      universe="russell2000"
      title="Ranking Russell 2000"
      description="Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla uniwersum małych spółek Russell 2000 (~1970 tickerów) i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. Lista składu to zrzut best-effort, a nie transmisja na żywo, więc kilka tickerów może być wycofanych z obrotu lub brakujących - te po prostu nie pokazują danych zamiast przerywać przebieg."
      startLabel="Start Russell 2000"
    />
  );
}
