import { Box, H2, H3, Table, code } from "@/components/ichimokuDoc";

export function IchimokuMethodologyEn() {
  return (
    <section className="mt-12 space-y-4 text-sm leading-relaxed text-white/70">
      <h2 className="text-2xl font-semibold text-white">How Ichimoku works</h2>

      <Box title="Key takeaways (summary)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The source methodology (Hosoda, Sasaki, Polish practitioners) rests on
            three theories: <strong>time</strong>, <strong>waves</strong> and{" "}
            <strong>price</strong>. The five-line chart is only its simplest
            part. The trend assessment on this page uses only that part and is a{" "}
            <em>synthesis</em> — a sum of five signals that does not exist in
            this form in any of the sources.
          </li>
          <li>
            Backtest on 504 S&amp;P 500 stocks (the last 3 years, with 15 years
            as a control): a &ldquo;bullish/bearish&rdquo; state <strong>does not
            predict the direction</strong> of future returns, but it{" "}
            <strong>predicts volatility well</strong> (a bearish state = roughly
            15–30% higher volatility over the next 21 sessions).
          </li>
          <li>
            Individual rules from the books (san&apos;yaku, Kijun breakout with
            retest, the &ldquo;current SSB&rdquo; pattern, TK crosses, cloud
            twist) as well as wave targets and &ldquo;time numbers&rdquo;{" "}
            <strong>show no edge</strong> over chance once volatility is taken
            into account.
          </li>
          <li>
            Practical use: a risk filter (do not buy in a bearish state), not a
            generator of buy/sell signals. Details and tables are in the
            sections below.
          </li>
        </ul>
      </Box>

      <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="mb-1 font-semibold text-white/80">Contents</p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>The five lines of the chart</li>
          <li>Three theories: time, waves, price</li>
          <li>Signals and trend assessment according to the sources</li>
          <li>Step-by-step scenarios</li>
          <li>Limitations and the authors&apos; warnings</li>
          <li>How this relates to the trend assessment on this page</li>
          <li>Backtest: 3 years (and 15 years as a control)</li>
          <li>Assessment of the methodology</li>
        </ol>
      </nav>

      {/* 1 */}
      <H2>1. The five lines of the chart</H2>
      <p>
        Ichimoku Kinko Hyo (&ldquo;equilibrium chart at a glance&rdquo;) draws
        five lines derived from price alone. In Hosoda&apos;s books they are
        also called &ldquo;spans&rdquo; (a span = the distance between the
        pillars of an arch).
      </p>
      <Table
        head={["Line (name in the books)", "Formula", "Role"]}
        rows={[
          [
            <strong key="a" className="text-sky-400">Tenkan-sen (conversion line)</strong>,
            "(highest high + lowest low) / 2 over 9 periods",
            "The fastest line; short-term trend and signal trigger.",
          ],
          [
            <strong key="b" className="text-orange-400">Kijun-sen (base line)</strong>,
            "(highest high + lowest low) / 2 over 26 periods",
            "According to Hosoda “the most important element”: its DIRECTION is practically the price trend. A support/resistance level; the boundary of a bottom.",
          ],
          [
            <strong key="c">Senkou Span A (leading span 1)</strong>,
            "(Tenkan + Kijun) / 2, shifted 26 periods forward",
            "One boundary of the cloud (the resistance zone).",
          ],
          [
            <strong key="d">Senkou Span B (leading span 2, “SSB”)</strong>,
            "(highest high + lowest low) / 2 over 52 periods, shifted 26 forward",
            "The other boundary of the cloud; a flat stretch of SSB is a strong S/R level.",
          ],
          [
            <strong key="e" className="text-purple-400">Chikou Span (lagging span)</strong>,
            "today's close plotted 26 periods back",
            "According to Hosoda “the best of the five spans” (together with the fifth); compares today's price with the price 26 days ago.",
          ],
        ]}
      />
      <p>
        The area between Span A and Span B is the <strong>cloud (Kumo, the
        &ldquo;resistance zone&rdquo;)</strong>. The cloud visible ahead of the
        current candle is not a forecast — its shape is already known because
        it comes from data 26 periods ago. Hosoda adds that as long as price
        stays in a strong trend, the cloud &ldquo;can be ignored&rdquo; — it
        becomes important on a reaction or reversal. An important note: 9, 26
        and 52 are not &ldquo;magic&rdquo; parameters but part of the time
        theory (see below) — 9 is the first cycle, 26 is a segment.
      </p>

      {/* 2 */}
      <H2>2. Three theories: time, waves, price</H2>
      <p>
        Hosoda writes that &ldquo;time is dozens of times more important than
        price&rdquo; and that price is merely a range placed within time. The
        whole system consists of three pillars: <strong>time theory</strong>{" "}
        (when), <strong>wave theory</strong> (what structure the movement forms)
        and <strong>price theory</strong> (how far). The five-line chart
        describes the &ldquo;state&rdquo;, while the three theories are meant to
        forecast &ldquo;when and how far&rdquo;.
      </p>

      <H3>2.1 Time theory</H3>
      <p>
        <strong>Basic numbers</strong> (days or weeks from an important bottom
        or top, counted including the starting day): 9, 17, 26, 33, 42, (51),
        65, 76, 129, 172, 200–257. They are built from simple sums reduced by 1
        day (because the day of the extreme is shared by two waves):
      </p>
      <Table
        head={["Number", "Construction", "Notes"]}
        rows={[
          ["9", "first cycle", "“The first basic number is the most important”; around 7–11."],
          ["17", "9 + 9 − 1", "second cycle; around 13–21."],
          ["26", "9 + 9 + 9 − 1", "segment; around 24–28. The third number is the foundation (“1 segment”)."],
          ["33", "17 + 17 − 1", "around 30–37."],
          ["42", "17 + 26 − 1", "around 39–46."],
          ["65", "33 + 33 − 1", "around 56–72."],
          ["76", "26 · 3 − 2", "“interval” = 3 segments."],
          ["129", "65 + 65 − 1", "around 120–138."],
          ["172", "65 + 42 + 42 + 26 − 3", "around 163–179."],
          ["200–257", "129 + 129 − 1 = 257", "“element” ≈ 9 segments (226)."],
        ]}
        caption="The values are treated as ranges (“a symbol unifies a certain range”), not as exact days."
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>The day of change</strong> is not the same as the &ldquo;day
          of reversal&rdquo;. There are three possibilities: an immediate
          reversal, an acceleration, or an extension of the trend. According to
          Hosoda the point is that price will stay high (or low){" "}
          <em>until</em> that day; the day is aimed at the day BEFORE the bottom/top
          is reached. In an uptrend an extension is more common, in a downtrend
          an acceleration.
        </li>
        <li>
          <strong>Equivalent numbers</strong>: the lengths of previous waves
          (from the last top to the bottom, and further back from the bottom
          to the top) are projected into the future from the current extreme,
          also in sums of waves (1+2, 2+3, 1+2+3). Choosing the right day is
          &ldquo;thesis, antithesis and synthesis&rdquo; with the basic numbers.
        </li>
        <li>
          <strong>Time relations</strong> (for segments A→B→C→D): AB = BD, AB =
          CD, AC = CD, BC = BD.
        </li>
        <li>
          <strong>Segments, periods and cycles</strong>: 5 days = a short phase,
          9 = a phase, 3 phases = a period (26), 3 periods = a cycle. The first
          period usually has small swings, the third large ones; when the price
          range of the third period is larger than the sum of the first two
          (expansion) it is &ldquo;the clearest sign of a bull market&rdquo;.
        </li>
        <li>
          <strong>Weekly charts</strong>: the same numbers, but in weeks (25–27
          weeks = &ldquo;practically the end of the trend&rdquo;). Sasaki notes
          that they are less precise than daily ones but show the direction of
          the main trend; Hosoda writes that when he has no time he uses
          &ldquo;practically only&rdquo; the weekly chart.
        </li>
        <li>
          The author&apos;s caveat: the ten time symbols &ldquo;work very well
          in an uptrend&rdquo;; in a decline applying them is &ldquo;not so
          simple&rdquo;.
        </li>
      </ul>

      <H3>2.2 Wave theory</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>I</strong> — a single wave (one move), <strong>V</strong>{" "}
          — a double wave (a move and a correction), <strong>N</strong> — a
          three-part wave (rise, fall, rise; the foundation of the whole
          theory), <strong>S</strong> — an inverted N.
        </li>
        <li>
          Combinations: 5 waves = two N waves, 7 = three, 9 = four. Nine waves
          are usually &ldquo;saturation&rdquo;; if after the seventh the price
          starts even a minimal decline in the eighth, that signals exhaustion.
          Hosoda: in theory an uptrend &ldquo;can last forever&rdquo;.
        </li>
        <li>
          <strong>P</strong> — an &ldquo;inward bulge&rdquo; (contraction,
          triangle; foreshadows a weaker scenario), <strong>Y</strong> — an
          &ldquo;outward bulge&rdquo; (expansion: price falls below previous
          lows and returns above previous highs; foreshadows a move of large
          range), PP — P within P (triangle).
        </li>
        <li>
          <strong>Wave breakdown</strong>: in an uptrend when price falls below
          the minimum of the previous wave, in a downtrend when it exceeds its
          maximum. Trend criterion: higher highs and lows = a rising wave.
        </li>
        <li>
          <strong>Head-and-shoulders formation</strong> in four variants
          (standard, P, Y, N) — plays the role of confirming a top/bottom.
        </li>
        <li>
          <strong>Boundary lines</strong> (Sasaki): the maximum or minimum of a
          given candle configuration; whether they are broken or not decides
          the direction.
        </li>
      </ul>

      <H3>2.3 Price theory — four calculated values</H3>
      <p>
        For a move A→B (the first wave), correction B→C and target D (mirrored
        in a falling market) Hosoda gives four methods. The formulas below were
        confirmed in several independent passages of the books and checked
        numerically on the author&apos;s examples (e.g. Dow: bottom 1020, top
        1588, correction to 1250 → E = 2156, V = 1926; Kaneka: NT = 338 + (338
        − 281) = 395).
      </p>
      <Table
        head={["Value", "Formula (rising market)", "Meaning"]}
        rows={[
          [<strong key="e">E</strong>, <>{code("B + (B − A)")}</>, "the range of the first wave added from top B"],
          [<strong key="v">V</strong>, <>{code("B + (B − C)")}</>, "the range of the correction added from top B (the minimum target)"],
          [<strong key="n">N</strong>, <>{code("C + (B − A)")}</>, "the first wave repeated from the bottom of the correction"],
          [<strong key="nt">NT</strong>, <>{code("C + (C − A)")}</>, "a symmetric bounce of A around C"],
        ]}
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Quadruple value</strong>: four times the first move from the
          bottom is the &ldquo;minimum long-term target&rdquo; (in a bear market
          rather three times). If it does not materialise, the author takes the
          median between it and E.
        </li>
        <li>
          Layering: three waves = B + 2(B − A), four = B + 3(B − A), eight = B +
          7(B − A). Additionally the 1/3, 1/2 and 2/3 levels of the range when
          there is no other anchor.
        </li>
        <li>
          &ldquo;Passive&rdquo; values (from previous waves) and
          &ldquo;active&rdquo; ones (from the current move); point S = the
          convergence of E and NT from different waves.
        </li>
        <li>
          The author stresses: &ldquo;it cannot be said whether a calculated
          value will certainly appear&rdquo;; time (the day of change) matters
          more than price itself — it is very likely that the approximate value
          will occur around the calculated day of change.
        </li>
      </ul>

      {/* 3 */}
      <H2>3. Signals and trend assessment according to the sources</H2>

      <H3>3.1 The three signals (san&apos;yaku)</H3>
      <p>
        The classic confirmation of a trend requires three elements to agree:
      </p>
      <Table
        head={["", "Bullish signal (kouten)", "Bearish signal (gyakuten)"]}
        rows={[
          ["Tenkan / Kijun", "Tenkan crosses Kijun from below (or is above it)", "Tenkan crosses Kijun from above"],
          ["Price / cloud", "Price above the cloud (the cloud becomes support)", "Price below the cloud (the cloud blocks a return)"],
          ["Chikou", "Chikou above the price from 26 periods ago", "Chikou below the price from 26 periods ago"],
        ]}
      />
      <p>
        Hosoda calls such &ldquo;clear buying periods&rdquo; successive periods:
        after every positive turn within the same trend you count the first,
        second, third and fourth buying period. Sasaki&apos;s sources do not use
        the terms &ldquo;golden/death cross&rdquo;, but they do treat the
        crossing of the conversion and base lines as a signal.
      </p>

      <H3>3.2 Two conditions for individual stocks (Hosoda, volume I)</H3>
      <p>
        On individual companies &ldquo;artificial, temporary price
        changes&rdquo; occur, so a crossover alone is not enough. The author
        sets two conditions:
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Time / new prices</strong>: the turn has lasted from the
          bottom for at least several days (e.g. more than 9) or appears after
          a series of new closing highs. Gaps on the chart are favourable.
        </li>
        <li>
          <strong>Kijun</strong>: after the turn the closing price does not fall
          below Kijun; ideally within 9 days Kijun does not fall even for one
          session. Tenkan briefly below Kijun while Kijun is rising is not yet a
          sell signal.
        </li>
      </ol>
      <p>
        The author writes that meeting both conditions &ldquo;allows for a calm
        purchase&rdquo; — and admits that for professionals this can be too
        lenient. Signals appear rarely (about 30 out of 100–200 instruments).
      </p>

      <H3>3.3 Stages of a downtrend reversal (Sasaki, lecture 53)</H3>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Price breaks the conversion line that was blocking the rise — a cautious &ldquo;trial purchase&rdquo;.</li>
        <li>Price above the base line.</li>
        <li>The lagging line gives a rising signal.</li>
        <li>Candles above the lower boundary of the cloud.</li>
        <li>Candles above the upper boundary of the cloud.</li>
      </ol>
      <p>
        &ldquo;Usually the buying period already begins at points 2 and
        3.&rdquo; A rising signal from the chart alone can be false if time and
        waves are ignored; one should not act on a single piece of evidence.
      </p>

      <H3>3.4 The three functions of the cloud and the twist (Sasaki)</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Candles rise above the cloud — it becomes support.</li>
        <li>Candles cross the lower boundary from above — the cloud prevents a return to the uptrend.</li>
        <li>
          The day Span A and B swap places (the twist) — a probable change of
          trend. A top is often reached when the cloud blocks the Chikou and
          price cannot get out of it.
        </li>
        <li>
          Flat stretches of Kijun and SSB are treated as consolidation and S/R
          levels (Sjack, Sobótka).
        </li>
      </ul>

      <H3>3.5 Kijun breakout with retest (N wave) and the &ldquo;current SSB&rdquo; pattern</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Kijun breakout and test</strong> (according to Polish
          practitioners): price breaks Kijun, returns to it (retest) without
          closing on the other side and moves on. Interpreted as the
          realisation of an N wave.
        </li>
        <li>
          <strong>The &ldquo;current SSB&rdquo; pattern</strong> (Sjack): a
          reversal is signalled by price breaking the <em>current</em>{" "}
          (unshifted) SSB, i.e. the midpoint of the range of the last 52
          periods, with the Chikou simultaneously on the right side of price
          and a new local extreme. Note: our &ldquo;price vs cloud&rdquo; signal
          compares price with the cloud shifted by 26 periods, so this is a
          different level.
        </li>
        <li>
          <strong>A false TK signal</strong> (Sobótka): a Tenkan/Kijun crossover
          without confirmation (Kijun not rising, price on the wrong side of the
          cloud) is treated as weak.
        </li>
      </ul>

      <H3>3.6 Candle configurations (Sasaki, Hosoda &ldquo;My configurations&rdquo;)</H3>
      <p>
        Runs of at least 5, 7 or 9 candles of the same colour (with one
        &ldquo;intervention&rdquo; by an opposite candle, or two for 9; a doji
        does not break the run) are treated as signals of a change in investor
        strategy — after a decline lasting at least a segment (26 days), a run
        of 5 white candles is a buy signal (a smaller rise range within the run
        = better). In addition: doubling of the price within one segment is
        often a top; a falling run of 5+ directly on the day of the top is a
        stronger warning than the same run after the first sell-off. In the
        volume on configurations Hosoda describes a catalogue of 30
        configurations and the &ldquo;high-risk phenomenon&rdquo;. The authors
        recommend combining them with Sakata&apos;s Five Rules (gap, cross,
        three crows, 8 and 10 new prices) and the equilibrium chart.
      </p>

      <H3>3.7 Hosoda&apos;s weekly chart</H3>
      <p>
        In the &ldquo;Weeks&rdquo; volume Hosoda uses weekly candles with the
        shapes B, Y and P (B — a breakout beyond the previous range, Y — a
        candle engulfing the previous one, P — a candle contained inside it),
        the average weekly price and &ldquo;nine-week candles&rdquo;. Entry
        happens on an &ldquo;overlap&rdquo; (a second B or Y after the first),
        one does not buy while black 9-week candles continue, and one buys
        around the 3rd–4th candle after the colour changes to white. The method
        is meant for selecting instruments and should always be compared with the
        broad market (in Hosoda: the Dow index).
      </p>

      <H3>3.8 Assessing which phase of the trend we are in</H3>
      <Table
        head={["Phase", "Criteria according to the sources"]}
        rows={[
          [
            "Uptrend",
            "Tenkan > Kijun; Kijun rising; price above Kijun and above the cloud; Chikou above price; successive higher highs and lows; range expansion in the third period; series of new closing highs.",
          ],
          [
            "Downtrend",
            "Tenkan < Kijun; Kijun falling; price below the cloud, rallies stall at its lower boundary (former support becomes resistance); Chikou below price.",
          ],
          [
            "Consolidation",
            "Price closes inside the cloud or between the lines, flat Kijun and SSB; a breakout from the cloud is a “big turning point”. In a wide sideways trend the weekly method does not apply.",
          ],
          [
            "Transition / reversal",
            "The stages from point 3.3, cloud twist, the day of change from time theory, a turn in Kijun. Hosoda: the equilibrium chart does not give a signal exactly at the top or bottom — this protects against “catching tops and bottoms”.",
          ],
        ]}
      />

      {/* 4 */}
      <H2>4. Step-by-step scenarios (from the books)</H2>
      <p>
        The examples below come from the books (Japanese quotes, 1965–1993,
        prices in JPY). The authors give no statistics — only selected
        examples. Some drawings are illegible in the translation, so a few
        numbers may be uncertain.
      </p>

      <div className="space-y-4">
        <Box title="Scenario 1 — Takeda (Hosoda, volume I): entering a buying period">
          <p>
            Bottom on 4 March: 291. After the turn with Tenkan above Kijun the
            closing price was 320 (day 25) and Kijun is rising — condition II is
            met. First target about 370 (a rise of 43 from the minimum 291 →
            334). Reality: on 14 April 374, correction only to 350. Further
            calculations: E from the top 374 with a range of 83 = 457, from the
            minimum 312 = 524. Then a maximum of 418 (9 May), and the passive E
            551 and maximum 584 were only realised after several months.
          </p>
          <p className="text-white/50">
            Lesson: entry signal = turn + rising Kijun; the targets are E/NT,
            and the pace is set by the time numbers (13th, 17th, 26th day).
          </p>
        </Box>

        <Box title="Scenario 2 — Matsumoto: E and V targets on successive waves">
          <p>
            Waves: 320 → 486 → 418 → 495 → 431. E = 486 + (486 − 320) = 652; E =
            495 + (495 − 418) = 572; V = 495 + (495 − 431) = 559. After the turn
            on 17 March 559, 572 and 652 were reached in turn; then the active
            709, 722, 810 and finally 834 (buying lasted until 848). The end: an
            engulfing formation with two black candles at the top and a decline
            of 158.
          </p>
        </Box>

        <Box title="Scenario 3 — Dow, April–June 1969: targets and the day of change">
          <p>
            Calculations from various formations: 1800, 1850, 1855 (indeed on 12
            February the close was 1859), later 1920, 1950, 2044 and 2050. The
            morning session calculated 2044, the close 2029; the author warned
            on air about a &ldquo;day of change on 9 June&rdquo;, after which a
            decline to 1866 (23 June) followed and a rebound to 1998 within two
            weeks.
          </p>
          <p className="text-white/50">
            Note: the market stopped near the calculated levels, but the author
            himself says that &ldquo;a calculated value does not necessarily have
            to reach the top&rdquo;.
          </p>
        </Box>

        <Box title="Scenario 4 — Dow of 21.09.1970: equivalent numbers">
          <p>
            From the bottom of 1929 (27 May): successive waves last 9, 9, 17, 18
            and 9 days. The rise from 2067 (26 July) to 2169 (5 August) plus the
            bottom of 12 August lasted 24 days, &ldquo;almost equal to the number
            26 — the third cycle&rdquo;. The author named the day of change 10.09
            in the newspaper; the top (2176) came on 9.09. Later he himself admits
            the day may have shifted to 21.09.
          </p>
        </Box>

        <Box title="Scenario 5 — Kaneka (1969–70): waves, head and shoulders, N versus Y">
          <p>
            Minimum 246, rise 282 → 305 → 361 → 398; bottom 301 (2 May) and
            281/303 (26 May); N = 432 &ldquo;was realised&rdquo;. Top 398:
            correction 388 → 365, rise to 398 (+33 in 5 days), a drop below 365 in
            12 days and 10 below it in 16 days — a complete Y wave. Top 433: an
            analogous Y. Values: V = 343, N = 318, V = 317, NT from 433 = 263. On 12
            November V = 343 was realised, on 29 September a segment (26 days)
            from 395 ended.
          </p>
        </Box>

        <Box title="Scenario 6 — Sasaki: a run of 5 candles after a decline (Japan Metals & Chemicals, 1992)">
          <p>
            Top 656 (2 July) → bottom 342 (12 August; a decline of more than a
            segment). After a doji on 13 August: 3 white, 1 black, 2 white = a run
            of 5 with an intervention of small range (80). A buy signal; before
            the first cycle (9 days) elapsed the price went to 851. A successful
            example. Counterexample: Toyo Suisan — a run of 6 candles on 30
            July &ldquo;too early&rdquo;, the price fell to 1230.
          </p>
        </Box>

        <Box title="Scenario 7 — Isuzu (1992): boundary lines and the day of change">
          <p>
            Bottom 226 (14 August), a run of 5 with an intervention, on 24 August
            a break of the boundary line 270 → buy signal; top 448 (3 September;
            price doubled in 15 days = a top according to the &ldquo;doubling in a
            segment&rdquo; rule). The decline: E = B − (A − B) = 252, bottom 245
            (12 November). The day of change: the 62nd day from the bottom 226 —
            12 November.
          </p>
        </Box>

        <Box title="Scenario 8 — Nikkei 225, weekly candles (1989–92)">
          <p>
            Top 29.12.1989 (38,915) → bottom 2.04.1990 (28,002) in 15 weeks.
            Expected return after about 15 weeks; on 7 June (10th week) 33,192.
            The next bottom: 1.10.1990 (20,221), i.e. 15 weeks after the
            intermediate bottom of 25.06.1990. Recurring intervals: 15, 16, 17,
            18, 22–25, 29, 33 and 34 weeks.
          </p>
          <p className="text-white/50">
            Note: with so many permitted intervals almost every turning point can
            be &ldquo;explained&rdquo; after the fact — see the test in point 7.
          </p>
        </Box>

        <Box title="Scenario 9 — multi-timeframe workflow">
          <p>
            According to practitioners: (1) the monthly/weekly chart sets the
            levels and the overriding direction, (2) the daily chart — the
            scenario (cloud, Kijun, N wave), (3) H4/H1 — the entry point (retest
            of Kijun after a breakout), (4) the stop behind the last local
            extreme or behind Kijun from the entry chart. Hosoda additionally
            always compares the instrument with the broad market.
          </p>
        </Box>
      </div>

      <H3>Position management rules in the sources</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>&ldquo;Do not hold losses&rdquo; while waiting for a day of change or wave theory.</li>
        <li>Do not average down; pyramiding only if planned from the start.</li>
        <li>Buy at the second important bottom, not the first.</li>
        <li>
          Beginners: trade only in almost ideal situations, so that after 4 days
          the profit covers the costs in both directions.
        </li>
        <li>
          Take profit at the calculated values (E/V/N/NT), after the price doubles
          within a segment, on warning candles (inverted hammer, gravestone doji,
          cross, gap) and after more than 10 new closing highs in a row.
        </li>
        <li>
          Stop-loss: Hosoda gives no explicit numerical rules (apart from
          &ldquo;do not hold losses&rdquo;); practitioners place it behind the last
          local extreme or on a close on the wrong side of Kijun.
        </li>
      </ul>

      {/* 5 */}
      <H2>5. Limitations and the authors&apos; warnings</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Hosoda claims the method allows &ldquo;over 90%&rdquo; of days of change
          to be read correctly, but without any data; he admits that there are
          &ldquo;many&rdquo; exceptions to the standard course and that the
          method takes 2–3 years of practice. Sasaki admits one missed example
          (Toyo Suisan).
        </li>
        <li>
          The definitions are subjective: &ldquo;small/large range&rdquo;,
          &ldquo;boundary line&rdquo;, &ldquo;day of change&rdquo;,
          &ldquo;medium-term wave movement&rdquo;, &ldquo;intermediate run&rdquo;
          have no numerical thresholds and are fitted after the fact.
        </li>
        <li>
          All the examples come from one market (Japan, 1960s–90s) and were
          chosen retrospectively (selection bias).
        </li>
        <li>
          The author: time numbers work best in an uptrend; the weekly chart
          makes sense for large trend changes, not for a wide sideways trend.
        </li>
        <li>
          Hosoda warns against relying on published signals — the widespread use
          of the method itself limits its effectiveness.
        </li>
      </ul>

      {/* 6 */}
      <H2>6. How this relates to the trend assessment on this page</H2>
      <p>
        The &ldquo;Trend assessment&rdquo; panel below the chart adds up five
        signals (each +1, −1 or 0). A sum ≥ +2 is BULLISH, ≤ −2 BEARISH, the
        rest NEUTRAL.
      </p>
      <Table
        head={["Signal on the page", "Counterpart in the sources", "Agreement"]}
        rows={[
          [
            "Price vs cloud (shifted by 26)",
            "The three functions of the cloud (Sasaki), san’yaku, stages 4–5",
            <span key="1" className="text-emerald-300">Consistent with the classics</span>,
          ],
          [
            "Tenkan vs Kijun",
            "A positive turn / crossover (Hosoda vol. I; Sasaki lecture 48)",
            <span key="2" className="text-emerald-300">Consistent; lacks the “Kijun not falling” and “new prices” conditions</span>,
          ],
          [
            "Chikou (close vs close 26 periods ago)",
            "The lagging span (Hosoda: “the best of the spans”; Sasaki: a rising signal when it crosses price)",
            <span key="3" className="text-amber-300">Consistent in meaning; no rule relative to the cloud</span>,
          ],
          [
            "Momentum over about 76 candles (±1%)",
            "Not in the sources (76 is a time number, but not as a price-change threshold)",
            <span key="4" className="text-fall">Our own addition</span>,
          ],
          [
            "Cloud colour in a window of 17 candles ahead",
            "The cloud twist (Sasaki) as a change of trend; colour by itself is not a signal",
            <span key="5" className="text-amber-300">Loosely related</span>,
          ],
          [
            "Sum of signals, threshold ±2",
            "None — the sources tell you to synthesise “conditions”, but without scoring",
            <span key="6" className="text-fall">Our own synthesis</span>,
          ],
        ]}
      />
      <H3>What our implementation lacks compared with the sources</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Time theory</strong> (the numbers 9/17/26/33/42/65/76, the day
          of change, equivalent numbers) — omitted entirely.
        </li>
        <li>
          <strong>The direction of Kijun</strong> (&ldquo;is practically the price
          trend&rdquo;) — is not a separate signal.
        </li>
        <li>
          Recognising <strong>consolidation</strong> (flat Kijun/SSB, price in the
          cloud) — missing; we only assess bull/bear/neutral.
        </li>
        <li>
          <strong>Kijun retest, the current-SSB pattern, candle
          configurations, multi-timeframe analysis</strong> — missing.
        </li>
        <li>
          Context: assessment relative to the broad market (Hosoda&apos;s Dow) —
          missing.
        </li>
      </ul>
      <Box tone="good" title="Wave targets consistent with the sources">
        <p>
          For points A → B → C the code calculates exactly Hosoda&apos;s formulas:
          E = B + (B − A), V = B + (B − C), N = C + (B − A), NT = C + (C − A). The
          formulas work the same way in a downtrend (the signs follow from the
          prices).
        </p>
      </Box>

      <H3>Wave targets — how the tool on this page works</H3>
      <p>
        A zigzag on closing prices marks a new turning point when price reverses
        by at least the &ldquo;wave sensitivity&rdquo; (%, the slider above the
        chart). From the last three turning points A → B → C four targets are
        calculated (E, V, N, NT — formulas from point 2.3). These are arithmetic
        projections from a heuristic wave detector, not forecasts.
      </p>

      {/* 7 */}
      <H2>7. Backtest: 3 years (and 15 years as a control)</H2>
      <Box title="Method" tone="info">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Data: daily, adjusted prices of 504 current S&amp;P 500 stocks
            (High/Low/Close). Main period: 19.09.2023–18.09.2026; control:
            19.09.2011–18.09.2026 and five 3-year subperiods.
          </li>
          <li>
            The trend assessment from this page was reproduced in vectorised form
            and verified against the backend (36 samples, 0 discrepancies). The
            signal is known at the close of day t, the return is measured from t
            (measuring information), and in the strategy simulations with a
            1-session delay and a cost of 5 bp per side.
          </li>
          <li>
            Horizons: 5, 10, 21 and 63 sessions. Excess = the stock&apos;s return
            minus the average of all stocks on the same day. Significance: the
            Newey-West t-stat on the daily series (correlation of observations
            over time). A value of |t| &gt; 2 is treated as significant.
          </li>
          <li>
            <strong>Important limitation</strong>: these are current S&amp;P 500
            members (survivorship bias) — it inflates the levels of returns, but
            not the comparisons between states. The tests cover only daily charts
            and US stocks, while the sources mainly describe the Japanese and FX
            markets with discretionary judgement.
          </li>
        </ul>
      </Box>

      <H3>7.1 Does the &ldquo;bullish / neutral / bearish&rdquo; assessment predict direction?</H3>
      <Table
        head={["State (3 years)", "Share of time", "Avg. 21-session return", "Avg. volatility of the next 21 sessions"]}
        rows={[
          [<span key="a" className="text-rise">BULLISH (≥ +2)</span>, "approx. 47–51%", "+1.55%", "28.6%"],
          ["NEUTRAL", "approx. 24%", "+1.96%", "30.7%"],
          [<span key="b" className="text-fall">BEARISH (≤ −2)</span>, "approx. 26–29%", "+2.13%", "32.9%"],
          ["All", "100%", "+1.81%", "—"],
        ]}
        caption="Excess over the market average in each state ≈ 0. 15 years: volatility 25.0% / 28.4% / 32.3%."
      />
      <Table
        head={["Measure (bulls minus bears)", "3 years", "15 years"]}
        rows={[
          ["Difference in 21-session returns (t)", "+0.17% (t = 0.36)", "−0.28% (t = −1.53)"],
          ["Difference in 63-session returns (t)", "−0.24% (t = −0.19)", "−0.68% (t = −1.69)"],
          ["Rank correlation (IC) with the 21-session outcome", "−0.006", "−0.0155"],
          ["Rank correlation (IC) with the 63-session outcome", "−0.028", "—"],
        ]}
      />
      <p>
        Conclusion: the assessment state <strong>does not predict direction</strong>{" "}
        — &ldquo;bearish&rdquo; stocks rose on average just as much as
        &ldquo;bulls&rdquo; in the following weeks (a rebound effect), and over 15
        years even slightly better. The assessment does, however,{" "}
        <strong>measure the risk regime</strong>: a bearish state means clearly
        higher volatility. In addition the state is unstable: the average length of
        a run in the same state is about 9.7 days (median 3 days).
      </p>

      <H3>7.2 Individual rules from the books (excess return in the direction of the signal, 21 sessions)</H3>
      <Table
        head={["Rule", "3 years: excess (t)", "15 years: excess (t)"]}
        rows={[
          ["San’yaku kouten (price>cloud, TS>KS, Chikou>price) — long", "+0.18% (−0.1)", "−0.10% (−1.4)"],
          ["Stable-rise phase: price>TS>KS>cloud — long", "+0.17% (−0.3)", "−0.10% (−1.9)"],
          ["Kijun retest after an upward breakout — long", "−0.20% (−1.9)", "−0.03% (−0.5)"],
          ["Price breakout above Kijun alone — long", "−0.18% (−1.9)", "−0.02% (−0.4)"],
          ["Sjack pattern (current SSB) upward — long", "−0.00% (−1.6)", "+0.04% (0.3)"],
          ["Break of the current SSB upward alone — long", "−0.30% (−3.0)", "−0.02% (−0.2)"],
          ["TS/KS golden cross (day of the cross) — long", "−0.21% (−1.3)", "−0.03% (−0.1)"],
          ["“True” golden cross (after 3 sessions) — long", "−0.00% (−0.2)", "−0.03% (−1.1)"],
          ["“False” golden cross — long", "−0.03% (0.2)", "+0.07% (1.4)"],
          ["Cloud twist to green — long", "−0.13% (−0.7)", "−0.21% (−2.4)"],
          ["Chikou above the price from 26 sessions ago — long", "+0.09% (−0.1)", "−0.07% (−1.1)"],
          ["Price>KS and KS rising (5 sessions) — long", "+0.24% (0.3)", "−0.08% (−1.6)"],
        ]}
        caption="The long versions are shown; the full test covered about 40 rules, including short counterparts (bearish signals). Practically all excesses ≈ 0 and |t| < 2; individual results with |t| > 2 in one period (e.g. a break of the current SSB downward, 3 years) do not repeat in the other, which with so many tests is expected from chance alone. The hit rate generally did not exceed the baseline (about 57% positive 21-session returns — market drift). Distinguishing false from true TK crosses, which Sobótka considers important, makes no difference."
      />

      <H3>7.3 Wave targets (E, V, N, NT) — does price reach them?</H3>
      <p>
        For every third zigzag point (5% threshold) the targets were calculated
        from Hosoda&apos;s formulas and from this page&apos;s formulas, and it was
        checked whether price (High/Low) reached the target within 21 or 63
        sessions. The raw hit rate can be high (N has a median distance of
        3–4.5%), but it has to be compared with the expected one: for the whole
        universe at the same distance expressed in standard deviations.
      </p>
      <Table
        head={["Target", "3 years: hit / expected (21 s.)", "15 years: hit / expected (21 s.)", "Difference (15 years, 63 s.)"]}
        rows={[
          ["Hosoda's E = B+(B−A)", "16.3% / 17.3%", "16.0% / 16.8%", "−1.6 pp"],
          ["Hosoda's V = B+(B−C)", "23.0% / 23.1%", "21.9% / 22.3%", "−1.2 pp"],
          ["N = C+(B−A)", "57.2% / 57.4%", "56.7% / 56.9%", "−0.8 pp"],
          ["Hosoda's NT = C+(C−A)", "41.2% / 41.5%", "40.6% / 41.0%", "−0.9 pp"],
          ["V of the page's old version = C−(B−A)", "11.6% / 12.5%", "11.1% / 12.0%", "−1.1 pp"],
          ["E of the page's old version = C+(C−B)", "11.6% / 12.3%", "11.1% / 11.9%", "−1.2 pp"],
        ]}
        caption="n ≈ 22 thousand events (3 years) and ≈ 100 thousand (15 years) per target. After adjusting for volatility all formulas are reached as often as the distance alone implies — no edge."
      />
      <p>
        Conclusion: wave targets are simply levels at a certain distance from
        price, reached with a probability determined by volatility. It has not
        been shown that Hosoda&apos;s formulas are better than a random level at
        the same distance. The formulas of this page&apos;s old version (V, E —
        different from Hosoda&apos;s, hence shown separately in the table) did
        neither worse nor better. The code now uses Hosoda&apos;s formulas.
      </p>

      <H3>7.4 Time theory — do turns fall on the numbers 9/17/26/33/42/51/65/76?</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Durations of the segments between successive zigzag points (5%) over
          15 years (about 30 thousand segments): the ratio of the number of
          segments in a ±1 window around the basic numbers to neighbouring lengths
          = 0.95 (for a randomly shuffled series 1.015). At 65 (0.85) and 76 (0.69)
          — fewer than usual. In the 3-year period 1.01 vs 1.00.
        </li>
        <li>
          Equal lengths of successive waves (AB = CD, difference ≤ 1 day) occur in
          13.1% of triples vs 11.05% for a random walk — a weak effect (about ×1.2
          over neighbouring lengths), affecting &lt; 1% of triples. The relations
          AB = BD and AC = CD (×0.93–0.95) — no effect.
        </li>
      </ul>
      <p>
        Conclusion: there is no evidence that the time numbers from the books play
        a special role. The only (small) trace is a similar length of successive
        waves.
      </p>

      <H3>7.5 Consolidation — do flat lines and price in the cloud foreshadow calm?</H3>
      <Table
        head={["Condition (3 years)", "Share of time", "Volatility of the next 21 sessions", "Move efficiency ratio"]}
        rows={[
          ["All observations", "100%", "30.4%", "0.238"],
          ["Kijun and SSB flat (5 sessions)", "7.9%", "30.8%", "0.238"],
          ["Price inside the cloud", "12.8%", "30.9%", "0.237"],
          ["Thin cloud (< 1% of price)", "16.4%", "26.8%", "0.237"],
        ]}
        caption="Flat lines and price in the cloud do not reduce the range or volatility; only a thin cloud foreshadows lower volatility (the volatility clustering effect)."
      />

      <H3>7.6 The weekly variant of the trend assessment</H3>
      <Table
        head={["Horizon (spread bulls − bears)", "3 years (t)", "15 years (t)"]}
        rows={[
          ["4 weeks", "+0.34% (0.80)", "−0.18% (−0.80)"],
          ["13 weeks", "+1.85% (1.95)", "−0.48% (−0.84)"],
          ["26 weeks", "+5.06% (4.07)", "−0.65% (−0.56)"],
        ]}
      />
      <p>
        Over the last 3 years the weekly version gives significant results (a
        period of strong momentum), but it is not confirmed over 15 years — the
        effect depends on the market regime, not on a constant edge of the method.
      </p>

      <H3>7.7 Strategy simulation (1-session delay, cost 5 bp per side)</H3>
      <p>An equal-weight portfolio of 504 stocks, daily rebalancing:</p>
      <Table
        head={["Strategy", "3 years: annual return / Sharpe", "15 years: annual return / Sharpe"]}
        rows={[
          ["Buy everything (benchmark)", "+20.3% / 1.35", "+18.7% / 1.07"],
          ["Long only bullish states", "+15.3% / 1.15", "—"],
          ["Long everything except bearish", "+17.4% / 1.30", "—"],
          ["Long bulls, short bears", "−5.8% / −0.34", "−12.3% / −0.88 (max. drawdown −86.8%)"],
          ["Long: san’yaku kouten", "+13.7% / 1.03", "—"],
        ]}
        caption="The strategy of shorting bears loses because stocks in a bearish state rebound and the stock market has a positive drift."
      />
      <p>
        A test at the <strong>index</strong> level (an equal-weighted index of 504
        stocks, approximated high/low), where the trend assessment serves as an
        exposure filter:
      </p>
      <Table
        head={["Strategy", "3 years: return / Sharpe / max. drawdown", "15 years: return / Sharpe / max. drawdown"]}
        rows={[
          ["Buy and hold", "+20.3% / 1.35 / —", "+18.7% / 1.07 / −38.4%"],
          ["Long when not bearish", "+17.6% / 1.51 / −10.1%", "+14.6% / 1.11 / −19.1%"],
          ["Long when bullish", "+12.5% / 1.27 / −7.8% (exposure 0.73)", "+6.9% / 0.69 / —"],
          ["Long/short", "+9.0% / 0.71 / —", "+1.7% / 0.19 / —"],
        ]}
      />
      <p>
        The filter &ldquo;stay out of the market when the index is bearish&rdquo;
        lowers the maximum drawdown (15 years: from −38% to −19%) and slightly
        improves the Sharpe ratio, at the cost of a lower return. The trend
        assessment therefore works as a <strong>risk filter</strong>, not as a tool
        for increasing return.
      </p>

      {/* 8 */}
      <H2>8. Assessment of the methodology</H2>
      <Box tone="good" title="What works">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The trend state (cloud, TK, Chikou, momentum) separates volatility
            regimes well — it is a sensible risk indicator and exposure filter
            (smaller drawdowns).
          </li>
          <li>
            The chart is a clear, coherent visualisation of context (trend,
            support/resistance, momentum) and helps with position management
            (Kijun as a trailing stop).
          </li>
          <li>A thin cloud foreshadows lower volatility; a weak trace of similar lengths of successive waves.</li>
        </ul>
      </Box>
      <Box tone="warn" title="What was not confirmed">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Prediction of price direction (bullish/bearish, san’yaku, Kijun
            retest, the SSB pattern, TK crosses, cloud twist) — zero edge over 3
            and 15 years on S&amp;P 500 stocks.
          </li>
          <li>An edge of the E/V/N/NT wave targets over a random level at the same distance.</li>
          <li>
            The alleged &ldquo;special role&rdquo; of the time numbers and the
            &ldquo;day of change&rdquo; (no enrichment at 9/17/26/33/42/65/76).
          </li>
          <li>A reduction of volatility and movement in consolidation (flat Kijun/SSB, price in the cloud).</li>
        </ul>
      </Box>
      <p>
        One must remember what the backtest does not check: the sources are
        discretionary — they combine many elements judged &ldquo;by eye&rdquo;, in
        several stages (month → day → H1) and mainly on the Japanese and FX
        markets. Mechanical rules on daily US stocks are only one fair way of
        testing; they do not prove that the method does not work in the hands of
        an experienced practitioner, but they also find no evidence that it does.
        The authors themselves present no statistics.
      </p>
      <p>
        Recommendation: treat the trend assessment on this page as a description
        of the regime and risk level (not as a buy/sell signal), and the wave
        targets as reference levels. Possible further improvements: add the
        direction of Kijun and consolidation detection as separate indicators.
      </p>
    </section>
  );
}
