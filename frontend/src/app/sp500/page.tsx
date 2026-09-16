import { RankingPage } from "@/components/RankingPage";

export default function Sp500Page() {
  return (
    <RankingPage
      universe="sp500"
      title="S&P 500 Ranking"
      description="Scans every S&P 500 company's Ichimoku trend across D1/H4/W1/H1, scores each by a weighted vote (D1 counts most, then H4, then W1, then H1), and ranks all ~500 companies from most bullish to most bearish. Results are saved, so reopening this page later shows the last completed run without re-scanning."
      startLabel="Start SP500"
    />
  );
}
