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

```sh
npm install
npm run dev       # Entwicklungsserver, http://localhost:4321/katastrophenschutz-dashboard/
npm run build     # Produktions-Build nach ./dist
npm run preview   # Produktions-Build lokal testen
```

Zum lokalen Testen der Warnungen-Kachel mit einer Beispielwarnung (die echte
NINA-API zeigt meist "keine aktiven Warnungen"):

```sh
DASHBOARD_TEST_WARNING=1 npm run build && npm run preview
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
https://JayJayzzzzzz.github.io/katastrophenschutz-dashboard/
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
legacy/
  ScheererTilWeatherApp.html   Erster Prototyp (Einzeldatei, vor der Astro-Umstellung)
.github/workflows/deploy.yml   Build & Deploy nach GitHub Pages (push + Zeitplan)
```

## Stand

Design-Richtung „Weich" (neumorphes Soft-UI) ist umgesetzt und an echte
Live-Daten angebunden. Alle in diesem README gelisteten Datenquellen sind
produktiv im Einsatz.
