# Lagebild-Dashboard · Katastrophenschutz Berlin

Internes Dashboard-Prototyp für die Lernsituation „Dashboard erstellen"
(Berufsschule, Block 1). Führt mehrere Datenquellen für die Lagebeurteilung
zusammen — auf einem Monitor (Leitstelle) als fester Bildschirm ohne
Scrollen, auf Tablet/Smartphone (Außeneinsatz) mit normalem Scrollen.

Gebaut mit [Astro](https://astro.build) als statische Seite. Es gibt keinen
eigenen Server/Backend — fast alle Daten werden beim Öffnen der Seite direkt
im Browser von offenen APIs geladen; eine Ausnahme ist unten erklärt.

## Was das Dashboard zeigt

- **Zeitstempel** – aktuelles Datum und eine live mitlaufende Uhrzeit.
- **Wetter aktuell** für Berlin inkl. 24-Stunden-Temperaturverlauf, Wind/Böen,
  Niederschlag, Luftdruck, UV-Index, Sonnenauf-/-untergang.
- **Luftqualität** (PM2.5/PM10, europäischer Index) — relevant, weil
  Rauch von Bränden die Luft verschlechtern kann.
- **Pegelstand der Spree** an der Messstelle Berlin-Köpenick, mit
  48-Stunden-Verlauf und Tendenz.
- **Brände der Feuerwehr Berlin**: Anzahl vom Vortag mit 14-Tage-Verlauf.
- **Ø Reaktionszeit der Feuerwehr** (Eintreffen 1. Löschfahrzeug), gemittelt
  über die letzten 30 Tage, mit Verlaufs-Chart.
- **Gesamteinsätze** (alle Kategorien) vom Vortag.
- **Amtliche Warnungen** (NINA/BBK: Wetter- und Zivilschutzwarnungen) mit
  Vorschau der aktiven Warnungen und Detailansicht.
- **Gefahrenkarte**: Popup mit der amtlichen Hochwassergefahrenkarte des
  Umweltatlas Berlin (statische Karte, keine Live-Einsatzdaten).
- **7-Tage-Vorhersage**, jeder Tag antippbar für Detailwerte (Niederschlag,
  Regenwahrscheinlichkeit, Wind/Böen, UV, Sonnenauf-/-untergang).

## Barrierefreiheit

Ein Knopf oben rechts (Icon neben der Uhrzeit) öffnet ein Einstellungs-Panel mit:

- **5 Sprachen**: Deutsch, English, Français, Polski, Español. Übersetzt
  wird die komplette Oberfläche inkl. Wetterlagen, Wochentagen und Zahlen-/
  Datumsformat (`toLocaleString` mit der jeweiligen Locale). Die amtlichen
  Warnungen (NINA/BBK) kommen bereits offiziell mehrsprachig vom Bund —
  Überschrift, Beschreibung *und* Handlungsempfehlung sind für alle fünf
  Sprachen einzeln geprüft und wirklich vollständig übersetzt, nicht nur
  der Titel. Ein Sprachwechsel braucht keinen neuen Netzwerk-Request: alle
  Sprachversionen werden beim Laden einmal zwischengespeichert und bei
  Bedarf nur neu gerendert (siehe `src/scripts/i18n.js`).
- **Hoher Kontrast**: verstärkt den Textkontrast (hellere `--muted`-Farbe,
  reduzierte De-Emphase-Deckkraft zurückgedreht), ersetzt die weichen
  Neumorph-Schatten durch klare, sichtbare Kanten und macht Diagramm-
  Gitterlinien deutlicher. Warnstufen-Badges bekommen zusätzlich einen
  Rahmen in ihrer eigenen Farbe. Da Text-, Rahmen- und Schattenfarben im
  ganzen Stylesheet ausschließlich über CSS-Variablen kommen, reicht dafür
  eine reine CSS-Umschaltung — kein Chart wird neu gezeichnet. Zustand und
  Sprache werden in `localStorage` gemerkt.
- **Hell-/Dunkelmodus**: Im selben Einstellungs-Panel lässt sich zwischen
  hellem und dunklem Farbschema wechseln. Die Auswahl bleibt gespeichert;
  der Kontrastmodus funktioniert unabhängig davon in beiden Varianten.
- **Sprachausgabe** (Web Speech API, `SpeechSynthesis`): liest eine kurze
  Zusammenfassung der aktuellen Lage vor (Wetter, Pegel, Brände,
  Luftqualität, Warnungen) — in der gerade gewählten Sprache. Funktioniert
  komplett im Browser, ohne weiteren Dienst; wird automatisch deaktiviert,
  wenn der Browser die API nicht unterstützt.

## Kurzanleitung & Quellen (in der Seite)

Ein zweiter Knopf oben rechts (Info-Symbol, neben dem Barrierefreiheit-
Knopf) öffnet ein Panel mit einer kurzen Bedienungsanleitung für die
(fiktiven) Nutzer:innen beim Katastrophenschutz: was automatisch aktuell
bleibt, was anklickbar ist, wie alt die Warnungen im schlimmsten Fall sein
können, und was zu beachten ist (Lernprojekt statt offizieller Software,
Gefahrenkarte ist statisch, Daten kommen ungeprüft von Drittquellen, im
Notfall 112). Am Ende steht dieselbe Datenquellen-Tabelle wie unten, jeweils
mit Link — auch das komplett in allen fünf Sprachen.

## Datenquellen

| Daten | Quelle | Besonderheit |
|---|---|---|
| Wetter aktuell, 24h-Verlauf, 7-Tage-Vorhersage | [Open-Meteo](https://open-meteo.com/) (`api.open-meteo.com`) | Live-Fetch im Browser |
| Luftqualität (PM2.5/PM10, EAQI) | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Live-Fetch im Browser |
| Pegelstand Spree · Berlin-Köpenick | [PEGELONLINE (WSV)](https://www.pegelonline.wsv.de/webservice/guideRestapi), Station `BERLIN-KÖPENICK` | Live-Fetch im Browser |
| Brände, Gesamteinsätze, Ø Reaktionszeit | [Berliner Feuerwehr – Open Data](https://github.com/Berliner-Feuerwehr/BF-Open-Data) (tägliche CSV) | Live-Fetch im Browser |
| Amtliche Warnungen | [NINA/BBK](https://warnung.bund.de) (`warnung.bund.de/api31`), AGS `110000000000` (Berlin) | **Kein CORS** → Abruf serverseitig beim Seiten-Build (Astro-Frontmatter), nicht im Browser. Deshalb baut der Deploy-Workflow die Seite zusätzlich alle 30 Minuten automatisch neu. |
| Gefahrenkarte (Hochwasser) | [Umweltatlas Berlin / GDI Berlin](https://gdi.berlin.de/services/wms/ua_hochwassergefahrenkarten) (WMS) | Statisches Kartenbild (`<img>`), keine Live-Daten |

Alle Quellen sind öffentlich und benötigen keinen API-Key.

### Warum diese Quellen und Widgets?

Die Auswahl verbindet die für eine schnelle Lageübersicht wichtigsten
Bereiche mit öffentlich zugänglichen, möglichst direkt abrufbaren Daten:

- **Wetter und Luftqualität (Open-Meteo):** Wetterlage, kurzfristiger Verlauf
  und Vorhersage geben den meteorologischen Kontext; PM2.5/PM10 ergänzen die
  Brandeinsätze um einen Hinweis auf mögliche Rauchbelastung.
- **Pegel (PEGELONLINE/WSV):** Die Messstelle Berlin-Köpenick liefert einen
  örtlichen Wasserstand samt Verlauf und Tendenz für die Spree.
- **Feuerwehr (Berliner Feuerwehr Open Data):** Tageszahlen zu Bränden und
  Gesamteinsätzen zeigen das Einsatzaufkommen; die mittlere Eintreffzeit des
  ersten Löschfahrzeugs ergänzt es um einen zeitlichen Leistungsindikator.
- **Amtliche Warnungen (NINA/BBK):** Warnungen sind für die Lagebeurteilung
  vorrangig. Da der Browserzugriff durch CORS verhindert wird, kommen sie aus
  dem Seiten-Build und werden im Workflow regelmäßig erneuert.
- **Hochwassergefahrenkarte (Umweltatlas Berlin):** Sie ergänzt den aktuellen
  Pegel um die amtliche, langfristige Gefährdungslage. Sie ist ausdrücklich
  keine Live-Einsatzkarte.

Die Kombination vermeidet Kennzahlen, für die keine verlässliche öffentliche
Quelle verfügbar ist. Die Oberfläche kennzeichnet Aktualisierungsstände und
Fehler; sie ersetzt keine amtlichen Warn- oder Einsatzsysteme.

## Konfiguration

Für den lokalen Start ist keine Konfiguration nötig. Die mitgelieferte
`astro.config.mjs` ist zugleich die verwendbare Vorlage für dieses Repository:

| Datei | Einstellung | Zweck / Anpassung |
|---|---|---|
| `astro.config.mjs` | `site` | Öffentliche Domain der GitHub-Pages-Site. Bei einem anderen GitHub-Nutzer oder einer eigenen Domain anpassen. |
| `astro.config.mjs` | `base` | Repository-Unterpfad, z. B. `/katastrophenschutz-dashboard`. Für eine Root-Domain auf `/` setzen. |
| `package.json` | `scripts` und `engines.node` | Start-, Build- und Vorschau-Befehle sowie erforderliche Node-Version. Nur ändern, wenn Laufzeit oder Tooling angepasst werden. |
| `.github/workflows/deploy.yml` | `schedule` | Aktualisierungsintervall der beim Build geladenen Warnungen. Der Zeitplan kann bei Bedarf angepasst oder entfernt werden. |
| `src/pages/index.astro` | `DASHBOARD_TEST_WARNING` | Optionaler lokaler Build-Schalter für eine Beispielwarnung; im normalen Build nicht setzen. |

Nach einer Änderung an `site` oder `base` lokal mit `npm run build` prüfen
und die URL an den neuen öffentlichen Pfad anpassen. Die Datenquellen selbst
sind im Code fest auf Berlin und die oben genannten offenen Dienste
ausgerichtet; ein Wechsel des Einsatzgebiets erfordert daher auch Änderungen
an den Koordinaten, Stationskennung und Warngebietskennung.

## Geprüft, aber nicht umgesetzt

Bei der Auswahl weiterer Datenquellen wurde eine längere Liste möglicher
Katastrophenschutz-Kennzahlen durchgeprüft (Einsatzorte, Einsatzkräfte,
Notunterkünfte, Ressourcen, Verkehr, Infrastruktur, Kommunikation …). Der
größte Teil davon ist grundsätzlich internes Leitstellen-Wissen ohne
öffentliche API (z. B. laufende Einsätze, verfügbare Kräfte/Fahrzeuge,
Notunterkünfte, Ressourcenbestände) und wurde deshalb nicht umgesetzt.

Ein konkreter, dokumentierter Sonderfall:

- **Straßensperrungen (VIZ Berlin)** — eine offene, CORS-fähige GeoJSON-API
  existiert (`api.viz.berlin.de/daten/baustellen_sperrungen.json`, dieselbe
  Quelle wie die offizielle Karte auf viz.berlin.de) und wurde erfolgreich
  getestet. Der Datensatz selbst ist jedoch seit dem **2. Juli 2025**
  eingefroren (verifiziert über absteigende Sortierung nach Zeitstempel
  über alle 387 Einträge) — die Berliner Pipeline dahinter scheint seit über
  einem Jahr nicht mehr befüllt zu werden. Eine "aktuelle" Sperrungen-Kachel
  auf diesen Daten wäre irreführend und wurde deshalb bewusst nicht gebaut.
  Falls die Quelle wieder aktiv gepflegt wird, ist die Anbindung technisch
  unkompliziert (funktioniert wie die anderen Live-Fetches im Browser).

## Projekt lokal ausführen

Diese Anleitung ist für Einsteiger gedacht. Es werden keine Vorkenntnisse vorausgesetzt.

**Ergebnis:** Das Dashboard läuft lokal unter:

```text
http://localhost:4321/katastrophenschutz-dashboard/
```

**Dauer:** ca. 10–15 Minuten

---

## 1. Terminal öffnen

### Windows

PowerShell öffnen:

```text
Startmenü → PowerShell
```

### macOS

```text
Cmd + Leertaste → Terminal
```

### Linux

```text
Strg + Alt + T
```

---

## 2. Node.js installieren

Für dieses Projekt wird **Node.js 22.12 oder neuer** benötigt.

### Windows

```powershell
winget install OpenJS.NodeJS.LTS
```

### macOS

Falls Homebrew noch nicht installiert ist:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Danach:

```bash
brew install node
```

### Linux

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Terminal neu öffnen und anschließend:

```bash
nvm install --lts
```

---

## Installation prüfen

```bash
node --version
npm --version
```

Die Node-Version sollte mindestens **v22.12.0** sein.

---

## 3. Projekt entpacken

### Windows

```powershell
cd $HOME\Downloads
Expand-Archive projekt.zip .
```

### macOS / Linux

```bash
cd ~/Downloads
unzip projekt.zip
```

Danach in den Projektordner wechseln:

```bash
cd ordnername
```

Prüfen:

```bash
ls
```

oder unter Windows:

```powershell
dir
```

Folgende Dateien sollten sichtbar sein:

```text
package.json
README.md
src
```

---

## 4. Abhängigkeiten installieren

Einmalig ausführen:

```bash
npm install
```

Dabei werden alle benötigten Bibliotheken installiert.

---

## 5. Entwicklungsserver starten

```bash
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:4321/katastrophenschutz-dashboard/
```

**Wichtig:** Der Teil

```text
/katastrophenschutz-dashboard/
```

muss Bestandteil der URL sein.

Das Terminal muss geöffnet bleiben.

Beenden:

```text
Strg + C
```

---

## 6. Produktions-Build testen (zum lokalen Testen nicht notwendig)

```bash
npm run build
npm run preview
```

- `npm run build` erstellt die fertige Version im Ordner `dist`
- `npm run preview` startet diese lokal

---

## Beispielwarnung anzeigen

Da häufig keine echte Warnung aktiv ist, kann eine Testwarnung eingeblendet werden.

### macOS / Linux

```bash
DASHBOARD_TEST_WARNING=1 npm run build && npm run preview
```

### Windows (Eingabeaufforderung)

```cmd
set DASHBOARD_TEST_WARNING=1 && npm run build && npm run preview
```

### Windows (PowerShell)

```powershell
$env:DASHBOARD_TEST_WARNING=1
npm run build
npm run preview
```

---

# Häufige Probleme

## Node oder npm wird nicht gefunden

Node.js ist nicht korrekt installiert oder das Terminal wurde vor der Installation geöffnet.

**Lösung:**

- Terminal schließen
- Neues Terminal öffnen
- Installation erneut prüfen

---

## PowerShell meldet „Ausführung von Skripts ist deaktiviert“

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Danach PowerShell neu starten.

---

## winget wird nicht gefunden

- Microsoft App Installer aktualisieren
- Alternativ Node.js manuell installieren

---

## Node-Version zu alt

### Windows

```powershell
winget upgrade OpenJS.NodeJS.LTS
```

### macOS

```bash
brew upgrade node
```

### Linux

```bash
nvm install --lts
```

---

## package.json wird nicht gefunden

Du befindest dich im falschen Ordner.

Mit `cd` in den Projektordner wechseln.

---

## 404 oder leere Seite

Die URL muss mit folgendem Pfad enden:

```text
/katastrophenschutz-dashboard/
```

---

## Port 4321 wird bereits verwendet

Ein anderer Dev-Server läuft bereits.

**Lösung:**

```text
Strg + C
```

im alten Terminalfenster.

---

## Daten-Kacheln bleiben leer

Internetverbindung prüfen.

Einige Schulnetzwerke blockieren bestimmte Schnittstellen.

---

## Keine aktiven Warnungen

Das ist normal.

Zum Testen kann die Beispielwarnung verwendet werden.

---

## npm install zeigt Warnungen

Meldungen wie

```text
warn
deprecated
```

sind meist unkritisch.

Relevante Fehler beginnen typischerweise mit:

```text
ERR!
error
```

---

## Kurzfassung

```bash
# Einmalig
npm install

# Dashboard starten
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:4321/katastrophenschutz-dashboard/
```

## Deployment (GitHub Pages)

Das Deployment läuft automatisch über GitHub Actions
(`.github/workflows/deploy.yml`): Jeder Push auf `main` baut die Seite mit
Astro und veröffentlicht sie auf GitHub Pages. Zusätzlich baut ein
Zeitplan (`schedule: */30 * * * *`) die Seite alle 30 Minuten neu, damit die
serverseitig geladenen Warnungen aktuell bleiben.

Einmalig in den Repository-Einstellungen einrichten:

1. **Settings → Pages → Source** auf **„GitHub Actions"** stellen (nicht
   „Deploy from a branch").
2. Einmal auf `main` pushen — der Workflow läuft automatisch an.

Die Seite ist danach erreichbar unter:

```
https://til2001.github.io/katastrophenschutz-dashboard/
```

`site` und `base` in [`astro.config.mjs`](astro.config.mjs) sind bereits
auf dieses Repository eingestellt. Bei einem anderen Repo-Namen oder
GitHub-Nutzernamen dort anpassen.

## Responsive-Verhalten

- **Desktop / Leitstellen-Monitor** (≥ 1100px): fester Bildschirm ohne
  Scrollen (Vorgabe der Lernsituation).
- **Tablet / Smartphone** (< 1100px): normales, natürliches Scrollen — für
  den Außeneinsatz sinnvoller als ein gequetschter No-Scroll-Screen.

## Projektstruktur

```
src/
  pages/index.astro     Seitenstruktur, Layout, Styles, serverseitiger
                         Warnungen-Abruf (Astro-Frontmatter)
  scripts/dashboard.js  Live-Daten laden (Wetter, Luft, Pegel, Brände),
                         Uhr, generische Chart-Zeichenfunktionen, Modals
  scripts/i18n.js       Übersetzungen, Zahlen-/Datumsformate, Theme- und
                         Kontrast-Einstellungen
public/                 Statische Dateien wie Favicons
astro.config.mjs        Zieladresse und Basis-Pfad für GitHub Pages
package.json            Abhängigkeiten sowie Start-, Build- und Preview-Befehle
legacy/
  ScheererTilWeatherApp.html   Erster Prototyp (Einzeldatei, vor der Astro-Umstellung)
.github/workflows/deploy.yml   Build & Deploy nach GitHub Pages (push + Zeitplan)
```

## Begründung der Implementierung

Das Dashboard ist in eine Build-Phase und eine Browser-Phase aufgeteilt. Astro
erzeugt beim Build aus `src/pages/index.astro` die statische HTML-Seite. In
deren Frontmatter werden die amtlichen NINA-Warnungen serverseitig abgerufen
und als JSON in die Seite eingebettet. Das ist nötig, weil der Browserzugriff
auf diese API durch CORS blockiert wird. Ein dauerhaft laufendes Backend gibt
es nicht: GitHub Pages liefert nur die fertigen Dateien aus. GitHub Actions
baut sie bei Änderungen und zusätzlich alle 30 Minuten neu, damit die
eingebetteten Warnungen regelmäßig aktualisiert werden.

Nach dem Laden übernimmt `src/scripts/dashboard.js` die Daten, die direkt im
Browser abrufbar sind: Wetter und Luftqualität von Open-Meteo, den Pegel von
PEGELONLINE sowie die Tages-CSV der Berliner Feuerwehr. Das Script aktualisiert
die Anzeigen, zeichnet die Diagramme und steuert die Detailfenster. Die
einzelnen Datenbereiche werden getrennt geladen; fällt eine Quelle aus, können
die übrigen Kacheln weiterhin funktionieren. `src/scripts/i18n.js` hält die
Übersetzungen und verwaltet Sprache, Hell-/Dunkelmodus und hohen Kontrast.

Diese Aufteilung passt zum statischen Hosting: Für die meisten öffentlichen
APIs ist kein eigener Server nötig, während nur die CORS-beschränkten Warnungen
beim Build verarbeitet werden. Das reduziert Betrieb und Infrastruktur, ohne
auf die benötigten Kennzahlen und Funktionen zu verzichten. Die Gefahrenkarte
wird als statisches Kartenbild eingebunden und deshalb ausdrücklich nicht als
Live-Einsatzinformation dargestellt.

## Stand

Design-Richtung „Weich" (neumorphes Soft-UI) ist umgesetzt und an echte
Live-Daten angebunden. Alle in diesem README gelisteten Datenquellen sind
produktiv im Einsatz.
