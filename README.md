# Lagebild-Dashboard · Katastrophenschutz Berlin

Internes Dashboard-Prototyp für die Lernsituation „Dashboard erstellen"
(Berufsschule, Block 1). Führt fünf Datenquellen für die Lagebeurteilung
auf einem einzigen, nicht scrollbaren Bildschirm zusammen:

- **Zeitstempel** – aktuelles Datum und eine live mitlaufende Uhrzeit.
- **Brände vom Vortag** – Einsatzzahlen der Berliner Feuerwehr.
- **Pegelstand der Spree** an der Messstelle Berlin-Köpenick.
- **Wetter aktuell** für Berlin inkl. 24-Stunden-Temperaturverlauf.
- **7-Tage-Vorhersage** für Berlin.

Gebaut mit [Astro](https://astro.build) als statische Seite; alle Daten
werden beim Aufruf direkt im Browser von den jeweiligen offenen
APIs geladen — es gibt keinen eigenen Server/Backend.

## Datenquellen

| Daten | Quelle |
|---|---|
| Wetter aktuell, 24h-Verlauf, 7-Tage-Vorhersage | [Open-Meteo](https://open-meteo.com/) (`api.open-meteo.com`) |
| Brände vom Vortag | [Berliner Feuerwehr – Open Data](https://github.com/Berliner-Feuerwehr/BF-Open-Data) (tägliche Einsatzstatistik-CSV) |
| Pegelstand Spree · Berlin-Köpenick | [PEGELONLINE (WSV)](https://www.pegelonline.wsv.de/webservice/guideRestapi), Station `BERLIN-KÖPENICK` (Spree-Oder-Wasserstraße) |

Alle drei APIs sind öffentlich, benötigen keinen API-Key und erlauben
Cross-Origin-Anfragen direkt aus dem Browser.

## Projekt lokal ausführen

```sh
npm install
npm run dev       # Entwicklungsserver, http://localhost:4321/katastrophenschutz-dashboard/
npm run build     # Produktions-Build nach ./dist
npm run preview   # Produktions-Build lokal testen
```

## Deployment (GitHub Pages)

Das Deployment läuft automatisch über GitHub Actions
(`.github/workflows/deploy.yml`): Jeder Push auf `main` baut die Seite mit
Astro und veröffentlicht sie auf GitHub Pages.

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

## Projektstruktur

```
src/
  pages/index.astro     Seitenstruktur, Layout & Styles des Dashboards
  scripts/dashboard.js  Live-Daten laden (Wetter, Pegel, Brände), Uhr, Chart zeichnen
legacy/
  ScheererTilWeatherApp.html   Erster Prototyp (Einzeldatei, vor der Astro-Umstellung)
.github/workflows/deploy.yml   Build & Deploy nach GitHub Pages
```

## Stand

Design-Richtung „Weich" (neumorphes Soft-UI) ist umgesetzt und an echte
Live-Daten angebunden. Feinschliff (Feintuning von Layout, Abständen,
Fehlerzuständen, mobiler Ansicht) folgt im nächsten Schritt.
