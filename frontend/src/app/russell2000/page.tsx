import { RankingPage } from "@/components/RankingPage";

export default function Russell2000Page() {
  return (
    <RankingPage
      universe="russell2000"
      title="Russell 2000 Ranking"
      description="Start downloads prices, 1-week to 1-year changes, D1/W1/H4/H1 Ichimoku trends and analysts' 1-year price targets for the Russell 2000 small-cap universe (~1,970 tickers) and saves them to the database; H4/H1 are then refreshed automatically every hour. The constituent list is a best-effort snapshot rather than a live feed, so a handful of tickers may be delisted or missing - those simply show no data rather than breaking the run."
      startLabel="Start Russell 2000"
    />
  );
}
