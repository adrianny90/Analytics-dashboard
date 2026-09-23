import { Box, H2, H3, Table, code } from "@/components/ichimokuDoc";

export function IchimokuMethodologyDe() {
  return (
    <section className="mt-12 space-y-4 text-sm leading-relaxed text-white/70">
      <h2 className="text-2xl font-semibold text-white">So funktioniert Ichimoku</h2>

      <Box title="Wichtigste Erkenntnisse (Zusammenfassung)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Die Quellmethodik (Hosoda, Sasaki, polnische Praktiker) beruht auf
            drei Theorien: <strong>Zeit</strong>, <strong>Wellen</strong> und{" "}
            <strong>Preis</strong>. Der Chart mit den fünf Linien ist nur ihr
            einfachster Teil. Die Trendbewertung auf dieser Seite nutzt
            ausschließlich diesen Teil und ist eine <em>Synthese</em> — eine
            Summe aus fünf Signalen, die es in dieser Form in keiner der Quellen
            gibt.
          </li>
          <li>
            Backtest an 504 Aktien des S&amp;P 500 (die letzten 3 Jahre, zur
            Kontrolle 15 Jahre): Ein &bdquo;bullischer/bärischer&ldquo; Zustand{" "}
            <strong>sagt die Richtung</strong> künftiger Renditen{" "}
            <strong>nicht voraus</strong>, <strong>sagt aber die Volatilität gut
            voraus</strong> (bärischer Zustand = ca. 15–30 % höhere Volatilität
            in den folgenden 21 Handelstagen).
          </li>
          <li>
            Einzelne Regeln aus den Büchern (San&apos;yaku, Kijun-Ausbruch mit
            Retest, das Muster des &bdquo;aktuellen SSB&ldquo;, TK-Kreuze,
            Wolkendrehung) sowie Wellenziele und &bdquo;Zeitzahlen&ldquo;{" "}
            <strong>zeigen keinen Vorteil</strong> gegenüber dem Zufall, wenn man
            die Volatilität berücksichtigt.
          </li>
          <li>
            Praktische Anwendung: ein Risikofilter (in bärischem Zustand nicht
            kaufen), kein Generator für Kauf-/Verkaufssignale. Details und
            Tabellen stehen in den folgenden Abschnitten.
          </li>
        </ul>
      </Box>

      <nav className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="mb-1 font-semibold text-white/80">Inhalt</p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>Die fünf Linien des Charts</li>
          <li>Drei Theorien: Zeit, Wellen, Preis</li>
          <li>Signale und Trendbewertung laut den Quellen</li>
          <li>Szenarien Schritt für Schritt</li>
          <li>Grenzen und Warnungen der Autoren</li>
          <li>Wie sich das zur Trendbewertung auf dieser Seite verhält</li>
          <li>Backtest: 3 Jahre (und 15 Jahre zur Kontrolle)</li>
          <li>Bewertung der Methodik</li>
        </ol>
      </nav>

      {/* 1 */}
      <H2>1. Die fünf Linien des Charts</H2>
      <p>
        Ichimoku Kinko Hyo (&bdquo;Gleichgewichtschart auf einen Blick&ldquo;)
        zeichnet fünf Linien, die allein aus dem Kurs abgeleitet werden. In
        Hosodas Büchern heißen sie auch &bdquo;Spannen&ldquo; (Span = Abstand
        zwischen den Pfeilern eines Bogens).
      </p>
      <Table
        head={["Linie (Name in den Büchern)", "Formel", "Rolle"]}
        rows={[
          [
            <strong key="a" className="text-sky-400">Tenkan-sen (Wendelinie)</strong>,
            "(Höchstkurs + Tiefstkurs) / 2 über 9 Perioden",
            "Die schnellste Linie; kurzfristiger Trend und Signalauslöser.",
          ],
          [
            <strong key="b" className="text-orange-400">Kijun-sen (Basislinie)</strong>,
            "(Höchstkurs + Tiefstkurs) / 2 über 26 Perioden",
            "Laut Hosoda „das wichtigste Element“: Ihre RICHTUNG ist praktisch der Kurstrend. Unterstützungs-/Widerstandsniveau; Grenze eines Tiefs.",
          ],
          [
            <strong key="c">Senkou Span A (vorlaufende Spanne 1)</strong>,
            "(Tenkan + Kijun) / 2, um 26 Perioden nach vorn verschoben",
            "Eine Grenze der Wolke (der Widerstandszone).",
          ],
          [
            <strong key="d">Senkou Span B (vorlaufende Spanne 2, „SSB“)</strong>,
            "(Höchstkurs + Tiefstkurs) / 2 über 52 Perioden, um 26 nach vorn verschoben",
            "Die andere Grenze der Wolke; ein flaches SSB-Stück ist ein starkes S/R-Niveau.",
          ],
          [
            <strong key="e" className="text-purple-400">Chikou Span (nachlaufende Spanne)</strong>,
            "heutiger Schlusskurs, 26 Perioden zurück eingezeichnet",
            "Laut Hosoda „die beste der fünf Spannen“ (zusammen mit der fünften); vergleicht den heutigen Kurs mit dem Kurs von vor 26 Tagen.",
          ],
        ]}
      />
      <p>
        Der Bereich zwischen Span A und Span B ist die <strong>Wolke (Kumo,
        &bdquo;Widerstandszone&ldquo;)</strong>. Die Wolke, die vor der aktuellen
        Kerze sichtbar ist, ist keine Prognose — ihre Form ist bereits bekannt,
        da sie aus Daten von vor 26 Perioden entsteht. Hosoda fügt hinzu, dass
        man die Wolke, solange der Kurs in einem starken Trend bleibt,
        &bdquo;ignorieren kann&ldquo; — wichtig wird sie bei einer Reaktion oder
        Umkehr. Ein wichtiger Hinweis: 9, 26 und 52 sind keine
        &bdquo;magischen&ldquo; Parameter, sondern Teil der Zeittheorie (siehe
        unten) — 9 ist der erste Zyklus, 26 ein Segment.
      </p>

      {/* 2 */}
      <H2>2. Drei Theorien: Zeit, Wellen, Preis</H2>
      <p>
        Hosoda schreibt, die &bdquo;Zeit sei um ein Vielfaches wichtiger als der
        Preis&ldquo;, und der Preis sei lediglich eine in die Zeit eingebettete
        Spanne. Das gesamte System besteht aus drei Säulen:{" "}
        <strong>Zeittheorie</strong> (wann), <strong>Wellentheorie</strong>{" "}
        (welche Struktur die Bewegung bildet) und <strong>Preistheorie</strong>{" "}
        (wie weit). Der Chart mit den fünf Linien beschreibt den
        &bdquo;Zustand&ldquo;, die drei Theorien sollen &bdquo;wann und wie
        weit&ldquo; prognostizieren.
      </p>

      <H3>2.1 Zeittheorie</H3>
      <p>
        <strong>Basiszahlen</strong> (Tage oder Wochen ab einem wichtigen Tief
        oder Hoch, inklusive des Starttags gezählt): 9, 17, 26, 33, 42, (51),
        65, 76, 129, 172, 200–257. Sie entstehen aus einfachen Summen, vermindert
        um 1 Tag (weil der Tag des Extrems zwei Wellen gemeinsam ist):
      </p>
      <Table
        head={["Zahl", "Konstruktion", "Anmerkungen"]}
        rows={[
          ["9", "erster Zyklus", "„Die erste Basiszahl ist die wichtigste“; Bereich um 7–11."],
          ["17", "9 + 9 − 1", "zweiter Zyklus; Bereich um 13–21."],
          ["26", "9 + 9 + 9 − 1", "Segment; Bereich um 24–28. Die dritte Zahl ist die Grundlage („1 Segment“)."],
          ["33", "17 + 17 − 1", "Bereich um 30–37."],
          ["42", "17 + 26 − 1", "Bereich um 39–46."],
          ["65", "33 + 33 − 1", "Bereich um 56–72."],
          ["76", "26 · 3 − 2", "„Intervall“ = 3 Segmente."],
          ["129", "65 + 65 − 1", "Bereich um 120–138."],
          ["172", "65 + 42 + 42 + 26 − 3", "Bereich um 163–179."],
          ["200–257", "129 + 129 − 1 = 257", "„Element“ ≈ 9 Segmente (226)."],
        ]}
        caption="Die Werte werden als Bereiche behandelt („ein Symbol vereinheitlicht einen gewissen Bereich“), nicht als exakte Tage."
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Der Veränderungstag</strong> ist nicht dasselbe wie der
          &bdquo;Umkehrtag&ldquo;. Es gibt drei Möglichkeiten: eine sofortige
          Umkehr, eine Beschleunigung oder eine Verlängerung des Trends. Nach
          Hosoda liegt der Kern darin, dass der Kurs <em>bis</em> zu diesem Tag
          hoch (oder niedrig) bleibt; der Tag zielt auf den Tag VOR Erreichen des
          Tiefs/Hochs. In einem Aufwärtstrend kommt eine Verlängerung häufiger
          vor, in einem Abwärtstrend eine Beschleunigung.
        </li>
        <li>
          <strong>Äquivalenzzahlen</strong>: Die Längen vorangegangener Wellen
          (vom letzten Hoch zum Tief, weiter zurück vom Tief zum Hoch) werden vom
          aktuellen Extrem aus in die Zukunft übertragen, auch in Wellensummen
          (1+2, 2+3, 1+2+3). Die Wahl des richtigen Tages ist &bdquo;These,
          Antithese und Synthese&ldquo; mit den Basiszahlen.
        </li>
        <li>
          <strong>Zeitrelationen</strong> (für die Abschnitte A→B→C→D): AB = BD,
          AB = CD, AC = CD, BC = BD.
        </li>
        <li>
          <strong>Segmente, Perioden und Zyklen</strong>: 5 Tage = eine kurze
          Phase, 9 = eine Phase, 3 Phasen = eine Periode (26), 3 Perioden = ein
          Zyklus. In der ersten Periode gibt es meist kleine Schwankungen, in
          der dritten große; ist die Kursspanne der dritten Periode größer als die
          Summe der ersten beiden (Expansion), gilt das als &bdquo;deutlichstes
          Zeichen eines Bullenmarktes&ldquo;.
        </li>
        <li>
          <strong>Wochencharts</strong>: dieselben Zahlen, aber in Wochen (25–27
          Wochen = &bdquo;praktisch das Ende des Trends&ldquo;). Sasaki merkt an,
          dass sie weniger genau sind als Tagescharts, aber die Richtung des
          Haupttrends zeigen; Hosoda schreibt, dass er, wenn er keine Zeit hat,
          &bdquo;praktisch nur&ldquo; den Wochenchart benutzt.
        </li>
        <li>
          Vorbehalt des Autors: Die zehn Zeitsymbole &bdquo;bewähren sich sehr
          gut im Aufwärtstrend&ldquo;; im Abwärtstrend sei ihre Anwendung
          &bdquo;nicht so einfach&ldquo;.
        </li>
      </ul>

      <H3>2.2 Wellentheorie</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>I</strong> — eine einzelne Welle (eine Bewegung),{" "}
          <strong>V</strong> — eine Doppelwelle (Bewegung und Korrektur),{" "}
          <strong>N</strong> — eine dreiteilige Welle (Anstieg, Rückgang,
          Anstieg; die Grundlage der gesamten Theorie), <strong>S</strong> — ein
          umgekehrtes N.
        </li>
        <li>
          Kombinationen: 5 Wellen = zwei N-Wellen, 7 = drei, 9 = vier. Neun
          Wellen bedeuten meist &bdquo;Sättigung&ldquo;; beginnt der Kurs nach der
          siebten in der achten auch nur einen minimalen Rückgang, ist das ein
          Zeichen der Erschöpfung. Hosoda: Theoretisch &bdquo;kann ein
          Aufwärtstrend unbegrenzt andauern&ldquo;.
        </li>
        <li>
          <strong>P</strong> — eine &bdquo;innere Ausbuchtung&ldquo; (Verengung,
          Dreieck; kündigt ein schwächeres Szenario an), <strong>Y</strong> —
          eine &bdquo;äußere Ausbuchtung&ldquo; (Erweiterung: Der Kurs fällt unter
          die früheren Tiefs und steigt wieder über die früheren Hochs; kündigt
          eine Bewegung mit großer Reichweite an), PP — P im P (Dreieck).
        </li>
        <li>
          <strong>Wellenbruch</strong>: im Aufwärtstrend, wenn der Kurs unter das
          Minimum der vorherigen Welle fällt, im Abwärtstrend, wenn er ihr Maximum
          übersteigt. Trendkriterium: höhere Hochs und Tiefs = steigende Welle.
        </li>
        <li>
          <strong>Kopf-Schulter-Formation</strong> in vier Varianten (Standard,
          P, Y, N) — dient der Bestätigung eines Hochs/Tiefs.
        </li>
        <li>
          <strong>Grenzlinien</strong> (Sasaki): das Maximum oder Minimum einer
          bestimmten Kerzenkonfiguration; ihr Durchbruch oder Nicht-Durchbruch
          entscheidet über die Richtung.
        </li>
      </ul>

      <H3>2.3 Preistheorie — vier Berechnungswerte</H3>
      <p>
        Für eine Bewegung A→B (die erste Welle), die Korrektur B→C und das Ziel D
        (im fallenden Markt spiegelbildlich) nennt Hosoda vier Methoden. Die
        folgenden Formeln wurden in mehreren unabhängigen Buchpassagen bestätigt
        und an den Beispielen des Autors numerisch überprüft (z. B. Dow: Tief
        1020, Hoch 1588, Korrektur auf 1250 → E = 2156, V = 1926; Kaneka: NT =
        338 + (338 − 281) = 395).
      </p>
      <Table
        head={["Wert", "Formel (steigender Markt)", "Bedeutung"]}
        rows={[
          [<strong key="e">E</strong>, <>{code("B + (B − A)")}</>, "die Spanne der ersten Welle, ab Hoch B addiert"],
          [<strong key="v">V</strong>, <>{code("B + (B − C)")}</>, "die Spanne der Korrektur, ab Hoch B addiert (Mindestziel)"],
          [<strong key="n">N</strong>, <>{code("C + (B − A)")}</>, "die erste Welle, ab dem Tief der Korrektur wiederholt"],
          [<strong key="nt">NT</strong>, <>{code("C + (C − A)")}</>, "symmetrischer Rücklauf von A um C"],
        ]}
      />
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Vierfacher Wert</strong>: das Vierfache der ersten Bewegung ab
          dem Tief ist das &bdquo;langfristige Mindestziel&ldquo; (im Bärenmarkt
          eher das Dreifache). Wird er nicht erreicht, nimmt der Autor den Median
          zwischen ihm und E.
        </li>
        <li>
          Schichtung: drei Wellen = B + 2(B − A), vier = B + 3(B − A), acht = B +
          7(B − A). Zusätzlich die Niveaus 1/3, 1/2 und 2/3 der Spanne, wenn es
          keinen anderen Anhaltspunkt gibt.
        </li>
        <li>
          &bdquo;Passive&ldquo; Werte (aus früheren Wellen) und &bdquo;aktive&ldquo;
          (aus der aktuellen Bewegung); Punkt S = Zusammentreffen von E und NT aus
          verschiedenen Wellen.
        </li>
        <li>
          Der Autor betont: &bdquo;Man kann nicht sagen, ob ein Berechnungswert
          sicher eintritt&ldquo;; wichtiger als der Preis selbst ist die Zeit (der
          Veränderungstag) — sehr wahrscheinlich tritt der ungefähre Wert um den
          berechneten Veränderungstag herum ein.
        </li>
      </ul>

      {/* 3 */}
      <H2>3. Signale und Trendbewertung laut den Quellen</H2>

      <H3>3.1 Die drei Signale (San&apos;yaku)</H3>
      <p>
        Die klassische Trendbestätigung verlangt die Übereinstimmung dreier
        Elemente:
      </p>
      <Table
        head={["", "Aufwärtssignal (Kouten)", "Abwärtssignal (Gyakuten)"]}
        rows={[
          ["Tenkan / Kijun", "Tenkan kreuzt Kijun von unten (oder liegt darüber)", "Tenkan kreuzt Kijun von oben"],
          ["Kurs / Wolke", "Kurs über der Wolke (die Wolke wird zur Unterstützung)", "Kurs unter der Wolke (die Wolke blockiert die Rückkehr)"],
          ["Chikou", "Chikou über dem Kurs von vor 26 Perioden", "Chikou unter dem Kurs von vor 26 Perioden"],
        ]}
      />
      <p>
        Hosoda nennt solche &bdquo;klaren Kaufperioden&ldquo; aufeinanderfolgende
        Perioden: Nach jeder positiven Wende im selben Trend zählt man die erste,
        zweite, dritte und vierte Kaufperiode. Sasakis Quellen verwenden die
        Begriffe &bdquo;Golden/Death Cross&ldquo; nicht, behandeln aber schon das
        Kreuzen von Wende- und Basislinie als Signal.
      </p>

      <H3>3.2 Zwei Bedingungen für Einzelaktien (Hosoda, Band I)</H3>
      <p>
        Bei einzelnen Unternehmen kommt es zu &bdquo;künstlichen, vorübergehenden
        Kursänderungen&ldquo;, weshalb ein Kreuzen allein nicht ausreicht. Der
        Autor stellt zwei Bedingungen:
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Zeit / neue Kurse</strong>: Die Wende dauert seit dem Tief
          mindestens einige Tage an (z. B. mehr als 9) oder tritt nach einer
          Serie neuer Schlusshochs auf. Lücken im Chart sind günstig.
        </li>
        <li>
          <strong>Kijun</strong>: Nach der Wende fällt der Schlusskurs nicht unter
          die Kijun; im Idealfall fällt die Kijun innerhalb von 9 Tagen nicht
          einmal in einer Sitzung. Liegt die Tenkan kurzzeitig unter der Kijun,
          während die Kijun steigt, ist das noch kein Verkaufssignal.
        </li>
      </ol>
      <p>
        Der Autor schreibt, dass die Erfüllung beider Bedingungen &bdquo;einen
        ruhigen Kauf erlaubt&ldquo; — und räumt ein, dass das für Profis mitunter
        zu wenig streng ist. Signale treten selten auf (ca. 30 von 100–200
        Instrumenten).
      </p>

      <H3>3.3 Phasen der Umkehr eines Abwärtstrends (Sasaki, Vorlesung 53)</H3>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Der Kurs durchbricht die Wendelinie, die den Anstieg blockiert hat — ein vorsichtiger „Probekauf“.</li>
        <li>Kurs über der Basislinie.</li>
        <li>Die nachlaufende Linie gibt ein Aufwärtssignal.</li>
        <li>Kerzen über der unteren Grenze der Wolke.</li>
        <li>Kerzen über der oberen Grenze der Wolke.</li>
      </ol>
      <p>
        &bdquo;Meist beginnt die Kaufperiode schon bei den Punkten 2 und 3.&ldquo;
        Ein Aufwärtssignal allein aus dem Chart kann falsch sein, wenn man Zeit und
        Wellen ignoriert; man sollte nicht aufgrund eines einzigen Belegs handeln.
      </p>

      <H3>3.4 Die drei Funktionen der Wolke und die Drehung (Sasaki)</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Kerzen steigen über die Wolke — sie wird zur Unterstützung.</li>
        <li>Kerzen durchbrechen die untere Grenze von oben — die Wolke verhindert die Rückkehr in den Aufwärtstrend.</li>
        <li>
          Der Tag, an dem Span A und B die Plätze tauschen (die Drehung) — eine
          wahrscheinliche Trendwende. Ein Hoch wird oft erreicht, wenn die Wolke
          den Chikou blockiert und der Kurs sie nicht verlassen kann.
        </li>
        <li>
          Flache Abschnitte von Kijun und SSB gelten als Konsolidierung und
          S/R-Niveaus (Sjack, Sobótka).
        </li>
      </ul>

      <H3>3.5 Kijun-Ausbruch mit Retest (N-Welle) und das Muster des &bdquo;aktuellen SSB&ldquo;</H3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Kijun-Ausbruch und -Test</strong> (laut polnischen Praktikern):
          Der Kurs durchbricht die Kijun, kehrt zu ihr zurück (Retest), ohne auf
          der anderen Seite zu schließen, und läuft weiter. Wird als Verwirklichung
          einer N-Welle gedeutet.
        </li>
        <li>
          <strong>Das Muster des &bdquo;aktuellen SSB&ldquo;</strong> (Sjack): Eine
          Umkehr signalisiert der Kurs, der den <em>aktuellen</em> (unverschobenen)
          SSB durchbricht, also die Mitte der Spanne der letzten 52 Perioden,
          während der Chikou zugleich auf der richtigen Seite des Kurses liegt und
          ein neues lokales Extrem entsteht. Hinweis: Unser Signal „Kurs vs. Wolke“
          vergleicht den Kurs mit der um 26 Perioden verschobenen Wolke, das ist
          also ein anderes Niveau.
        </li>
        <li>
          <strong>Ein falsches TK-Signal</strong> (Sobótka): Ein Kreuzen von Tenkan
          und Kijun ohne Bestätigung (Kijun steigt nicht, Kurs auf der falschen
          Seite der Wolke) gilt als schwach.
        </li>
      </ul>

      <H3>3.6 Kerzenkonfigurationen (Sasaki, Hosoda „Meine Konfigurationen“)</H3>
      <p>
        Serien von mindestens 5, 7 oder 9 Kerzen derselben Farbe (mit einer, bei
        9 mit zwei &bdquo;Interventionen&ldquo; einer gegenläufigen Kerze; ein
        Doji unterbricht die Serie nicht) gelten als Signale für einen Wechsel der
        Anlegerstrategie — nach einem Rückgang von mindestens einem Segment (26
        Tage) ist eine Serie von 5 weißen Kerzen ein Kaufsignal (je kleiner die
        Anstiegsspanne innerhalb der Serie, desto besser). Außerdem: Eine
        Verdoppelung des Kurses innerhalb eines Segments markiert oft ein Hoch; eine
        fallende Serie von 5+ direkt am Tag des Hochs ist eine stärkere Warnung als
        dieselbe Serie nach dem ersten Ausverkauf. Im Band über die Konfigurationen
        beschreibt Hosoda einen Katalog von 30 Konfigurationen und das
        &bdquo;Hochrisiko-Phänomen&ldquo;. Die Autoren empfehlen, sie mit Sakatas
        Fünf Regeln (Lücke, Kreuz, drei Krähen, 8 und 10 neue Kurse) und dem
        Gleichgewichtschart zu kombinieren.
      </p>

      <H3>3.7 Hosodas Wochenchart</H3>
      <p>
        Im Band &bdquo;Wochen&ldquo; verwendet Hosoda Wochenkerzen mit den Formen
        B, Y und P (B — Ausbruch über die vorherige Spanne hinaus, Y — eine Kerze,
        die die vorherige umfasst, P — eine Kerze innerhalb der vorherigen), den
        durchschnittlichen Wochenkurs und &bdquo;Neun-Wochen-Kerzen&ldquo;. Der
        Einstieg erfolgt bei einer &bdquo;Überlagerung&ldquo; (ein zweites B oder Y
        nach dem ersten); man kauft nicht, solange schwarze 9-Wochen-Kerzen
        anhalten, und kauft etwa bei der 3.–4. Kerze nach dem Farbwechsel zu Weiß.
        Die Methode dient der Auswahl von Instrumenten und sollte stets mit dem
        breiten Markt verglichen werden (bei Hosoda: dem Dow-Index).
      </p>

      <H3>3.8 Einschätzen, in welcher Trendphase wir uns befinden</H3>
      <Table
        head={["Phase", "Kriterien laut den Quellen"]}
        rows={[
          [
            "Aufwärtstrend",
            "Tenkan > Kijun; Kijun steigt; Kurs über der Kijun und über der Wolke; Chikou über dem Kurs; aufeinanderfolgende höhere Hochs und Tiefs; Spannenexpansion in der dritten Periode; Serien neuer Schlusshochs.",
          ],
          [
            "Abwärtstrend",
            "Tenkan < Kijun; Kijun fällt; Kurs unter der Wolke, Anstiege stoppen an ihrer Unterkante (frühere Unterstützung wird zum Widerstand); Chikou unter dem Kurs.",
          ],
          [
            "Konsolidierung",
            "Kurs schließt in der Wolke oder zwischen den Linien, flache Kijun und SSB; ein Ausbruch aus der Wolke ist ein „großer Wendepunkt“. Bei einem breiten Seitwärtstrend ist die Wochenmethode nicht anwendbar.",
          ],
          [
            "Übergang / Umkehr",
            "Die Phasen aus Punkt 3.3, Wolkendrehung, der Veränderungstag aus der Zeittheorie, eine Wende der Kijun. Hosoda: Der Gleichgewichtschart gibt kein Signal genau am Hoch oder Tief — das schützt davor, „Hochs und Tiefs zu fangen“.",
          ],
        ]}
      />

      {/* 4 */}
      <H2>4. Szenarien Schritt für Schritt (aus den Büchern)</H2>
      <p>
        Die folgenden Beispiele stammen aus den Büchern (japanische Kurse, Jahre
        1965–1993, Preise in JPY). Die Autoren nennen keine Statistiken — nur
        ausgewählte Beispiele. Ein Teil der Zeichnungen ist in der Übersetzung
        unleserlich, daher können einige Zahlen unsicher sein.
      </p>

      <div className="space-y-4">
        <Box title="Szenario 1 — Takeda (Hosoda, Band I): Einstieg in eine Kaufperiode">
          <p>
            Tief am 4. März: 291. Nach der Wende mit Tenkan über Kijun betrug der
            Schlusskurs 320 (Tag 25), und die Kijun steigt — Bedingung II ist
            erfüllt. Erstes Ziel ca. 370 (ein Anstieg um 43 vom Minimum 291 → 334).
            Realität: am 14. April 374, Korrektur nur auf 350. Weitere Berechnungen:
            E vom Hoch 374 mit einer Spanne von 83 = 457, vom Minimum 312 = 524.
            Dann ein Maximum von 418 (9. Mai), und das passive E 551 und das Maximum
            584 wurden erst nach mehreren Monaten erreicht.
          </p>
          <p className="text-white/50">
            Lehre: Einstiegssignal = Wende + steigende Kijun; die Ziele sind E/NT,
            und das Tempo geben die Zeitzahlen vor (13., 17., 26. Tag).
          </p>
        </Box>

        <Box title="Szenario 2 — Matsumoto: E- und V-Ziele auf aufeinanderfolgenden Wellen">
          <p>
            Wellen: 320 → 486 → 418 → 495 → 431. E = 486 + (486 − 320) = 652; E =
            495 + (495 − 418) = 572; V = 495 + (495 − 431) = 559. Nach der Wende am
            17. März wurden nacheinander 559, 572, 652 erreicht; dann die aktiven
            709, 722, 810 und schließlich 834 (der Kauf dauerte bis 848). Das Ende:
            eine Umfassungsformation mit zwei schwarzen Kerzen am Hoch und ein
            Rückgang um 158.
          </p>
        </Box>

        <Box title="Szenario 3 — Dow, April–Juni 1969: Ziele und Veränderungstag">
          <p>
            Berechnungen aus verschiedenen Formationen: 1800, 1850, 1855 (tatsächlich
            schloss der Kurs am 12. Februar bei 1859), später 1920, 1950, 2044 und
            2050. Die Vormittagssitzung errechnete 2044, der Schlusskurs war 2029;
            der Autor warnte im Radio vor einem &bdquo;Veränderungstag am 9.
            Juni&ldquo;, worauf ein Rückgang auf 1866 (23. Juni) und eine Erholung
            auf 1998 innerhalb von zwei Wochen folgten.
          </p>
          <p className="text-white/50">
            Hinweis: Der Markt stoppte in der Nähe der berechneten Niveaus, aber der
            Autor selbst sagt, dass ein &bdquo;Berechnungswert nicht unbedingt das
            Hoch erreichen muss&ldquo;.
          </p>
        </Box>

        <Box title="Szenario 4 — Dow vom 21.09.1970: Äquivalenzzahlen">
          <p>
            Ab dem Tief von 1929 (27. Mai): Die aufeinanderfolgenden Wellen dauern 9,
            9, 17, 18 und 9 Tage. Der Anstieg von 2067 (26. Juli) auf 2169 (5.
            August) plus das Tief vom 12. August dauerte 24 Tage, &bdquo;fast gleich
            der Zahl 26 — dem dritten Zyklus&ldquo;. Der Autor nannte in der Zeitung
            den Veränderungstag 10.09.; das Hoch (2176) kam am 9.09. Später räumt er
            selbst ein, dass sich der Tag auf den 21.09. verschoben haben könnte.
          </p>
        </Box>

        <Box title="Szenario 5 — Kaneka (1969–70): Wellen, Kopf und Schultern, N gegen Y">
          <p>
            Minimum 246, Anstieg 282 → 305 → 361 → 398; Tief 301 (2. Mai) und
            281/303 (26. Mai); N = 432 &bdquo;wurde erreicht&ldquo;. Hoch 398:
            Korrektur 388 → 365, Anstieg auf 398 (+33 in 5 Tagen), Rückgang unter
            365 in 12 Tagen und um 10 darunter in 16 Tagen — eine vollständige
            Y-Welle. Hoch 433: ein analoges Y. Werte: V = 343, N = 318, V = 317, NT
            von 433 = 263. Am 12. November wurde V = 343 erreicht, am 29. September
            endete ein Segment (26 Tage) ab 395.
          </p>
        </Box>

        <Box title="Szenario 6 — Sasaki: eine Serie von 5 Kerzen nach einem Rückgang (Japan Metals & Chemicals, 1992)">
          <p>
            Hoch 656 (2. Juli) → Tief 342 (12. August; ein Rückgang von mehr als einem
            Segment). Nach einem Doji am 13. August: 3 weiße, 1 schwarze, 2 weiße = eine
            Serie von 5 mit einer Intervention geringer Reichweite (80). Ein
            Kaufsignal; vor Ablauf des ersten Zyklus (9 Tage) stieg der Kurs auf 851.
            Ein gelungenes Beispiel. Gegenbeispiel: Toyo Suisan — eine Serie von 6
            Kerzen am 30. Juli &bdquo;zu früh&ldquo;, der Kurs fiel auf 1230.
          </p>
        </Box>

        <Box title="Szenario 7 — Isuzu (1992): Grenzlinien und Veränderungstag">
          <p>
            Tief 226 (14. August), eine Serie von 5 mit Intervention, am 24. August
            Durchbruch der Grenzlinie 270 → Kaufsignal; Hoch 448 (3. September;
            Verdoppelung des Kurses in 15 Tagen = ein Hoch nach der Regel
            &bdquo;Verdoppelung innerhalb eines Segments&ldquo;). Der Rückgang: E = B
            − (A − B) = 252, Tief 245 (12. November). Der Veränderungstag: der 62. Tag
            ab dem Tief 226 — der 12. November.
          </p>
        </Box>

        <Box title="Szenario 8 — Nikkei 225, Wochenkerzen (1989–92)">
          <p>
            Hoch 29.12.1989 (38.915) → Tief 2.04.1990 (28.002) in 15 Wochen.
            Erwartete Rückkehr nach ca. 15 Wochen; am 7. Juni (10. Woche) 33.192. Das
            nächste Tief: 1.10.1990 (20.221), also 15 Wochen nach dem mittleren Tief
            vom 25.06.1990. Wiederkehrende Abstände: 15, 16, 17, 18, 22–25, 29, 33 und
            34 Wochen.
          </p>
          <p className="text-white/50">
            Hinweis: Bei so vielen zulässigen Abständen lässt sich fast jeder
            Wendepunkt im Nachhinein &bdquo;erklären&ldquo; — siehe den Test in Punkt
            7.
          </p>
        </Box>

        <Box title="Szenario 9 — mehrstufiger (Multi-Timeframe-)Ablauf">
          <p>
            Laut Praktikern: (1) Der Monats-/Wochenchart legt Niveaus und die
            übergeordnete Richtung fest, (2) der Tageschart — das Szenario (Wolke,
            Kijun, N-Welle), (3) H4/H1 — den Einstiegspunkt (Retest der Kijun nach
            dem Ausbruch), (4) der Stopp hinter dem letzten lokalen Extrem oder hinter
            der Kijun des Einstiegscharts. Hosoda vergleicht das Instrument zusätzlich
            immer mit dem breiten Markt.
          </p>
        </Box>
      </div>

      <H3>Regeln zum Positionsmanagement in den Quellen</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>&bdquo;Verluste nicht laufen lassen&ldquo; in Erwartung eines Veränderungstags oder der Wellentheorie.</li>
        <li>Nicht nachkaufen, um den Einstandskurs zu senken; Pyramidisieren nur, wenn von Anfang an geplant.</li>
        <li>Am zweiten wichtigen Tief kaufen, nicht am ersten.</li>
        <li>
          Anfänger: nur in nahezu idealen Situationen handeln, sodass der Gewinn nach
          4 Tagen die Kosten in beide Richtungen deckt.
        </li>
        <li>
          Gewinne an den Berechnungswerten (E/V/N/NT) mitnehmen, nach einer
          Kursverdoppelung innerhalb eines Segments, bei Warnkerzen (umgekehrter
          Hammer, Grabstein-Doji, Kreuz, Lücke) und nach mehr als 10 neuen
          Schlusshochs in Folge.
        </li>
        <li>
          Stop-Loss: Hosoda nennt keine expliziten numerischen Regeln (abgesehen von
          &bdquo;Verluste nicht laufen lassen&ldquo;); Praktiker setzen ihn hinter das
          letzte lokale Extrem oder auf einen Schlusskurs auf der falschen Seite der
          Kijun.
        </li>
      </ul>

      {/* 5 */}
      <H2>5. Grenzen und Warnungen der Autoren</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Hosoda behauptet, die Methode erlaube es, &bdquo;über 90 %&ldquo; der
          Veränderungstage richtig zu lesen, jedoch ohne jegliche Daten; er räumt
          ein, dass es &bdquo;viele&ldquo; Ausnahmen vom Standardverlauf gebe und
          die Methode 2–3 Jahre Praxis erfordere. Sasaki räumt ein verfehltes
          Beispiel ein (Toyo Suisan).
        </li>
        <li>
          Die Definitionen sind subjektiv: &bdquo;kleine/große Reichweite&ldquo;,
          &bdquo;Grenzlinie&ldquo;, &bdquo;Veränderungstag&ldquo;,
          &bdquo;mittelfristige Wellenbewegung&ldquo;, &bdquo;Zwischenserie&ldquo;
          haben keine numerischen Schwellen und werden im Nachhinein angepasst.
        </li>
        <li>
          Alle Beispiele stammen aus einem Markt (Japan, 1960er–90er Jahre) und
          wurden rückblickend ausgewählt (Selektionsverzerrung).
        </li>
        <li>
          Der Autor: Zeitzahlen funktionieren am besten im Aufwärtstrend; der
          Wochenchart ist bei großen Trendwenden sinnvoll, nicht bei einem breiten
          Seitwärtstrend.
        </li>
        <li>
          Hosoda warnt davor, sich auf veröffentlichte Signale zu verlassen — die
          weite Verbreitung der Methode schränkt für sich genommen ihre Wirksamkeit
          ein.
        </li>
      </ul>

      {/* 6 */}
      <H2>6. Wie sich das zur Trendbewertung auf dieser Seite verhält</H2>
      <p>
        Das Panel &bdquo;Trendbewertung&ldquo; unter dem Chart addiert fünf Signale
        (jeweils +1, −1 oder 0). Eine Summe ≥ +2 ist BULLISCH, ≤ −2 BÄRISCH, der
        Rest NEUTRAL.
      </p>
      <Table
        head={["Signal auf der Seite", "Entsprechung in den Quellen", "Übereinstimmung"]}
        rows={[
          [
            "Kurs vs. Wolke (um 26 verschoben)",
            "Die drei Funktionen der Wolke (Sasaki), San’yaku, Phasen 4–5",
            <span key="1" className="text-emerald-300">Entspricht der Klassik</span>,
          ],
          [
            "Tenkan vs. Kijun",
            "Positive Wende / Kreuzen (Hosoda Band I; Sasaki Vorlesung 48)",
            <span key="2" className="text-emerald-300">Entspricht; es fehlen die Bedingungen „Kijun fällt nicht“ und „neue Kurse“</span>,
          ],
          [
            "Chikou (Schlusskurs vs. Schlusskurs vor 26 Perioden)",
            "Die nachlaufende Spanne (Hosoda: „die beste der Spannen“; Sasaki: Aufwärtssignal beim Kreuzen des Kurses)",
            <span key="3" className="text-amber-300">Sinngemäß entsprechend; keine Regel in Bezug auf die Wolke</span>,
          ],
          [
            "Momentum über ca. 76 Kerzen (±1 %)",
            "In den Quellen nicht enthalten (76 ist eine Zeitzahl, aber nicht als Schwelle für die Kursänderung)",
            <span key="4" className="text-fall">Eigene Ergänzung</span>,
          ],
          [
            "Wolkenfarbe im Fenster von 17 Kerzen voraus",
            "Die Wolkendrehung (Sasaki) als Trendwechsel; die Farbe allein ist kein Signal",
            <span key="5" className="text-amber-300">Nur lose verwandt</span>,
          ],
          [
            "Summe der Signale, Schwelle ±2",
            "Keine — die Quellen verlangen, „Bedingungen“ zu synthetisieren, aber ohne Punktesystem",
            <span key="6" className="text-fall">Eigene Synthese</span>,
          ],
        ]}
      />
      <H3>Was unserer Umsetzung gegenüber den Quellen fehlt</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Zeittheorie</strong> (die Zahlen 9/17/26/33/42/65/76, der
          Veränderungstag, Äquivalenzzahlen) — vollständig weggelassen.
        </li>
        <li>
          <strong>Die Richtung der Kijun</strong> (&bdquo;ist praktisch der
          Kurstrend&ldquo;) — ist kein eigenes Signal.
        </li>
        <li>
          Erkennen von <strong>Konsolidierung</strong> (flache Kijun/SSB, Kurs in der
          Wolke) — fehlt; wir bewerten nur bullisch/bärisch/neutral.
        </li>
        <li>
          <strong>Kijun-Retest, das Muster des aktuellen SSB,
          Kerzenkonfigurationen, mehrstufige Analyse</strong> — fehlen.
        </li>
        <li>
          Kontext: Bewertung im Verhältnis zum breiten Markt (bei Hosoda der Dow) —
          fehlt.
        </li>
      </ul>
      <Box tone="good" title="Wellenziele im Einklang mit den Quellen">
        <p>
          Für die Punkte A → B → C berechnet der Code exakt Hosodas Formeln: E = B +
          (B − A), V = B + (B − C), N = C + (B − A), NT = C + (C − A). Die Formeln
          funktionieren im Abwärtstrend genauso (die Vorzeichen ergeben sich aus den
          Kursen).
        </p>
      </Box>

      <H3>Wellenziele — so funktioniert das Werkzeug auf dieser Seite</H3>
      <p>
        Ein Zigzag auf den Schlusskursen markiert einen neuen Wendepunkt, wenn der
        Kurs mindestens um die &bdquo;Wellen-Empfindlichkeit&ldquo; (%, der Regler
        über dem Chart) dreht. Aus den letzten drei Wendepunkten A → B → C werden
        vier Ziele berechnet (E, V, N, NT — Formeln aus Punkt 2.3). Das sind
        arithmetische Projektionen eines heuristischen Wellendetektors, keine
        Prognosen.
      </p>

      {/* 7 */}
      <H2>7. Backtest: 3 Jahre (und 15 Jahre zur Kontrolle)</H2>
      <Box title="Methode" tone="info">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Daten: tägliche, bereinigte Kurse von 504 aktuellen Aktien des S&amp;P 500
            (High/Low/Close). Hauptzeitraum: 19.09.2023–18.09.2026; Kontrolle:
            19.09.2011–18.09.2026 sowie fünf 3-Jahres-Teilzeiträume.
          </li>
          <li>
            Die Trendbewertung dieser Seite wurde vektorisiert nachgebildet und mit
            dem Backend abgeglichen (36 Stichproben, 0 Abweichungen). Das Signal ist
            zum Schluss von Tag t bekannt, die Rendite wird ab t gemessen (Messung
            des Informationsgehalts), und in den Strategiesimulationen mit 1 Sitzung
            Verzögerung und Kosten von 5 Bp je Seite.
          </li>
          <li>
            Horizonte: 5, 10, 21 und 63 Sitzungen. Überrendite = Rendite der Aktie
            minus Durchschnitt aller Aktien am selben Tag. Signifikanz: der
            Newey-West-t-Wert auf der Tagesreihe (zeitliche Korrelation der
            Beobachtungen). Einen Wert von |t| &gt; 2 behandeln wir als signifikant.
          </li>
          <li>
            <strong>Wichtige Einschränkung</strong>: Es handelt sich um aktuelle
            Mitglieder des S&amp;P 500 (Survivorship Bias) — das verzerrt die
            Renditeniveaus nach oben, nicht aber die Vergleiche zwischen den
            Zuständen. Die Tests betreffen ausschließlich Tagescharts und
            US-Aktien, während die Quellen überwiegend den japanischen und den
            Devisenmarkt mit diskretionärer Beurteilung beschreiben.
          </li>
        </ul>
      </Box>

      <H3>7.1 Sagt die Bewertung „bullisch / neutral / bärisch“ die Richtung voraus?</H3>
      <Table
        head={["Zustand (3 Jahre)", "Zeitanteil", "Ø Rendite über 21 Sitzungen", "Ø Volatilität der folgenden 21 Sitzungen"]}
        rows={[
          [<span key="a" className="text-rise">BULLISCH (≥ +2)</span>, "ca. 47–51 %", "+1,55 %", "28,6 %"],
          ["NEUTRAL", "ca. 24 %", "+1,96 %", "30,7 %"],
          [<span key="b" className="text-fall">BÄRISCH (≤ −2)</span>, "ca. 26–29 %", "+2,13 %", "32,9 %"],
          ["Alle", "100 %", "+1,81 %", "—"],
        ]}
        caption="Überrendite gegenüber dem Marktdurchschnitt in jedem Zustand ≈ 0. 15 Jahre: Volatilität 25,0 % / 28,4 % / 32,3 %."
      />
      <Table
        head={["Maß (Bullen minus Bären)", "3 Jahre", "15 Jahre"]}
        rows={[
          ["Differenz der Renditen über 21 Sitzungen (t)", "+0,17 % (t = 0,36)", "−0,28 % (t = −1,53)"],
          ["Differenz der Renditen über 63 Sitzungen (t)", "−0,24 % (t = −0,19)", "−0,68 % (t = −1,69)"],
          ["Rangkorrelation (IC) mit dem Ergebnis nach 21 Sitzungen", "−0,006", "−0,0155"],
          ["Rangkorrelation (IC) mit dem Ergebnis nach 63 Sitzungen", "−0,028", "—"],
        ]}
      />
      <p>
        Fazit: Der Bewertungszustand <strong>sagt die Richtung nicht voraus</strong>{" "}
        — &bdquo;bärische&ldquo; Aktien stiegen in den folgenden Wochen im Schnitt
        genauso stark wie &bdquo;Bullen&ldquo; (ein Erholungseffekt), über 15 Jahre
        sogar etwas besser. Die Bewertung <strong>misst dafür das
        Risikoregime</strong>: Ein bärischer Zustand bedeutet deutlich höhere
        Volatilität. Zudem ist der Zustand instabil: Die durchschnittliche Länge
        einer Serie im selben Zustand beträgt ca. 9,7 Tage (Median 3 Tage).
      </p>

      <H3>7.2 Einzelne Regeln aus den Büchern (Überrendite in Signalrichtung, 21 Sitzungen)</H3>
      <Table
        head={["Regel", "3 Jahre: Überrendite (t)", "15 Jahre: Überrendite (t)"]}
        rows={[
          ["San’yaku Kouten (Kurs>Wolke, TS>KS, Chikou>Kurs) — Long", "+0,18 % (−0,1)", "−0,10 % (−1,4)"],
          ["Phase des stabilen Anstiegs: Kurs>TS>KS>Wolke — Long", "+0,17 % (−0,3)", "−0,10 % (−1,9)"],
          ["Kijun-Retest nach Ausbruch nach oben — Long", "−0,20 % (−1,9)", "−0,03 % (−0,5)"],
          ["Kursausbruch über die Kijun allein — Long", "−0,18 % (−1,9)", "−0,02 % (−0,4)"],
          ["Sjack-Muster (aktueller SSB) nach oben — Long", "−0,00 % (−1,6)", "+0,04 % (0,3)"],
          ["Durchbruch des aktuellen SSB nach oben allein — Long", "−0,30 % (−3,0)", "−0,02 % (−0,2)"],
          ["TS/KS-Golden-Cross (Tag des Kreuzes) — Long", "−0,21 % (−1,3)", "−0,03 % (−0,1)"],
          ["„Echtes“ Golden Cross (nach 3 Sitzungen) — Long", "−0,00 % (−0,2)", "−0,03 % (−1,1)"],
          ["„Falsches“ Golden Cross — Long", "−0,03 % (0,2)", "+0,07 % (1,4)"],
          ["Wolkendrehung auf Grün — Long", "−0,13 % (−0,7)", "−0,21 % (−2,4)"],
          ["Chikou über dem Kurs von vor 26 Sitzungen — Long", "+0,09 % (−0,1)", "−0,07 % (−1,1)"],
          ["Kurs>KS und KS steigt (5 Sitzungen) — Long", "+0,24 % (0,3)", "−0,08 % (−1,6)"],
        ]}
        caption="Gezeigt werden die Long-Versionen; der vollständige Test umfasste rund 40 Regeln, auch die Short-Entsprechungen (Abwärtssignale). Praktisch alle Überrenditen ≈ 0 und |t| < 2; einzelne Ergebnisse mit |t| > 2 in einem Zeitraum (z. B. Durchbruch des aktuellen SSB nach unten, 3 Jahre) wiederholen sich im anderen nicht, was bei so vielen Tests allein durch Zufall zu erwarten ist. Die Trefferquote übertraf in der Regel nicht die Basisquote (ca. 57 % positive 21-Sitzungs-Renditen — Marktdrift). Die Unterscheidung zwischen falschen und echten TK-Kreuzen, die Sobótka für wesentlich hält, macht keinen Unterschied."
      />

      <H3>7.3 Wellenziele (E, V, N, NT) — erreicht der Kurs sie?</H3>
      <p>
        Für jeden dritten Zigzag-Punkt (Schwelle 5 %) wurden die Ziele nach Hosodas
        Formeln und nach den Formeln dieser Seite berechnet und geprüft, ob der
        Kurs (High/Low) das Ziel innerhalb von 21 oder 63 Sitzungen erreichte. Die
        rohe Trefferquote kann hoch sein (N hat einen Median-Abstand von 3–4,5 %),
        muss aber mit der erwarteten verglichen werden: für das gesamte Universum bei
        gleichem, in Standardabweichungen ausgedrücktem Abstand.
      </p>
      <Table
        head={["Ziel", "3 Jahre: Treffer / erwartet (21 S.)", "15 Jahre: Treffer / erwartet (21 S.)", "Differenz (15 Jahre, 63 S.)"]}
        rows={[
          ["Hosodas E = B+(B−A)", "16,3 % / 17,3 %", "16,0 % / 16,8 %", "−1,6 PP"],
          ["Hosodas V = B+(B−C)", "23,0 % / 23,1 %", "21,9 % / 22,3 %", "−1,2 PP"],
          ["N = C+(B−A)", "57,2 % / 57,4 %", "56,7 % / 56,9 %", "−0,8 PP"],
          ["Hosodas NT = C+(C−A)", "41,2 % / 41,5 %", "40,6 % / 41,0 %", "−0,9 PP"],
          ["V der alten Seitenversion = C−(B−A)", "11,6 % / 12,5 %", "11,1 % / 12,0 %", "−1,1 PP"],
          ["E der alten Seitenversion = C+(C−B)", "11,6 % / 12,3 %", "11,1 % / 11,9 %", "−1,2 PP"],
        ]}
        caption="n ≈ 22 Tsd. Ereignisse (3 Jahre) und ≈ 100 Tsd. (15 Jahre) je Ziel. Nach Bereinigung um die Volatilität werden alle Formeln genauso oft erreicht, wie es der Abstand allein erwarten lässt — kein Vorteil."
      />
      <p>
        Fazit: Wellenziele sind schlicht Niveaus in einem bestimmten Abstand vom
        Kurs, die mit einer durch die Volatilität bestimmten Wahrscheinlichkeit
        erreicht werden. Es wurde nicht gezeigt, dass Hosodas Formeln besser sind als
        ein zufälliges Niveau im selben Abstand. Die Formeln der alten Seitenversion
        (V, E — abweichend von Hosoda, daher gesondert in der Tabelle gezeigt)
        schnitten weder schlechter noch besser ab. Derzeit verwendet der Code
        Hosodas Formeln.
      </p>

      <H3>7.4 Zeittheorie — fallen Wendepunkte auf die Zahlen 9/17/26/33/42/51/65/76?</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Dauer der Abschnitte zwischen aufeinanderfolgenden Zigzag-Punkten (5 %) über
          15 Jahre (ca. 30 Tsd. Abschnitte): Das Verhältnis der Zahl der Abschnitte im
          ±1-Fenster um die Basiszahlen zu benachbarten Längen = 0,95 (bei zufällig
          gemischter Reihe 1,015). Bei 65 (0,85) und 76 (0,69) — weniger als üblich.
          Im 3-Jahres-Zeitraum 1,01 vs. 1,00.
        </li>
        <li>
          Gleiche Längen aufeinanderfolgender Wellen (AB = CD, Differenz ≤ 1 Tag)
          treten bei 13,1 % der Tripel auf gegenüber 11,05 % bei einem Random Walk —
          ein schwacher Effekt (ca. ×1,2 gegenüber benachbarten Längen), der &lt; 1 %
          der Tripel betrifft. Die Relationen AB = BD und AC = CD (×0,93–0,95) — ohne
          Effekt.
        </li>
      </ul>
      <p>
        Fazit: Es gibt keinen Beleg dafür, dass die Zeitzahlen aus den Büchern eine
        besondere Rolle spielen. Die einzige (kleine) Spur ist eine ähnliche Länge
        aufeinanderfolgender Wellen.
      </p>

      <H3>7.5 Konsolidierung — kündigen flache Linien und ein Kurs in der Wolke Ruhe an?</H3>
      <Table
        head={["Bedingung (3 Jahre)", "Zeitanteil", "Volatilität der folgenden 21 Sitzungen", "Bewegungseffizienz-Verhältnis"]}
        rows={[
          ["Alle Beobachtungen", "100 %", "30,4 %", "0,238"],
          ["Kijun und SSB flach (5 Sitzungen)", "7,9 %", "30,8 %", "0,238"],
          ["Kurs innerhalb der Wolke", "12,8 %", "30,9 %", "0,237"],
          ["Dünne Wolke (< 1 % des Kurses)", "16,4 %", "26,8 %", "0,237"],
        ]}
        caption="Flache Linien und ein Kurs in der Wolke verringern weder die Spanne noch die Volatilität; nur eine dünne Wolke kündigt geringere Volatilität an (Volatilitäts-Clustering-Effekt)."
      />

      <H3>7.6 Die Wochenvariante der Trendbewertung</H3>
      <Table
        head={["Horizont (Spread Bullen − Bären)", "3 Jahre (t)", "15 Jahre (t)"]}
        rows={[
          ["4 Wochen", "+0,34 % (0,80)", "−0,18 % (−0,80)"],
          ["13 Wochen", "+1,85 % (1,95)", "−0,48 % (−0,84)"],
          ["26 Wochen", "+5,06 % (4,07)", "−0,65 % (−0,56)"],
        ]}
      />
      <p>
        In den letzten 3 Jahren liefert die Wochenversion signifikante Ergebnisse
        (eine Phase starken Momentums), bestätigt sich aber über 15 Jahre nicht — der
        Effekt hängt vom Marktregime ab und nicht von einem dauerhaften Vorteil der
        Methode.
      </p>

      <H3>7.7 Strategiesimulation (1 Sitzung Verzögerung, Kosten 5 Bp je Seite)</H3>
      <p>Portfolio mit gleichen Gewichten aus 504 Aktien, tägliches Rebalancing:</p>
      <Table
        head={["Strategie", "3 Jahre: Jahresrendite / Sharpe", "15 Jahre: Jahresrendite / Sharpe"]}
        rows={[
          ["Alles kaufen (Benchmark)", "+20,3 % / 1,35", "+18,7 % / 1,07"],
          ["Nur Long in bullischen Zuständen", "+15,3 % / 1,15", "—"],
          ["Long in allem außer bärisch", "+17,4 % / 1,30", "—"],
          ["Long Bullen, Short Bären", "−5,8 % / −0,34", "−12,3 % / −0,88 (max. Drawdown −86,8 %)"],
          ["Long: San’yaku Kouten", "+13,7 % / 1,03", "—"],
        ]}
        caption="Die Strategie, Bären zu shorten, verliert, weil Aktien im bärischen Zustand sich erholen und der Aktienmarkt eine positive Drift hat."
      />
      <p>
        Ein Test auf <strong>Indexebene</strong> (gleichgewichteter Index aus 504
        Aktien, Hoch/Tief näherungsweise), bei dem die Trendbewertung als
        Expositionsfilter dient:
      </p>
      <Table
        head={["Strategie", "3 Jahre: Rendite / Sharpe / max. Drawdown", "15 Jahre: Rendite / Sharpe / max. Drawdown"]}
        rows={[
          ["Kaufen und halten", "+20,3 % / 1,35 / —", "+18,7 % / 1,07 / −38,4 %"],
          ["Long, wenn nicht bärisch", "+17,6 % / 1,51 / −10,1 %", "+14,6 % / 1,11 / −19,1 %"],
          ["Long, wenn bullisch", "+12,5 % / 1,27 / −7,8 % (Exposition 0,73)", "+6,9 % / 0,69 / —"],
          ["Long/Short", "+9,0 % / 0,71 / —", "+1,7 % / 0,19 / —"],
        ]}
      />
      <p>
        Der Filter &bdquo;nicht im Markt sein, wenn der Index bärisch ist&ldquo;
        senkt den maximalen Drawdown (15 Jahre: von −38 % auf −19 %) und verbessert
        das Sharpe-Ratio leicht, auf Kosten einer niedrigeren Rendite. Die
        Trendbewertung wirkt also als <strong>Risikofilter</strong>, nicht als
        Werkzeug zur Steigerung der Rendite.
      </p>

      {/* 8 */}
      <H2>8. Bewertung der Methodik</H2>
      <Box tone="good" title="Was funktioniert">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Der Trendzustand (Wolke, TK, Chikou, Momentum) unterscheidet
            Volatilitätsregime gut — er ist ein sinnvoller Risikoindikator und
            Expositionsfilter (kleinere Drawdowns).
          </li>
          <li>
            Der Chart ist eine klare, stimmige Visualisierung des Kontexts (Trend,
            Unterstützung/Widerstand, Momentum) und hilft beim Positionsmanagement
            (Kijun als Trailing-Stopp).
          </li>
          <li>Eine dünne Wolke kündigt geringere Volatilität an; eine schwache Spur ähnlicher Längen aufeinanderfolgender Wellen.</li>
        </ul>
      </Box>
      <Box tone="warn" title="Was nicht bestätigt wurde">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Die Vorhersage der Kursrichtung (bullisch/bärisch, San’yaku, Kijun-Retest,
            das SSB-Muster, TK-Kreuze, Wolkendrehung) — kein Vorteil in 3 und 15 Jahren
            bei Aktien des S&amp;P 500.
          </li>
          <li>Ein Vorteil der Wellenziele E/V/N/NT gegenüber einem zufälligen Niveau im selben Abstand.</li>
          <li>
            Die angebliche &bdquo;besondere Rolle&ldquo; der Zeitzahlen und des
            &bdquo;Veränderungstags&ldquo; (keine Anreicherung bei 9/17/26/33/42/65/76).
          </li>
          <li>Eine Verringerung von Volatilität und Bewegung in der Konsolidierung (flache Kijun/SSB, Kurs in der Wolke).</li>
        </ul>
      </Box>
      <p>
        Man muss bedenken, was der Backtest nicht prüft: Die Quellen sind
        diskretionär — sie kombinieren viele Elemente, die &bdquo;nach Augenmaß&ldquo;
        beurteilt werden, mehrstufig (Monat → Tag → H1) und überwiegend am
        japanischen und am Devisenmarkt. Mechanische Regeln an täglichen
        US-Aktien sind nur eine faire Art der Prüfung; sie beweisen nicht, dass die
        Methode in den Händen eines erfahrenen Praktikers nicht funktioniert, finden
        aber auch keinen Beleg dafür, dass sie funktioniert. Die Autoren selbst
        legen keine Statistiken vor.
      </p>
      <p>
        Empfehlung: Die Trendbewertung auf dieser Seite als Beschreibung des Regimes
        und des Risikoniveaus behandeln (nicht als Kauf-/Verkaufssignal) und die
        Wellenziele als Referenzniveaus. Mögliche weitere Verbesserungen: die
        Richtung der Kijun und die Erkennung von Konsolidierung als eigene
        Indikatoren ergänzen.
      </p>
    </section>
  );
}
