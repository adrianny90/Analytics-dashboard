import { RankingPage } from "@/components/RankingPage";

export default function Russell2000Page() {
  return (
    <RankingPage
      universe="russell2000"
      title="Russell 2000 Ranking"
      description="Scans the Russell 2000 small-cap universe (~1,970 tickers) the same way as the S&P 500 ranking. The constituent list is a best-effort snapshot rather than a live feed, so a handful of tickers may be delisted or missing - those simply show no data rather than breaking the scan."
      startLabel="Start Russell 2000"
    />
  );
}
