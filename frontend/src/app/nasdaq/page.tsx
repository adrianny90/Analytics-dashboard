import { RankingPage } from "@/components/RankingPage";

export default function NasdaqPage() {
  return (
    <RankingPage
      universe="nasdaq"
      title="Nasdaq Ranking"
      description="Start downloads prices, 1-week to 1-year changes, D1/W1/H4/H1 Ichimoku trends and analysts' 1-year price targets for every Nasdaq Composite-listed common stock (~3,400 tickers) and saves them to the database; H4/H1 are then refreshed automatically every hour. This is roughly 7x the S&P 500 run, so expect it to take considerably longer - check back later rather than waiting on this page."
      startLabel="Start Nasdaq"
    />
  );
}
