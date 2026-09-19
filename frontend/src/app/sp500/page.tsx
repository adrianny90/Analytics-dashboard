import { RankingPage } from "@/components/RankingPage";

export default function Sp500Page() {
  return (
    <RankingPage
      universe="sp500"
      title="S&P 500 Ranking"
      description="Start downloads prices, 1-week to 1-year changes, D1/W1/H4/H1 Ichimoku trends and analysts' 1-year price targets for every S&P 500 company and saves them to the database; H4/H1 are then refreshed automatically every hour. Companies are scored by a weighted vote of the four timeframes and ranked from most bullish to most bearish. Results are saved, so reopening this page later shows the last completed run without re-scanning."
      startLabel="Start SP500"
    />
  );
}
