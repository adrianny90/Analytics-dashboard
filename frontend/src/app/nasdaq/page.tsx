import { RankingPage } from "@/components/RankingPage";

export default function NasdaqPage() {
  return (
    <RankingPage
      universe="nasdaq"
      title="Nasdaq Ranking"
      description="Scans every Nasdaq Composite-listed common stock (~3,400 tickers) the same way as the S&P 500 ranking. A full run covers roughly 7x the S&P 500 scan, so expect it to take considerably longer - check back later rather than waiting on this page."
      startLabel="Start Nasdaq"
    />
  );
}
