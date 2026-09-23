import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";

export function MetodologiaEn() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Methodology</h1>
      <p className="mt-1 text-sm text-white/50">
        What we tested, what came out best (Ichimoku + Kijun 52 + analyst forecasts + MA200 + top-up), how to optimise it for a
        higher win rate and how to get to almost $5,000 from $1,000 in the backtest. As of September 2026.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Important disclaimer">
          <p>
            These are the results of <Strong>backtests</Strong> (simulations on historical data), not forecasts or investment
            advice. All figures refer to a single period (20.09.2021–18.09.2026), to current S&amp;P 500 members and to variants
            chosen after looking at the results from among several hundred tested, so they carry selection and survivorship
            bias. The method has not been confirmed out of sample. Treat it as a hypothesis for further verification.{" "}
            <Strong>Section 10 at the end of the page contains a later control test that weakens the conclusions of sections 1–9</Strong>{" "}
            (out of sample, with the index membership list as of each day, on Nasdaq and the Russell 2000).
          </p>
        </Box>

        <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="mb-1 font-semibold text-white/80">Contents</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Summary</li>
            <li>How we tested (data, period, simulator)</li>
            <li>The best methodology: Ichimoku + Kijun 52 + analysts + MA200 + top-up</li>
            <li>Backtest results of this methodology</li>
            <li>What else we tested (test history)</li>
            <li>Comparison with other methods (Bollinger, Fibonacci, MACD, RSI and others)</li>
            <li>Optimising for a higher win rate (up to 46% and over 50% winning positions)</li>
            <li>How to get to almost $5,000 from $1,000: step by step</li>
            <li>Limitations and what still needs to be checked</li>
            <li>Control test (21.09.2026): out of sample, Nasdaq and Russell 2000, 10% drawdown limit, $10,000</li>
            <li>Additional test (22.09.2026): NYSE, robustness of the top-up on the S&amp;P 500, a test of the indices themselves</li>
            <li>Updated procedure: how to apply all the indicators step by step (entry, stop, exit)</li>
          </ol>
        </nav>

        {/* 1 */}
        <H2>1. Summary</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            The best method found is a combination of: <Strong>analyst forecast ≥ 20% upside</Strong> +{" "}
            <Strong>price above MA200</Strong> + entry when price breaks upward through the <Strong>52-period Kijun-sen</Strong> +{" "}
            <Strong>a 5% top-up of capital</Strong> when price is above the Ichimoku cloud and the five-line score is bullish,
            with an exit after price closes below Kijun-sen 52. On the S&amp;P 500 (483 stocks, 5 years, $1,000) it returned on
            average <Strong>$2,694–$3,374</Strong> versus $1,851 for buying the whole market, with the same drawdown (−19%) and a
            higher Sharpe ratio (1.2 versus 0.83). Only about 25% of trades were profitable.
          </li>
          <li>
            Ichimoku on its own (without analysts and MA200) <Strong>did not beat the market</Strong>. Most of the edge comes
            from the analyst filter + MA200 and the top-up, not from the Ichimoku line itself.
          </li>
          <li>
            The win rate can be raised from about 24% to <Strong>about 46%</Strong> almost without losing capital (breakout
            confirmed over 5 sessions + exit when Tenkan crosses below Kijun), and to <Strong>about 51%</Strong> at the cost of
            part of the profit (additionally selling half the position at +8%): $1,968–$2,448.
          </li>
          <li>
            The highest capital came from the version with the breakout confirmed over 5 sessions and an exit below Kijun 52
            (no profit-taking), base position 5%: <Strong>$4,819</Strong> (range $4,567–$5,099 over 6 draws), drawdown −21%,
            Sharpe 1.72, win rate 35%. This is the &ldquo;almost $5,000&rdquo; described in section 8.
          </li>
        </ul>

        {/* 2 */}
        <H2>2. How we tested</H2>
        <DocTable
          head={["Element", "Backtest setting"]}
          rows={[
            ["Test period", "20.09.2021–18.09.2026 (about 5 years, 1,255 sessions). Indicators calculated from 2019 (warm-up)."],
            ["Stocks", "483 current S&P 500 stocks (historical analyst forecasts exist for them). Earlier tests: 295 Nasdaq/Russell 2000 stocks, 881 and 1,214 stocks (without analysts)."],
            ["Price data", "Yahoo Finance, daily OHLC adjusted for splits and dividends."],
            ["Starting capital", "$1,000, no leverage, cash earns no interest."],
            ["Position size", "Base position = 1%, 2%, 5%, 10% or 20% of current capital per stock (capital calculated on a running basis); top-up +5% of capital, once per position. Fractional shares."],
            ["Execution", "Signal at the close of session t, purchase at the open of session t+1. Exit on signal: sale at the next session's open."],
            ["Costs", "5 basis points (0.05%) per side of a trade."],
            ["Excess signals", "When there are more signals than cash, stocks are picked at random. We report the result as the average of 6–10 random orderings (and the min–max range)."],
            ["Benchmark", "Buy and hold all 483 stocks with equal weights: $1,851, drawdown −19.4%, Sharpe 0.83."],
            ["Measures", "Final capital, maximum drawdown (from daily closes), Sharpe, number and win rate of trades, average profit and loss, profit factor (PF)."],
          ]}
        />
        <H3>How the analyst forecasts were reconstructed (without looking into the future)</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Source: a history of 155 thousand changes of recommendations and price targets (2011–2026) for the S&amp;P 500 from Yahoo Finance.
          </li>
          <li>
            The consensus of a given day = the median of each firm's latest target from the last 180 days, with at least 3 firms.
            Only targets published up to that day are used.
          </li>
          <li>
            The targets are nominal as of the publication day, so they were adjusted for later splits (e.g. Amazon $3,500 just before
            the 20:1 split). 5,037 of 127 thousand targets (a target above 4× or below 0.25× of the price) were rejected as artefacts.
          </li>
          <li>Upside = consensus / closing price − 1. Condition: at least 20%.</li>
        </ul>
        <H3>How the Ichimoku elements are calculated</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Kijun-sen 52</Strong> = the midpoint of the range (highest High + lowest Low) of the last 52 daily candles.
            Entry signal: a close above Kijun 52 when the previous session closed at or below it.
          </li>
          <li>
            <Strong>Cloud</Strong>: Senkou A = (Tenkan 9 + Kijun 26) / 2, Senkou B = the midpoint of the 52-candle range, both
            shifted 26 candles forward. &ldquo;Price above the cloud&rdquo; = a close above the higher of the two boundaries.
          </li>
          <li>
            <Strong>Five-line score</Strong> = exactly the same function as in the ranking on the site (price vs cloud, Tenkan vs
            Kijun, close vs close 26 candles ago, price change over 76 candles &gt; ±1%, cloud colour over the next 17 candles).
            A sum ≥ +2 is a bullish score. Verified against the backend (0 discrepancies on 36 samples).
          </li>
          <li>
            <Strong>MA200</Strong> = a simple average of 200 daily closes.
          </li>
        </ul>

        {/* 3 */}
        <H2>3. The best methodology: Ichimoku + Kijun 52 + analysts + MA200 + top-up</H2>
        <p>The rules in the order in which they operate in the simulation (base version):</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Entry filter</Strong> (all conditions at once): analyst forecast ≥ 20% upside{" "}
            <em>and</em> closing price above MA200 (a long-term uptrend).
          </li>
          <li>
            <Strong>Entry signal</Strong>: price closes above Kijun-sen 52 (a break upward from a level at or below it).
          </li>
          <li>
            <Strong>Purchase</Strong>: at the next session's open, base position (e.g. 1–5% of capital). No adding to the
            position other than in point 4.
          </li>
          <li>
            <Strong>Top-up</Strong>: once, +5% of capital to the open position when price is above the Ichimoku cloud
            <em> and</em> the five-line score is bullish (≥ +2). It raises exposure to stocks in a confirmed trend.
          </li>
          <li>
            <Strong>Exit</Strong>: a close of price below Kijun-sen 52 closes the whole position at the next session's open.
            There is no separate price stop-loss.
          </li>
          <li>
            Re-entering the same stock is possible after a new signal (the same conditions from scratch). No adding to the
            position beyond the top-up.
          </li>
        </ol>

        {/* 4 */}
        <H2>4. Backtest results of this methodology</H2>
        <p>
          Average of 10 random orderings of stock selection, 483 S&amp;P 500 stocks, 20.09.2021–18.09.2026, $1,000. Market
          (buy and hold): $1,851, drawdown −19.4%, Sharpe 0.83.
        </p>
        <DocTable
          head={["Base position (+5% top-up)", "Final capital (average, range)", "Max. drawdown", "Sharpe", "Trades", "Win rate"]}
          rows={[
            ["1%", "$2,694 (2,584–2,816)", "−19%", "1.22", "962", "24%"],
            ["2%", "$2,725 (2,599–2,896)", "−21%", "1.18", "878", "25%"],
            ["5%", "$2,905 (2,628–3,240)", "−22%", "1.14", "594", "25%"],
            ["10%", "$2,887 (2,098–4,216)", "−26%", "1.07", "397", "28%"],
            ["20%", "$3,374 (2,847–3,841)", "−29%", "1.10", "221", "30%"],
          ]}
          caption="Version without the top-up: $1,290 (drawdown −5%), $1,638 (−9%), $2,141 (−21%), $2,688 (−26%), $2,648 (−29%) for positions of 1–20% respectively."
        />
        <H3>Where the result comes from: adding elements one by one</H3>
        <DocTable
          head={["Configuration (S&P 500, position 1% / 2%)", "Final capital"]}
          rows={[
            ["Ichimoku alone: Kijun 52 cross + top-up + exit below Kijun 52", "$1,333 / $1,381 (below the market)"],
            ["+ analyst forecast ≥ 20%", "$1,940 / $1,680"],
            ["+ analysts + price > MA100 + top-up", "$2,380 / $2,333"],
            ["+ analysts + price > MA200 + top-up (base method)", "$2,694 / $2,725"],
            ["Without analysts, with MA200 + top-up", "$1,577 / $1,435"],
          ]}
          caption="The most important element is the analyst filter; MA200 and the top-up improve the result further."
        />
        <H3>Stability over time</H3>
        <p>
          Splitting the period into halves (base position 1%): in the first half (09.2021–03.2024) capital ×1.47 versus ×1.28 for
          the market, in the second (03.2024–09.2026) ×1.83 versus ×1.45. The edge holds in both halves, but it is still a single
          sample.
        </p>
        <Box tone="warn" title="An honest note: Kijun 52 versus plain Kijun 26">
          <p>
            In the full combination (analysts + MA200 + top-up) the plain Kijun 26 did at least as well as 52:
            $2,664 / $2,870 / $3,306 / $4,014 / $6,115 for positions of 1–20% (drawdown −13% to −28%, Sharpe 1.4–1.6, at 20% a wide
            spread of $4,908–$7,051). The advantage of Kijun 52 is only visible in weaker configurations (without analysts and MA200).
            The wording &ldquo;Kijun 52&rdquo; in the methodology comes from the premise of the study, not from its unambiguous result.
          </p>
        </Box>
        <H3>Effect of position size</H3>
        <p>
          A larger base position raises the average result only moderately ($2,694 → $3,374 from 1% to 20%), but the drawdown grows
          from −19% to −29% (to −33% in the worst draw), Sharpe falls, and the spread of results grows many times over. Small
          positions with a top-up on a confirmed trend are more sensible.
        </p>

        {/* 5 */}
        <H2>5. What else we tested (test history)</H2>
        <DocTable
          head={["Test", "Sample and period", "Result"]}
          rows={[
            ["The site's trend assessment (5 signals, bullish/bearish)", "504 S&P 500 stocks, 3 years and 15 years", "Does not predict price direction; predicts volatility (bearish: 15–30% higher). Useful as a risk filter (index drawdown −19% instead of −38%)."],
            ["Rules from the Ichimoku books (san'yaku, Kijun breakout and retest, SSB pattern, TK crosses, cloud twist, candle configurations)", "504 stocks, 3 and 15 years", "No edge over chance (excesses ≈ 0, |t| < 2)."],
            ["Wave targets (E, V, N, NT), time theory (numbers 9/17/26/33/42/65/76), consolidation", "504 stocks, 3 and 15 years", "No edge after adjusting for volatility; no enrichment at the time numbers; flat lines do not reduce volatility."],
            ["Kitchin cycle phases as a filter", "295 Nasdaq/Russell 2000 stocks, 5 years", "Does not work as a buy signal (phases change roughly every 6 days)."],
            ["$1,000 system: entry on san'yaku, exit below Kijun / Tenkan below Kijun, stop below the cloud", "295 stocks, 5 years", "$1,105–$1,400 versus $1,749 for the market; classic profile (34–40% winners)."],
            ["RSI ≤ 30 filter and the site's Prediction", "295 stocks, 5 years", "RSI ≤ 30 is mutually exclusive with entry above the cloud (0 trades); Prediction ≥ 60% adds nothing."],
            ["Weekly Kijun 26 versus 52 weeks", "881 stocks, 5 years", "52 weeks better ($1,703 versus $1,497), but both below the market ($1,769)."],
            ["Analyst forecast filter 20% / 25% / 30% / 40% / 50%", "483 S&P 500 stocks, 5 years", "≥ 20%: $1,921–$2,112 (market $1,859); higher thresholds leave too few opportunities (≥ 30%: $1,378–$1,394)."],
            ["Mass tests: 6,300 variants (entries, exits, RSI, fixed times, position sizes, a circuit breaker after −8%) with a 10% drawdown limit", "1,214 stocks, 5 years", "No variant with a drawdown ≤ 10% beat the market; the best $1,346–$1,418 ≈ the market with part of it in cash."],
            ["Final test: analysts + Kijun 52 + MA100/MA200 + top-up; positions 1–20%", "483 stocks, 5 years", "Best result: $2,694–$3,374 (section 4)."],
            ["High win-rate methods (RSI2, IBS, RSI14, +1–3% target)", "1,214 stocks, 5 years", "Win rate up to 84%, but expectancy ≈ 0 (average loss 4–6× larger than the gain)."],
            ["Other methodologies (Bollinger, Fibonacci, MACD, Stochastic, Donchian, MA)", "483 stocks, 5 years", "Section 6."],
            ["Optimising for win rate (about 300 variants)", "483 stocks, 5 years", "Section 7."],
          ]}
        />

        {/* 6 */}
        <H2>6. Comparison with other methods</H2>
        <p>
          The same simulator and the same execution rules. Final capital from $1,000 with a 2% / 5% position, win rate with a 2%
          position. &ldquo;Filter&rdquo; = analysts ≥ 20% + price &gt; MA200. Market: $1,851.
        </p>
        <DocTable
          head={["Method", "Without filter", "With filter", "Win rate (with filter)"]}
          rows={[
            [<Strong key="k">Dark horse: Kijun 52 + filter + top-up</Strong>, "—", "2,693 / 2,954 (Sharpe 1.18)", "24%"],
            ["Ichimoku Kijun 52, the cross alone", "1,283 / 1,157", "1,638 / 2,162", "30%"],
            ["Ichimoku Kijun 26, the cross alone", "1,261 / 1,093", "1,483 / 2,621", "31%"],
            ["Ichimoku san'yaku (fresh)", "1,386 / 1,640", "1,301 / 1,870", "45%"],
            ["MA200 (buy above, sell below)", "1,961 / 2,117", "2,016 / 2,253", "22%"],
            ["MA50", "1,317 / 1,289", "1,693 / 2,665 (dd. −6%, Sharpe 1.33)", "28%"],
            ["MA20/50, golden cross MA50/200", "1,670 / 1,681, 1,692 / 1,847", "1,375 / 2,047, 1,401 / 2,146", "43%, 41%"],
            ["Bollinger Bands (20,2), breakout", "1,439 / 1,266", "1,221 / 1,598 (dd. −3%, Sharpe 1.29)", "45%"],
            ["Bollinger Bands (20,2), reversal", "1,316 / 1,302", "1,208 / 1,424", "59%"],
            ["Fibonacci 61.8% / 50% / 38.2% (pullback in a trend)", "975–1,053", "1,010–1,077", "30–35%"],
            ["Donchian 55/20 (Turtle)", "1,698 / 1,503", "1,130 / 1,342", "50% (135 trades)"],
            ["MACD (cross below zero)", "1,430 / 1,429", "1,109 / 1,346", "37%"],
            ["Stochastic (14,3,3) < 20", "1,640 / 1,664", "1,279 / 1,503", "64%"],
            ["Connors RSI2 < 10 + MA200", "1,590 / 1,543", "1,280 / 1,626", "63%"],
            ["RSI14 < 30 + MA200", "1,191 / 1,378", "1,105 / 1,261", "62%"],
          ]}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>Fibonacci did worst (profit factor about 1.0), so it has no edge.</li>
          <li>
            The high win-rate methods (Bollinger, Stochastic, RSI) end up with capital below the market because they sit in cash
            most of the time and the average loss is larger than the gain.
          </li>
          <li>
            The analysts + MA200 filter improves almost all trend methods (Sharpe from about 0.4–0.8 to 1.0–1.4). The dark horse's
            edge therefore comes mainly from the filter and the top-up, not from Ichimoku itself.
          </li>
        </ul>

        {/* 7 */}
        <H2>7. Optimising for a higher win rate</H2>
        <p>
          Goal: raise the share of profitable positions from about 24% to at least 50%. About 300 variants were tested (all with
          the analysts + MA200 filter and a 5% top-up): breakout confirmation (price above Kijun 52 for 3 or 5 consecutive
          sessions), other exits (Tenkan below Kijun, price below Kijun 26 / MA10 / MA20 / Tenkan), targets of +6…+15%, moving the
          stop to the entry price after +5%, a 40-session limit, a market filter (index above MA200), relative strength, RSI 50–70,
          analysts ≥ 30%, entry after a pullback to Kijun 26 and partial profit-taking (selling half or 1/3 of the position at
          +5…+15%).
        </p>
        <DocTable
          head={["Variant", "Capital (position 2% / 5%)", "Win rate", "Drawdown", "Sharpe"]}
          rows={[
            ["Previous dark horse", "$2,693 / $2,954", "24–25%", "−20% / −22%", "1.18"],
            [<Strong key="a">A. 5-session confirmation + exit below Kijun 52 (max capital)</Strong>, "$3,163 / $4,819", "32–35%", "−15% / −21%", "1.58 / 1.72"],
            ["B. 5-session confirmation + exit Tenkan below Kijun (balanced)", "$2,624 / $2,827", "45–46%", "−12% / −19%", "1.69 / 1.47"],
            [<Strong key="c">C. B + sell half the position at +8% (≥ 50% win rate)</Strong>, "$1,968 / $2,448", "51%", "−8% / −15%", "1.68 / 1.59"],
            ["D. B with a +8% target for the whole position", "$1,339 / $1,467", "56–57%", "−8% / −14%", "—"],
            ["5-session confirmation + exit below Kijun 26", "$2,284 / $2,982", "36%", "−7% / −10%", "1.80 / 1.78"],
            ["fresh san'yaku + market > MA200, exit below Kijun 52", "$2,900 / $3,397", "36–37%", "−15% / −16%", "1.5"],
          ]}
          caption="Average of 6 random orderings, 483 S&P 500 stocks, 20.09.2021–18.09.2026. All variants with a 5% top-up."
        />
        <Box tone="info" title="Conclusions from the optimisation">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Breakout confirmation over 5 sessions</Strong> filters out false breakouts: with the same exit it raises
              capital from $2,693 to $3,163 (2% position) and from $2,954 to $4,819 (5%), and Sharpe from 1.18 to 1.6–1.7.
            </li>
            <li>
              <Strong>A faster exit</Strong> (Tenkan below Kijun instead of price below Kijun 52) raises the win rate from 32–35% to
              45–46% with almost no change in capital relative to the previous dark horse, but by less than variant A.
            </li>
            <li>
              <Strong>≥ 50% win rate</Strong> requires partial profit-taking. Of 144 variants only 4 exceeded 50%, and none gave
              capital above $2,500. Every change that raises the win rate reduces the average profit and capital.
            </li>
            <li>
              Additional filters (index above MA200, 63-day relative strength versus the market) improved Sharpe and lowered the
              drawdown to −6…−12%, but reduced capital.
            </li>
          </ul>
        </Box>
        <H3>What exactly to change relative to the base version</H3>
        <DocTable
          head={["Goal", "Entry", "Exit", "Profit-taking"]}
          rows={[
            ["More winning positions (about 46%)", "Analysts + MA200 filter; price closed above Kijun 52 for 5 consecutive sessions (buy at the open after the first day it is met)", "Tenkan falls below Kijun (26) at the close, sale at the next session's open", "None"],
            ["Over 50% winning positions", "As above", "As above", "Sell half the position once +8% above the purchase price is reached (limit order), the rest to the exit"],
            ["Highest capital", "As above", "Close below Kijun 52", "None"],
          ]}
          caption="The +5% top-up (price above the cloud and a bullish score) in all versions as in section 3."
        />

        {/* 8 */}
        <H2>8. How to get to almost $5,000 from $1,000: step by step</H2>
        <p>
          The best result from the backtests: version A (5-session confirmation, exit below Kijun 52, no profit-taking), base
          position 5%.
        </p>
        <DocTable
          head={["Measure", "Result (average of 6 draws)"]}
          rows={[
            ["Final capital from $1,000 after 5 years", "$4,819 (range of draws $4,567–$5,099)"],
            ["Market (buy and hold S&P 500, equal weights)", "$1,851"],
            ["Maximum drawdown", "−21% (market: −19%)"],
            ["Sharpe", "1.72 (market: 0.83)"],
            ["Trades in 5 years", "282 (about 56 per year)"],
            ["Win rate", "35%"],
            ["Average profit / average loss per trade", "+23.3% / −4.6% (profit factor 2.75)"],
            ["Average result per trade", "+5.2% after costs"],
          ]}
          caption="For comparison, a 2% base position: $3,163 (drawdown −15%, Sharpe 1.58)."
        />
        <H3>Procedure (every day after the US session closes)</H3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Universe</Strong>: S&amp;P 500 stocks (483 stocks with full history in the test). Smaller companies have no
            forecast history, so they were not tested with this filter.
          </li>
          <li>
            <Strong>Fundamental filter</Strong>: the median of the latest analyst price targets (last 180 days, min. 3 firms)
            at least 20% above the price. In the app this is the &ldquo;Min. analyst upside&rdquo; field in the Trend setup section.
          </li>
          <li>
            <Strong>Trend filter</Strong>: closing price above the daily MA200 (in the Setup: MA200 from the D1 timeframe).
          </li>
          <li>
            <Strong>Signal</Strong>: price closed above the Kijun-sen (52) on D1 for 5 consecutive sessions, having previously
            closed at or below it. The signal comes on the fifth day.
          </li>
          <li>
            <Strong>Purchase</Strong>: at the next session's open for 5% of current capital per stock (capital = cash +
            position value). If there are more stocks than cash, pick at random (a random draw in the test); do not buy when
            there is no cash.
          </li>
          <li>
            <Strong>Top-up</Strong>: once, +5% of capital to the position when price is above the Ichimoku cloud and the
            five-line score (Ichimoku page / trend columns) is bullish (≥ +2). Do this at the next session's open.
          </li>
          <li>
            <Strong>Exit</Strong>: when price closes below Kijun-sen 52, sell the whole position at the next session's open.
            No additional price stop-loss and no fixed profit target.
          </li>
          <li>
            <Strong>Capital</Strong>: always size the position from current capital (compounding). Cash earns no interest. Costs
            in the test: 0.05% per side.
          </li>
        </ol>
        <Box tone="warn" title="What to expect and the risks">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              65% of trades end in a loss (−4.6% on average). The result is made by a few large gains (+23% on average), so the
              strategy demands patience and sticking to the rules.
            </li>
            <li>The maximum drawdown in the test is −21%; in a bear market it could be larger (the test period was mostly a bull market with one bear market in 2022).</li>
            <li>
              The result depends on the random order in which stocks are picked ($4,567–$5,099 in the test) and on variants chosen
              after looking at the results (about 300 tested). Version A carries selection bias.
            </li>
            <li>Taxes, slippage beyond 0.05% and liquidity are not taken into account; only current S&amp;P 500 stocks were tested.</li>
          </ul>
        </Box>
        <H3>What the app has and what it lacks for this procedure</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Has</Strong>: the Trend setup section (Kijun-sen 52 from the chosen timeframe, minimum analyst upside, price
            above the MA from the chosen timeframe, weight in the ranking); the five-line score and trend columns; the S&amp;P 500 ranking.
          </li>
          <li>
            <Strong>To be set</Strong>: the Kijun-sen and MA timeframe to D1 (default H4), upside 20%, MA200.
          </li>
          <li>
            <Strong>Missing</Strong>: the condition &ldquo;5 consecutive sessions above Kijun 52&rdquo;, the top-up signal (price
            above the cloud + bullish score) as separate information, the exit (price below Kijun 52) and automatic position
            sizing. Today the app helps you pick stocks, and the entry and exit rules are applied manually.
          </li>
        </ul>

        {/* 9 */}
        <H2>9. Limitations and what still needs to be checked</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Survivorship</Strong>: current S&amp;P 500 stocks are tested; delisted companies have no data (including
            forecasts), which inflates the result of a method based on forecasts.
          </li>
          <li>
            <Strong>A single period</Strong> (2021–2026) and choosing variants after looking at the results: an out-of-sample test
            is needed, e.g. on 2012–2021 (analyst data exists), and on stocks removed from the index.
          </li>
          <li>
            <Strong>Multiple testing</Strong>: thousands of variants were tested; a statistical correction and walk-forward
            (parameters chosen on one period, evaluated on the next) are needed.
          </li>
          <li>
            <Strong>Analyst data</Strong>: from Yahoo Finance, without independent verification; no history for Nasdaq and the
            Russell 2000; sensitivity to the 180-day window and the minimum of 3 firms still to be checked.
          </li>
          <li>
            <Strong>Realism</Strong>: costs of 0.05% per side, no taxes or slippage; entry at the open assumes a fill.
          </li>
          <li>
            <Strong>Not yet checked</Strong>: entries on H4 (Yahoo provides hourly data for only 730 days), other markets
            (Europe, Japan) and periods with a long bear market.
          </li>
          <li>
            The criterion for regarding the method as better than buying the index (set in advance): an edge after costs and tax
            in at least 2 of 3 independent periods, after correcting for multiple testing and in a walk-forward test, in a sample
            free of survivorship bias and robust to a ±20% change of parameters. Until this is met, the default choice remains an
            index ETF.
          </li>
        </ul>

        {/* 10 */}
        <H2 id="test-kontrolny">10. Control test (21.09.2026): out of sample, Nasdaq and Russell 2000, 10% drawdown limit, $10,000</H2>
        <p>
          Sections 1–9 describe results from a single period and only from the S&amp;P 500. This section is another round of
          tests that checks whether those results hold. All figures refer to backtests, not forecasts.
        </p>
        <Box tone="warn" title="The most important conclusion">
          <p>
            The result from section 8 (<Strong>$4,819 from $1,000</Strong>) was partly an artefact of how it was selected. Once the
            index membership as of each day is taken into account, the same variant gives about $3,229 instead of $4,819 in
            2021–2026 (5% position), and out of sample (2014–2021) only <Strong>$1,356, i.e. below the market</Strong>. The method
            does not meet the criteria from section 9. The default choice remains an index ETF.
          </p>
        </Box>

        <H3>10.1 What was added to the tests</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Index membership as of each day</Strong>: a stock can be bought only during the period when it was actually in
            the S&amp;P 500. Earlier tests bought, from day one, stocks that joined the index later (usually ones that had grown).
            This lowers results by 17–38%.
          </li>
          <li>
            <Strong>An out-of-sample period 2014–2021</Strong> (analysts are in the data from 2013), data from 2006 (the 2008–2009
            bear market) and 118 stocks that dropped out of the index (out of 280; the rest have no data).
          </li>
          <li>
            <Strong>Nasdaq and the Russell 2000</Strong>: 4,157 stocks, but only liquid ones are bought (median daily turnover over
            60 sessions from $1 million, price from $3); a cost of 25 bp per side for small caps; analyst history was downloaded for
            3,000 stocks outside the S&amp;P 500. Without the liquidity filter the results are worthless (noise and bad ticks).
          </li>
          <li>
            <Strong>A fairer comparison</Strong>: not only against the market but also against a market with the same exposure
            (the strategy often holds 30–70% in stocks), against SPY, RSP, QQQ and IWM, and against the market scaled down to a 10%
            drawdown; White&apos;s correction for multiple testing, walk-forward and random entries.
          </li>
          <li>
            <Strong>New variants</Strong>: risk per trade (0.25–1% of capital) with a hard stop, a 10% drawdown budget, an R:R
            filter from the Ichimoku wave targets and entries on H4.
          </li>
          <li>
            <Strong>$10,000 of capital, whole shares only.</Strong> The simulator works in percentages, so capital does not change
            the results: the difference relative to $1,000 is +0.1%. That is why the amounts below are simply ten times larger.
          </li>
        </ul>

        <H3>10.2 S&amp;P 500 out of sample: the dark horse (analysts ≥ 20% + Kijun 52 + MA200 + top-up)</H3>
        <DocTable
          head={["Period", "Market (equal-weighted basket)", "Dark horse, 2% position", "5% position", "Sharpe: dark horse vs market"]}
          rows={[
            ["2014-01 – 2016-08", "$13,470", "$10,490", "$10,920", "0.34 vs 0.87"],
            ["2016-09 – 2019-04", "$14,760", "$11,100", "$11,220", "0.70 vs 1.30"],
            ["2019-05 – 2021-09", "$15,760", "$17,060", "$19,530", "1.90 vs 0.85"],
            [<Strong key="a">2014 – 2021 (whole)</Strong>, "$31,330 (SPY $27,660)", "$19,490", "$23,580", "1.06 vs 0.90"],
            ["2021-09 – 2026-09", "$17,190 (SPY $18,450)", "$22,760", "$21,800", "1.11 vs 0.75"],
          ]}
          caption="Cost 5 bp per side, start $10,000 (converted from percentage results), average of 8 random orderings of trades."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Out of sample the capital is <Strong>below the market</Strong> over the whole period and in 2 of 3 subperiods. The edge
            in 2019–2021 comes mainly from avoiding the 2020 crash (drawdown −7% versus −39%).
          </li>
          <li>
            Alpha relative to a market with the same exposure: −2.0%, −0.2%, +11.1%, +2.6% (whole) and +9.2% a year in 2021–2026,
            with t-statistics below 1.5. None is statistically significant. White&apos;s correction for 64 variants: p = 0.10 in the
            period from which the method was chosen, and 0.33–0.995 in the others.
          </li>
          <li>
            The variant with 5-session confirmation (from section 8) out of sample: $1,356 versus $1,528 for a market with the same
            exposure. A typical symptom of fitting to the sample: it was chosen as the best of about 300 variants.
          </li>
          <li>
            Parameters: Kijun 40–65, MA 150–300, the minimum number of firms and the top-up give similar results (robust), whereas{" "}
            <Strong>the analyst threshold is fragile</Strong>: in 2021–2026 at 15% it comes to $17,050 (the market level), at 20%
            $22,840, at 25% $15,230.
          </li>
          <li>
            The signal (Kijun 52 cross and exit below Kijun) beats random entries within the same filter (85th–100th percentile),
            but modestly: +1.3% per trade versus +1.0% at random. Most of the result comes from the analysts + MA200 filter and
            the exposure itself.
          </li>
        </ul>

        <H3>10.3 Nasdaq and the Russell 2000: the dark horse does not work</H3>
        <DocTable
          head={["Period", "Russell: dark horse", "Russell: market", "Nasdaq: dark horse", "Nasdaq: market"]}
          rows={[
            ["2014-01 – 2016-08", "$8,590", "$11,120", "$9,580", "$11,790"],
            ["2016-09 – 2019-04", "$9,860", "$13,740", "$10,120", "$14,650"],
            ["2019-05 – 2021-09", "$23,090", "$16,420", "$21,730", "$16,690"],
            ["2014 – 2021 (whole)", "$19,780", "$25,100", "$22,130", "$28,810"],
            ["2021-09 – 2026-09", "$7,310", "$12,670", "$8,910", "$8,860"],
          ]}
          caption="Liquid stocks (from $1 million a day), cost 25 bp, 2% position, K52. Market: an equal-weighted basket rebalanced once a month."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            The dark horse beats the market <Strong>only in 2019–2021</Strong> (alpha +15–19% a year, t around 1). In 2014–2019 and
            in 2021–2026 (Russell 2000: −10%/year) it is equal or worse. The edge from sections 1–9 therefore applies only to the S&amp;P 500.
          </li>
          <li>
            <Strong>The analyst filter does not predict returns</Strong> on Nasdaq and the Russell 2000 (the difference in returns of
            stocks with upside ≥ 20% and below: about 0, |t| below 1), and consensus coverage of liquid stocks is only 13–30% in
            2014–2021 (S&amp;P 500: 77–97%).
          </li>
          <li>
            <Strong>A Kijun 52 cross</Strong> is usually worse than a random day (after 63 sessions −0.35% to −0.53%; significantly
            so on Nasdaq and outside the S&amp;P). In 2021–2026 the value comes from the state &ldquo;price above MA200 +
            consensus&rdquo;, not from the cross itself.
          </li>
          <li>Kijun 26 is clearly worse than 52 (in the Russell 6,220 trades versus 3,787, a worse result in most periods).</li>
          <li>
            Without analysts, at realistic costs (25 bp), no method (K52/K26 + MA200, MA200 alone) beats the market in 2014–2021.
            The 2008–2009 bear market: the MA200 and Kijun filters did not protect capital (drawdown −37% to −50% versus −52%).
          </li>
        </ul>

        <H3>10.4 The last 6 years (21.09.2020 – 18.09.2026), start $10,000</H3>
        <DocTable
          head={["Market", "Method", "Capital", "Max. drawdown", "Sharpe"]}
          rows={[
            ["S&P 500", "Dark horse K26, 20% position", "$49,640", "−27%", "1.38"],
            ["S&P 500", "5-session confirmation K52 (exit K52), 5% position", "$36,432", "−15%", "1.49"],
            ["S&P 500", "Dark horse K52, 2% position", "$33,213", "−18%", "1.36"],
            ["S&P 500", "5-session confirmation + exit Tenkan below Kijun, 2% position", "$22,241", "−7%", "1.64"],
            ["S&P 500", "10% drawdown limit (stop at Kijun 52, analysts, 1% risk)", "$18,713", "−10%", "1.06"],
            ["Nasdaq", "Dark horse K52, 5% position (best)", "$17,510", "−56%", "0.42"],
            ["Russell 2000", "Donchian 55/20, 20% position (spread of draws $7,079–$53,178)", "$31,505", "−53%", "0.58"],
            ["Russell 2000", "MA200 alone, 2% position", "$21,525", "−32%", "0.68"],
            [<Strong key="b">Reference</Strong>, "SPY / QQQ / IWM / RSP", "$24,977 / $27,974 / $19,980 / $21,338", "−24% / −35% / −32% / −21%", "1.00 / 0.88 / 0.63 / 0.87"],
            ["Reference", "Market scaled down to a 10% drawdown (S&P 500)", "$15,753", "−10%", "1.00"],
          ]}
          caption="Average of 5 random orderings of trades. The full breakdown of all methods, 2/5/10/20% positions and charts: the raport.html file in the repository."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>The biggest gains come from methods with Kijun-sen + the MA200 filter + analysts, but only on the S&amp;P 500.</Strong> There
            all variants with the top-up finish clearly above SPY ($24,977) and QQQ ($27,974). On Nasdaq and the Russell 2000 the
            result is lower than in the ETFs or bought with a 45–55% drawdown.
          </li>
          <li>
            The biggest result (K26, 20% position: $49,640) depends heavily on a single phase: capital grew by about 49% in March–June
            2026 alone (from $35.5k to $52.8k) while SPY gained about 20%. The spread of draws is $43.9–56.2k. Smaller positions (2–5%)
            are safer.
          </li>
        </ul>

        <H3>10.5 A 10% drawdown limit, cutting losses and an R:R filter from Ichimoku waves</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Construction</Strong>: position = risk per trade (0.25–1% of capital) divided by the distance to the stop (max.
            10% of capital per stock); an intraday stop at Kijun 52 (trailed only upward) or below the low of the wave&apos;s correction
            (optionally an exit at the wave target); the drawdown budget reduces positions as capital falls, and at −9% a circuit
            breaker closes everything for 21 sessions. The limit is not guaranteed (price gaps), so the actual drawdown is reported.
          </li>
          <li>
            <Strong>R:R from waves</Strong>: a 5% zigzag on closes, target N = C + (B − A) from the last rising wave (A the low, B
            the high, C the low of the correction; the same as in the Ichimoku chart code). R:R = (target − price) / (price − stop);
            a filter of 2, 3 or 4.
          </li>
          <li>
            <Strong>Result</Strong>: the 10% limit can be kept (on the S&amp;P 500 all configurations with analysts), but capital is
            usually 1.0–1.9× the starting capital over 6 years (best: $18,713), similar to or worse than the market scaled down to the
            same drawdown. An excess over such a market is seen only on the S&amp;P 500 in 2019–2021 and 2021–2026.
          </li>
          <li>
            <Strong>An R:R ≥ 3:1 filter does not improve results.</Strong> On the S&amp;P 500 it worsens the average result relative
            to the scaled-down market by $470–$700 (out of $10,000) and reduces the number of trades by 45–70%; on Nasdaq and the
            Russell 2000 it slightly reduces the loss, but does not beat the market either.
          </li>
        </ul>
        <DocTable
          head={["Planned R:R", "How often the wave target is reached before the stop", "Comment"]}
          rows={[
            ["below 1 (plan 0.5–0.6)", "60–83%", "target close, small gain"],
            ["2 to 3 (plan 2.4–2.5)", "19–39%", ""],
            ["3 to 5 (plan 3.8–4.1)", "8–31%", ""],
            ["3 and above (plan 7.5–9.3 on average)", "15–20%", "the planned R:R is not realised"],
          ]}
          caption="Entry events (Kijun 52 cross + MA200, with and without analysts, S&P 500, Russell 2000 and Nasdaq, 2014–2026; stop = Kijun 52 at the moment of the signal)."
        />
        <p>
          The N wave target is thus reached before the stop in only 15–30% of cases, and the higher the planned R:R, the more rarely.
          A high R:R comes mainly from a close stop and a distant target. A target from Ichimoku waves is not a reliable
          profit-taking point.
        </p>

        <H3>10.6 Entries on H4</H3>
        <p>
          Hourly data reach back about 2.8 years (12.2023–09.2026), 480 S&amp;P 500 stocks, start $10,000. The market in this window:
          about $15,680, SPY about $17,310. The best daily and H4 variants finish in a similar range (about $19,400–$19,800 with a
          5% position), the differences are within the noise of the draws. <Strong>H4 does not improve the result</Strong> beyond
          daily entries, but does bring more trades and costs. A higher win rate (36–44%) comes mainly from a faster exit, at the
          expense of capital.
        </p>

        <H3>10.7 Older data (2014–2020): with caution</H3>
        <p>
          For 2014–2020 the results are inconsistent: the best variants change from period to period (e.g. on the S&amp;P 500 the best
          is MA200 alone, $22,199 with a 20% position versus SPY $20,431, and the dark horse with analysts is not among the leaders).
          The reasons this data has to be treated with caution: the history of analyst targets is sparse (in small caps coverage is
          13–26%), the Nasdaq and Russell 2000 lists are current members (survivorship), and for delisted companies there are neither
          prices nor targets. Treat it as a check, not proof.
        </p>

        <H3>10.8 The answer to the question: which methodology gives the biggest profits?</H3>
        <DocTable
          head={["Goal", "Methodology", "Notes"]}
          rows={[
            ["Biggest profit (6 years, S&P 500)", "Dark horse with Kijun 26, 20% position; among the others the best are the 5-session confirmation K52 and the dark horse K52", "High drawdown (−27%), strong dependence on a single 2026 phase, weak on Nasdaq and the Russell 2000"],
            ["Best profit-to-risk ratio", "5-session confirmation K52 with an exit of Tenkan below Kijun, 2% position: drawdown −7%, Sharpe 1.64", "Out of sample it comes in below the market"],
            ["Drawdown no more than 10%", "Stop at Kijun 52 (trailed), analysts ≥ 20%, MA200, 1% risk per trade", "About 11% a year; better than the market scaled down to 10%, but many times less than full positions"],
            ["Nasdaq, Russell 2000", "No method better than an ETF (QQQ, IWM)", "No method is stable"],
            ["Default choice", "An index ETF (SPY or RSP)", "The criteria from section 9 are not met"],
          ]}
        />
        <Box tone="info" title="What this means for the app">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The Trend setup section in the rankings (Kijun 52, analyst upside, price above the MA) is a sensible selection filter
              on the S&amp;P 500, but it is a <Strong>hypothesis, not a proven edge</Strong>. On Nasdaq and the Russell 2000 it has no
              support in the tests.
            </li>
            <li>
              It is worth setting the default Setup timeframe to D1 and MA200, because that is what the backtests used; entries on
              H4 improved nothing. The wave R:R filter was not added to the app because it does not improve results.
            </li>
          </ul>
        </Box>

        <Box tone="warn" title="Caveats to section 10">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The analyst forecasts are reconstructed from the history of target changes (Yahoo: upgrades/downgrades: the median of
              firms&apos; latest targets over 180 days, min. 3 firms). There is no independent verification, the history begins in
              2013, and the targets of delisted companies do not exist in the data.
            </li>
            <li>
              Survivorship inflates the results: the Nasdaq and Russell 2000 lists are current members, and the S&amp;P 500 lacks most
              delisted companies (data coverage of index members: 75–90% in 2014–2021, 61–70% in 2007–2011).
            </li>
            <li>
              Costs: 5 bp (S&amp;P 500) and 25 bp (Nasdaq, Russell 2000) per side; no taxes or slippage beyond that. The best
              configurations were chosen after looking at the results, so they carry selection bias.
            </li>
            <li>
              Still not checked: other markets (Europe, Japan), revisions of analyst targets instead of the target level,
              Hosoda&apos;s weekly chart, and results with the full list of bankrupt companies.
            </li>
          </ul>
        </Box>

        {/* 11 */}
        <H2 id="test-nyse">11. Additional test (22.09.2026): NYSE, robustness of the top-up on the S&amp;P 500, a test of the indices themselves</H2>
        <p>
          A further round of tests building on section 10: NYSE as a fourth market (alongside the S&amp;P 500, Nasdaq, Russell
          2000), a check of whether the position top-up variant on the S&amp;P 500 is robust to changes in execution details, and
          a clean point of reference — simply buying and holding the indices/ETFs, with no strategy at all.
        </p>

        <H3>11.1 What was tested</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>NYSE</Strong>: 2,181 stocks (price data 2011–2026 and analyst forecast history downloaded specifically for
            this test; cost assumed at 10 bp per side — more than the S&amp;P 500, less than Nasdaq/Russell, since NYSE is
            mostly large- and mid-cap stocks; the same liquidity filter as in section 10). Four test families: (a) dark horse
            + 10% drawdown limit — the same variants as in section 10.3 for Nasdaq/Russell; (b) top-up to a target weight
            (first entry 20% of capital, then topping up to 25/50/100%); (c) &bdquo;all-in only when analysts ≥ 30/50/70%&rdquo;.
          </li>
          <li>
            <Strong>Robustness of the S&amp;P 500 top-up</Strong>: a baseline version (first entry 20% of capital, top-up to
            50% or 100% right after the signal, no limit on the number of positions, no circuit breaker) and, separately, each
            change: a different first-entry size (10% / 30%), a maximum of 1 position at a time, topping up only after 5 or 21
            sessions of holding, a hard stop <em>within the session</em> below the Kijun-sen 52 (instead of waiting for the
            close), a circuit breaker after a −20% drawdown (21 sessions of pause), and all of these changes together. 10
            order-of-fill draws per variant, $10,000, two independent windows: 2014-01 – 2020-09 and 2020-09 – 2026-09.
          </li>
          <li>
            <Strong>A test of the indices themselves</Strong>: buying and holding SPY, RSP, QQQ, IWM, VTI (with dividends)
            over all the periods used in the tests of sections 10 and 11, with no entry/exit rule at all — a reference point
            for the rest.
          </li>
        </ul>

        <H3>11.2 NYSE results</H3>
        <DocTable
          head={["Variant", "6 years (2020-09–2026-09)", "2014-01–2020-09"]}
          rows={[
            ["Market: SPY", "$24,977, DD −24%", "$20,431, DD −34%"],
            ["Market: NYSE basket (equal-weight)", "$22,678, DD −26%", "$15,063, DD −44%"],
            ["Dark horse K52 (as in section 3), 20% position", "$24,659, DD −39%", "$18,068, DD −29%"],
            ["Best family-A variant (K26, 20% position)", "$54,518", "— (best in OLD: MA200+analyst filter, $19,541)"],
            ["10% drawdown limit (family B), best variant", "$14,425, DD −11%", "$11,063, DD −8%"],
            ["Top-up to a target weight, best variant (to 50%)", "$79,411 (range $41k–106k)", "$20,085 (range $18.2k–21.9k)"],
            ["All-in when analysts ≥ 50%", "$22,779, DD −37%", "$15,162, DD −30%"],
            ["All-in when analysts ≥ 70%", "$23,866, DD −36%", "$14,955, DD −30%"],
          ]}
          caption="Start $10,000. &bdquo;Family A&rdquo; = variants as in section 10.3 (dark horse and derivatives); &bdquo;family B&rdquo; = ~10% drawdown limit as in section 10.5."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>NYSE behaves like Nasdaq and the Russell 2000, not like the S&amp;P 500.</Strong> The dark horse K52
            barely keeps up with SPY in the newer window and clearly loses in the older one; the 10% drawdown limit barely
            beats the market scaled to the same risk; raising the analyst threshold (30% → 70%) gives no consistent
            improvement and stays below SPY in both windows.
          </li>
          <li>
            The top-up variant (K26 + all 5 lines bullish) gave 3.2× the SPY result in the newer window, but barely caught up
            with it in the older one — <Strong>the same pattern as in section 10</Strong>: spectacular results only in the
            easier 2020–2026 bull market, disappearing in the harder 2014–2020 period. The spread of results from the
            order-of-fill draw alone ($41k–106k) is very large, which further weakens the credibility.
          </li>
        </ul>

        <H3>11.3 Robustness of the S&amp;P 500 top-up: which version is best</H3>
        <DocTable
          head={["Change relative to the baseline (top-up to 50%)", "2020-09–2026-09", "2014-01–2020-09"]}
          rows={[
            ["Baseline (first entry 20%, top-up to 50% right away, no restrictions)", "$44,636, DD −35%", "$11,928, DD −36%"],
            [<Strong key="hs">+ hard stop within the session below Kijun 52 (= the method described in section 12)</Strong>, <Strong key="hs1">$76,116, DD −19%</Strong>, <Strong key="hs2">$31,983, DD −15%</Strong>],
            ["For comparison: the same, but topping up to 100% (all-in) instead of 50%", "$76,280, DD −21%", "$25,868, DD −19%"],
            ["First entry 10% instead of 20%", "$34,386, DD −28%", "$10,553, DD −38%"],
            ["First entry 30% instead of 20%", "$48,396, DD −35%", "$10,640, DD −42%"],
            ["Max. 1 position at a time", "$16,486, DD −25%", "$11,542, DD −23%"],
            ["Top-up only after 5 sessions of holding", "$65,412, DD −32%", "$12,938, DD −32%"],
            ["Circuit breaker after a −20% drawdown (21-session pause)", "$20,928, DD −24%", "$10,899, DD −24%"],
            ["All changes together", "$20,486, DD −18%", "$15,401, DD −12%"],
          ]}
          caption="Position from Kijun 52 + analysts ≥ 20% + MA200, top-up when price is above the cloud and the 5-line score is bullish, $10,000, 10 order-of-fill draws."
        />
        <Box tone="info" title="The best method found across the whole test program">
          <p>
            Topping up to a target weight of <Strong>50%</Strong> of capital (not 100%/all-in) together with a{" "}
            <Strong>hard stop within the session below Kijun 52</Strong> (exit when the day&apos;s low falls below the
            previous day&apos;s Kijun-sen 52, instead of waiting for the close) gave the highest, and at the same time the
            most robust, result of all the tests in sections 3–11: <Strong>$76,116</Strong> in the 2020–2026 window and{" "}
            <Strong>$31,983</Strong> in the 2014–2020 window (from $10,000), both above SPY ($24,977 and $20,431) and with a
            lower drawdown than SPY (−19%/−15% vs. −24%/−34%). It is the only variant in the whole series that beats SPY in
            both independent windows at once <em>and</em> has a lower drawdown than SPY in both at once — even better than the
            same method with a top-up to the full 100% (all-in). The other changes (a smaller/larger base, a limit of 1
            position, a circuit breaker) lower the result more than they lower the risk. This result{" "}
            <Strong>has not yet been tested out of sample</Strong> (on a period not seen when it was chosen) — the full
            step-by-step description is in section 12.
          </p>
        </Box>

        <H3>11.4 A test of the indices themselves (buy and hold, with dividends, start $1,000)</H3>
        <DocTable
          head={["Period", "SPY", "RSP", "QQQ", "IWM", "VTI"]}
          rows={[
            ["2014-01 – 2016-08", "1,237", "1,223", "1,365", "1,107", "1,220"],
            ["2016-09 – 2019-04", "1,427", "1,350", "1,669", "1,330", "1,421"],
            ["2019-05 – 2021-09", "1,567", "1,476", "2,001", "1,446", "1,582"],
            ["2014 – 2021 (whole period)", "2,766", "2,438", "4,559", "2,129", "2,742"],
            ["2021-09 – 2026-09", "1,845", "1,508", "1,989", "1,363", "1,758"],
            ["OLD: 2014-01 – 2020-09", "2,043", "1,722", "3,241", "1,452", "1,995"],
            ["6L: 2020-09 – 2026-09", "2,498", "2,134", "2,797", "1,998", "2,416"],
          ]}
          caption="QQQ (Nasdaq 100) wins consistently in every period; IWM (Russell 2000) is consistently the weakest. This is the raw point of reference — no strategy from sections 3–11 beats QQQ in every period at once."
        />

        {/* 12 */}
        <H2 id="procedura-krok-po-kroku">
          12. Updated procedure: how to apply all the indicators step by step
        </H2>
        <p>
          Exclusively for the <Strong>single best method</Strong> found across the whole test program (section 11.3): S&amp;P
          500, Kijun 52 + analysts ≥ 20% + MA200, top-up to a target weight of 50% of capital, with a hard stop within the
          session below Kijun 52. Result: $76,116 (2020–2026) and $31,983 (2014–2020) from $10,000, both above SPY and with a
          lower drawdown than SPY. This is still a hypothesis from backtests on a single sample, not a ready-made strategy —
          see the caveat at the end.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Universe</Strong>: S&amp;P 500 stocks only. This is the only one of the four tested markets (S&amp;P 500,
            Nasdaq, Russell 2000, NYSE — sections 10.3 and 11.2) on which this method showed a trace of an edge. Do not apply
            this procedure on the other three.
          </li>
          <li>
            <Strong>Fundamental filter</Strong>: the analyst consensus (median of the latest price targets over 180 days, min.
            3 firms) at least <Strong>20%</Strong> above the current price. Do not raise the threshold — 25–70% gave worse
            results in every test (sections 4, 10.2, 11.2).
          </li>
          <li>
            <Strong>Trend filter</Strong>: closing price above <Strong>MA200</Strong> (daily, D1 timeframe). Entries on H4 did
            not improve the result (section 10.6) — stick with D1.
          </li>
          <li>
            <Strong>Entry signal</Strong>: price closes above the Kijun-sen <Strong>52</Strong>-period line (D1), having closed
            at or below it the previous day.
          </li>
          <li>
            <Strong>Buy (first entry)</Strong>: at the open of the next session, for <Strong>20%</Strong> of current capital
            (cash + position value) in that stock.
          </li>
          <li>
            <Strong>Top-up</Strong> (once per position): when the price is above the Ichimoku cloud <em>and</em> the 5-line
            score is bullish (≥ +2), at the open of the next session buy more shares of the same stock so the position reaches{" "}
            <Strong>50%</Strong> of current capital. 50% came out better than a full all-in (100%) in both time windows
            (section 11.3) — do not top up beyond this weight.
          </li>
          <li>
            <Strong>Stop loss</Strong>: a hard stop <em>within the session</em>, not only at the close — if the day&apos;s low
            falls below the level of the Kijun-sen 52 from the previous session, close the whole position (at that level or at
            the opening price if it is lower). This is the element that, in testing, raised the capital and lowered the
            drawdown at the same time, in both independent windows at once (section 11.3) — the only such case in the whole
            series.
          </li>
          <li>
            <Strong>Close-based exit (if the stop from step 7 did not trigger)</Strong>: when the price closes below the
            Kijun-sen 52, sell the whole position at the open of the next session.
          </li>
          <li>
            <Strong>Order when there are more signals than cash</Strong>: choose randomly. There is no single best order — the
            choice of order alone changed the result by tens of percent between draws (range $63k–90k and $30k–34k in the
            table in section 11.3).
          </li>
          <li>
            <Strong>What not to do</Strong> (confirmed by testing): do not apply this on NYSE, Nasdaq or the Russell 2000 (step
            1); do not raise the analyst threshold above 20–25%; do not add the wave R:R filter (it makes results worse,
            section 10.5); do not limit to 1 position at a time and do not add a circuit breaker after a −20% drawdown — in
            testing these made the result worse by more than they lowered the risk (section 11.3); do not enter on H4 instead
            of D1; do not top up to 100% (all-in) — worse than topping up to 50%.
          </li>
          <li>
            <Strong>Costs and realism</Strong>: 5 basis points (0.05%) per side of a trade in the tests, with no taxes and no
            slippage beyond that. Real-world costs (capital-gains tax, more slippage) will lower the result.
          </li>
        </ol>
        <Box tone="warn" title="Caveat for the whole procedure">
          <p>
            This is a synthesis of backtest results on a single historical sample (S&amp;P 500, current members, 2014–2026),
            not a confirmed edge and not investment advice. Step 7 (the hard stop below Kijun 52) is the newest and
            least-tested element — chosen and tested only on the same two time windows on which the rest of the procedure was
            evaluated, with no separate out-of-sample test and no correction for multiple testing. The criteria for judging a
            method better than a plain index ETF (section 9) are still not fully met. The default, safer choice remains
            buying an index ETF (e.g. SPY or RSP).
          </p>
        </Box>
      </div>
    </main>
  );
}
