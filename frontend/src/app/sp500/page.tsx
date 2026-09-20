import { RankingPage } from "@/components/RankingPage";

export default function Sp500Page() {
  return (
    <RankingPage
      universe="sp500"
      title="Ranking S&P 500"
      description="Start pobiera ceny, zmiany od 1 tygodnia do 1 roku, trendy Ichimoku D1/W1/H4/H1 oraz roczne cele cenowe analityków dla każdej spółki z S&P 500 i zapisuje je w bazie danych; H4/H1 są potem odświeżane automatycznie co godzinę. Spółki są punktowane ważonym głosowaniem czterech interwałów czasowych i sortowane od najbardziej byczych do najbardziej niedźwiedzich. Wyniki są zapisywane, więc ponowne otwarcie tej strony pokazuje ostatni ukończony przebieg bez ponownego skanowania."
      startLabel="Start SP500"
    />
  );
}
