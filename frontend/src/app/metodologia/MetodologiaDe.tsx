import { Box, DocTable, H2, H3, Strong } from "@/components/DocBlocks";

export function MetodologiaDe() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Methodik</h1>
      <p className="mt-1 text-sm text-white/50">
        Was wir getestet haben, was am besten abgeschnitten hat (Ichimoku + Kijun 52 + Analystenprognosen + MA200 + Aufstockung),
        wie sich das auf eine höhere Trefferquote optimieren lässt und wie man im Backtest aus 1.000 USD fast 5.000 USD macht.
        Stand: September 2026.
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <Box tone="warn" title="Wichtiger Hinweis">
          <p>
            Dies sind Ergebnisse von <Strong>Backtests</Strong> (Simulationen auf historischen Daten), keine Prognosen und keine
            Anlageberatung. Alle Zahlen beziehen sich auf einen einzigen Zeitraum (20.09.2021–18.09.2026), auf aktuelle
            S&amp;P-500-Mitglieder und auf Varianten, die nach Sichtung der Ergebnisse aus mehreren Hundert getesteten ausgewählt
            wurden; sie sind daher durch Auswahl- und Survivorship-Verzerrung belastet. Die Methode wurde außerhalb der Stichprobe
            nicht bestätigt. Betrachten Sie sie als Hypothese, die weiter überprüft werden muss.{" "}
            <Strong>Abschnitt 10 am Ende der Seite enthält einen späteren Kontrolltest, der die Schlussfolgerungen der Abschnitte 1–9 abschwächt</Strong>{" "}
            (außerhalb der Stichprobe, mit der Indexzusammensetzung des jeweiligen Tages, an der Nasdaq und im Russell 2000).
          </p>
        </Box>

        <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
          <p className="mb-1 font-semibold text-white/80">Inhalt</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Zusammenfassung</li>
            <li>Wie wir getestet haben (Daten, Zeitraum, Simulator)</li>
            <li>Die beste Methodik: Ichimoku + Kijun 52 + Analysten + MA200 + Aufstockung</li>
            <li>Backtest-Ergebnisse dieser Methodik</li>
            <li>Was wir sonst noch getestet haben (Testhistorie)</li>
            <li>Vergleich mit anderen Methoden (Bollinger, Fibonacci, MACD, RSI und weitere)</li>
            <li>Optimierung auf eine höhere Trefferquote (bis 46 % und über 50 % gewinnbringende Positionen)</li>
            <li>Wie man aus 1.000 USD fast 5.000 USD macht: Schritt für Schritt</li>
            <li>Grenzen und was noch zu prüfen ist</li>
            <li>Kontrolltest (21.09.2026): außerhalb der Stichprobe, Nasdaq und Russell 2000, Drawdown-Limit 10 %, 10.000 USD</li>
            <li>Zusatztest (22.09.2026): NYSE, Robustheit der Aufstockung am S&amp;P 500, Test der Indizes selbst</li>
            <li>Aktualisierte Vorgehensweise: alle Indikatoren Schritt für Schritt anwenden (Einstieg, Stopp, Ausstieg)</li>
          </ol>
        </nav>

        {/* 1 */}
        <H2>1. Zusammenfassung</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Die beste gefundene Methode ist eine Kombination aus: <Strong>Analystenprognose ≥ 20 % Aufwärtspotenzial</Strong> +{" "}
            <Strong>Kurs über der MA200</Strong> + Einstieg, wenn der Kurs die <Strong>52-Perioden-Kijun-sen</Strong> nach oben
            durchbricht + <Strong>Aufstockung um 5 % des Kapitals</Strong>, wenn der Kurs über der Ichimoku-Wolke liegt und die
            Fünf-Linien-Bewertung bullisch ist, Ausstieg nach einem Schlusskurs unter der Kijun-sen 52. Am S&amp;P 500 (483 Aktien,
            5 Jahre, 1.000 USD) ergab das im Schnitt <Strong>2.694–3.374 USD</Strong> gegenüber 1.851 USD beim Kauf des gesamten
            Marktes, bei gleichem Drawdown (−19 %) und höherer Sharpe-Ratio (1,2 gegenüber 0,83). Nur etwa 25 % der Trades waren
            profitabel.
          </li>
          <li>
            Ichimoku allein (ohne Analysten und MA200) <Strong>schlug den Markt nicht</Strong>. Den größten Teil des Vorteils
            liefern der Analystenfilter + MA200 und die Aufstockung, nicht die Ichimoku-Linie selbst.
          </li>
          <li>
            Die Trefferquote lässt sich von ca. 24 % auf <Strong>ca. 46 %</Strong> steigern, fast ohne Kapitalverlust
            (Ausbruchsbestätigung über 5 Sitzungen + Ausstieg beim Kreuzen der Tenkan unter die Kijun), und auf{" "}
            <Strong>ca. 51 %</Strong> auf Kosten eines Teils des Gewinns (zusätzlich Verkauf der Hälfte der Position bei +8 %):
            1.968–2.448 USD.
          </li>
          <li>
            Das höchste Kapital lieferte die Version mit Ausbruchsbestätigung über 5 Sitzungen und Ausstieg unter der Kijun 52 (ohne
            Gewinnmitnahme), Basisposition 5 %: <Strong>4.819 USD</Strong> (Spanne 4.567–5.099 USD in 6 Ziehungen), Drawdown −21 %,
            Sharpe 1,72, Trefferquote 35 %. Das sind die in Abschnitt 8 beschriebenen &bdquo;fast 5.000 USD&ldquo;.
          </li>
        </ul>

        {/* 2 */}
        <H2>2. Wie wir getestet haben</H2>
        <DocTable
          head={["Element", "Einstellung im Backtest"]}
          rows={[
            ["Testzeitraum", "20.09.2021–18.09.2026 (ca. 5 Jahre, 1.255 Sitzungen). Indikatoren ab 2019 berechnet (Einlaufphase)."],
            ["Aktien", "483 aktuelle S&P-500-Aktien (für sie liegen historische Analystenprognosen vor). Frühere Tests: 295 Aktien von Nasdaq/Russell 2000, 881 und 1.214 Aktien (ohne Analysten)."],
            ["Kursdaten", "Yahoo Finance, tägliche OHLC-Daten, bereinigt um Splits und Dividenden."],
            ["Startkapital", "1.000 USD, ohne Hebel, Bargeld wird nicht verzinst."],
            ["Positionsgröße", "Basisposition = 1 %, 2 %, 5 %, 10 % oder 20 % des aktuellen Kapitals je Aktie (Kapital laufend berechnet); Aufstockung +5 % des Kapitals, einmal je Position. Bruchstücke von Aktien."],
            ["Ausführung", "Signal zum Schluss der Sitzung t, Kauf zum Eröffnungskurs der Sitzung t+1. Ausstieg bei Signal: Verkauf zur Eröffnung der nächsten Sitzung."],
            ["Kosten", "5 Basispunkte (0,05 %) je Seite eines Trades."],
            ["Signalüberschuss", "Gibt es mehr Signale als Bargeld, werden die Aktien zufällig ausgewählt. Das Ergebnis geben wir als Mittelwert aus 6–10 Ziehungen der Reihenfolge an (und die Spanne Min–Max)."],
            ["Benchmark", "Kaufen und halten aller 483 Aktien mit gleichen Gewichten: 1.851 USD, Drawdown −19,4 %, Sharpe 0,83."],
            ["Kennzahlen", "Endkapital, maximaler Drawdown (aus Tagesschlusskursen), Sharpe, Anzahl und Trefferquote der Trades, durchschnittlicher Gewinn und Verlust, Profitfaktor (PF)."],
          ]}
        />
        <H3>Wie die Analystenprognosen nachgebildet wurden (ohne in die Zukunft zu schauen)</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Quelle: eine Historie von 155 Tsd. Änderungen von Empfehlungen und Kurszielen (2011–2026) für den S&amp;P 500 von Yahoo Finance.
          </li>
          <li>
            Der Konsens eines Tages = Median des jeweils letzten Ziels jedes Hauses aus den letzten 180 Tagen, bei mindestens 3
            Häusern. Verwendet werden ausschließlich bis zu diesem Tag veröffentlichte Ziele.
          </li>
          <li>
            Die Ziele sind nominal zum Veröffentlichungstag, daher wurden sie um spätere Splits bereinigt (z. B. Amazon 3.500 USD
            kurz vor dem 20:1-Split). 5.037 von 127 Tsd. Zielen (Ziel über dem 4-Fachen oder unter dem 0,25-Fachen des Kurses)
            wurden als Artefakte verworfen.
          </li>
          <li>Aufwärtspotenzial = Konsens / Schlusskurs − 1. Bedingung: mindestens 20 %.</li>
        </ul>
        <H3>Wie die Ichimoku-Elemente berechnet werden</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Kijun-sen 52</Strong> = Mitte der Spanne (höchstes High + niedrigstes Low) der letzten 52 Tageskerzen.
            Einstiegssignal: Schlusskurs über der Kijun 52, wenn der Schlusskurs der Vorsitzung auf oder unter ihr lag.
          </li>
          <li>
            <Strong>Wolke</Strong>: Senkou A = (Tenkan 9 + Kijun 26) / 2, Senkou B = Mitte der Spanne aus 52 Kerzen, beide um 26
            Kerzen nach vorn verschoben. &bdquo;Kurs über der Wolke&ldquo; = Schlusskurs über der höheren der beiden Grenzen.
          </li>
          <li>
            <Strong>Fünf-Linien-Bewertung</Strong> = exakt dieselbe Funktion wie im Ranking auf der Seite (Kurs vs. Wolke, Tenkan vs.
            Kijun, Schlusskurs vs. Schlusskurs von vor 26 Kerzen, Kursänderung über 76 Kerzen &gt; ±1 %, Wolkenfarbe in den nächsten
            17 Kerzen). Eine Summe ≥ +2 ist eine bullische Bewertung. Mit dem Backend abgeglichen (0 Abweichungen bei 36 Stichproben).
          </li>
          <li>
            <Strong>MA200</Strong> = einfacher Durchschnitt von 200 Tagesschlusskursen.
          </li>
        </ul>

        {/* 3 */}
        <H2>3. Die beste Methodik: Ichimoku + Kijun 52 + Analysten + MA200 + Aufstockung</H2>
        <p>Die Regeln in der Reihenfolge, in der sie in der Simulation wirken (Basisversion):</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Einstiegsfilter</Strong> (alle Bedingungen gleichzeitig): Analystenprognose ≥ 20 % Aufwärtspotenzial{" "}
            <em>und</em> Schlusskurs über der MA200 (langfristiger Aufwärtstrend).
          </li>
          <li>
            <Strong>Einstiegssignal</Strong>: Der Kurs schließt über der Kijun-sen 52 (Durchbruch nach oben von einem Niveau auf oder
            unter ihr).
          </li>
          <li>
            <Strong>Kauf</Strong>: zum Eröffnungskurs der nächsten Sitzung, Basisposition (z. B. 1–5 % des Kapitals). Kein
            Nachlegen zur Position außer in Punkt 4.
          </li>
          <li>
            <Strong>Aufstockung</Strong>: einmalig +5 % des Kapitals auf die offene Position, wenn der Kurs über der
            Ichimoku-Wolke liegt <em>und</em> die Fünf-Linien-Bewertung bullisch ist (≥ +2). Erhöht die Exposition gegenüber Aktien
            in bestätigtem Trend.
          </li>
          <li>
            <Strong>Ausstieg</Strong>: Ein Schlusskurs unter der Kijun-sen 52 schließt die gesamte Position zur Eröffnung der
            nächsten Sitzung. Es gibt keinen separaten Kurs-Stop-Loss.
          </li>
          <li>
            Ein erneuter Einstieg in dieselbe Aktie ist nach einem neuen Signal möglich (dieselben Bedingungen von vorn). Über die
            Aufstockung hinaus wird nicht nachgelegt.
          </li>
        </ol>

        {/* 4 */}
        <H2>4. Backtest-Ergebnisse dieser Methodik</H2>
        <p>
          Mittelwert aus 10 Ziehungen der Reihenfolge der Aktienauswahl, 483 S&amp;P-500-Aktien, 20.09.2021–18.09.2026, 1.000 USD.
          Markt (Kaufen und halten): 1.851 USD, Drawdown −19,4 %, Sharpe 0,83.
        </p>
        <DocTable
          head={["Basisposition (+5 % Aufstockung)", "Endkapital (Mittelwert, Spanne)", "Max. Drawdown", "Sharpe", "Trades", "Treffer"]}
          rows={[
            ["1 %", "2.694 USD (2.584–2.816)", "−19 %", "1,22", "962", "24 %"],
            ["2 %", "2.725 USD (2.599–2.896)", "−21 %", "1,18", "878", "25 %"],
            ["5 %", "2.905 USD (2.628–3.240)", "−22 %", "1,14", "594", "25 %"],
            ["10 %", "2.887 USD (2.098–4.216)", "−26 %", "1,07", "397", "28 %"],
            ["20 %", "3.374 USD (2.847–3.841)", "−29 %", "1,10", "221", "30 %"],
          ]}
          caption="Version ohne Aufstockung: 1.290 (Drawdown −5 %), 1.638 (−9 %), 2.141 (−21 %), 2.688 (−26 %), 2.648 USD (−29 %) für Positionen von 1–20 %."
        />
        <H3>Woher das Ergebnis kommt: Elemente nacheinander hinzufügen</H3>
        <DocTable
          head={["Konfiguration (S&P 500, Position 1 % / 2 %)", "Endkapital"]}
          rows={[
            ["Ichimoku allein: Kijun-52-Durchbruch + Aufstockung + Ausstieg unter der Kijun 52", "1.333 / 1.381 USD (unter dem Markt)"],
            ["+ Analystenprognose ≥ 20 %", "1.940 / 1.680 USD"],
            ["+ Analysten + Kurs > MA100 + Aufstockung", "2.380 / 2.333 USD"],
            ["+ Analysten + Kurs > MA200 + Aufstockung (Basismethode)", "2.694 / 2.725 USD"],
            ["Ohne Analysten, mit MA200 + Aufstockung", "1.577 / 1.435 USD"],
          ]}
          caption="Das wichtigste Element ist der Analystenfilter; MA200 und Aufstockung verbessern das Ergebnis weiter."
        />
        <H3>Stabilität im Zeitverlauf</H3>
        <p>
          Teilt man den Zeitraum in Hälften (Basisposition 1 %): In der ersten Hälfte (09.2021–03.2024) Kapital ×1,47 gegenüber ×1,28
          beim Markt, in der zweiten (03.2024–09.2026) ×1,83 gegenüber ×1,45. Der Vorteil besteht in beiden Hälften, ist aber
          weiterhin nur eine Stichprobe.
        </p>
        <Box tone="warn" title="Ein ehrlicher Hinweis: Kijun 52 gegen die gewöhnliche Kijun 26">
          <p>
            In der vollständigen Kombination (Analysten + MA200 + Aufstockung) schnitt die gewöhnliche Kijun 26 mindestens so gut ab
            wie die 52: 2.664 / 2.870 / 3.306 / 4.014 / 6.115 USD für Positionen von 1–20 % (Drawdown −13 % bis −28 %, Sharpe
            1,4–1,6, bei 20 % große Streuung von 4.908–7.051 USD). Den Vorteil der Kijun 52 sieht man erst in schwächeren
            Konfigurationen (ohne Analysten und MA200). Die Angabe &bdquo;Kijun 52&ldquo; in der Methodik beruht auf der Annahme der
            Untersuchung und nicht auf ihrem eindeutigen Ergebnis.
          </p>
        </Box>
        <H3>Einfluss der Positionsgröße</H3>
        <p>
          Eine größere Basisposition erhöht das durchschnittliche Ergebnis nur mäßig (2.694 → 3.374 USD von 1 % auf 20 %), aber der
          Drawdown wächst von −19 % auf −29 % (bis −33 % in der schlechtesten Ziehung), die Sharpe-Ratio sinkt, und die Streuung
          der Ergebnisse wächst um ein Vielfaches. Sinnvoller sind kleine Positionen mit Aufstockung bei bestätigtem Trend.
        </p>

        {/* 5 */}
        <H2>5. Was wir sonst noch getestet haben (Testhistorie)</H2>
        <DocTable
          head={["Test", "Stichprobe und Zeitraum", "Ergebnis"]}
          rows={[
            ["Trendbewertung der Seite (5 Signale, bullisch/bärisch)", "504 S&P-500-Aktien, 3 Jahre und 15 Jahre", "Sagt die Kursrichtung nicht voraus; sagt die Volatilität voraus (bärisch: 15–30 % höher). Nützlich als Risikofilter (Index-Drawdown −19 % statt −38 %)."],
            ["Regeln aus den Ichimoku-Büchern (San'yaku, Kijun-Ausbruch und -Retest, SSB-Muster, TK-Kreuze, Wolkendrehung, Kerzenkonfigurationen)", "504 Aktien, 3 und 15 Jahre", "Kein Vorteil gegenüber dem Zufall (Überrenditen ≈ 0, |t| < 2)."],
            ["Wellenziele (E, V, N, NT), Zeittheorie (Zahlen 9/17/26/33/42/65/76), Konsolidierung", "504 Aktien, 3 und 15 Jahre", "Kein Vorteil nach Bereinigung um die Volatilität; keine Anreicherung bei den Zeitzahlen; flache Linien verringern die Volatilität nicht."],
            ["Phasen des Kitchin-Zyklus als Filter", "295 Aktien von Nasdaq/Russell 2000, 5 Jahre", "Funktioniert nicht als Kaufsignal (die Phasen wechseln etwa alle 6 Tage)."],
            ["System mit 1.000 USD: Einstieg bei San'yaku, Ausstieg unter der Kijun / Tenkan unter der Kijun, Stopp unter der Wolke", "295 Aktien, 5 Jahre", "1.105–1.400 USD gegenüber 1.749 USD beim Markt; klassisches Profil (34–40 % Treffer)."],
            ["RSI-≤-30-Filter und die Prognose der Seite", "295 Aktien, 5 Jahre", "RSI ≤ 30 schließt sich mit einem Einstieg über der Wolke aus (0 Trades); Prognose ≥ 60 % bringt nichts."],
            ["Wochen-Kijun 26 gegen 52 Wochen", "881 Aktien, 5 Jahre", "52 Wochen besser (1.703 gegenüber 1.497 USD), aber beide unter dem Markt (1.769 USD)."],
            ["Filter für Analystenprognosen 20 % / 25 % / 30 % / 40 % / 50 %", "483 S&P-500-Aktien, 5 Jahre", "≥ 20 %: 1.921–2.112 USD (Markt 1.859 USD); höhere Schwellen lassen zu wenige Gelegenheiten (≥ 30 %: 1.378–1.394 USD)."],
            ["Massentests: 6.300 Varianten (Einstiege, Ausstiege, RSI, feste Zeiten, Positionsgrößen, Notbremse nach −8 %) mit Drawdown-Limit 10 %", "1.214 Aktien, 5 Jahre", "Keine Variante mit Drawdown ≤ 10 % schlug den Markt; die besten 1.346–1.418 USD ≈ Markt mit einem Teil in Bargeld."],
            ["Abschlusstest: Analysten + Kijun 52 + MA100/MA200 + Aufstockung; Positionen 1–20 %", "483 Aktien, 5 Jahre", "Bestes Ergebnis: 2.694–3.374 USD (Abschnitt 4)."],
            ["Methoden mit hoher Trefferquote (RSI2, IBS, RSI14, Ziel +1–3 %)", "1.214 Aktien, 5 Jahre", "Trefferquote bis 84 %, aber Erwartungswert ≈ 0 (durchschnittlicher Verlust 4–6-mal größer als der Gewinn)."],
            ["Andere Methodiken (Bollinger, Fibonacci, MACD, Stochastic, Donchian, MA)", "483 Aktien, 5 Jahre", "Abschnitt 6."],
            ["Optimierung auf die Trefferquote (ca. 300 Varianten)", "483 Aktien, 5 Jahre", "Abschnitt 7."],
          ]}
        />

        {/* 6 */}
        <H2>6. Vergleich mit anderen Methoden</H2>
        <p>
          Derselbe Simulator und dieselben Ausführungsregeln. Endkapital aus 1.000 USD bei einer Position von 2 % / 5 %,
          Trefferquote bei einer Position von 2 %. &bdquo;Filter&ldquo; = Analysten ≥ 20 % + Kurs &gt; MA200. Markt: 1.851 USD.
        </p>
        <DocTable
          head={["Methode", "Ohne Filter", "Mit Filter", "Treffer (mit Filter)"]}
          rows={[
            [<Strong key="k">Dark Horse: Kijun 52 + Filter + Aufstockung</Strong>, "—", "2.693 / 2.954 (Sharpe 1,18)", "24 %"],
            ["Ichimoku Kijun 52, nur der Durchbruch", "1.283 / 1.157", "1.638 / 2.162", "30 %"],
            ["Ichimoku Kijun 26, nur der Durchbruch", "1.261 / 1.093", "1.483 / 2.621", "31 %"],
            ["Ichimoku San'yaku (frisch)", "1.386 / 1.640", "1.301 / 1.870", "45 %"],
            ["MA200 (über ihr kaufen, darunter verkaufen)", "1.961 / 2.117", "2.016 / 2.253", "22 %"],
            ["MA50", "1.317 / 1.289", "1.693 / 2.665 (DD −6 %, Sharpe 1,33)", "28 %"],
            ["MA20/50, Golden Cross MA50/200", "1.670 / 1.681, 1.692 / 1.847", "1.375 / 2.047, 1.401 / 2.146", "43 %, 41 %"],
            ["Bollinger-Bänder (20,2), Ausbruch", "1.439 / 1.266", "1.221 / 1.598 (DD −3 %, Sharpe 1,29)", "45 %"],
            ["Bollinger-Bänder (20,2), Umkehr", "1.316 / 1.302", "1.208 / 1.424", "59 %"],
            ["Fibonacci 61,8 % / 50 % / 38,2 % (Rücksetzer im Trend)", "975–1.053", "1.010–1.077", "30–35 %"],
            ["Donchian 55/20 (Turtle)", "1.698 / 1.503", "1.130 / 1.342", "50 % (135 Trades)"],
            ["MACD (Kreuzen unter null)", "1.430 / 1.429", "1.109 / 1.346", "37 %"],
            ["Stochastic (14,3,3) < 20", "1.640 / 1.664", "1.279 / 1.503", "64 %"],
            ["Connors RSI2 < 10 + MA200", "1.590 / 1.543", "1.280 / 1.626", "63 %"],
            ["RSI14 < 30 + MA200", "1.191 / 1.378", "1.105 / 1.261", "62 %"],
          ]}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>Fibonacci schnitt am schlechtesten ab (Profitfaktor ca. 1,0), hat also keinen Vorteil.</li>
          <li>
            Methoden mit hoher Trefferquote (Bollinger, Stochastic, RSI) haben ein Kapital unter dem Markt, weil sie die meiste Zeit
            Bargeld halten und der durchschnittliche Verlust größer ist als der Gewinn.
          </li>
          <li>
            Der Filter Analysten + MA200 verbessert fast alle Trendmethoden (Sharpe von ca. 0,4–0,8 auf 1,0–1,4). Der Vorteil des
            Dark Horse stammt also hauptsächlich aus dem Filter und der Aufstockung, nicht aus Ichimoku selbst.
          </li>
        </ul>

        {/* 7 */}
        <H2>7. Optimierung auf eine höhere Trefferquote</H2>
        <p>
          Ziel: den Anteil profitabler Positionen von ca. 24 % auf mindestens 50 % zu erhöhen. Getestet wurden ca. 300 Varianten
          (alle mit dem Filter Analysten + MA200 und einer Aufstockung von 5 %): Ausbruchsbestätigung (Kurs über der Kijun 52 an 3
          oder 5 aufeinanderfolgenden Sitzungen), andere Ausstiege (Tenkan unter der Kijun, Kurs unter der Kijun 26 / MA10 / MA20 /
          Tenkan), Ziele von +6…+15 %, Nachziehen des Stopps auf den Einstiegskurs nach +5 %, ein Limit von 40 Sitzungen,
          Marktfilter (Index über der MA200), relative Stärke, RSI 50–70, Analysten ≥ 30 %, Einstieg nach einem Rücksetzer auf die
          Kijun 26 sowie teilweise Gewinnmitnahme (Verkauf der Hälfte oder von 1/3 der Position bei +5…+15 %).
        </p>
        <DocTable
          head={["Variante", "Kapital (Position 2 % / 5 %)", "Treffer", "Drawdown", "Sharpe"]}
          rows={[
            ["Bisheriger Dark Horse", "2.693 / 2.954 USD", "24–25 %", "−20 % / −22 %", "1,18"],
            [<Strong key="a">A. Bestätigung über 5 Sitzungen + Ausstieg unter der Kijun 52 (max. Kapital)</Strong>, "3.163 / 4.819 USD", "32–35 %", "−15 % / −21 %", "1,58 / 1,72"],
            ["B. Bestätigung über 5 Sitzungen + Ausstieg Tenkan unter der Kijun (ausgewogen)", "2.624 / 2.827 USD", "45–46 %", "−12 % / −19 %", "1,69 / 1,47"],
            [<Strong key="c">C. B + Verkauf der Hälfte der Position bei +8 % (≥ 50 % Treffer)</Strong>, "1.968 / 2.448 USD", "51 %", "−8 % / −15 %", "1,68 / 1,59"],
            ["D. B mit Ziel +8 % für die gesamte Position", "1.339 / 1.467 USD", "56–57 %", "−8 % / −14 %", "—"],
            ["Bestätigung über 5 Sitzungen + Ausstieg unter der Kijun 26", "2.284 / 2.982 USD", "36 %", "−7 % / −10 %", "1,80 / 1,78"],
            ["frisches San'yaku + Markt > MA200, Ausstieg unter der Kijun 52", "2.900 / 3.397 USD", "36–37 %", "−15 % / −16 %", "1,5"],
          ]}
          caption="Mittelwert aus 6 Ziehungen der Reihenfolge, 483 S&P-500-Aktien, 20.09.2021–18.09.2026. Alle Varianten mit einer Aufstockung von 5 %."
        />
        <Box tone="info" title="Schlussfolgerungen aus der Optimierung">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Strong>Die Ausbruchsbestätigung über 5 Sitzungen</Strong> sortiert falsche Ausbrüche aus: Bei gleichem Ausstieg hebt
              sie das Kapital von 2.693 auf 3.163 USD (Position 2 %) und von 2.954 auf 4.819 USD (5 %), die Sharpe-Ratio von 1,18 auf
              1,6–1,7.
            </li>
            <li>
              <Strong>Ein schnellerer Ausstieg</Strong> (Tenkan unter der Kijun statt Kurs unter der Kijun 52) hebt die Trefferquote
              von 32–35 % auf 45–46 % fast ohne Änderung des Kapitals gegenüber dem bisherigen Dark Horse, aber weniger als
              Variante A.
            </li>
            <li>
              <Strong>≥ 50 % Trefferquote</Strong> erfordern eine teilweise Gewinnmitnahme. Von 144 Varianten überschritten nur 4 die
              50 %, und keine ergab ein Kapital über 2.500 USD. Jede Änderung, die die Trefferquote erhöht, verringert den
              durchschnittlichen Gewinn und das Kapital.
            </li>
            <li>
              Zusätzliche Filter (Index über der MA200, relative Stärke über 63 Tage gegenüber dem Markt) verbesserten die Sharpe-Ratio
              und senkten den Drawdown auf −6…−12 %, verringerten aber das Kapital.
            </li>
          </ul>
        </Box>
        <H3>Was genau gegenüber der Basisversion zu ändern ist</H3>
        <DocTable
          head={["Ziel", "Einstieg", "Ausstieg", "Gewinnmitnahme"]}
          rows={[
            ["Mehr gewinnbringende Positionen (ca. 46 %)", "Filter Analysten + MA200; Kurs schloss an 5 aufeinanderfolgenden Sitzungen über der Kijun 52 (Kauf zur Eröffnung nach dem ersten Tag der Erfüllung)", "Tenkan fällt zum Schluss unter die Kijun (26), Verkauf zur Eröffnung der nächsten Sitzung", "Keine"],
            ["Über 50 % gewinnbringende Positionen", "Wie oben", "Wie oben", "Verkauf der Hälfte der Position bei Erreichen von +8 % über dem Kaufkurs (Limit-Order), der Rest bis zum Ausstieg"],
            ["Höchstes Kapital", "Wie oben", "Schlusskurs unter der Kijun 52", "Keine"],
          ]}
          caption="Die Aufstockung um +5 % (Kurs über der Wolke und bullische Bewertung) in allen Versionen wie in Abschnitt 3."
        />

        {/* 8 */}
        <H2>8. Wie man aus 1.000 USD fast 5.000 USD macht: Schritt für Schritt</H2>
        <p>
          Das beste Ergebnis aus den Backtests: Version A (Bestätigung über 5 Sitzungen, Ausstieg unter der Kijun 52, ohne
          Gewinnmitnahme), Basisposition 5 %.
        </p>
        <DocTable
          head={["Kennzahl", "Ergebnis (Mittelwert aus 6 Ziehungen)"]}
          rows={[
            ["Endkapital aus 1.000 USD nach 5 Jahren", "4.819 USD (Spanne der Ziehungen 4.567–5.099 USD)"],
            ["Markt (Kaufen und halten S&P 500, gleiche Gewichte)", "1.851 USD"],
            ["Maximaler Drawdown", "−21 % (Markt: −19 %)"],
            ["Sharpe", "1,72 (Markt: 0,83)"],
            ["Trades in 5 Jahren", "282 (ca. 56 pro Jahr)"],
            ["Treffer", "35 %"],
            ["Durchschnittlicher Gewinn / durchschnittlicher Verlust je Trade", "+23,3 % / −4,6 % (Profitfaktor 2,75)"],
            ["Durchschnittliches Ergebnis je Trade", "+5,2 % nach Kosten"],
          ]}
          caption="Zum Vergleich eine Basisposition von 2 %: 3.163 USD (Drawdown −15 %, Sharpe 1,58)."
        />
        <H3>Vorgehen (täglich nach Handelsschluss in den USA)</H3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Universum</Strong>: Aktien des S&amp;P 500 (im Test 483 Aktien mit vollständiger Historie). Für kleinere
            Unternehmen gibt es keine Prognosehistorie, daher wurden sie mit diesem Filter nicht getestet.
          </li>
          <li>
            <Strong>Fundamentalfilter</Strong>: Median der letzten Analysten-Kursziele (letzte 180 Tage, mind. 3 Häuser) mindestens
            20 % über dem Kurs. In der App ist das das Feld „Min. Analysten-Potenzial“ im Abschnitt Trend-Setup.
          </li>
          <li>
            <Strong>Trendfilter</Strong>: Schlusskurs über der Tages-MA200 (im Setup: MA200 aus dem Zeitrahmen D1).
          </li>
          <li>
            <Strong>Signal</Strong>: Der Kurs schloss an 5 aufeinanderfolgenden Sitzungen über der Kijun-sen (52) auf D1, nachdem er
            zuvor auf oder unter ihr geschlossen hatte. Das Signal kommt am fünften Tag.
          </li>
          <li>
            <Strong>Kauf</Strong>: zur Eröffnung der nächsten Sitzung für 5 % des aktuellen Kapitals je Aktie (Kapital = Bargeld +
            Positionswert). Gibt es mehr Aktien als Bargeld, zufällig auswählen (im Test eine zufällige Ziehung); nicht kaufen, wenn
            kein Bargeld vorhanden ist.
          </li>
          <li>
            <Strong>Aufstockung</Strong>: einmalig +5 % des Kapitals auf die Position, wenn der Kurs über der Ichimoku-Wolke liegt und
            die Fünf-Linien-Bewertung (Ichimoku-Seite / Trendspalten) bullisch ist (≥ +2). Zur Eröffnung der nächsten Sitzung
            ausführen.
          </li>
          <li>
            <Strong>Ausstieg</Strong>: Schließt der Kurs unter der Kijun-sen 52, die gesamte Position zur Eröffnung der nächsten
            Sitzung verkaufen. Ohne zusätzlichen Kurs-Stop-Loss und ohne festes Gewinnziel.
          </li>
          <li>
            <Strong>Kapital</Strong>: Die Positionsgröße stets vom aktuellen Kapital aus bemessen (Zinseszins). Bargeld wird nicht
            verzinst. Kosten im Test: 0,05 % je Seite.
          </li>
        </ol>
        <Box tone="warn" title="Was zu erwarten ist und die Risiken">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              65 % der Trades enden mit einem Verlust (durchschnittlich −4,6 %). Das Ergebnis machen wenige große Gewinne
              (durchschnittlich +23 %), die Strategie erfordert also Geduld und Regeltreue.
            </li>
            <li>Der maximale Drawdown im Test beträgt −21 %; in einem Bärenmarkt könnte er größer ausfallen (der Testzeitraum war überwiegend ein Bullenmarkt mit einem Bärenmarkt 2022).</li>
            <li>
              Das Ergebnis hängt von der zufälligen Reihenfolge der Aktienauswahl ab (im Test 4.567–5.099 USD) und von Varianten, die
              nach Sichtung der Ergebnisse ausgewählt wurden (ca. 300 getestet). Version A ist durch Auswahlverzerrung belastet.
            </li>
            <li>Steuern, Slippage über 0,05 % hinaus und Liquidität wurden nicht berücksichtigt; getestet wurden nur aktuelle S&amp;P-500-Aktien.</li>
          </ul>
        </Box>
        <H3>Was die App bietet und was für dieses Vorgehen fehlt</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>Vorhanden</Strong>: der Abschnitt Trend-Setup (Kijun-sen 52 aus dem gewählten Zeitrahmen, minimales
            Analysten-Potenzial, Kurs über der MA aus dem gewählten Zeitrahmen, Gewichtung im Ranking); die Fünf-Linien-Bewertung und
            die Trendspalten; das S&amp;P-500-Ranking.
          </li>
          <li>
            <Strong>Einzustellen</Strong>: Zeitrahmen von Kijun-sen und MA auf D1 (Standard H4), Potenzial 20 %, MA200.
          </li>
          <li>
            <Strong>Es fehlen</Strong>: die Bedingung &bdquo;5 aufeinanderfolgende Sitzungen über der Kijun 52&ldquo;, das
            Aufstockungssignal (Kurs über der Wolke + bullische Bewertung) als separate Information, der Ausstieg (Kurs unter der
            Kijun 52) sowie die automatische Berechnung der Positionsgröße. Heute hilft die App bei der Auswahl der Aktien, die
            Einstiegs- und Ausstiegsregeln wendet man manuell an.
          </li>
        </ul>

        {/* 9 */}
        <H2>9. Grenzen und was noch zu prüfen ist</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Survivorship</Strong>: Getestet werden aktuelle S&amp;P-500-Aktien; ausgeschiedene Unternehmen haben keine Daten
            (auch keine Prognosen), was das Ergebnis einer auf Prognosen beruhenden Methode nach oben verzerrt.
          </li>
          <li>
            <Strong>Ein einziger Zeitraum</Strong> (2021–2026) und die Wahl von Varianten nach Sichtung der Ergebnisse: Nötig ist ein
            Test außerhalb der Stichprobe, z. B. auf den Jahren 2012–2021 (Analystendaten liegen vor), sowie an aus dem Index
            ausgeschiedenen Aktien.
          </li>
          <li>
            <Strong>Mehrfachtests</Strong>: Es wurden Tausende Varianten getestet; nötig sind eine statistische Korrektur und
            Walk-Forward (Parameter auf einem Zeitraum gewählt, auf dem nächsten bewertet).
          </li>
          <li>
            <Strong>Analystendaten</Strong>: von Yahoo Finance, ohne unabhängige Verifizierung; keine Historie für Nasdaq und Russell
            2000; die Sensitivität gegenüber dem 180-Tage-Fenster und der Mindestzahl von 3 Häusern ist noch zu prüfen.
          </li>
          <li>
            <Strong>Realismus</Strong>: Kosten von 0,05 % je Seite, keine Steuern und keine Slippage; der Einstieg zur Eröffnung
            setzt eine Ausführung voraus.
          </li>
          <li>
            <Strong>Noch nicht geprüft</Strong>: Einstiege auf H4 (Yahoo liefert Stundendaten nur für 730 Tage), andere Märkte
            (Europa, Japan) und Zeiträume mit einem langen Bärenmarkt.
          </li>
          <li>
            Kriterium, wann die Methode als besser gilt als der Kauf des Index (vorab festgelegt): ein Vorteil nach Kosten und
            Steuern in mindestens 2 von 3 unabhängigen Zeiträumen, nach Korrektur um Mehrfachtests und im Walk-Forward-Test, in einer
            Stichprobe ohne Survivorship-Verzerrung und robust gegenüber einer Änderung der Parameter um ±20 %. Solange das nicht
            erfüllt ist, bleibt ein Index-ETF die Standardwahl.
          </li>
        </ul>

        {/* 10 */}
        <H2 id="test-kontrolny">10. Kontrolltest (21.09.2026): außerhalb der Stichprobe, Nasdaq und Russell 2000, Drawdown-Limit 10 %, 10.000 USD</H2>
        <p>
          Die Abschnitte 1–9 beschreiben Ergebnisse aus einem einzigen Zeitraum und nur aus dem S&amp;P 500. Dieser Abschnitt ist
          ein weiterer Testdurchlauf, der prüft, ob diese Ergebnisse Bestand haben. Alle Zahlen beziehen sich auf Backtests, nicht
          auf Prognosen.
        </p>
        <Box tone="warn" title="Die wichtigste Schlussfolgerung">
          <p>
            Das Ergebnis aus Abschnitt 8 (<Strong>4.819 USD aus 1.000 USD</Strong>) war zum Teil ein Artefakt der Art seiner Auswahl.
            Berücksichtigt man die Indexzusammensetzung des jeweiligen Tages, ergibt dieselbe Variante in den Jahren 2021–2026 ca.
            3.229 USD statt 4.819 USD (Position 5 %), und außerhalb der Stichprobe (2014–2021) nur{" "}
            <Strong>1.356 USD, also unter dem Markt</Strong>. Die Methode erfüllt die Kriterien aus Abschnitt 9 nicht. Die
            Standardwahl bleibt ein Index-ETF.
          </p>
        </Box>

        <H3>10.1 Was den Tests hinzugefügt wurde</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Indexzusammensetzung des jeweiligen Tages</Strong>: Eine Aktie darf nur in dem Zeitraum gekauft werden, in dem sie
            tatsächlich im S&amp;P 500 war. Frühere Tests kauften vom ersten Tag an Aktien, die später in den Index aufgenommen wurden
            (meist solche, die gewachsen waren). Das senkt die Ergebnisse um 17–38 %.
          </li>
          <li>
            <Strong>Ein Zeitraum außerhalb der Stichprobe 2014–2021</Strong> (Analysten sind in den Daten ab 2013 enthalten), Daten ab
            2006 (Bärenmarkt 2008–2009) und 118 Aktien, die aus dem Index ausgeschieden sind (von 280; die übrigen haben keine
            Daten).
          </li>
          <li>
            <Strong>Nasdaq und Russell 2000</Strong>: 4.157 Aktien, aber gekauft werden nur liquide (Median des Tagesumsatzes über 60
            Sitzungen ab 1 Mio. USD, Kurs ab 3 USD); Kosten von 25 Bp je Seite für kleine Werte; die Analystenhistorie wurde für 3.000
            Aktien außerhalb des S&amp;P 500 geladen. Ohne den Liquiditätsfilter sind die Ergebnisse wertlos (Rauschen und fehlerhafte
            Ticks).
          </li>
          <li>
            <Strong>Ein fairerer Vergleich</Strong>: nicht nur mit dem Markt, sondern auch mit einem Markt mit gleicher Exposition (die
            Strategie hält oft 30–70 % in Aktien), mit SPY, RSP, QQQ und IWM sowie mit dem auf einen Drawdown von 10 % herunterskalierten
            Markt; White-Korrektur für Mehrfachtests, Walk-Forward und zufällige Einstiege.
          </li>
          <li>
            <Strong>Neue Varianten</Strong>: Risiko pro Trade (0,25–1 % des Kapitals) mit hartem Stopp, ein Drawdown-Budget von 10 %,
            ein R:R-Filter aus den Ichimoku-Wellenzielen und Einstiege auf H4.
          </li>
          <li>
            <Strong>Kapital 10.000 USD, nur ganze Aktien.</Strong> Der Simulator rechnet prozentual, daher ändert das Kapital die
            Ergebnisse nicht: Die Differenz gegenüber 1.000 USD beträgt +0,1 %. Deshalb sind die Beträge unten schlicht das
            Zehnfache.
          </li>
        </ul>

        <H3>10.2 S&amp;P 500 außerhalb der Stichprobe: der Dark Horse (Analysten ≥ 20 % + Kijun 52 + MA200 + Aufstockung)</H3>
        <DocTable
          head={["Zeitraum", "Markt (gleichgewichteter Korb)", "Dark Horse, Position 2 %", "Position 5 %", "Sharpe: Dark Horse vs. Markt"]}
          rows={[
            ["2014-01 – 2016-08", "13.470 USD", "10.490 USD", "10.920 USD", "0,34 vs. 0,87"],
            ["2016-09 – 2019-04", "14.760 USD", "11.100 USD", "11.220 USD", "0,70 vs. 1,30"],
            ["2019-05 – 2021-09", "15.760 USD", "17.060 USD", "19.530 USD", "1,90 vs. 0,85"],
            [<Strong key="a">2014 – 2021 (gesamt)</Strong>, "31.330 USD (SPY 27.660)", "19.490 USD", "23.580 USD", "1,06 vs. 0,90"],
            ["2021-09 – 2026-09", "17.190 USD (SPY 18.450)", "22.760 USD", "21.800 USD", "1,11 vs. 0,75"],
          ]}
          caption="Kosten 5 Bp je Seite, Start 10.000 USD (aus prozentualen Ergebnissen umgerechnet), Mittelwert aus 8 Ziehungen der Reihenfolge der Trades."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Außerhalb der Stichprobe liegt das Kapital <Strong>unter dem Markt</Strong> – über den gesamten Zeitraum und in 2 von 3
            Teilzeiträumen. Der Vorteil in 2019–2021 ergibt sich hauptsächlich daraus, dass der Crash 2020 vermieden wurde (Drawdown
            −7 % gegenüber −39 %).
          </li>
          <li>
            Alpha gegenüber einem Markt mit gleicher Exposition: −2,0 %, −0,2 %, +11,1 %, +2,6 % (gesamt) und +9,2 % pro Jahr in
            2021–2026, bei t-Werten unter 1,5. Keines ist statistisch signifikant. White-Korrektur für 64 Varianten: p = 0,10 in dem
            Zeitraum, aus dem die Methode ausgewählt wurde, und 0,33–0,995 in den übrigen.
          </li>
          <li>
            Die Variante mit Bestätigung über 5 Sitzungen (aus Abschnitt 8) außerhalb der Stichprobe: 1.356 USD gegenüber 1.528 USD
            beim Markt mit gleicher Exposition. Ein typisches Anzeichen für die Anpassung an die Stichprobe: Sie wurde als die beste
            von ca. 300 Varianten gewählt.
          </li>
          <li>
            Parameter: Kijun 40–65, MA 150–300, die Mindestzahl von Häusern und die Aufstockung liefern ähnliche Ergebnisse (robust),
            dagegen ist <Strong>die Analystenschwelle fragil</Strong>: in 2021–2026 ergibt sich bei 15 % 17.050 USD (Marktniveau), bei
            20 % 22.840 USD, bei 25 % 15.230 USD.
          </li>
          <li>
            Das Signal (Kijun-52-Durchbruch und Ausstieg unter der Kijun) schlägt zufällige Einstiege im selben Filter (Perzentil
            85–100), aber bescheiden: +1,3 % je Trade gegenüber +1,0 % bei Zufall. Den größten Teil des Ergebnisses liefern der
            Filter Analysten + MA200 und die Exposition selbst.
          </li>
        </ul>

        <H3>10.3 Nasdaq und Russell 2000: der Dark Horse funktioniert nicht</H3>
        <DocTable
          head={["Zeitraum", "Russell: Dark Horse", "Russell: Markt", "Nasdaq: Dark Horse", "Nasdaq: Markt"]}
          rows={[
            ["2014-01 – 2016-08", "8.590 USD", "11.120 USD", "9.580 USD", "11.790 USD"],
            ["2016-09 – 2019-04", "9.860 USD", "13.740 USD", "10.120 USD", "14.650 USD"],
            ["2019-05 – 2021-09", "23.090 USD", "16.420 USD", "21.730 USD", "16.690 USD"],
            ["2014 – 2021 (gesamt)", "19.780 USD", "25.100 USD", "22.130 USD", "28.810 USD"],
            ["2021-09 – 2026-09", "7.310 USD", "12.670 USD", "8.910 USD", "8.860 USD"],
          ]}
          caption="Liquide Aktien (ab 1 Mio. USD pro Tag), Kosten 25 Bp, Position 2 %, K52. Markt: gleichgewichteter Korb, einmal im Monat neu gewichtet."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Der Dark Horse schlägt den Markt <Strong>nur in 2019–2021</Strong> (Alpha +15–19 % pro Jahr, t etwa 1). In 2014–2019 und
            in 2021–2026 (Russell 2000: −10 %/Jahr) ist er gleichauf oder schlechter. Der Vorteil aus den Abschnitten 1–9 gilt also
            nur für den S&amp;P 500.
          </li>
          <li>
            <Strong>Der Analystenfilter sagt Renditen nicht voraus</Strong> an der Nasdaq und im Russell 2000 (Renditedifferenz von
            Aktien mit Potenzial ≥ 20 % und darunter: etwa 0, |t| unter 1), und die Konsensabdeckung liquider Aktien beträgt in
            2014–2021 nur 13–30 % (S&amp;P 500: 77–97 %).
          </li>
          <li>
            <Strong>Ein Kijun-52-Durchbruch</Strong> ist in der Regel schlechter als ein zufälliger Tag (nach 63 Sitzungen −0,35 % bis
            −0,53 %; an der Nasdaq und außerhalb des S&amp;P signifikant). In den Jahren 2021–2026 liefert der Zustand &bdquo;Kurs über
            der MA200 + Konsens&ldquo; den Wert, nicht der Durchbruch selbst.
          </li>
          <li>Die Kijun 26 ist deutlich schlechter als die 52 (im Russell 6.220 Trades gegenüber 3.787, in den meisten Zeiträumen ein schlechteres Ergebnis).</li>
          <li>
            Ohne Analysten schlägt bei realistischen Kosten (25 Bp) keine Methode (K52/K26 + MA200, MA200 allein) den Markt in den
            Jahren 2014–2021. Bärenmarkt 2008–2009: Die Filter MA200 und Kijun schützten das Kapital nicht (Drawdown −37 % bis −50 %
            gegenüber −52 %).
          </li>
        </ul>

        <H3>10.4 Die letzten 6 Jahre (21.09.2020 – 18.09.2026), Start 10.000 USD</H3>
        <DocTable
          head={["Markt", "Methode", "Kapital", "Max. Drawdown", "Sharpe"]}
          rows={[
            ["S&P 500", "Dark Horse K26, Position 20 %", "49.640 USD", "−27 %", "1,38"],
            ["S&P 500", "Bestätigung über 5 Sitzungen K52 (Ausstieg K52), Position 5 %", "36.432 USD", "−15 %", "1,49"],
            ["S&P 500", "Dark Horse K52, Position 2 %", "33.213 USD", "−18 %", "1,36"],
            ["S&P 500", "Bestätigung über 5 Sitzungen + Ausstieg Tenkan unter der Kijun, Position 2 %", "22.241 USD", "−7 %", "1,64"],
            ["S&P 500", "Drawdown-Limit 10 % (Stopp an der Kijun 52, Analysten, Risiko 1 %)", "18.713 USD", "−10 %", "1,06"],
            ["Nasdaq", "Dark Horse K52, Position 5 % (der beste)", "17.510 USD", "−56 %", "0,42"],
            ["Russell 2000", "Donchian 55/20, Position 20 % (Streuung der Ziehungen 7.079–53.178 USD)", "31.505 USD", "−53 %", "0,58"],
            ["Russell 2000", "MA200 allein, Position 2 %", "21.525 USD", "−32 %", "0,68"],
            [<Strong key="b">Referenz</Strong>, "SPY / QQQ / IWM / RSP", "24.977 / 27.974 / 19.980 / 21.338 USD", "−24 % / −35 % / −32 % / −21 %", "1,00 / 0,88 / 0,63 / 0,87"],
            ["Referenz", "Auf einen Drawdown von 10 % herunterskalierter Markt (S&P 500)", "15.753 USD", "−10 %", "1,00"],
          ]}
          caption="Mittelwert aus 5 Ziehungen der Reihenfolge der Trades. Die vollständige Aufstellung aller Methoden, der Positionen von 2/5/10/20 % sowie Diagramme: die Datei raport.html im Repository."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Die größten Gewinne bringen Methoden mit Kijun-sen + MA200-Filter + Analysten, aber nur am S&amp;P 500.</Strong>{" "}
            Dort enden alle Varianten mit Aufstockung deutlich über SPY (24.977 USD) und QQQ (27.974 USD). An der Nasdaq und im
            Russell 2000 ist das Ergebnis niedriger als in den ETFs oder wird mit einem Drawdown von 45–55 % erkauft.
          </li>
          <li>
            Das größte Ergebnis (K26, Position 20 %: 49.640 USD) hängt stark von einer einzigen Phase ab: Das Kapital wuchs allein im
            März–Juni 2026 um ca. 49 % (von 35,5 Tsd. auf 52,8 Tsd. USD), als SPY etwa 20 % gewann. Die Streuung der Ziehungen
            beträgt 43,9–56,2 Tsd. USD. Sicherer sind kleinere Positionen (2–5 %).
          </li>
        </ul>

        <H3>10.5 Drawdown-Limit 10 %, Verlustbegrenzung und ein R:R-Filter aus Ichimoku-Wellen</H3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Konstruktion</Strong>: Position = Risiko je Trade (0,25–1 % des Kapitals) geteilt durch den Abstand zum Stopp (max.
            10 % des Kapitals je Aktie); ein untertägiger Stopp an der Kijun 52 (nur nach oben nachgezogen) oder unter dem Tief der
            Wellenkorrektur (optional Ausstieg am Wellenziel); das Drawdown-Budget verkleinert die Positionen mit sinkendem Kapital,
            und bei −9 % schließt eine Notbremse für 21 Sitzungen alles. Das Limit ist nicht garantiert (Kurslücken), daher wird der
            tatsächliche Drawdown angegeben.
          </li>
          <li>
            <Strong>R:R aus Wellen</Strong>: ein 5-%-Zigzag auf Schlusskursen, Ziel N = C + (B − A) aus der letzten Aufwärtswelle (A
            das Tief, B das Hoch, C das Tief der Korrektur; dasselbe wie im Code des Ichimoku-Charts). R:R = (Ziel − Kurs) / (Kurs −
            Stopp); ein Filter ab 2, 3 oder 4.
          </li>
          <li>
            <Strong>Ergebnis</Strong>: Das 10-%-Limit lässt sich einhalten (am S&amp;P 500 alle Konfigurationen mit Analysten), aber
            das Kapital beträgt in 6 Jahren meist das 1,0–1,9-Fache des Startkapitals (bestes: 18.713 USD), ähnlich oder schlechter
            als der auf denselben Drawdown herunterskalierte Markt. Einen Überschuss gegenüber einem solchen Markt sieht man nur am
            S&amp;P 500 in den Jahren 2019–2021 und 2021–2026.
          </li>
          <li>
            <Strong>Ein R:R-Filter ≥ 3:1 verbessert die Ergebnisse nicht.</Strong> Am S&amp;P 500 verschlechtert er das
            durchschnittliche Ergebnis gegenüber dem herunterskalierten Markt um 470–700 USD (von 10.000 USD) und verringert die
            Zahl der Trades um 45–70 %; an der Nasdaq und im Russell 2000 verringert er den Verlust leicht, schlägt den Markt aber
            ebenfalls nicht.
          </li>
        </ul>
        <DocTable
          head={["Geplantes R:R", "Wie oft das Wellenziel vor dem Stopp erreicht wird", "Kommentar"]}
          rows={[
            ["unter 1 (Plan 0,5–0,6)", "60–83 %", "Ziel nah, kleiner Gewinn"],
            ["2 bis 3 (Plan 2,4–2,5)", "19–39 %", ""],
            ["3 bis 5 (Plan 3,8–4,1)", "8–31 %", ""],
            ["3 und mehr (Plan im Schnitt 7,5–9,3)", "15–20 %", "das geplante R:R wird nicht erreicht"],
          ]}
          caption="Einstiegsereignisse (Kijun-52-Durchbruch + MA200, mit und ohne Analysten, S&P 500, Russell 2000 und Nasdaq, 2014–2026; Stopp = Kijun 52 zum Zeitpunkt des Signals)."
        />
        <p>
          Das Wellenziel N wird also nur in 15–30 % der Fälle vor dem Stopp erreicht, und je höher das geplante R:R, desto seltener. Ein
          hohes R:R ergibt sich hauptsächlich aus einem nahen Stopp und einem fernen Ziel. Ein Ziel aus Ichimoku-Wellen ist kein
          verlässlicher Punkt für die Gewinnmitnahme.
        </p>

        <H3>10.6 Einstiege auf H4</H3>
        <p>
          Die Stundendaten reichen ca. 2,8 Jahre zurück (12.2023–09.2026), 480 S&amp;P-500-Aktien, Start 10.000 USD. Der Markt in
          diesem Fenster: ca. 15.680 USD, SPY ca. 17.310 USD. Die besten Tages- und H4-Varianten enden in einem ähnlichen Bereich (ca.
          19.400–19.800 USD bei einer Position von 5 %), die Unterschiede liegen im Rauschen der Ziehungen.{" "}
          <Strong>H4 verbessert das Ergebnis nicht</Strong> gegenüber Tageseinstiegen, bringt aber mehr Trades und Kosten. Eine höhere
          Trefferquote (36–44 %) liefert hauptsächlich ein schnellerer Ausstieg, auf Kosten des Kapitals.
        </p>

        <H3>10.7 Ältere Daten (2014–2020): mit Vorsicht</H3>
        <p>
          Für die Jahre 2014–2020 sind die Ergebnisse uneinheitlich: Die besten Varianten wechseln von Zeitraum zu Zeitraum (z. B. am
          S&amp;P 500 ist die MA200 allein am besten, 22.199 USD bei einer Position von 20 % gegenüber SPY 20.431 USD, und der Dark
          Horse mit Analysten gehört nicht zur Spitzengruppe). Gründe, diese Daten mit Vorsicht zu behandeln: Die Historie der
          Analystenziele ist dünn (bei kleinen Werten 13–26 % Abdeckung), die Listen von Nasdaq und Russell 2000 sind aktuelle
          Mitglieder (Survivorship), und für ausgeschiedene Unternehmen gibt es weder Kurse noch Ziele. Betrachten Sie sie als Prüfung,
          nicht als Beweis.
        </p>

        <H3>10.8 Die Antwort auf die Frage: Welche Methodik bringt die größten Gewinne?</H3>
        <DocTable
          head={["Ziel", "Methodik", "Anmerkungen"]}
          rows={[
            ["Größter Gewinn (6 Jahre, S&P 500)", "Dark Horse mit Kijun 26, Position 20 %; unter den übrigen sind die Bestätigung über 5 Sitzungen K52 und der Dark Horse K52 am besten", "Hoher Drawdown (−27 %), starke Abhängigkeit von einer einzigen Phase 2026, schwach an der Nasdaq und im Russell 2000"],
            ["Bestes Verhältnis von Gewinn zu Risiko", "Bestätigung über 5 Sitzungen K52 mit Ausstieg Tenkan unter der Kijun, Position 2 %: Drawdown −7 %, Sharpe 1,64", "Außerhalb der Stichprobe schneidet sie unter dem Markt ab"],
            ["Drawdown höchstens 10 %", "Stopp an der Kijun 52 (nachgezogen), Analysten ≥ 20 %, MA200, Risiko 1 % je Trade", "Ca. 11 % pro Jahr; besser als der auf 10 % herunterskalierte Markt, aber um ein Vielfaches weniger als volle Positionen"],
            ["Nasdaq, Russell 2000", "Keine Methode, die besser wäre als ein ETF (QQQ, IWM)", "Keine Methode ist stabil"],
            ["Standardwahl", "Ein Index-ETF (SPY oder RSP)", "Die Kriterien aus Abschnitt 9 sind nicht erfüllt"],
          ]}
        />
        <Box tone="info" title="Was das für die App bedeutet">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Der Abschnitt Trend-Setup in den Rankings (Kijun 52, Analysten-Potenzial, Kurs über der MA) ist ein sinnvoller
              Auswahlfilter am S&amp;P 500, aber eine <Strong>Hypothese und kein bestätigter Vorteil</Strong>. An der Nasdaq und im
              Russell 2000 findet er in den Tests keine Stütze.
            </li>
            <li>
              Es lohnt sich, den Standard-Zeitrahmen des Setups auf D1 und MA200 zu stellen, weil die Backtests so liefen; Einstiege
              auf H4 haben nichts verbessert. Der Wellen-R:R-Filter wurde nicht in die App aufgenommen, weil er die Ergebnisse nicht
              verbessert.
            </li>
          </ul>
        </Box>

        <Box tone="warn" title="Vorbehalte zu Abschnitt 10">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Die Analystenprognosen sind aus der Historie der Zieländerungen nachgebildet (Yahoo: Upgrades/Downgrades: Median der
              letzten Ziele der Häuser aus 180 Tagen, mind. 3 Häuser). Es gibt keine unabhängige Verifizierung, die Historie beginnt
              2013, und die Ziele ausgeschiedener Unternehmen sind in den Daten nicht vorhanden.
            </li>
            <li>
              Survivorship verzerrt die Ergebnisse nach oben: Die Listen von Nasdaq und Russell 2000 sind aktuelle Mitglieder, und im
              S&amp;P 500 fehlen die meisten ausgeschiedenen Unternehmen (Datenabdeckung der Indexmitglieder: 75–90 % in 2014–2021,
              61–70 % in 2007–2011).
            </li>
            <li>
              Kosten: 5 Bp (S&amp;P 500) und 25 Bp (Nasdaq, Russell 2000) je Seite; keine Steuern und keine Slippage darüber hinaus.
              Die besten Konfigurationen wurden nach Sichtung der Ergebnisse ausgewählt und sind daher durch Auswahlverzerrung
              belastet.
            </li>
            <li>
              Weiterhin nicht geprüft: andere Märkte (Europa, Japan), Revisionen der Analystenziele statt der Höhe des Ziels, Hosodas
              Wochenchart sowie Ergebnisse mit der vollständigen Liste insolventer Unternehmen.
            </li>
          </ul>
        </Box>

        {/* 11 */}
        <H2 id="test-nyse">11. Zusatztest (22.09.2026): NYSE, Robustheit der Aufstockung am S&amp;P 500, Test der Indizes selbst</H2>
        <p>
          Ein weiterer Testdurchlauf, der auf Abschnitt 10 aufbaut: NYSE als vierter Markt (neben S&amp;P 500, Nasdaq, Russell
          2000), eine Prüfung, ob die Positions-Aufstockungsvariante am S&amp;P 500 robust gegenüber Änderungen der
          Ausführungsdetails ist, sowie ein sauberer Bezugspunkt — einfaches Kaufen und Halten der Indizes/ETFs, ohne jede
          Strategie.
        </p>

        <H3>11.1 Was getestet wurde</H3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Strong>NYSE</Strong>: 2181 Aktien (Kursdaten 2011–2026 und Analystenprognose-Historie speziell für diesen Test
            geladen; angenommene Kosten 10 Bp je Seite — mehr als S&amp;P 500, weniger als Nasdaq/Russell, da die NYSE
            überwiegend aus Large- und Mid-Caps besteht; derselbe Liquiditätsfilter wie in Abschnitt 10). Vier Testfamilien:
            (a) Dark Horse + Drawdown-Limit 10 % — dieselben Varianten wie in Abschnitt 10.3 für Nasdaq/Russell; (b)
            Aufstockung auf ein Zielgewicht (erster Einstieg 20 % des Kapitals, danach Aufstocken auf 25/50/100 %); (c)
            &bdquo;All-in nur wenn Analysten ≥ 30/50/70 %&ldquo;.
          </li>
          <li>
            <Strong>Robustheit der Aufstockung am S&amp;P 500</Strong>: eine Basisversion (erster Einstieg 20 % des Kapitals,
            Aufstockung auf 50 % oder 100 % sofort nach dem Signal, keine Begrenzung der Positionsanzahl, kein
            Notausschalter) und einzeln jede Änderung: eine andere Größe des Ersteinstiegs (10 % / 30 %), maximal 1 Position
            gleichzeitig, Aufstockung erst nach 5 oder 21 Sitzungen Haltedauer, ein harter Stopp <em>innerhalb der Sitzung</em>{" "}
            unter der Kijun-sen 52 (statt bis zum Schlusskurs zu warten), ein Notausschalter nach einem Drawdown von −20 % (21
            Sitzungen Pause) sowie alle diese Änderungen zusammen. 10 Ziehungen der Ausführungsreihenfolge je Variante,
            10.000 USD, zwei unabhängige Fenster: 2014-01 – 2020-09 und 2020-09 – 2026-09.
          </li>
          <li>
            <Strong>Test der Indizes selbst</Strong>: Kaufen und Halten von SPY, RSP, QQQ, IWM, VTI (mit Dividenden) über alle
            in den Tests der Abschnitte 10 und 11 verwendeten Zeiträume, ohne jede Einstiegs-/Ausstiegsregel — ein
            Bezugspunkt für den Rest.
          </li>
        </ul>

        <H3>11.2 Ergebnisse NYSE</H3>
        <DocTable
          head={["Variante", "6 Jahre (2020-09–2026-09)", "2014-01–2020-09"]}
          rows={[
            ["Markt: SPY", "24.977 USD, DD −24 %", "20.431 USD, DD −34 %"],
            ["Markt: NYSE-Korb (gleichgewichtet)", "22.678 USD, DD −26 %", "15.063 USD, DD −44 %"],
            ["Dark Horse K52 (wie in Abschnitt 3), Position 20 %", "24.659 USD, DD −39 %", "18.068 USD, DD −29 %"],
            ["Beste Variante der Familie A (K26, Position 20 %)", "54.518 USD", "— (beste in OLD: Filter MA200+Analysten, 19.541 USD)"],
            ["Drawdown-Limit 10 % (Familie B), beste Variante", "14.425 USD, DD −11 %", "11.063 USD, DD −8 %"],
            ["Aufstockung auf Zielgewicht, beste Variante (auf 50 %)", "79.411 USD (Spanne 41–106 Tsd.)", "20.085 USD (Spanne 18,2–21,9 Tsd.)"],
            ["All-in, wenn Analysten ≥ 50 %", "22.779 USD, DD −37 %", "15.162 USD, DD −30 %"],
            ["All-in, wenn Analysten ≥ 70 %", "23.866 USD, DD −36 %", "14.955 USD, DD −30 %"],
          ]}
          caption="Start 10.000 USD. „Familie A“ = Varianten wie in Abschnitt 10.3 (Dark Horse und Ableitungen); „Familie B“ = Drawdown-Limit ~10 % wie in Abschnitt 10.5."
        />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Strong>Die NYSE verhält sich wie Nasdaq und Russell 2000, nicht wie der S&amp;P 500.</Strong> Der Dark Horse K52
            hält im neueren Fenster gerade so mit SPY mit und verliert im älteren deutlich; das Drawdown-Limit 10 % schlägt
            den auf dasselbe Risiko skalierten Markt nur knapp; eine Anhebung der Analystenschwelle (30 % → 70 %) bringt keine
            durchgängige Verbesserung und bleibt in beiden Fenstern unter SPY.
          </li>
          <li>
            Die Aufstockungsvariante (K26 + alle 5 Linien bullisch) erzielte im neueren Fenster das 3,2-Fache des
            SPY-Ergebnisses, holte im älteren Fenster aber nur knapp auf — <Strong>dasselbe Muster wie in Abschnitt 10</Strong>
            : spektakuläre Ergebnisse nur in der leichteren Hausse 2020–2026, die im schwierigeren Zeitraum 2014–2020
            verschwinden. Die Streuung der Ergebnisse allein durch die Ausführungsreihenfolge (41–106 Tsd. USD) ist sehr
            groß, was die Glaubwürdigkeit zusätzlich schwächt.
          </li>
        </ul>

        <H3>11.3 Robustheit der Aufstockung am S&amp;P 500: welche Version ist die beste</H3>
        <DocTable
          head={["Änderung gegenüber der Basisversion (Aufstockung auf 50 %)", "2020-09–2026-09", "2014-01–2020-09"]}
          rows={[
            ["Basisversion (Ersteinstieg 20 %, Aufstockung auf 50 % sofort, ohne Einschränkungen)", "44.636 USD, DD −35 %", "11.928 USD, DD −36 %"],
            [<Strong key="hs">+ harter Stopp innerhalb der Sitzung unter der Kijun 52 (= die in Abschnitt 12 beschriebene Methode)</Strong>, <Strong key="hs1">76.116 USD, DD −19 %</Strong>, <Strong key="hs2">31.983 USD, DD −15 %</Strong>],
            ["Zum Vergleich: dasselbe, aber Aufstockung auf 100 % (all-in) statt 50 %", "76.280 USD, DD −21 %", "25.868 USD, DD −19 %"],
            ["Ersteinstieg 10 % statt 20 %", "34.386 USD, DD −28 %", "10.553 USD, DD −38 %"],
            ["Ersteinstieg 30 % statt 20 %", "48.396 USD, DD −35 %", "10.640 USD, DD −42 %"],
            ["Max. 1 Position gleichzeitig", "16.486 USD, DD −25 %", "11.542 USD, DD −23 %"],
            ["Aufstockung erst nach 5 Sitzungen Haltedauer", "65.412 USD, DD −32 %", "12.938 USD, DD −32 %"],
            ["Notausschalter nach −20 % Drawdown (21 Sitzungen Pause)", "20.928 USD, DD −24 %", "10.899 USD, DD −24 %"],
            ["Alle Änderungen zusammen", "20.486 USD, DD −18 %", "15.401 USD, DD −12 %"],
          ]}
          caption="Position aus Kijun 52 + Analysten ≥ 20 % + MA200, Aufstockung wenn Kurs über der Wolke und 5-Linien-Bewertung bullisch, 10.000 USD, 10 Ziehungen der Ausführungsreihenfolge."
        />
        <Box tone="info" title="Die beste Methode aus dem gesamten Testprogramm">
          <p>
            Eine Aufstockung auf ein Zielgewicht von <Strong>50 %</Strong> des Kapitals (nicht 100 %/all-in) zusammen mit
            einem <Strong>harten Stopp innerhalb der Sitzung unter der Kijun 52</Strong> (Ausstieg, wenn das Tagestief unter
            die Kijun-sen 52 des Vortags fällt, statt bis zum Schlusskurs zu warten) lieferte das höchste und zugleich
            robusteste Ergebnis aus allen Tests der Abschnitte 3–11: <Strong>76.116 USD</Strong> im Fenster 2020–2026 und{" "}
            <Strong>31.983 USD</Strong> im Fenster 2014–2020 (aus 10.000 USD), beide über SPY (24.977 und 20.431 USD) und mit
            einem niedrigeren Drawdown als SPY (−19 %/−15 % gegenüber −24 %/−34 %). Es ist die einzige Variante der ganzen
            Serie, die SPY in beiden unabhängigen Fenstern zugleich schlägt <em>und</em> in beiden zugleich einen niedrigeren
            Drawdown als SPY hat — sogar besser als dieselbe Methode mit Aufstockung auf die vollen 100 % (all-in). Die
            übrigen Änderungen (kleinere/größere Basis, Limit von 1 Position, Notausschalter) senken das Ergebnis stärker,
            als sie das Risiko senken. Dieses Ergebnis <Strong>wurde noch nicht außerhalb der Stichprobe getestet</Strong>{" "}
            (an einem Zeitraum, der bei seiner Auswahl nicht gesehen wurde) — die vollständige Schritt-für-Schritt-Beschreibung
            steht in Abschnitt 12.
          </p>
        </Box>

        <H3>11.4 Test der Indizes selbst (Kaufen und Halten, mit Dividenden, Start 1.000 USD)</H3>
        <DocTable
          head={["Zeitraum", "SPY", "RSP", "QQQ", "IWM", "VTI"]}
          rows={[
            ["2014-01 – 2016-08", "1237", "1223", "1365", "1107", "1220"],
            ["2016-09 – 2019-04", "1427", "1350", "1669", "1330", "1421"],
            ["2019-05 – 2021-09", "1567", "1476", "2001", "1446", "1582"],
            ["2014 – 2021 (gesamt)", "2766", "2438", "4559", "2129", "2742"],
            ["2021-09 – 2026-09", "1845", "1508", "1989", "1363", "1758"],
            ["OLD: 2014-01 – 2020-09", "2043", "1722", "3241", "1452", "1995"],
            ["6L: 2020-09 – 2026-09", "2498", "2134", "2797", "1998", "2416"],
          ]}
          caption="QQQ (Nasdaq 100) gewinnt in jedem Zeitraum durchgängig; IWM (Russell 2000) ist durchgängig am schwächsten. Das ist der rohe Bezugspunkt — keine Strategie aus den Abschnitten 3–11 schlägt QQQ in jedem Zeitraum zugleich."
        />

        {/* 12 */}
        <H2 id="procedura-krok-po-kroku">
          12. Aktualisierte Vorgehensweise: alle Indikatoren Schritt für Schritt anwenden
        </H2>
        <p>
          Ausschließlich für die <Strong>eine, beste Methode</Strong>, die im gesamten Testprogramm gefunden wurde (Abschnitt
          11.3): S&amp;P 500, Kijun 52 + Analysten ≥ 20 % + MA200, Aufstockung auf ein Zielgewicht von 50 % des Kapitals, mit
          hartem Stopp innerhalb der Sitzung unter der Kijun 52. Ergebnis: 76.116 USD (2020–2026) und 31.983 USD (2014–2020)
          aus 10.000 USD, beide über SPY und mit niedrigerem Drawdown als SPY. Das ist weiterhin eine Hypothese aus
          Backtests auf einer einzigen Stichprobe, keine fertige Strategie — siehe den Vorbehalt am Ende.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Strong>Universum</Strong>: nur Aktien des S&amp;P 500. Das ist der einzige der vier getesteten Märkte (S&amp;P
            500, Nasdaq, Russell 2000, NYSE — Abschnitte 10.3 und 11.2), an dem diese Methode eine Spur eines Vorteils
            zeigte. An den übrigen drei diese Vorgehensweise nicht anwenden.
          </li>
          <li>
            <Strong>Fundamentaler Filter</Strong>: der Analystenkonsens (Median der letzten Kursziele aus 180 Tagen, mind. 3
            Häuser) mindestens <Strong>20 %</Strong> über dem aktuellen Kurs. Die Schwelle nicht anheben — 25–70 % ergaben in
            allen Tests schlechtere Ergebnisse (Abschnitte 4, 10.2, 11.2).
          </li>
          <li>
            <Strong>Trendfilter</Strong>: Schlusskurs über der <Strong>MA200</Strong> (täglich, Zeitrahmen D1). Einstiege auf
            H4 verbesserten das Ergebnis nicht (Abschnitt 10.6) — bei D1 bleiben.
          </li>
          <li>
            <Strong>Einstiegssignal</Strong>: der Kurs schließt über der Kijun-sen <Strong>52</Strong> Perioden (D1), nachdem
            er am Vortag auf oder unter ihr geschlossen hat.
          </li>
          <li>
            <Strong>Kauf (Ersteinstieg)</Strong>: bei Eröffnung der nächsten Sitzung, in Höhe von <Strong>20 %</Strong> des
            aktuellen Kapitals (Bargeld + Positionswert) in dieser Aktie.
          </li>
          <li>
            <Strong>Aufstockung</Strong> (einmalig je Position): wenn der Kurs über der Ichimoku-Wolke liegt <em>und</em> die
            5-Linien-Bewertung bullisch ist (≥ +2), bei Eröffnung der nächsten Sitzung Aktien derselben Firma nachkaufen, bis
            die Position <Strong>50 %</Strong> des aktuellen Kapitals erreicht. 50 % schnitten in beiden Zeitfenstern besser
            ab als ein volles All-in (100 %) (Abschnitt 11.3) — nicht über dieses Gewicht hinaus aufstocken.
          </li>
          <li>
            <Strong>Stop-Loss</Strong>: ein harter Stopp <em>innerhalb der Sitzung</em>, nicht erst beim Schlusskurs — fällt
            das Tagestief (Low) unter das Niveau der Kijun-sen 52 der vorherigen Sitzung, die gesamte Position schließen (zu
            diesem Niveau oder zum Eröffnungskurs, falls dieser niedriger ist). Das ist das Element, das im Test das Kapital
            erhöhte und den Drawdown zugleich senkte, in beiden unabhängigen Fenstern zugleich (Abschnitt 11.3) — der einzige
            solche Fall in der gesamten Serie.
          </li>
          <li>
            <Strong>Ausstieg über den Schlusskurs (falls der Stopp aus Schritt 7 nicht ausgelöst wurde)</Strong>: schließt der
            Kurs unter der Kijun-sen 52, die gesamte Position bei Eröffnung der nächsten Sitzung verkaufen.
          </li>
          <li>
            <Strong>Reihenfolge bei mehr Signalen als Bargeld</Strong>: zufällig wählen. Es gibt keine einzelne beste
            Reihenfolge — allein die Wahl der Reihenfolge veränderte das Ergebnis zwischen den Ziehungen um mehrere Zehn
            Prozent (Spanne 63–90 Tsd. und 30–34 Tsd. USD in der Tabelle in Abschnitt 11.3).
          </li>
          <li>
            <Strong>Was nicht zu tun ist</Strong> (durch Tests bestätigt): nicht an der NYSE, Nasdaq oder im Russell 2000
            anwenden (Schritt 1); die Analystenschwelle nicht über 20–25 % anheben; den Wellen-R:R-Filter nicht hinzufügen
            (verschlechtert die Ergebnisse, Abschnitt 10.5); nicht auf 1 Position gleichzeitig begrenzen und keinen
            Notausschalter nach −20 % Drawdown hinzufügen — im Test verschlechterte dies das Ergebnis stärker, als es das
            Risiko senkte (Abschnitt 11.3); nicht auf H4 statt D1 einsteigen; nicht auf 100 % (all-in) aufstocken —
            schlechter als eine Aufstockung auf 50 %.
          </li>
          <li>
            <Strong>Kosten und Realismus</Strong>: in den Tests 5 Basispunkte (0,05 %) je Seite eines Trades, ohne Steuern und
            ohne Slippage darüber hinaus. Reale Kosten (Kapitalertragsteuer, mehr Slippage) senken das Ergebnis.
          </li>
        </ol>
        <Box tone="warn" title="Vorbehalt zur gesamten Vorgehensweise">
          <p>
            Dies ist eine Synthese von Backtest-Ergebnissen auf einer einzigen historischen Stichprobe (S&amp;P 500, aktuelle
            Mitglieder, 2014–2026), kein bestätigter Vorteil und keine Anlageberatung. Schritt 7 (der harte Stopp unter der
            Kijun 52) ist das neueste und am wenigsten getestete Element — ausgewählt und getestet nur auf denselben beiden
            Zeitfenstern, auf denen auch der Rest der Vorgehensweise bewertet wurde, ohne separaten Out-of-Sample-Test und
            ohne Korrektur für multiples Testen. Die Kriterien, um eine Methode als besser als einen einfachen Index-ETF
            einzustufen (Abschnitt 9), sind weiterhin nicht vollständig erfüllt. Die Standard-, sicherere Wahl bleibt der
            Kauf eines Index-ETF (z. B. SPY oder RSP).
          </p>
        </Box>
      </div>
    </main>
  );
}
