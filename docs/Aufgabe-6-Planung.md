# Aufgabe 6 – Planung: Lagebild-Dashboard Katastrophenschutz Berlin

**Autoren:** Julian Schaefers, Til Scheerer

**Klasse:** LF8 - 11BE15

**Idee:** Ein Dashboard, das die wichtigsten Lageinformationen für Berlin (Wetter, Pegel, Luft, Einsätze, amtliche Warnungen) auf einen Blick zusammenführt, statt mehrere Webseiten einzeln zu öffnen. Die Nutzer sind fiktiv, aber an realen Abläufen orientiert.

## 1. Anwender

| | **Primär: Leitstelle / Lagedienst** | **Sekundär: Einsatzkräfte im Außeneinsatz** |
|---|---|---|
| Wer | Disponent:innen im Schichtdienst, Fachwissen hoch, Technikkenntnis gering | Einsatz- und Zugführer:innen, viel im Freien |
| Gerät | Großer Monitor / Wandbildschirm | Smartphone, Tablet |
| Nutzung | Dauerhaft im Hintergrund, Blick von 2–3 Sekunden | Kurz, gezielt, unter Zeitdruck |
| Folge fürs Design | Alles **ohne Scrollen** sichtbar, ruhig, keine Bedienung nötig | Scrollbar, große Touch-Flächen, Details per Antippen |

Nicht Zielgruppe sind Krisenstab (braucht eher Berichte) und Öffentlichkeit (dafür gibt es die NINA-App). Wegen des mehrsprachigen Einsatzumfelds und schlechter Lesbarkeit im Freien gibt es 5 Sprachen, einen Hoher-Kontrast-Modus und eine Sprachausgabe.

## 2. Inhalte

Nur, was die **erste Lagebeurteilung** unterstützt. Alle Quellen sind öffentlich und ohne API-Key nutzbar.

| Inhalt | Warum relevant | Quelle |
|---|---|---|
| Wetter, 24-h-Verlauf, 7-Tage-Vorhersage | Sturm, Starkregen, Hitze bestimmen Einsatzlagen | Open-Meteo |
| Luftqualität | Rauch von Bränden | Open-Meteo Air Quality |
| Pegelstand Spree (Köpenick) | Frühindikator für Hochwasser | PEGELONLINE (WSV) |
| Brände, Einsätze, Ø Reaktionszeit | Belastung der Feuerwehr | Berliner Feuerwehr Open Data |
| Amtliche Warnungen | Wichtigste Einzelinformation | NINA/BBK |
| Gefahrenkarte Hochwasser | Räumlicher Bezug zum Pegel | Umweltatlas Berlin |

Nicht enthalten: laufende Einsätze, Kräfte und Ressourcen (intern, keine öffentliche Schnittstelle). Straßensperrungen wurden getestet, aber verworfen, weil die Daten seit Juli 2025 nicht mehr aktualisiert werden.

## 3. Kriterien

| Kriterium | Anforderung | Begründung |
|---|---|---|
| Übersichtlichkeit | Desktop (≥ 1100 px): alle Kacheln ohne Scrollen, wenige große Kennzahlen | Vorgabe der Lernsituation, Blick unter Zeitdruck |
| Responsivität | Unter 1100 px normales Scrollen, antippbare Details | Außeneinsatz mit Smartphone/Tablet |
| Aktualität | Siehe Tabelle unten | Veraltete Information ist im Einsatz riskant |
| Barrierefreiheit | 5 Sprachen, hoher Kontrast, Sprachausgabe, Warnstufen nicht nur über Farbe | Mehrsprachige Teams, schlechte Lichtverhältnisse, Hände/Augen oft gebunden |
| Verständlichkeit | Kurzanleitung und Quellenübersicht per Info-Button, keine Anmeldung | Muss ohne Schulung und ohne Technikwissen nutzbar sein |
| Zuverlässigkeit | Fällt eine Quelle aus, bleiben die anderen Kacheln nutzbar | Mehrere unabhängige Drittquellen |
| Transparenz | Quellen benannt, Hinweis „kein offizielles Einsatzmittel, im Notfall 112" | Daten kommen ungeprüft von Dritten |

**Aktualität:** Der Browser lädt beim Öffnen und danach alle 5 Minuten neu. Die Warnungen kommen aus dem Backend und werden nur beim Seiten-Neubau erneuert.

| Inhalt | Aktualisierung |
|---|---|
| Uhrzeit | jede Sekunde |
| Wetter, Luftqualität, Pegel | alle 5 Min. (Messwerte der Quellen selbst etwa alle 15 Min. bis 1 Std.) |
| Brände, Einsätze, Reaktionszeit | alle 5 Min. abgefragt, die Quelle liefert aber nur **Vortageswerte** (Tages-CSV) |
| Amtliche Warnungen | Neubau alle 30 Min.; ein offener Tab lädt sie erst beim Neuladen |
| Gefahrenkarte | statisch, nicht zeitkritisch |

Die Warnungen sind damit die schwächste Stelle. Für den Ernstfall gelten weiter NINA-App und 112, das steht auch in der Kurzanleitung.

## 4. Architektur: Backend & Frontend

Das Dashboard ist kein reines Frontend-Widget (z. B. iFrame), sondern eine Anwendung mit **Astro und Node.js**, die ihre Daten selbst per API abfragt.

| Schicht | Technik | Aufgabe |
|---|---|---|
| Backend | Node.js / Astro (beim Build), GitHub Actions | Ruft NINA-Warnungen serverseitig ab und baut die Seite alle 30 Min. neu |
| Frontend | HTML, CSS, JavaScript im Browser | Lädt Wetter, Luft, Pegel und Feuerwehrdaten live per API, zeichnet Diagramme, Sprache, Kontrast, Sprachausgabe |
| Hosting | GitHub Pages | Auslieferung der gebauten Seite |

**Begründung:** Alle Inhalte kommen per API und müssen ausgewertet werden (z. B. Ø Reaktionszeit aus der CSV). Die NINA-Warnungen erlauben keinen Browser-Zugriff (kein CORS) und gehen nur serverseitig. Die Aufteilung lässt sich später um weitere Quellen oder echte Leitstellendaten erweitern.