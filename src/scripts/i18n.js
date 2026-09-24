// Katastrophenschutz Berlin — Übersetzungen & Sprachverwaltung
// Fünf Sprachen: Deutsch (Standard), Englisch, Französisch, Polnisch, Spanisch.
// Die NINA-Warnungen kommen bereits mehrsprachig vom Bund (siehe index.astro);
// alle übrigen Texte werden hier übersetzt.

export const LANGS = {
  de: { label: "Deutsch", short: "DE", locale: "de-DE" },
  en: { label: "English", short: "EN", locale: "en-GB" },
  fr: { label: "Français", short: "FR", locale: "fr-FR" },
  pl: { label: "Polski", short: "PL", locale: "pl-PL" },
  es: { label: "Español", short: "ES", locale: "es-ES" },
};

export const STRINGS = {
  loading: { de: "Lädt …", en: "Loading …", fr: "Chargement…", pl: "Wczytywanie…", es: "Cargando…" },
  noData: { de: "Keine Daten", en: "No data", fr: "Aucune donnée", pl: "Brak danych", es: "Sin datos" },
  standPrefix: { de: "Stand", en: "As of", fr: "à", pl: "Stan na", es: "Actualizado" },
  clockSuffix: { de: "Uhr", en: "", fr: "", pl: "", es: "" },

  heroAriaLabel: {
    de: "Aktuelles Wetter und Luftqualität", en: "Current weather and air quality",
    fr: "Météo actuelle et qualité de l'air", pl: "Aktualna pogoda i jakość powietrza",
    es: "Tiempo actual y calidad del aire",
  },
  condLoading: {
    de: "Wetter wird geladen …", en: "Loading weather…", fr: "Chargement de la météo…",
    pl: "Wczytywanie pogody…", es: "Cargando el tiempo…",
  },
  chipGust: { de: "Böen", en: "Gusts", fr: "Rafales", pl: "Porywy", es: "Rachas" },
  chipPrecip: { de: "Niederschlag", en: "Precipitation", fr: "Précipitations", pl: "Opady", es: "Precipitación" },
  chipPressure: { de: "Luftdruck", en: "Pressure", fr: "Pression", pl: "Ciśnienie", es: "Presión" },
  chipAir: { de: "Luft", en: "Air", fr: "Air", pl: "Powietrze", es: "Aire" },
  airQualityTitle: {
    de: "Luftqualität", en: "Air quality", fr: "Qualité de l'air", pl: "Jakość powietrza", es: "Calidad del aire",
  },

  pegelAriaLabel: {
    de: "Pegelstand Spree Berlin-Köpenick, 48-Stunden-Verlauf",
    en: "Spree water level Berlin-Köpenick, 48-hour trend",
    fr: "Niveau de la Spree à Berlin-Köpenick, tendance sur 48 heures",
    pl: "Poziom wody Spree Berlin-Köpenick, trend 48-godzinny",
    es: "Nivel del río Spree en Berlín-Köpenick, tendencia de 48 horas",
  },
  pegelLabel: {
    de: "Pegel Spree · Köpenick", en: "Spree level · Köpenick", fr: "Niveau de la Spree · Köpenick",
    pl: "Poziom Spree · Köpenick", es: "Nivel del Spree · Köpenick",
  },
  trendPrefix: { de: "Tendenz", en: "Trend", fr: "Tendance", pl: "Tendencja", es: "Tendencia" },

  fireAriaLabel: {
    de: "Brandeinsätze der Berliner Feuerwehr, 14-Tage-Verlauf",
    en: "Berlin Fire Department fire calls, 14-day trend",
    fr: "Interventions incendie des pompiers de Berlin, tendance sur 14 jours",
    pl: "Interwencje pożarowe berlińskiej straży pożarnej, trend 14-dniowy",
    es: "Intervenciones por incendio de los bomberos de Berlín, tendencia de 14 días",
  },
  fireLabel: {
    de: "Brände · 14-Tage-Verlauf", en: "Fires · 14-day trend", fr: "Incendies · tendance 14 j",
    pl: "Pożary · trend 14 dni", es: "Incendios · tendencia 14 d",
  },
  unitEinsaetze: { de: "Einsätze", en: "calls", fr: "interventions", pl: "interwencji", es: "intervenciones" },
  amPrefix: { de: "am", en: "on", fr: "le", pl: "w dniu", es: "el" },

  warnBtnAriaLabel: {
    de: "Amtliche Warnungen, Details öffnen", en: "Official warnings, open details",
    fr: "Alertes officielles, ouvrir les détails", pl: "Oficjalne ostrzeżenia, otwórz szczegóły",
    es: "Avisos oficiales, abrir detalles",
  },
  warnLabel: { de: "Warnungen", en: "Warnings", fr: "Alertes", pl: "Ostrzeżenia", es: "Avisos" },
  warnActiveSuffix: { de: "aktiv", en: "active", fr: "active(s)", pl: "aktywne", es: "activos" },
  warnNoneActive: {
    de: "Keine aktiv", en: "None active", fr: "Aucune active", pl: "Brak aktywnych", es: "Ninguno activo",
  },
  warnSubOk: {
    de: "Bund/DWD für Berlin", en: "Federal Gov./DWD for Berlin", fr: "Gouv. fédéral/DWD pour Berlin",
    pl: "Rząd federalny/DWD dla Berlina", es: "Gobierno federal/DWD para Berlín",
  },
  warnSubError: {
    de: "Bund/DWD für Berlin nicht erreichbar", en: "Federal Gov./DWD for Berlin unreachable",
    fr: "Gouv. fédéral/DWD pour Berlin inaccessible", pl: "Rząd federalny/DWD dla Berlina niedostępny",
    es: "Gobierno federal/DWD para Berlín no disponible",
  },
  warnPreviewError: {
    de: "Warnungen aktuell nicht abrufbar.", en: "Warnings currently unavailable.",
    fr: "Alertes actuellement indisponibles.", pl: "Ostrzeżenia obecnie niedostępne.",
    es: "Avisos no disponibles actualmente.",
  },
  warnPreviewEmpty: {
    de: "Keine amtlichen Warnungen (NINA/DWD/BBK) für Berlin.", en: "No official warnings (NINA/DWD/BBK) for Berlin.",
    fr: "Aucune alerte officielle (NINA/DWD/BBK) pour Berlin.", pl: "Brak oficjalnych ostrzeżeń (NINA/DWD/BBK) dla Berlina.",
    es: "No hay avisos oficiales (NINA/DWD/BBK) para Berlín.",
  },
  detailsView: { de: "Details ansehen", en: "View details", fr: "Voir les détails", pl: "Zobacz szczegóły", es: "Ver detalles" },

  chart24h: {
    de: "24-Std.-Verlauf", en: "24h trend", fr: "Tendance 24 h", pl: "Trend 24-godz.", es: "Tendencia 24 h",
  },

  respLabel: {
    de: "Ø Reaktionszeit (30 Tage)", en: "Avg. response time (30 days)", fr: "Temps de réaction moy. (30 j)",
    pl: "Śr. czas reakcji (30 dni)", es: "Tiempo de respuesta medio (30 d)",
  },
  respSub: {
    de: "Eintreffen 1. Löschfahrzeug", en: "Arrival of 1st fire engine", fr: "Arrivée du 1er véhicule",
    pl: "Przyjazd 1. wozu strażackiego", es: "Llegada del 1.er camión",
  },

  totalLabel: {
    de: "Gesamteinsätze", en: "Total call-outs", fr: "Interventions totales", pl: "Wszystkie interwencje",
    es: "Intervenciones totales",
  },
  allCategories: {
    de: "alle Kategorien", en: "all categories", fr: "toutes catégories", pl: "wszystkie kategorie",
    es: "todas las categorías",
  },
  hazardLabel: { de: "Gefahrenkarte", en: "Hazard map", fr: "Carte des risques", pl: "Mapa zagrożeń", es: "Mapa de riesgos" },
  hazardValue: { de: "Hochwasser", en: "Flooding", fr: "Inondation", pl: "Powódź", es: "Inundación" },
  hazardCta: {
    de: "Amtliche Karte ansehen", en: "View official map", fr: "Voir la carte officielle",
    pl: "Zobacz urzędową mapę", es: "Ver mapa oficial",
  },

  forecastAriaLabel: {
    de: "7-Tage-Vorhersage, zum Aufklappen antippen", en: "7-day forecast, tap to expand",
    fr: "Prévisions sur 7 jours, appuyez pour développer", pl: "Prognoza 7-dniowa, dotknij, aby rozwinąć",
    es: "Previsión de 7 días, toca para ampliar",
  },
  today: { de: "Heute", en: "Today", fr: "Aujourd'hui", pl: "Dziś", es: "Hoy" },

  dmPrecip: { de: "Niederschlag", en: "Precipitation", fr: "Précipitations", pl: "Opady", es: "Precipitación" },
  dmPrecipProb: {
    de: "Regenwahrscheinlichkeit", en: "Chance of rain", fr: "Probabilité de pluie",
    pl: "Prawdopodobieństwo opadów", es: "Probabilidad de lluvia",
  },
  dmWind: { de: "Wind (max.)", en: "Wind (max.)", fr: "Vent (max.)", pl: "Wiatr (maks.)", es: "Viento (máx.)" },
  dmGust: { de: "Böen (max.)", en: "Gusts (max.)", fr: "Rafales (max.)", pl: "Porywy (maks.)", es: "Rachas (máx.)" },
  dmUv: { de: "UV-Index (max.)", en: "UV index (max.)", fr: "Indice UV (max.)", pl: "Indeks UV (maks.)", es: "Índice UV (máx.)" },
  dmSun: {
    de: "Sonnenauf-/-untergang", en: "Sunrise/sunset", fr: "Lever/coucher du soleil",
    pl: "Wschód/zachód słońca", es: "Amanecer/atardecer",
  },
  close: { de: "Schließen", en: "Close", fr: "Fermer", pl: "Zamknij", es: "Cerrar" },

  warnModalTitle: {
    de: "Amtliche Warnungen · Berlin", en: "Official Warnings · Berlin", fr: "Alertes officielles · Berlin",
    pl: "Oficjalne ostrzeżenia · Berlin", es: "Avisos oficiales · Berlín",
  },
  validUntil: { de: "gültig bis", en: "valid until", fr: "valable jusqu'au", pl: "obowiązuje do", es: "válido hasta" },
  warnSource: {
    de: "Quelle: NINA / Bund (warnung.bund.de)", en: "Source: NINA / Federal Government (warnung.bund.de)",
    fr: "Source : NINA / Gouvernement fédéral (warnung.bund.de)", pl: "Źródło: NINA / Rząd federalny (warnung.bund.de)",
    es: "Fuente: NINA / Gobierno federal (warnung.bund.de)",
  },
  buildStandLabel: {
    de: "Stand des letzten Seiten-Builds", en: "As of the last page build",
    fr: "À la date de la dernière génération de la page", pl: "Stan z ostatniej kompilacji strony",
    es: "Estado de la última compilación de la página",
  },
  warnModalError: {
    de: "Die Warnungen (NINA/BBK) konnten beim letzten Build der Seite nicht geladen werden. Das ist keine Aussage darüber, ob gerade eine Warnung besteht — bitte zusätzlich warnung.bund.de prüfen.",
    en: "The warnings (NINA/BBK) could not be loaded during the last build of this page. This does not mean no warning is currently in effect — please also check warnung.bund.de.",
    fr: "Les alertes (NINA/BBK) n'ont pas pu être chargées lors de la dernière génération de cette page. Cela ne signifie pas qu'aucune alerte n'est en cours — veuillez également consulter warnung.bund.de.",
    pl: "Ostrzeżeń (NINA/BBK) nie udało się wczytać podczas ostatniej kompilacji tej strony. Nie oznacza to, że obecnie nie ma żadnego ostrzeżenia — sprawdź dodatkowo warnung.bund.de.",
    es: "Los avisos (NINA/BBK) no se pudieron cargar durante la última compilación de esta página. Esto no significa que no haya ningún aviso vigente — consulta también warnung.bund.de.",
  },

  hazardModalTitle: {
    de: "Hochwassergefahrenkarte · Berlin", en: "Flood Hazard Map · Berlin",
    fr: "Carte des risques d'inondation · Berlin", pl: "Mapa zagrożenia powodziowego · Berlin",
    es: "Mapa de riesgo de inundación · Berlín",
  },
  hazardSub: {
    de: "Amtliche Karte des Umweltatlas Berlin: Gewässerabschnitte, für die eine Hochwassergefahr amtlich ausgewiesen ist, in drei Wahrscheinlichkeits-Szenarien (häufig, mittel, extrem). Dunklere Blautöne zeigen eine größere Wassertiefe im jeweiligen Szenario.",
    en: "Official map from the Berlin Environmental Atlas: waterway sections officially designated as flood-prone, shown in three probability scenarios (frequent, medium, extreme). Darker blue tones indicate greater water depth in each scenario.",
    fr: "Carte officielle de l'Atlas environnemental de Berlin : tronçons de cours d'eau officiellement classés à risque d'inondation, selon trois scénarios de probabilité (fréquent, moyen, extrême). Les teintes de bleu plus foncées indiquent une profondeur d'eau plus importante dans chaque scénario.",
    pl: "Urzędowa mapa Atlasu Środowiskowego Berlina: odcinki wód, dla których urzędowo wskazano zagrożenie powodziowe, w trzech scenariuszach prawdopodobieństwa (częste, średnie, ekstremalne). Ciemniejsze odcienie niebieskiego oznaczają większą głębokość wody w danym scenariuszu.",
    es: "Mapa oficial del Atlas Medioambiental de Berlín: tramos de cursos de agua oficialmente designados con riesgo de inundación, en tres escenarios de probabilidad (frecuente, medio, extremo). Los tonos de azul más oscuros indican mayor profundidad del agua en cada escenario.",
  },
  hazardSourcePrefix: { de: "Quelle:", en: "Source:", fr: "Source :", pl: "Źródło:", es: "Fuente:" },
  hazardSourceOrg: {
    de: "Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen",
    en: "Senate Department for Urban Development, Building and Housing",
    fr: "Sénat en charge de l'urbanisme, de la construction et du logement",
    pl: "Senacki Wydział Rozwoju Miasta, Budownictwa i Mieszkalnictwa",
    es: "Departamento del Senado de Desarrollo Urbano, Construcción y Vivienda",
  },
  hazardStaticNote: {
    de: "statische amtliche Gefahrenkarte, keine Live-Daten zu einem laufenden Einsatz",
    en: "static official hazard map, not live data for an ongoing incident",
    fr: "carte officielle statique, pas de données en temps réel sur une intervention en cours",
    pl: "statyczna urzędowa mapa zagrożeń, brak danych na żywo o trwającym zdarzeniu",
    es: "mapa de riesgo oficial estático, sin datos en vivo sobre una emergencia en curso",
  },
  hazardFullMapLink: {
    de: "Vollständige interaktive Karte öffnen ↗", en: "Open full interactive map ↗",
    fr: "Ouvrir la carte interactive complète ↗", pl: "Otwórz pełną interaktywną mapę ↗",
    es: "Abrir mapa interactivo completo ↗",
  },

  a11yBtnAria: {
    de: "Barrierefreiheit-Einstellungen", en: "Accessibility settings", fr: "Paramètres d'accessibilité",
    pl: "Ustawienia dostępności", es: "Ajustes de accesibilidad",
  },
  a11yTitle: { de: "Barrierefreiheit", en: "Accessibility", fr: "Accessibilité", pl: "Dostępność", es: "Accesibilidad" },
  a11yLanguage: { de: "Sprache", en: "Language", fr: "Langue", pl: "Język", es: "Idioma" },
  a11yHighContrast: {
    de: "Hoher Kontrast", en: "High contrast", fr: "Contraste élevé", pl: "Wysoki kontrast",
    es: "Alto contraste",
  },
  a11ySpeak: {
    de: "Lagebericht vorlesen", en: "Read situation report aloud", fr: "Lire le rapport à voix haute",
    pl: "Odczytaj raport na głos", es: "Leer el informe en voz alta",
  },
  a11ySpeakStop: {
    de: "Vorlesen stoppen", en: "Stop reading", fr: "Arrêter la lecture", pl: "Zatrzymaj odczytywanie",
    es: "Detener lectura",
  },
  a11ySpeakUnsupported: {
    de: "Vorlesen wird von diesem Browser nicht unterstützt.", en: "Reading aloud is not supported by this browser.",
    fr: "La lecture à voix haute n'est pas prise en charge par ce navigateur.",
    pl: "Odczytywanie na głos nie jest wspierane przez tę przeglądarkę.",
    es: "La lectura en voz alta no es compatible con este navegador.",
  },
};

export const WEEKDAYS = {
  de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  pl: ["Nie", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"],
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
};

export const WEEKDAYS_LONG = {
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  pl: ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
};

// Wetterlagen nach Open-Meteo WMO-Code.
export const WEATHER_LABELS = {
  de: {
    0: "Klarer Himmel", 1: "Meistens klar", 2: "Teilweise bewölkt", 3: "Bewölkt", 45: "Nebel", 48: "Raureifnebel",
    51: "Leichter Nieselregen", 53: "Nieselregen", 55: "Starker Nieselregen", 56: "Leichter gefrierender Regen",
    57: "Gefrierender Regen", 61: "Leichter Regen", 63: "Regen", 65: "Starker Regen", 66: "Leichter gefrierender Regen",
    67: "Gefrierender Regen", 71: "Leichter Schneefall", 73: "Schneefall", 75: "Starker Schneefall", 77: "Schneekörner",
    80: "Leichte Regenschauer", 81: "Regenschauer", 82: "Starke Regenschauer", 85: "Leichte Schneeschauer",
    86: "Starke Schneeschauer", 95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Schweres Gewitter",
  },
  en: {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Freezing fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Light freezing drizzle", 57: "Freezing drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Light freezing rain", 67: "Freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Light rain showers", 81: "Rain showers",
    82: "Heavy rain showers", 85: "Light snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
    96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  },
  fr: {
    0: "Ciel dégagé", 1: "Plutôt dégagé", 2: "Partiellement nuageux", 3: "Nuageux", 45: "Brouillard",
    48: "Brouillard givrant", 51: "Bruine légère", 53: "Bruine", 55: "Forte bruine", 56: "Bruine verglaçante légère",
    57: "Bruine verglaçante", 61: "Pluie légère", 63: "Pluie", 65: "Forte pluie", 66: "Pluie verglaçante légère",
    67: "Pluie verglaçante", 71: "Neige légère", 73: "Neige", 75: "Forte neige", 77: "Granules de neige",
    80: "Averses de pluie légères", 81: "Averses de pluie", 82: "Fortes averses de pluie", 85: "Averses de neige légères",
    86: "Fortes averses de neige", 95: "Orage", 96: "Orage avec grêle", 99: "Orage violent",
  },
  pl: {
    0: "Bezchmurnie", 1: "Przeważnie bezchmurnie", 2: "Częściowe zachmurzenie", 3: "Pochmurno", 45: "Mgła",
    48: "Mgła osadzająca szadź", 51: "Lekka mżawka", 53: "Mżawka", 55: "Silna mżawka", 56: "Lekka marznąca mżawka",
    57: "Marznąca mżawka", 61: "Lekki deszcz", 63: "Deszcz", 65: "Silny deszcz", 66: "Lekki marznący deszcz",
    67: "Marznący deszcz", 71: "Lekki śnieg", 73: "Śnieg", 75: "Silny śnieg", 77: "Ziarna śniegu",
    80: "Lekkie przelotne opady deszczu", 81: "Przelotne opady deszczu", 82: "Silne przelotne opady deszczu",
    85: "Lekkie przelotne opady śniegu", 86: "Silne przelotne opady śniegu", 95: "Burza", 96: "Burza z gradem",
    99: "Silna burza",
  },
  es: {
    0: "Cielo despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado", 45: "Niebla",
    48: "Niebla helada", 51: "Llovizna ligera", 53: "Llovizna", 55: "Llovizna intensa", 56: "Llovizna helada ligera",
    57: "Llovizna helada", 61: "Lluvia ligera", 63: "Lluvia", 65: "Lluvia intensa", 66: "Lluvia helada ligera",
    67: "Lluvia helada", 71: "Nieve ligera", 73: "Nieve", 75: "Nieve intensa", 77: "Granos de nieve",
    80: "Chubascos ligeros", 81: "Chubascos", 82: "Chubascos intensos", 85: "Chubascos de nieve ligeros",
    86: "Chubascos de nieve intensos", 95: "Tormenta", 96: "Tormenta con granizo", 99: "Tormenta severa",
  },
};

export const TREND_LABELS = {
  steigend: { de: "steigend", en: "rising", fr: "en hausse", pl: "rosnący", es: "en aumento" },
  fallend: { de: "fallend", en: "falling", fr: "en baisse", pl: "spadający", es: "en descenso" },
  stabil: { de: "stabil", en: "stable", fr: "stable", pl: "stabilny", es: "estable" },
};

export const AQI_LABELS = {
  good: { de: "Gut", en: "Good", fr: "Bonne", pl: "Dobra", es: "Buena" },
  warning: { de: "Mäßig", en: "Moderate", fr: "Modérée", pl: "Umiarkowana", es: "Moderada" },
  serious: { de: "Schlecht", en: "Poor", fr: "Mauvaise", pl: "Słaba", es: "Mala" },
  critical: { de: "Sehr schlecht", en: "Very poor", fr: "Très mauvaise", pl: "Bardzo słaba", es: "Muy mala" },
};

export const SEVERITY_LABELS = {
  Extreme: { de: "Extrem", en: "Extreme", fr: "Extrême", pl: "Ekstremalne", es: "Extremo" },
  Severe: { de: "Schwer", en: "Severe", fr: "Sévère", pl: "Poważne", es: "Grave" },
  Moderate: { de: "Mittel", en: "Moderate", fr: "Modérée", pl: "Umiarkowane", es: "Moderado" },
  Minor: { de: "Gering", en: "Minor", fr: "Mineure", pl: "Niskie", es: "Menor" },
};

// Sätze für die Sprachausgabe (Web Speech API). Kurz & einfach gehalten,
// damit die Übersetzung über alle Sprachen hinweg zuverlässig bleibt.
export const SPEECH = {
  intro: {
    de: "Lagebericht Berlin.", en: "Situation report Berlin.", fr: "Rapport de situation Berlin.",
    pl: "Raport sytuacyjny Berlin.", es: "Informe de situación Berlín.",
  },
  temp: {
    de: (t, c) => `Temperatur ${t} Grad, ${c}.`,
    en: (t, c) => `Temperature ${t} degrees, ${c}.`,
    fr: (t, c) => `Température ${t} degrés, ${c}.`,
    pl: (t, c) => `Temperatura ${t} stopni, ${c}.`,
    es: (t, c) => `Temperatura ${t} grados, ${c}.`,
  },
  pegel: {
    de: (v, tr) => `Pegel Spree Köpenick: ${v} Zentimeter, Tendenz ${tr}.`,
    en: (v, tr) => `Spree water level at Köpenick: ${v} centimeters, trend ${tr}.`,
    fr: (v, tr) => `Niveau de la Spree à Köpenick : ${v} centimètres, tendance ${tr}.`,
    pl: (v, tr) => `Poziom Spree w Köpenick: ${v} centymetrów, tendencja ${tr}.`,
    es: (v, tr) => `Nivel del Spree en Köpenick: ${v} centímetros, tendencia ${tr}.`,
  },
  fire: {
    de: (n) => `Brände gestern: ${n} Einsätze.`,
    en: (n) => `Fires yesterday: ${n} calls.`,
    fr: (n) => `Incendies hier : ${n} interventions.`,
    pl: (n) => `Pożary wczoraj: ${n} interwencji.`,
    es: (n) => `Incendios ayer: ${n} intervenciones.`,
  },
  aqi: {
    de: (a) => `Luftqualität: ${a}.`, en: (a) => `Air quality: ${a}.`, fr: (a) => `Qualité de l'air : ${a}.`,
    pl: (a) => `Jakość powietrza: ${a}.`, es: (a) => `Calidad del aire: ${a}.`,
  },
  warnNone: {
    de: "Keine aktiven Warnungen.", en: "No active warnings.", fr: "Aucune alerte active.",
    pl: "Brak aktywnych ostrzeżeń.", es: "Sin avisos activos.",
  },
  warnSome: {
    de: (n, h) => `${n} aktive Warnung${n === 1 ? "" : "en"}: ${h}.`,
    en: (n, h) => `${n} active warning${n === 1 ? "" : "s"}: ${h}.`,
    fr: (n, h) => `${n} alerte${n === 1 ? "" : "s"} active${n === 1 ? "" : "s"} : ${h}.`,
    pl: (n, h) => `${n} aktywnych ostrzeżeń: ${h}.`,
    es: (n, h) => `${n} aviso${n === 1 ? "" : "s"} activo${n === 1 ? "" : "s"}: ${h}.`,
  },
};

const STORAGE_KEY_LANG = "dashboard-lang";
const STORAGE_KEY_HC = "dashboard-high-contrast";

let currentLang = "de";

export function getLang() {
  return currentLang;
}

export function locale() {
  return LANGS[currentLang]?.locale || "de-DE";
}

export function t(key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[currentLang] ?? entry.de ?? key;
}

export function weatherLabel(code) {
  const table = WEATHER_LABELS[currentLang] || WEATHER_LABELS.de;
  return table[code] ?? WEATHER_LABELS.de[code] ?? "—";
}

export function weekday(index) {
  return (WEEKDAYS[currentLang] || WEEKDAYS.de)[index];
}

export function weekdayLong(index) {
  return (WEEKDAYS_LONG[currentLang] || WEEKDAYS_LONG.de)[index];
}

export function trendLabel(key) {
  return TREND_LABELS[key]?.[currentLang] || TREND_LABELS[key]?.de || key;
}

export function aqiLabel(key) {
  return AQI_LABELS[key]?.[currentLang] || AQI_LABELS[key]?.de || key;
}

export function severityLabel(key) {
  return SEVERITY_LABELS[key]?.[currentLang] || SEVERITY_LABELS.Minor[currentLang];
}

export function speech(key, ...args) {
  const entry = SPEECH[key];
  if (!entry) return "";
  const fnOrStr = entry[currentLang] ?? entry.de;
  return typeof fnOrStr === "function" ? fnOrStr(...args) : fnOrStr;
}

export function setLang(lang) {
  if (!LANGS[lang]) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  } catch {
    /* localStorage evtl. nicht verfügbar (privater Modus etc.) — dann bleibt die Wahl nur für diese Sitzung */
  }
  document.documentElement.lang = lang;
}

export function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY_LANG);
  } catch {
    /* siehe oben */
  }
  currentLang = saved && LANGS[saved] ? saved : "de";
  document.documentElement.lang = currentLang;
  return currentLang;
}

export function getHighContrast() {
  try {
    return localStorage.getItem(STORAGE_KEY_HC) === "1";
  } catch {
    return false;
  }
}

export function setHighContrast(on) {
  try {
    localStorage.setItem(STORAGE_KEY_HC, on ? "1" : "0");
  } catch {
    /* siehe oben */
  }
  document.documentElement.toggleAttribute("data-high-contrast", on);
}

// Wendet alle [data-i18n]-Texte und [data-i18n-aria]-aria-labels im Dokument
// auf die aktuell gewählte Sprache an.
export function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    el.setAttribute("aria-label", t(key));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    el.setAttribute("title", t(key));
  });
}
