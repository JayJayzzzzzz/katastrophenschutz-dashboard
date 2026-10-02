# Lagebild-Dashboard · Katastrophenschutz Berlin

Internes Dashboard-Prototyp für die Lernsituation „Dashboard erstellen"
(Berufsschule, Block 1). Führt mehrere Datenquellen für die Lagebeurteilung
zusammen — auf einem Monitor (Leitstelle) als fester Bildschirm ohne
Scrollen, auf Tablet/Smartphone (Außeneinsatz) mit normalem Scrollen.

**Version 2.0.0** · Julian Schaefers, Til Scheerer

Gebaut mit [Astro](https://astro.build) als statisch generierte Seite. Es gibt
kein eigenes Backend: Fast alle Daten lädt der Browser beim Öffnen der Seite
direkt von offenen APIs. Die einzige Ausnahme sind die amtlichen Warnungen.
Sie werden beim Bauen der Seite abgerufen (siehe
[Architektur](#architektur-und-begründung-der-implementierung)).

## Was das Dashboard zeigt

- **Zeitstempel** – aktuelles Datum und eine live mitlaufende Uhrzeit.
- **Wetter aktuell** für Berlin inkl. 24-Stunden-Temperaturverlauf, Wind/Böen,
  Niederschlag, Luftdruck, UV-Index, Sonnenauf-/-untergang.
- **Luftqualität** (PM2.5/PM10, europäischer Index) — relevant, weil
  Rauch von Bränden die Luft verschlechtern kann.
- **Pegelstand der Spree** an der Messstelle Berlin-Köpenick als
  Pegellatte mit den amtlichen Kennwerten und einem Flussquerschnitt, der bis
  zum aktuellen Stand gefüllt ist; dazu Einordnung (normal / erhöht / …) und
  Tendenz über 24 Stunden.
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
- **Sprachausgabe**: liest eine kurze Zusammenfassung der aktuellen Lage vor
  (Wetter, Pegel, Brände, Luftqualität, Warnungen) — in der gerade gewählten
  Sprache. Details siehe [Sprachausgabe](#sprachausgabe-browser-stimmen-und-lokales-sprachmodell).
- **Tastaturbedienung**: Alle Bedienelemente sind per Tab erreichbar und
  sichtbar fokussiert. Enter öffnet Details, Esc schließt ein Fenster. Solange
  ein Fenster offen ist, bleibt der Fokus darin; nach dem Schließen springt er
  zurück zum auslösenden Knopf.

## Kurzanleitung & Quellen (Anwenderdokumentation in der Seite)

Ein zweiter Knopf oben rechts (Info-Symbol, neben dem Barrierefreiheit-
Knopf) öffnet die Anwenderdokumentation für die (fiktiven) Nutzer:innen beim
Katastrophenschutz: was automatisch aktuell bleibt, was anklickbar ist, wie
die Tastaturbedienung funktioniert, wie alt die Warnungen sein können, und was
zu beachten ist (Lernprojekt statt offizieller Software, Gefahrenkarte ist
statisch, Daten stammen von externen Quellen und können abweichen, im Notfall
112). Im zweiten Reiter stehen die Datenquellen mit Link und Begründung sowie
die Versionsnummer — alles in allen fünf Sprachen.

## Pegel-Kachel: Einordnung statt Rauschen

Die Kachel zeigt links eine Pegellatte mit farbigen Bereichen und einer
Wassersäule bis zum aktuellen Stand, rechts einen stilisierten
Flussquerschnitt, der bis zum aktuellen Stand gefüllt ist. Die Linien sind
die amtlichen Kennwerte der Messstelle, die das Dashboard live von
PEGELONLINE abruft:

| Kennwert | Bedeutung | Köpenick |
|---|---|---|
| NNW | niedrigster je gemessener Stand | 53 cm |
| MNW | mittlerer Niedrigwasserstand (2010–2020) | 83 cm |
| MW | Mittelwasser | 87 cm |
| MHW | mittlerer Hochwasserstand | 96 cm |
| HHW | höchster je gemessener Stand | 165 cm |

Daraus leitet das Dashboard die Einordnung ab: niedrig unter MNW, normal bis
MHW, erhöht bis zur Mitte zwischen MHW und HHW (≈ 130 cm), hoch darüber,
Rekordnähe ab 10 cm unter HHW. Das ist eine **eigene Einteilung**:
PEGELONLINE liefert für Köpenick keine Hochwasser-Meldestufen. Die Tendenz
vergleicht den aktuellen Wert mit dem von vor 24 Stunden; unter 2 cm
Unterschied gilt der Pegel als stabil, weil die Messauflösung 1 cm beträgt.

Warum so: Die Spree ist in Köpenick reguliert und schwankt meist nur um
1–3 cm. Ein Verlaufsdiagramm zeigte fast nur Messrauschen und wirkte bei
automatischer Skalierung sogar dramatisch. Für die Lage zählt die Frage „Ist
das normal?“, und die beantwortet die Einordnung an den amtlichen Kennwerten
auf einen Blick. Der Querschnitt ist eine Illustration, nicht die echte Form
des Flussbetts.

## Sprachausgabe: Browser-Stimmen und lokales Sprachmodell

Welche Stimmen ein Browser zum Vorlesen anbietet, hängt von Browser und
Betriebssystem ab. Windows bringt meist nur Stimmen für die Systemsprache und
Englisch mit; Chrome ergänzt eigene Online-Stimmen („Google français“ …),
Edge sehr natürliche Online-Stimmen („Microsoft … Online (Natural)“), Firefox
nutzt nur die installierten Windows-Stimmen. Das Dashboard geht deshalb in
dieser Reihenfolge vor:

1. **Stimme des Browsers** (Web Speech API): Das Dashboard wählt die passende
   Stimme selbst aus und bevorzugt natürlich klingende vor den klassischen
   Systemstimmen. Nur die Sprache zu setzen reicht nicht — ohne ausdrückliche
   Stimmenwahl liest z. B. Chrome französischen Text mit der englischen
   Standardstimme vor. Vorgelesen wird satzweise, weil Chrome lange Texte bei
   Online-Stimmen sonst nach etwa 15 Sekunden abbricht.
2. **Lokales Sprachmodell** ([Piper TTS](https://github.com/rhasspy/piper)),
   nur wenn der Browser für die gewählte Sprache keine Stimme hat: Im
   Barrierefreiheit-Panel erscheint dann unter dem Vorlesen-Knopf ein Knopf
   **„Stimme herunterladen“** mit Größenangabe und Hinweis; das Vorlesen ist
   bis dahin gesperrt. **Heruntergeladen wird nur nach diesem Klick**, nie
   automatisch. Die Stimme wird in Abschnitten von 2 MB geladen; schlägt ein
   Abschnitt fehl, wird nur dieser bis zu fünfmal wiederholt. In einem Stück
   brach der Download bei langsamem 3G nach rund 10 Minuten ab und hätte von
   vorn beginnen müssen. Danach läuft das Modell direkt im Browser
   (WebAssembly) und bleibt dort gespeichert (Origin Private File System);
   beim nächsten Mal startet das Vorlesen sofort.
3. Kann der Browser auch kein WebAssembly ausführen, wird der Knopf mit
   Erklärung deaktiviert — nie wird mit falscher Stimme vorgelesen.

**Warum der Download nur auf Klick:** Eine Stimme ist rund 60 MB groß, beim
allerersten Mal kommen Laufzeit und Aussprache-Daten (≈ 30 MB) dazu. Auf
Mobilfunk im Außeneinsatz kostet das spürbar Zeit und Datenvolumen; das soll
niemand unbemerkt auslösen. Der normale Seitenaufruf lädt vom Sprachmodell
nichts — der Code dafür wird erst bei Bedarf nachgeladen.

| Sprache | Stimme (Qualität „medium“) | Größe | Lizenz |
|---|---|---|---|
| Deutsch | thorsten | 60 MB | CC0 |
| Englisch | cori | 61 MB | gemeinfrei |
| Französisch | siwis | 60 MB | CC BY 4.0 (Namensnennung im Info-Panel) |
| Polnisch | gosia | 60 MB | CC0 |
| Spanisch | davefx | 60 MB | CC0 |

Die Stimmen kommen von Hugging Face, die KI-Laufzeit (onnxruntime-web) von
cdnjs und die Aussprache-Daten (eSpeak) von jsDelivr. Im Projekt selbst liegt
davon nichts: `npm install` lädt nur den Programmcode
(`@mintplex-labs/piper-tts-web`, `onnxruntime-web` in genau Version 1.18.0,
passend zur WASM-Datei auf cdnjs).

### Gemessene Ladezeiten

Gemessen im echten Chrome mit gedrosselter Verbindung (Chrome DevTools
Protocol), jeweils mit neuem, leerem Browserprofil:

| Verbindung | Seitenaufruf bis alle Kacheln Daten zeigen | Übertragen | Mit Cache | Stimme herunterladen (≈ 71 MB) |
|---|---|---|---|---|
| ungedrosselt | 0,3 s | 603 KB | 0,1 s | 5–20 s |
| Glasfaser 100 Mbit/s | 0,4 s | 603 KB | 0,1 s | 26–41 s |
| Kabel 50 Mbit/s | 0,4 s | 603 KB | 0,1 s | 18–25 s |
| DSL 16 Mbit/s | 0,7 s | 660 KB | 0,2 s | 41 s |
| LTE 12 Mbit/s | 0,8 s | 660 KB | 0,3 s | 53–115 s |
| 3G 1,6 Mbit/s | 3,9 s | 660 KB | 0,6 s | 9,2 min |
| 3G 0,4 Mbit/s | 14,4 s | 660 KB | 1,6 s | in einem Stück nach ≈ 10 min abgebrochen; seither abschnittsweise (rechnerisch ≈ 25 min) |

- Der Seitenaufruf lädt vom Sprachmodell nichts.
- Nach dem Download ist der erste Ton nach 0,4–2,6 s zu hören. Während des
  Vorlesens und nach einem Neuladen wird nichts mehr nachgeladen.
- Ab etwa 50 Mbit/s bestimmt nicht die eigene Leitung, sondern der Server von
  Hugging Face die Dauer; zwei Messungen derselben Verbindung lagen bis zu
  15 Sekunden auseinander.
- Geprüft für Französisch, Polnisch und Spanisch. Der abschnittsweise Download wurde ungedrosselt geprüft; bei 0,4 Mbit/s wurde er nicht erneut bis zum Ende gemessen.

## Datenquellen

| Daten | Quelle | Besonderheit |
|---|---|---|
| Wetter aktuell, 24h-Verlauf, 7-Tage-Vorhersage | [Open-Meteo](https://open-meteo.com/) (`api.open-meteo.com`) | Live-Fetch im Browser |
| Luftqualität (PM2.5/PM10, EAQI) | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Live-Fetch im Browser |
| Pegelstand Spree · Berlin-Köpenick, amtliche Kennwerte | [PEGELONLINE (WSV)](https://www.pegelonline.wsv.de/webservice/guideRestapi), Station `BERLIN-KÖPENICK` | Live-Fetch im Browser; Kennwerte mit Rückfallwerten im Code |
| Brände, Gesamteinsätze, Ø Reaktionszeit | [Berliner Feuerwehr – Open Data](https://github.com/Berliner-Feuerwehr/BF-Open-Data) (tägliche CSV) | Live-Fetch im Browser |
| Amtliche Warnungen | [NINA/BBK](https://warnung.bund.de) (`warnung.bund.de/api31`), AGS `110000000000` (Berlin) | **Kein Browser-Zugriff möglich** (die API sendet keinen `Access-Control-Allow-Origin`-Header) → Abruf zur Build-Zeit in Node.js, Ergebnis wird in die Seite eingebettet. Aktuell nur bis zum letzten Build, siehe [Architektur](#architektur-und-begründung-der-implementierung). |
| Gefahrenkarte (Hochwasser) | [Umweltatlas Berlin / GDI Berlin](https://gdi.berlin.de/services/wms/ua_hochwassergefahrenkarten) (WMS) | Statisches Kartenbild (`<img>`), keine Live-Daten |

Alle Quellen sind öffentlich und benötigen keinen API-Key.

### Warum diese Quellen und Widgets?

Die Auswahl verbindet die für eine schnelle Lageübersicht wichtigsten
Bereiche mit öffentlich zugänglichen, möglichst direkt abrufbaren Daten:

- **Wetter und Luftqualität (Open-Meteo):** Wetterlage, kurzfristiger Verlauf
  und Vorhersage geben den meteorologischen Kontext; PM2.5/PM10 ergänzen die
  Brandeinsätze um einen Hinweis auf mögliche Rauchbelastung.
- **Pegel (PEGELONLINE/WSV):** Die Messstelle Berlin-Köpenick liefert den
  örtlichen Wasserstand der Spree und ihre amtlichen Kennwerte. Die Spree ist
  dort durch Wehre und Schleusen reguliert; in 30 Tagen schwankte der Pegel
  nur zwischen 85 und 89 cm. Ein Zeitverlauf zeigte deshalb fast nur
  Messrauschen. Die Kachel ordnet den Stand stattdessen ein (siehe unten).
- **Feuerwehr (Berliner Feuerwehr Open Data):** Tageszahlen zu Bränden und
  Gesamteinsätzen zeigen das Einsatzaufkommen; die mittlere Eintreffzeit des
  ersten Löschfahrzeugs ergänzt es um einen zeitlichen Leistungsindikator.
- **Amtliche Warnungen (NINA/BBK):** Warnungen sind für die Lagebeurteilung
  vorrangig und kommen direkt vom Bund, mehrsprachig und mit
  Handlungsempfehlung. Weil der Browser sie nicht direkt abrufen darf, werden
  sie beim Bauen der Seite geladen; das Dashboard zeigt deshalb ihr Alter an.
- **Hochwassergefahrenkarte (Umweltatlas Berlin):** Sie ergänzt den aktuellen
  Pegel um die amtliche, langfristige Gefährdungslage. Sie ist ausdrücklich
  keine Live-Einsatzkarte.

Die Kombination vermeidet Kennzahlen, für die keine verlässliche öffentliche
Quelle verfügbar ist. Die Oberfläche kennzeichnet Aktualisierungsstände und
Fehler; sie ersetzt keine amtlichen Warn- oder Einsatzsysteme.

## Konfiguration

Für den lokalen Start ist **keine Konfiguration nötig** — alle Datenquellen
sind öffentlich und brauchen keinen API-Key. Angepasst werden muss nur etwas,
wenn man das Dashboard selbst veröffentlichen oder vorführen möchte.

### Vorlage `.env.example`

Lokale Einstellungen stehen in einer `.env`-Datei. Als direkt verwendbare
Vorlage liegt `.env.example` bei:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

| Variable | Werte | Zweck |
|---|---|---|
| `DASHBOARD_TEST_WARNING` | `0` (Standard) / `1`–`3` | Blendet 1 bis 3 Beispielwarnungen ein, auch wenn gerade keine echte Warnung aktiv ist (ab 2 sieht man das Blättern im Warnungen-Fenster). Nur zum Testen und Vorführen, nie für das veröffentlichte Dashboard. |

Die `.env` wird bei `npm run dev` und `npm run build` gelesen und nicht ins
Repository übernommen (`.gitignore`).

### Weitere Einstellungen

| Datei | Einstellung | Zweck / Anpassung |
|---|---|---|
| `astro.config.mjs` | `site` | Öffentliche Domain der GitHub-Pages-Site. Bei einem anderen GitHub-Nutzer oder einer eigenen Domain anpassen. |
| `astro.config.mjs` | `base` | Repository-Unterpfad, z. B. `/katastrophenschutz-dashboard`. Für eine Root-Domain auf `/` setzen. Bestimmt auch die lokale Adresse. |
| `package.json` | `version`, `scripts`, `engines.node` | Versionsnummer (wird im Info-Panel angezeigt), Start-/Build-/Vorschau-Befehle und erforderliche Node-Version. |
| `.github/workflows/deploy.yml` | `schedule` | Wie oft GitHub die Seite neu bauen soll — und damit, wie oft die Warnungen aktualisiert werden. GitHub hält den Zeitplan nicht garantiert ein (siehe [Architektur](#architektur-und-begründung-der-implementierung)). |

Nach einer Änderung an `site` oder `base` lokal mit `npm run build` prüfen
und die URL an den neuen öffentlichen Pfad anpassen. Die Datenquellen selbst
sind im Code fest auf Berlin ausgerichtet; ein Wechsel des Einsatzgebiets
erfordert Änderungen an den Koordinaten (`BERLIN_LAT`/`BERLIN_LON` in
`src/scripts/dashboard.js`), der
Pegel-Station (`PEGEL_UUID`) und dem Warngebiet (`NINA_AGS` in
`src/pages/index.astro`).

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

### 1. Terminal öffnen

#### Windows

PowerShell öffnen:

```text
Startmenü → PowerShell
```

#### macOS

```text
Cmd + Leertaste → Terminal
```

#### Linux

```text
Strg + Alt + T
```

---

### 2. Node.js installieren

Für dieses Projekt wird **Node.js 22.12 oder neuer** benötigt.

#### Windows

```powershell
winget install OpenJS.NodeJS.LTS
```

#### macOS

Falls Homebrew noch nicht installiert ist:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Danach:

```bash
brew install node
```

#### Linux

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Terminal neu öffnen und anschließend:

```bash
nvm install --lts
```

---

### Installation prüfen

```bash
node --version
npm --version
```

Die Node-Version sollte mindestens **v22.12.0** sein.

---

### 3. Projekt entpacken

#### Windows

```powershell
cd $HOME\Downloads
Expand-Archive projekt.zip .
```

#### macOS / Linux

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

### 4. Abhängigkeiten installieren

Einmalig ausführen:

```bash
npm install
```

Dabei werden alle benötigten Bibliotheken installiert.

---

### 5. Entwicklungsserver starten

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

### 6. Produktions-Build testen (zum lokalen Testen nicht notwendig)

```bash
npm run build
npm run preview
```

- `npm run build` erstellt die fertige Version im Ordner `dist`
- `npm run preview` startet diese lokal

---

### Beispielwarnung anzeigen

Da häufig keine echte Warnung aktiv ist, kann eine Testwarnung eingeblendet
werden. Am einfachsten über die Vorlage `.env.example` (siehe
[Konfiguration](#konfiguration)): nach `.env` kopieren, dort
`DASHBOARD_TEST_WARNING=1` setzen und `npm run dev` neu starten. Zum
Ausschalten wieder `0` eintragen oder die `.env` löschen.

Alternativ einmalig direkt im Terminal:

#### macOS / Linux

```bash
DASHBOARD_TEST_WARNING=1 npm run build && npm run preview
```

#### Windows (Eingabeaufforderung)

```cmd
set "DASHBOARD_TEST_WARNING=1" && npm run build && npm run preview
```

#### Windows (PowerShell)

```powershell
$env:DASHBOARD_TEST_WARNING=1
npm run build
npm run preview
```

Unter PowerShell bleibt die Variable bis zum Schließen des Fensters gesetzt.
Danach wieder abschalten, sonst enthält auch der nächste Build die
Testwarnung:

```powershell
Remove-Item Env:DASHBOARD_TEST_WARNING
```

---

## Häufige Probleme

### Node oder npm wird nicht gefunden

Node.js ist nicht korrekt installiert oder das Terminal wurde vor der Installation geöffnet.

**Lösung:**

- Terminal schließen
- Neues Terminal öffnen
- Installation erneut prüfen

---

### PowerShell meldet „Ausführung von Skripts ist deaktiviert“

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Danach PowerShell neu starten.

---

### winget wird nicht gefunden

- Microsoft App Installer aktualisieren
- Alternativ Node.js manuell installieren

---

### Node-Version zu alt

#### Windows

```powershell
winget upgrade OpenJS.NodeJS.LTS
```

#### macOS

```bash
brew upgrade node
```

#### Linux

```bash
nvm install --lts
```

---

### package.json wird nicht gefunden

Du befindest dich im falschen Ordner.

Mit `cd` in den Projektordner wechseln.

---

### 404 oder leere Seite

Die URL muss mit folgendem Pfad enden:

```text
/katastrophenschutz-dashboard/
```

---

### Port 4321 wird bereits verwendet

Ein anderer Dev-Server läuft bereits.

**Lösung:**

```text
Strg + C
```

im alten Terminalfenster.

---

### Daten-Kacheln bleiben leer

Internetverbindung prüfen.

Einige Schulnetzwerke blockieren bestimmte Schnittstellen.

---

### Keine aktiven Warnungen

Das ist normal.

Zum Testen kann die Beispielwarnung verwendet werden.

---

### npm install zeigt Warnungen

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

### `npm run build` meldet „Module "crypto"/"fs"/"path" has been externalized“

Unkritisch. Die Meldungen stammen aus dem Sprachmodell-Paket (Piper), das
auch Code für Node.js enthält. Dieser Teil wird im Browser nie ausgeführt.

---

## Kurzfassung: lokal starten

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
Astro und veröffentlicht sie auf GitHub Pages. Zusätzlich fordert ein
Zeitplan (`schedule: */30 * * * *`) alle 30 Minuten einen neuen Build an,
damit die beim Build geladenen Warnungen erneuert werden. GitHub führt diese
geplanten Läufe allerdings nur nach Kapazität aus — tatsächlich lagen
zwischen zwei Läufen 3 bis 7 Stunden. In öffentlichen Repositories werden
geplante Workflows außerdem nach 60 Tagen ohne Aktivität automatisch
deaktiviert.

Einmalig in den Repository-Einstellungen einrichten:

1. **Settings → Pages → Source** auf **„GitHub Actions"** stellen (nicht
   „Deploy from a branch").
2. Einmal auf `main` pushen — der Workflow läuft automatisch an.

Die Seite ist danach erreichbar unter:

```
https://jayjayzzzzzz.github.io/katastrophenschutz-dashboard/
```

`site` und `base` in [`astro.config.mjs`](astro.config.mjs) sind bereits
auf dieses Repository eingestellt. Bei einem anderen Repo-Namen oder
GitHub-Nutzernamen dort anpassen.

## Responsive-Verhalten

- **Desktop / Leitstellen-Monitor** (ab 1101 px Breite): fester Bildschirm
  **ohne jedes Scrollen** (Vorgabe der Lernsituation) — weder die Seite noch
  eine Kachel noch ein Fenster scrollt. Das gilt auch bei wenig Höhe, z. B.
  1280×720, 150 % Browser-Zoom oder einem 1366×768-Laptop, bei dem nach
  Browser- und Taskleiste nur ≈ 650 px sichtbar bleiben. Statt zu scrollen
  passt sich der Inhalt an:
  - Unter 760 px und unter 660 px Höhe werden Abstände, Schriften und die
    Vorhersage-Kacheln in zwei Stufen kompakter.
  - Die Gefahrenkarte im Fenster schrumpft mit der verfügbaren Höhe.
  - Die Kurzanleitung verteilt Anleitung und Quellen auf zwei Reiter, wenn
    beides zusammen nicht passt (unter 820 px Höhe).
  - Mehrere Warnungen zeigt das Warnungen-Fenster einzeln zum Blättern
    („‹ Warnung 1 von 3 ›“, schwerste zuerst) — abgeschnitten wird bei
    amtlichen Warnungen nie.
  Geprüft von 1280×600 bis 2560×1440: keine Kachel und kein Fenster
  schneidet Inhalt ab.
- **Tablet / Smartphone** (bis 1100 px Breite): normales, natürliches Scrollen
  — für den Außeneinsatz sinnvoller als ein gequetschter No-Scroll-Screen.
  Hier zeigt das Warnungen-Fenster alle Warnungen untereinander.

## Projektstruktur

```
src/
  pages/index.astro     Seitenstruktur, Layout, Styles; Warnungen-Abruf zur
                         Build-Zeit (Astro-Frontmatter)
  scripts/dashboard.js  Live-Daten im Browser laden (Wetter, Luft, Pegel,
                         Feuerwehr), Uhr, Chart-Zeichenfunktionen, Fenster
  scripts/i18n.js       Übersetzungen, Zahlen-/Datumsformate, Theme- und
                         Kontrast-Einstellungen
public/                 Statische Dateien wie Favicons
.env.example            Vorlage für lokale Einstellungen (siehe Konfiguration)
astro.config.mjs        Zieladresse und Basis-Pfad für GitHub Pages
package.json            Version, Abhängigkeiten, Start-/Build-/Preview-Befehle
.github/workflows/deploy.yml   Build & Deploy nach GitHub Pages (Push + Zeitplan)
```

Nur im Repository, nicht im Abgabe-ZIP: `legacy/` (erster Prototyp als
Einzeldatei, vor der Astro-Umstellung) und `docs/` (Projektdokumente).
`node_modules/`, `dist/` und `.astro/` entstehen erst lokal durch
`npm install` bzw. `npm run build`.

## Architektur und Begründung der Implementierung

Das Dashboard ist eine **statisch generierte Seite (Static Site Generation)
ohne eigenes Backend**. Ein Backend wäre ein Dienst, der dauerhaft läuft und
Anfragen der Nutzer:innen zur Laufzeit beantwortet — so etwas gibt es hier
bewusst nicht. Stattdessen gibt es drei getrennte Phasen:

| Phase | Wo läuft das? | Was passiert? |
|---|---|---|
| **1. Build-Zeit** | GitHub Actions (CI/CD), bzw. lokal bei `npm run build` — Node.js | Astro erzeugt aus `src/pages/index.astro` fertiges HTML/CSS/JS. Dabei werden die NINA-Warnungen abgerufen und als JSON in die Seite eingebettet. Der Code läuft einmal pro Build, danach existiert der Prozess nicht mehr. |
| **2. Auslieferung** | GitHub Pages (statischer Webserver) | Liefert nur die fertigen Dateien aus, führt keinen eigenen Code aus. |
| **3. Laufzeit** | Browser der Nutzer:innen | `src/scripts/dashboard.js` ruft Wetter, Luftqualität, Pegel und Feuerwehrdaten **direkt** bei den offenen APIs ab, wertet sie aus (z. B. Ø Reaktionszeit aus der Feuerwehr-CSV), zeichnet die Diagramme und aktualisiert alles alle 5 Minuten. |

**Warum die Warnungen zur Build-Zeit geladen werden:** Browser setzen die
*Same-Origin-Policy* durch. Eine Seite auf `github.io` darf die Antwort einer
anderen Domain nur lesen, wenn deren Server das per CORS-Header
(`Access-Control-Allow-Origin`) ausdrücklich erlaubt. Open-Meteo, PEGELONLINE
und GitHub (Feuerwehr-CSV) senden diesen Header, `warnung.bund.de` nicht. Der
Browser schickt die Anfrage zwar ab, gibt die Antwort aber nicht an das
Script frei. Node.js kennt diese Browser-Regel nicht, deshalb funktioniert
derselbe Abruf beim Build.

**Folge für die Aktualität:** Die Warnungen sind nur so aktuell wie der letzte
Build. Der Workflow fordert zwar alle 30 Minuten einen Build an, GitHub führt
geplante Läufe aber nicht garantiert pünktlich aus — gemessen lagen 3 bis
7 Stunden dazwischen. Ein bereits geöffneter Tab sieht neue Warnungen außerdem
erst nach einem Neuladen. Das Dashboard macht das deshalb sichtbar: Die
Warnungen-Kachel zeigt neben der Uhrzeit des Builds das Alter an
(„vor 4 Std.“); ist der Stand älter als eine Stunde, erscheint ein Hinweis in
Warnfarbe mit Verweis auf warnung.bund.de bzw. die NINA-App. Für den Ernstfall
gelten ohnehin die offiziellen Kanäle und der Notruf 112.

**Warum trotzdem diese Architektur:** GitHub Pages kann keinen eigenen Code
ausführen; ein echtes Backend bräuchte zusätzliches Hosting und Betrieb. Für
einen Prototyp haben wir kostenloses, wartungsarmes statisches Hosting gewählt
und die geringere Aktualität der Warnungen bewusst in Kauf genommen — offen
benannt statt versteckt. Alle anderen Kennzahlen sind davon nicht betroffen.

Weitere Entscheidungen:

- **Getrennte Datenbereiche:** Jede Quelle wird einzeln geladen und
  fehlerbehandelt. Fällt eine Schnittstelle aus, zeigt nur diese Kachel
  „Keine Daten“, die übrigen funktionieren weiter.
- **Mehrsprachigkeit ohne neue Requests:** Alle Sprachfassungen (auch die der
  Warnungen) liegen nach dem Laden vor; ein Sprachwechsel rendert nur neu.
- **Diagramme ohne Bibliothek:** Eigene SVG-Zeichenfunktionen, deren viewBox
  der tatsächlichen Pixelgröße entspricht und die bei jeder Größenänderung
  der Kachel neu zeichnen. So bleiben Linien und Beschriftungen bei jedem
  Zoom und jeder Bildschirmgröße unverzerrt.
- **Gefahrenkarte als statisches Kartenbild:** Die amtliche WMS-Karte wird
  direkt als Bild eingebunden und ausdrücklich nicht als Live-Information
  dargestellt.

### Geplante Erweiterung: Warnungen in Echtzeit

Damit auch die Warnungen live im Browser geladen werden können, wäre ein
kleines echtes Backend nötig: eine Serverless-Funktion (z. B. ein Cloudflare
Worker), die die Anfrage an `warnung.bund.de` weiterleitet und den fehlenden
CORS-Header ergänzt. Das Dashboard könnte die Warnungen dann wie alle anderen
Daten alle 5 Minuten aktualisieren, der Zeitplan-Build entfiele. Kosten
entstehen dafür im kostenlosen Kontingent nicht, wohl aber ein zusätzlicher
Dienst, der betrieben und überwacht werden muss — deshalb ist das für den
Prototyp nicht umgesetzt.

## Stand

Version 2.0.0. Design-Richtung „Weich" (neumorphes Soft-UI) ist umgesetzt und
an echte Live-Daten angebunden. Alle in diesem README gelisteten Datenquellen
sind produktiv im Einsatz.
