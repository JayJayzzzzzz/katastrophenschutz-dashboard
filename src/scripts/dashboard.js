// Katastrophenschutz Berlin — Lagebild-Dashboard
// Alle Daten werden client-seitig geladen (statische GitHub-Pages-Seite, kein Server/Build-Step nötig).

const GEO_NAME = "Berlin, DE";
const BERLIN_LAT = 52.5200;
const BERLIN_LON = 13.4050;

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const FIRE_DATA_URL =
  "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/BFw_mission_data_daily.csv";

// PEGELONLINE (WSV) — Pegel Berlin-Köpenick an der Spree-Oder-Wasserstraße.
const PEGEL_UUID = "47d3e815-c556-4e1b-93de-9fe07329fb00";
const PEGEL_BASE = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_UUID}`;

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const WEATHER_ICON_BY_CODE = {
  0: "sun",
  1: "cloud-sun",
  2: "cloud-sun",
  3: "cloud",
  45: "fog",
  48: "fog",
  51: "rain",
  53: "rain",
  55: "rain",
  56: "rain",
  57: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "rain",
  85: "snow",
  86: "snow",
  95: "thunder",
  96: "thunder",
  99: "thunder",
};

const WEATHER_LABEL_BY_CODE = {
  0: "Klarer Himmel",
  1: "Meistens klar",
  2: "Teilweise bewölkt",
  3: "Bewölkt",
  45: "Nebel",
  48: "Raureifnebel",
  51: "Leichter Nieselregen",
  53: "Nieselregen",
  55: "Starker Nieselregen",
  56: "Leichter gefrierender Regen",
  57: "Gefrierender Regen",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  66: "Leichter gefrierender Regen",
  67: "Gefrierender Regen",
  71: "Leichter Schneefall",
  73: "Schneefall",
  75: "Starker Schneefall",
  77: "Schneekörner",
  80: "Leichte Regenschauer",
  81: "Regenschauer",
  82: "Starke Regenschauer",
  85: "Leichte Schneeschauer",
  86: "Starke Schneeschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Schweres Gewitter",
};

function iconFor(code) {
  return WEATHER_ICON_BY_CODE[code] || "cloud";
}

function labelFor(code) {
  return WEATHER_LABEL_BY_CODE[code] || "Wetterlage";
}

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function iconMarkup(name, extraClass = "") {
  return `<svg class="ic ${extraClass}"><use href="#i-${name}"/></svg>`;
}

// ---------- Zeitstempel ----------

function updateClock() {
  const now = new Date();
  setText(
    "liveDate",
    now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );
  setText(
    "liveClock",
    now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

function markUpdated(elId) {
  setText(
    elId,
    "Stand " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  );
}

// ---------- Wetter (aktuell + 24h-Verlauf + 7-Tage) ----------

async function loadWeather() {
  try {
    const url =
      `${WEATHER_URL}?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code,uv_index` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_min,temperature_2m_max,weather_code,sunrise,sunset` +
      `&timezone=Europe%2FBerlin&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Wetterdaten nicht erreichbar");
    const data = await response.json();
    const current = data.current;
    const code = current.weather_code;

    setText("temperature", Math.round(current.temperature_2m) + "°");
    setText("description", labelFor(code));
    setText("tempMin", Math.round(data.daily.temperature_2m_min[0]) + "°");
    setText("tempMax", Math.round(data.daily.temperature_2m_max[0]) + "°");

    const heroIcon = $("heroIcon");
    if (heroIcon) heroIcon.innerHTML = `<use href="#i-${iconFor(code)}"/>`;

    setText("chipWind", Math.round(current.wind_speed_10m * 3.6) + " km/h");
    setText("chipHumidity", Math.round(current.relative_humidity_2m) + " %");
    setText("chipPressure", Math.round(current.surface_pressure) + " hPa");
    setText("chipUV", Number(current.uv_index ?? 0).toFixed(1));
    const sunrise = formatClock(data.daily.sunrise[0]);
    const sunset = formatClock(data.daily.sunset[0]);
    setText("chipSun", `${sunrise} · ${sunset}`);

    renderForecast(data.daily);
    markUpdated("weatherStatus");

    // 24-Stunden-Verlauf: die nächsten 24 Stundenwerte ab jetzt.
    const nowMs = Date.now();
    const upcoming = data.hourly.time
      .map((time, index) => ({ time, index }))
      .filter(({ time }) => new Date(time).getTime() >= nowMs)
      .slice(0, 24);

    if (upcoming.length > 0) {
      lastChartValues = upcoming.map(({ index }) => data.hourly.temperature_2m[index]);
      lastChartLabels = upcoming.map(({ time }) => time);
      drawChart(lastChartValues, lastChartLabels);
    }
  } catch (error) {
    console.error(error);
    setText("description", "Wetterdaten nicht verfügbar");
    setText("weatherStatus", "Fehler beim Laden");
  }
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function renderForecast(daily) {
  const row = $("forecastRow");
  if (!row) return;

  const days = daily.time.map((dateStr, i) => {
    const date = new Date(dateStr + "T00:00:00");
    const label = i === 0 ? "Heute" : WEEKDAYS[date.getDay()];
    return {
      label,
      icon: iconFor(daily.weather_code[i]),
      hi: Math.round(daily.temperature_2m_max[i]),
      lo: Math.round(daily.temperature_2m_min[i]),
    };
  });

  row.innerHTML = days
    .map(
      (d) => `
      <div class="day">
        <div class="d">${d.label}</div>
        ${iconMarkup(d.icon)}
        <div class="hi">${d.hi}°</div>
        <div class="lo">${d.lo}°</div>
      </div>`
    )
    .join("");
}

// ---------- 24h-Temperaturverlauf (verzerrungsfrei) ----------

function drawChart(values, labels) {
  const svg = $("weatherChart");
  const tooltip = $("chartTooltip");
  if (!svg || !values.length) return;

  // Wichtig: die viewBox entspricht exakt der tatsächlichen Pixelgröße des
  // Elements. Dadurch wird nie mit unterschiedlichen X/Y-Faktoren gestreckt
  // (der frühere Bug: fixes 420×220-Raster + preserveAspectRatio="none").
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("preserveAspectRatio");

  const padding = { top: 14, right: 10, bottom: 22, left: 34 };
  const temps = values.map(Number);
  const minTemp = Math.min(...temps) - 1.5;
  const maxTemp = Math.max(...temps) + 1.5;
  const range = Math.max(maxTemp - minTemp, 1);

  const xFor = (i) => padding.left + (i * (w - padding.left - padding.right)) / Math.max(temps.length - 1, 1);
  const yFor = (t) => h - padding.bottom - ((t - minTemp) / range) * (h - padding.top - padding.bottom);

  const yTicks = 3;
  const grid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = minTemp + (range / yTicks) * i;
    return { value, y: yFor(value) };
  });

  const tickIdx = [0, Math.floor((temps.length - 1) / 3), Math.floor(((temps.length - 1) * 2) / 3), temps.length - 1];
  const uniqueTicks = [...new Set(tickIdx)];

  const points = temps.map((t, i) => ({ x: xFor(i), y: yFor(t), t, label: labels[i] }));
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${line} ${points[points.length - 1].x},${h - padding.bottom} ${points[0].x},${h - padding.bottom}`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32" />
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
      </linearGradient>
    </defs>
    ${grid
      .map(
        (g) => `
      <line x1="${padding.left}" y1="${g.y}" x2="${w - padding.right}" y2="${g.y}" stroke="var(--chart-grid)" stroke-width="1" />
      <text x="4" y="${g.y + 4}" fill="var(--muted)" font-size="11">${Math.round(g.value)}°</text>`
      )
      .join("")}
    <polygon points="${area}" fill="url(#chartFill)"></polygon>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${uniqueTicks
      .map((i) => {
        const label = new Date(labels[i]).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        return `<text x="${xFor(i)}" y="${h - 6}" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text>`;
      })
      .join("")}
  `;

  points.forEach((p, i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
    dot.setAttribute("r", i === points.length - 1 ? 4 : 2.6);
    dot.setAttribute("fill", i === points.length - 1 ? "var(--accent2)" : "var(--accent)");
    svg.appendChild(dot);
  });

  setText("chartNow", Math.round(temps[0]) + "°");

  svg.onpointermove = (event) => {
    if (!tooltip) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * w;
    let closest = points[0];
    let bestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p.x - mx);
      if (dist < bestDist) {
        bestDist = dist;
        closest = p;
      }
    }
    const label = new Date(closest.label).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    tooltip.hidden = false;
    tooltip.textContent = `${label} · ${Math.round(closest.t)}°C`;
    tooltip.style.left = (closest.x / w) * rect.width + "px";
    tooltip.style.top = (closest.y / h) * rect.height + "px";
  };
  svg.onpointerleave = () => {
    if (tooltip) tooltip.hidden = true;
  };
}

let lastChartValues = null;
let lastChartLabels = null;
let chartResizeTimer = null;

// Bei Resize (z. B. Fenstergröße geändert) neu zeichnen, damit die viewBox
// weiter exakt zur Pixelgröße passt.
window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    if (lastChartValues) drawChart(lastChartValues, lastChartLabels);
  }, 150);
});

// ---------- Brände (Vortag, Feuerwehr Berlin) ----------

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseFireCsv(csvText) {
  const rows = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];

  const headers = rows[0].split(",");
  const dateIndex = headers.indexOf("mission_created_date");
  const fireIndex = headers.indexOf("mission_count_fire");
  if (dateIndex === -1 || fireIndex === -1) return [];

  return rows
    .slice(1)
    .map((row) => {
      const values = row.split(",");
      const date = (values[dateIndex] || "").trim();
      const fireCount = Number(values[fireIndex] || 0);
      return { date, fireCount: Number.isFinite(fireCount) ? fireCount : 0 };
    })
    .filter((entry) => entry.date && entry.date.length >= 8);
}

async function loadFireCount() {
  try {
    const response = await fetch(FIRE_DATA_URL);
    if (!response.ok) throw new Error("Feuerstatistik nicht erreichbar");
    const csvText = await response.text();
    const rows = parseFireCsv(csvText);
    if (!rows.length) throw new Error("Keine Einträge in der Feuerstatistik");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const row =
      rows.find((r) => r.date === yesterdayKey) ||
      rows.reduce((latest, r) => (r.date > latest.date ? r : latest), rows[0]);

    setText("fireCount", Math.round(row.fireCount));
    setText("fireDate", formatDisplayDate(row.date));
  } catch (error) {
    console.error(error);
    setText("fireCount", "--");
    setText("fireDate", "--");
  }
}

// ---------- Pegelstand Spree · Berlin-Köpenick (PEGELONLINE / WSV) ----------

async function loadPegel() {
  try {
    const [currentRes, historyRes] = await Promise.all([
      fetch(`${PEGEL_BASE}/W/currentmeasurement.json`),
      fetch(`${PEGEL_BASE}/W/measurements.json?start=P0DT3H`),
    ]);

    if (!currentRes.ok) throw new Error("Pegeldaten nicht erreichbar");
    const current = await currentRes.json();

    setText("pegelValue", Math.round(current.value) + " cm");

    let trendLabel = "stabil";
    if (historyRes.ok) {
      const history = await historyRes.json();
      if (history.length >= 2) {
        const diff = history[history.length - 1].value - history[0].value;
        if (diff >= 1) trendLabel = "steigend";
        else if (diff <= -1) trendLabel = "fallend";
      }
    }
    setText("pegelTrend", "Tendenz " + trendLabel);
    setText(
      "pegelTime",
      "Stand " + new Date(current.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (error) {
    console.error(error);
    setText("pegelValue", "--");
    setText("pegelTrend", "Keine Daten");
  }
}

// ---------- Start ----------

function refreshAll() {
  loadWeather();
  loadFireCount();
  loadPegel();
}

updateClock();
setInterval(updateClock, 1000);

refreshAll();
setInterval(refreshAll, 5 * 60 * 1000); // alle 5 Minuten aktualisieren
