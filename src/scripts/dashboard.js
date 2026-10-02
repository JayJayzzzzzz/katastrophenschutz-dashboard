// Katastrophenschutz Berlin — Lagebild-Dashboard
// Alle Live-Daten werden client-seitig geladen (statische GitHub-Pages-Seite,
// kein Server/Build-Step nötig) — Ausnahme: die amtlichen Warnungen, siehe
// index.astro und den Abschnitt "Warnungen" unten.

import {
  getLang, setLang, initLang, locale, t, weatherLabel, weekday, weekdayLong,
  trendLabel, aqiLabel, severityLabel, speech, applyStaticTranslations,
  getHighContrast, setHighContrast, getTheme, setTheme, initTheme,
} from "./i18n.js";

const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.405;

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const FIRE_DATA_URL =
  "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/BFw_mission_data_daily.csv";

// PEGELONLINE (WSV) — Pegel Berlin-Köpenick an der Spree-Oder-Wasserstraße.
const PEGEL_UUID = "47d3e815-c556-4e1b-93de-9fe07329fb00";
const PEGEL_BASE = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_UUID}`;

const WEATHER_ICON_BY_CODE = {
  0: "sun", 1: "cloud-sun", 2: "cloud-sun", 3: "cloud",
  45: "fog", 48: "fog",
  51: "rain", 53: "rain", 55: "rain", 56: "rain", 57: "rain",
  61: "rain", 63: "rain", 65: "rain", 66: "rain", 67: "rain",
  71: "snow", 73: "snow", 75: "snow", 77: "snow",
  80: "rain", 81: "rain", 82: "rain", 85: "snow", 86: "snow",
  95: "thunder", 96: "thunder", 99: "thunder",
};

// Nachts (is_day = 0 bei Open-Meteo) Mond statt Sonne. Nur für das aktuelle
// Wetter relevant; die 7-Tage-Vorhersage zeigt Tageswerte.
const NIGHT_ICON = { sun: "moon", "cloud-sun": "cloud-moon" };

function iconFor(code, isDay = true) {
  const icon = WEATHER_ICON_BY_CODE[code] || "cloud";
  return isDay ? icon : NIGHT_ICON[icon] || icon;
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
function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
}
function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ---------- Zeitstempel ----------

function updateClock() {
  const now = new Date();
  setText(
    "liveDate",
    now.toLocaleDateString(locale(), { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
  );
  const suffix = t("clockSuffix");
  setText(
    "liveClock",
    now.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + (suffix ? " " + suffix : "")
  );
}

function markUpdated(elId) {
  setText(elId, t("standPrefix") + " " + new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }));
}

// ---------- Generische Chart-Zeichenfunktionen ----------
// Wichtig: die viewBox jedes Charts entspricht exakt der tatsächlichen
// Pixelgröße seines Containers. Dadurch wird nie mit unterschiedlichen
// X/Y-Faktoren gestreckt (der Bug im ersten Prototyp: festes 420×220-Raster
// + preserveAspectRatio="none" auf einem anders großen Element -> verzerrte
// Linien UND Zahlen).
//
// Die Serien-/Status-Farben werden immer als CSS-Variable (z. B.
// "var(--series-pegel)") übergeben statt als fester Hex-Wert — dadurch
// reicht für den Farbenblind-Modus eine reine CSS-Umschaltung der
// Variablen auf der Root-Ebene, ohne dass hier neu gezeichnet werden muss.

const charts = {}; // name -> { svg, tooltip, draw: fn() }

function chartLabelFontSize() {
  if (window.matchMedia("(min-width: 3000px) and (min-height: 1600px)").matches) return 18;
  if (window.matchMedia("(min-width: 1800px) and (min-height: 1000px)").matches) return 14;
  return 10.5;
}

// Neu gezeichnet wird, sobald sich die Größe des Charts selbst ändert — nicht
// nur bei einem Fenster-Resize. Sonst bleibt eine Zeichnung mit veralteter
// viewBox stehen, wenn eine Kachel erst nach dem Laden der Daten ihre
// endgültige Größe bekommt, und Linien und Beschriftungen werden gestaucht.
const pendingChartRedraws = new Set();
const redrawPendingCharts = debounce(() => {
  pendingChartRedraws.forEach((svg) => Object.values(charts).find((c) => c.svg === svg)?.draw());
  pendingChartRedraws.clear();
}, 100);
const chartResizeObserver =
  "ResizeObserver" in window
    ? new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.contentRect.width && entry.contentRect.height) pendingChartRedraws.add(entry.target);
        });
        redrawPendingCharts();
      })
    : null;

function registerChart(name, svg, tooltip, drawFn) {
  const previous = charts[name];
  if (previous?.svg && previous.svg !== svg) chartResizeObserver?.unobserve(previous.svg);
  charts[name] = { svg, tooltip, draw: drawFn };
  if (svg && previous?.svg !== svg) chartResizeObserver?.observe(svg);
}

function redrawAllCharts() {
  Object.values(charts).forEach((c) => c.draw());
}

function positionChartTooltip(tooltip, svg, anchorX, anchorY) {
  const container = tooltip.offsetParent || svg.parentElement;
  if (!container) return;

  const inset = 8;
  const gap = 8;
  const maxLeft = Math.max(inset, container.clientWidth - tooltip.offsetWidth - inset);
  const left = Math.max(inset, Math.min(anchorX - tooltip.offsetWidth / 2, maxLeft));
  const maxTop = Math.max(inset, container.clientHeight - tooltip.offsetHeight - inset);
  const above = anchorY - tooltip.offsetHeight - gap;
  const below = anchorY + gap;
  const top = above >= inset ? Math.min(above, maxTop) : Math.min(below, maxTop);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.transform = "none";
}

function drawLineChart(svg, tooltip, values, labels, opts) {
  if (!svg || !values || !values.length) return;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("preserveAspectRatio");

  const color = opts.color;
  const labelFontSize = chartLabelFontSize();
  const pad = opts.padding || { top: 10, right: 8, bottom: 20, left: labelFontSize > 12 ? 60 : 30 };
  const showGrid = opts.grid !== false;
  const nums = values.map(Number);
  const pad10 = Math.max((Math.max(...nums) - Math.min(...nums)) * 0.15, opts.minPad ?? 1.5);
  const minV = (opts.min ?? Math.min(...nums) - pad10);
  const maxV = (opts.max ?? Math.max(...nums) + pad10);
  const range = Math.max(maxV - minV, 0.001);

  const xFor = (i) => pad.left + (i * (w - pad.left - pad.right)) / Math.max(nums.length - 1, 1);
  const yFor = (v) => h - pad.bottom - ((v - minV) / range) * (h - pad.top - pad.bottom);

  const points = nums.map((v, i) => ({ x: xFor(i), y: yFor(v), v, label: labels[i] }));
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${line} ${points[points.length - 1].x},${h - pad.bottom} ${points[0].x},${h - pad.bottom}`;

  let gridSvg = "";
  if (showGrid) {
    const ticks = opts.yTicks ?? 3;
    gridSvg = Array.from({ length: ticks + 1 }, (_, i) => {
      const value = minV + (range / ticks) * i;
      const y = yFor(value);
      return `
        <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="var(--chart-grid)" stroke-width="1" />
        ${opts.showYLabels === false ? "" : `<text x="${pad.left - 4}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="${labelFontSize}">${Math.round(value)}${opts.unitShort || ""}</text>`}`;
    }).join("");
  }

  let xLabelsSvg = "";
  if (opts.xLabelCount) {
    const n = opts.xLabelCount;
    const idxs = [...new Set(Array.from({ length: n }, (_, i) => Math.round((i * (nums.length - 1)) / (n - 1))))];
    xLabelsSvg = idxs
      .map((i) => {
        // Am linken/rechten Rand nicht mittig verankern, sonst schneidet der
        // Container die Hälfte des Textes ab (besonders bei knappem Padding).
        const anchor = i === 0 ? "start" : i === nums.length - 1 ? "end" : "middle";
        return `<text x="${xFor(i)}" y="${h - 5}" text-anchor="${anchor}" fill="var(--muted)" font-size="${labelFontSize}">${opts.xLabelFormatter(labels[i])}</text>`;
      })
      .join("");
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad-${opts.id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.32" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </linearGradient>
    </defs>
    ${gridSvg}
    ${opts.fill !== false ? `<polygon points="${area}" fill="url(#grad-${opts.id})"></polygon>` : ""}
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="${labelFontSize > 12 ? 3.5 : 2.5}" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${xLabelsSvg}
  `;

  const lastPoint = points[points.length - 1];
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", lastPoint.x);
  dot.setAttribute("cy", lastPoint.y);
  dot.setAttribute("r", 4);
  dot.setAttribute("fill", color);
  dot.setAttribute("stroke", "var(--panel)");
  dot.setAttribute("stroke-width", "2");
  svg.appendChild(dot);

  if (opts.nowLabelId) setText(opts.nowLabelId, opts.valueFormatter(nums[nums.length - 1]));

  if (tooltip) {
    svg.onpointermove = (event) => {
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
      tooltip.hidden = false;
      tooltip.textContent = `${opts.labelFormatter(closest.label)} · ${opts.valueFormatter(closest.v)}`;
      positionChartTooltip(tooltip, svg, (closest.x / w) * rect.width, (closest.y / h) * rect.height);
    };
    svg.onpointerleave = () => {
      tooltip.hidden = true;
    };
  }
}

function drawBarChart(svg, tooltip, values, labels, opts) {
  if (!svg || !values || !values.length) return;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("preserveAspectRatio");

  const color = opts.color;
  const highlightColor = opts.highlightColor || color;
  const labelFontSize = chartLabelFontSize();
  const pad = opts.padding || { top: 8, right: 4, bottom: 18, left: 4 };
  const nums = values.map(Number);
  const maxV = Math.max(...nums, 1) * 1.2;

  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const gap = opts.gap ?? 3;
  const barW = Math.max((innerW - gap * (nums.length - 1)) / nums.length, 1);

  const bars = nums.map((v, i) => {
    const x = pad.left + i * (barW + gap);
    const barH = Math.max((v / maxV) * innerH, 2);
    const y = h - pad.bottom - barH;
    return { x, y, w: barW, h: barH, v, label: labels[i], isLast: i === nums.length - 1 };
  });

  svg.innerHTML = `
    <line x1="${pad.left}" y1="${h - pad.bottom}" x2="${w - pad.right}" y2="${h - pad.bottom}" stroke="var(--chart-grid)" stroke-width="1" />
    ${bars
      .map(
        (b) => `
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="3" ry="3"
        fill="${b.isLast ? highlightColor : color}" opacity="${b.isLast ? 1 : 0.55}"></rect>`
      )
      .join("")}
    ${
      opts.xLabelFirst
          ? `<text x="${bars[0].x}" y="${h - 4}" fill="var(--muted)" font-size="${labelFontSize}">${opts.xLabelFormatter(bars[0].label)}</text>
            <text x="${bars[bars.length - 1].x + bars[bars.length - 1].w}" y="${h - 4}" text-anchor="end" fill="var(--muted)" font-size="${labelFontSize}">${opts.xLabelFormatter(bars[bars.length - 1].label)}</text>`
        : ""
    }
  `;

  if (opts.nowLabelId) setText(opts.nowLabelId, opts.valueFormatter(nums[nums.length - 1]));

  if (tooltip) {
    svg.onpointermove = (event) => {
      const rect = svg.getBoundingClientRect();
      const mx = ((event.clientX - rect.left) / rect.width) * w;
      let closest = bars[0];
      let bestDist = Infinity;
      for (const b of bars) {
        const center = b.x + b.w / 2;
        const dist = Math.abs(center - mx);
        if (dist < bestDist) {
          bestDist = dist;
          closest = b;
        }
      }
      tooltip.hidden = false;
      tooltip.textContent = `${opts.labelFormatter(closest.label)} · ${opts.valueFormatter(closest.v)}`;
      positionChartTooltip(
        tooltip,
        svg,
        ((closest.x + closest.w / 2) / w) * rect.width,
        (closest.y / h) * rect.height
      );
    };
    svg.onpointerleave = () => {
      tooltip.hidden = true;
    };
  }
}

// ---------- Zusammenfassung für die Sprachausgabe ----------
// Wird nach jedem erfolgreichen Laden aktualisiert, damit der "Vorlesen"-
// Knopf ohne erneuten Netzwerk-Request funktioniert.
const speechState = {};

// ---------- Wetter (aktuell + 24h-Verlauf + 7-Tage) ----------

let forecastDays = [];
let lastWeatherPayload = null;
let openDayIndex = null;

async function loadWeather() {
  try {
    const url =
      `${WEATHER_URL}?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,uv_index,is_day` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_min,temperature_2m_max,weather_code,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max` +
      `&timezone=Europe%2FBerlin&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Wetterdaten nicht erreichbar");
    lastWeatherPayload = await response.json();
    renderWeather();
  } catch (error) {
    console.error(error);
    setText("description", t("noData"));
    setText("weatherStatus", t("noData"));
  }
}

function renderWeather() {
  const data = lastWeatherPayload;
  if (!data) return;
  const current = data.current;
  const code = current.weather_code;

  setText("temperature", Math.round(current.temperature_2m) + "°");
  setText("description", weatherLabel(code));
  setText("tempMin", Math.round(data.daily.temperature_2m_min[0]) + "°");
  setText("tempMax", Math.round(data.daily.temperature_2m_max[0]) + "°");

  const heroIcon = $("heroIcon");
  if (heroIcon) heroIcon.innerHTML = `<use href="#i-${iconFor(code, current.is_day !== 0)}"/>`;

  // Open-Meteo liefert Windwerte standardmäßig bereits in km/h (kein m/s) —
  // hier NICHT zusätzlich mit 3.6 umrechnen.
  setText("chipWind", Math.round(current.wind_speed_10m) + " km/h");
  setText("chipGust", Math.round(current.wind_gusts_10m) + " km/h");
  setText("chipFeelsLike", Math.round(current.apparent_temperature) + "°");
  setText("chipHumidity", Math.round(current.relative_humidity_2m) + " %");
  setText("chipPressure", Math.round(current.surface_pressure) + " hPa");
  setText("chipPrecip", (current.precipitation ?? 0).toFixed(1) + " mm");
  setText("chipUV", Number(current.uv_index ?? 0).toFixed(1));
  setText("chipSun", `${formatClock(data.daily.sunrise[0])} · ${formatClock(data.daily.sunset[0])}`);

  renderForecast(data.daily);
  markUpdated("weatherStatus");

  speechState.temp = Math.round(current.temperature_2m);
  speechState.cond = weatherLabel(code).toLowerCase();

  // 24-Stunden-Verlauf: die nächsten 24 Stundenwerte ab jetzt.
  const nowMs = Date.now();
  const upcoming = data.hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => new Date(time).getTime() >= nowMs)
    .slice(0, 24);

  if (upcoming.length > 0) {
    const values = upcoming.map(({ index }) => data.hourly.temperature_2m[index]);
    const labels = upcoming.map(({ time }) => time);
    registerChart("weather", $("weatherChart"), $("chartTooltip"), () =>
      drawLineChart($("weatherChart"), $("chartTooltip"), values, labels, {
        id: "weather",
        color: "var(--series-weather)",
        unitShort: "°",
        yTicks: 2,
        xLabelCount: 3,
        nowLabelId: "chartNow",
        valueFormatter: (v) => Math.round(v) + "°C",
        labelFormatter: (time) => formatClock(time),
        xLabelFormatter: (time) => formatClock(time),
      })
    );
    charts.weather.draw();
  }

  if (openDayIndex != null) openDayDetail(openDayIndex);
}

function renderForecast(daily) {
  const row = $("forecastRow");
  if (!row) return;

  forecastDays = daily.time.map((dateStr, i) => {
    const date = new Date(dateStr + "T00:00:00");
    return {
      date,
      dateStr,
      isToday: i === 0,
      dayLabel: i === 0 ? t("today") : weekday(date.getDay()),
      weekdayIndex: date.getDay(),
      code: daily.weather_code[i],
      icon: iconFor(daily.weather_code[i]),
      hi: Math.round(daily.temperature_2m_max[i]),
      lo: Math.round(daily.temperature_2m_min[i]),
      precipSum: daily.precipitation_sum[i],
      precipProb: daily.precipitation_probability_max[i],
      windMax: daily.wind_speed_10m_max[i],
      gustMax: daily.wind_gusts_10m_max[i],
      uvMax: daily.uv_index_max[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    };
  });

  row.innerHTML = forecastDays
    .map(
      (d, i) => `
      <button type="button" class="day" data-index="${i}" aria-haspopup="dialog">
        <div class="d">${d.dayLabel}</div>
        ${iconMarkup(d.icon, `weather-icon weather-icon-${d.icon}`)}
        <div class="hi">${d.hi}°</div>
        <div class="lo">${d.lo}°</div>
      </button>`
    )
    .join("");

  row.querySelectorAll(".day").forEach((btn) => {
    btn.addEventListener("click", () => openDayDetail(Number(btn.dataset.index)));
  });
}

function openDayDetail(index) {
  const d = forecastDays[index];
  if (!d) return;
  const modal = $("dayModal");
  if (!modal) return;
  openDayIndex = index;

  setText(
    "dayModalDate",
    `${d.isToday ? t("today") + " · " : ""}${weekdayLong(d.weekdayIndex)}, ${d.date.toLocaleDateString(locale(), { day: "2-digit", month: "2-digit", year: "numeric" })}`
  );
  setText("dayModalCond", weatherLabel(d.code));
  setText("dayModalHi", d.hi + "°");
  setText("dayModalLo", d.lo + "°");
  setText("dayModalPrecip", d.precipSum.toFixed(1) + " mm");
  setText("dayModalPrecipProb", Math.round(d.precipProb) + " %");
  setText("dayModalWind", Math.round(d.windMax) + " km/h");
  setText("dayModalGust", Math.round(d.gustMax) + " km/h");
  setText("dayModalUV", Number(d.uvMax).toFixed(1));
  setText("dayModalSun", `${formatClock(d.sunrise)} · ${formatClock(d.sunset)}`);
  const icon = $("dayModalIcon");
  if (icon) icon.innerHTML = `<use href="#i-${d.icon}"/>`;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  $("dayModalClose")?.focus();
}

function closeDayDetail() {
  const modal = $("dayModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
  openDayIndex = null;
}

// ---------- Brände (14-Tage-Verlauf, Feuerwehr Berlin) ----------

let lastFireRows = null;

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(locale(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatShortDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(locale(), { day: "2-digit", month: "2-digit" });
}

function parseFireCsv(csvText) {
  const rows = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];

  const headers = rows[0].split(",");
  const dateIndex = headers.indexOf("mission_created_date");
  const fireIndex = headers.indexOf("mission_count_fire");
  const allIndex = headers.indexOf("mission_count_all");
  const responseTimeIndex = headers.indexOf("response_time_fire_time_to_first_pump_mean");
  if (dateIndex === -1 || fireIndex === -1) return [];

  const num = (values, index) => {
    if (index === -1) return null;
    const n = Number(values[index]);
    return Number.isFinite(n) ? n : null;
  };

  return rows
    .slice(1)
    .map((row) => {
      const values = row.split(",");
      const date = (values[dateIndex] || "").trim();
      return {
        date,
        fireCount: num(values, fireIndex) || 0,
        missionsAll: num(values, allIndex),
        // Sekunden -> Minuten: die CSV liefert die Eintreffzeit des ersten
        // Löschfahrzeugs in Sekunden.
        responseTimeMin: responseTimeIndex !== -1 && num(values, responseTimeIndex) != null ? num(values, responseTimeIndex) / 60 : null,
      };
    })
    .filter((entry) => entry.date && entry.date.length >= 8)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

async function loadFireCount() {
  try {
    const response = await fetch(FIRE_DATA_URL);
    if (!response.ok) throw new Error("Feuerstatistik nicht erreichbar");
    const csvText = await response.text();
    lastFireRows = parseFireCsv(csvText);
    if (!lastFireRows.length) throw new Error("Keine Einträge in der Feuerstatistik");
    renderFire();
  } catch (error) {
    console.error(error);
    setText("fireCount", "--");
    setText("fireDate", "--");
    setText("totalMissionsValue", "--");
    setText("respTimeValue", "--");
  }
}

function renderFire() {
  const rows = lastFireRows;
  if (!rows || !rows.length) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // Nur vollständige Tage bis (einschließlich) gestern berücksichtigen,
  // damit kein unvollständiger "heute"-Datensatz den Verlauf verfälscht.
  const completeRows = rows.filter((r) => r.date <= yesterdayKey);
  const last14 = completeRows.slice(-14);
  const latest = last14[last14.length - 1] || rows[rows.length - 1];

  setText("fireCount", Math.round(latest.fireCount));
  setText("fireDate", formatDisplayDate(latest.date));
  speechState.fireCount = Math.round(latest.fireCount);

  if (last14.length) {
    registerChart("fire", $("fireChart"), $("fireTooltip"), () =>
      drawBarChart(
        $("fireChart"),
        $("fireTooltip"),
        last14.map((r) => r.fireCount),
        last14.map((r) => r.date),
        {
          color: "var(--series-fire)",
          highlightColor: "var(--series-fire)",
          valueFormatter: (v) => Math.round(v) + " " + t("unitEinsaetze"),
          labelFormatter: (d) => formatDisplayDate(d),
          xLabelFirst: true,
          xLabelFormatter: (d) => formatShortDate(d),
        }
      )
    );
    charts.fire.draw();
  }

  const missionRows = completeRows.filter((row) => row.missionsAll != null);
  const latestMission = missionRows[missionRows.length - 1];
  if (latestMission) {
    setText("totalMissionsValue", Math.round(latestMission.missionsAll).toLocaleString(locale()));
    setText("fireDate2", formatDisplayDate(latestMission.date));
  } else {
    setText("totalMissionsValue", "--");
    setText("fireDate2", "--");
  }

  const previousSeven = missionRows.slice(-8, -1);
  const comparison = $("missionsDelta");
  if (latestMission && previousSeven.length === 7) {
    const average = previousSeven.reduce((sum, row) => sum + row.missionsAll, 0) / previousSeven.length;
    if (average > 0) {
      const changePercent = Math.round(((latestMission.missionsAll - average) / average) * 100);
      const direction = changePercent > 0 ? "↑ +" : changePercent < 0 ? "↓ −" : "→ ";
      setText("missionsDelta", `${direction}${Math.abs(changePercent).toLocaleString(locale())} %`);
      comparison?.parentElement?.classList.toggle("is-above", changePercent > 0);
      comparison?.parentElement?.classList.toggle("is-below", changePercent < 0);
    } else {
      setText("missionsDelta", t("noData"));
    }
  } else {
    setText("missionsDelta", t("noData"));
  }

  const last14Missions = missionRows.slice(-14);
  if (last14Missions.length) {
    registerChart("missions", $("missionsChart"), $("missionsTooltip"), () =>
      drawBarChart(
        $("missionsChart"),
        $("missionsTooltip"),
        last14Missions.map((row) => row.missionsAll),
        last14Missions.map((row) => row.date),
        {
          color: "var(--series-pegel)",
          highlightColor: "var(--series-pegel)",
          padding: { top: 8, right: 8, bottom: 24, left: 8 },
          valueFormatter: (value) => Math.round(value).toLocaleString(locale()) + " " + t("unitEinsaetze"),
          labelFormatter: (date) => formatDisplayDate(date),
          xLabelFirst: true,
          xLabelFormatter: (date) => formatShortDate(date),
        }
      )
    );
    charts.missions.draw();
  } else {
    $("missionsChart")?.replaceChildren();
  }

  // Ø Reaktionszeit (Eintreffzeit erstes Löschfahrzeug) über die letzten
  // 30 vollständigen Tage — "des letzten Monats".
  const last30 = completeRows.slice(-30).filter((r) => r.responseTimeMin != null);
  if (last30.length) {
    const avgMin = last30.reduce((sum, r) => sum + r.responseTimeMin, 0) / last30.length;
    setText("respTimeValue", avgMin.toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " min");

    registerChart("respTime", $("respTimeChart"), $("respTimeTooltip"), () =>
      drawLineChart(
        $("respTimeChart"),
        $("respTimeTooltip"),
        last30.map((r) => r.responseTimeMin),
        last30.map((r) => r.date),
        {
          id: "resptime",
          color: "var(--series-fire)",
          grid: false,
          padding: { top: 6, right: 4, bottom: 16, left: 4 },
          xLabelCount: 2,
          valueFormatter: (v) => v.toLocaleString(locale(), { maximumFractionDigits: 1 }) + " min",
          labelFormatter: (d) => formatDisplayDate(d),
          xLabelFormatter: (d) => formatShortDate(d),
        }
      )
    );
    charts.respTime.draw();
  } else {
    setText("respTimeValue", "--");
  }
}

// ---------- Pegelstand Spree · Berlin-Köpenick (PEGELONLINE / WSV) ----------

// Die Spree in Köpenick ist durch Wehre und Schleusen reguliert und schwankt
// meist nur um 1–3 cm. Ein Zeitverlauf zeigt dann fast nur Messrauschen —
// für die Lage zählt die Einordnung. Deshalb zeigt die Kachel eine Pegellatte
// mit den amtlichen Kennwerten der Messstelle und daneben einen stilisierten
// Flussquerschnitt, der bis zum aktuellen Stand gefüllt ist.

// Amtliche Kennwerte (PEGELONLINE, Mittelwerte 2010–2020). Werden beim Laden
// live abgefragt; diese Werte dienen nur als Rückfall.
const PEGEL_KENNWERTE_FALLBACK = { NNW: 53, MNW: 83, MW: 87, MHW: 96, HHW: 165 };
let pegelKennwerte = { ...PEGEL_KENNWERTE_FALLBACK };
let lastPegelSeries = null;

// Eigene Bereichsgrenzen aus den Kennwerten — PEGELONLINE liefert für
// Köpenick keine Hochwasser-Meldestufen: niedrig unter MNW, normal bis MHW,
// erhöht bis zur Mitte zwischen MHW und HHW, hoch darüber, Rekordnähe ab
// 10 cm unter dem höchsten je gemessenen Stand.
function pegelZones(kw) {
  const high = Math.round(kw.MHW + (kw.HHW - kw.MHW) / 2);
  const record = kw.HHW - 10;
  return [
    { key: "low", from: -Infinity, to: kw.MNW },
    { key: "normal", from: kw.MNW, to: kw.MHW },
    { key: "raised", from: kw.MHW, to: high },
    { key: "high", from: high, to: record },
    { key: "record", from: record, to: Infinity },
  ];
}

async function loadPegel() {
  try {
    const [res, stationRes] = await Promise.all([
      fetch(`${PEGEL_BASE}/W/measurements.json?start=P2D`),
      fetch(`${PEGEL_BASE}.json?includeTimeseries=true&includeCharacteristicValues=true`).catch(() => null),
    ]);
    if (!res.ok) throw new Error("Pegeldaten nicht erreichbar");
    const series = await res.json();
    if (!series.length) throw new Error("Keine Pegeldaten");
    try {
      const station = stationRes?.ok ? await stationRes.json() : null;
      const values = station?.timeseries?.find((ts) => ts.shortname === "W")?.characteristicValues || [];
      const kw = Object.fromEntries(values.map((c) => [c.shortname, c.value]));
      if (Object.keys(PEGEL_KENNWERTE_FALLBACK).every((k) => Number.isFinite(kw[k]))) {
        pegelKennwerte = Object.fromEntries(Object.keys(PEGEL_KENNWERTE_FALLBACK).map((k) => [k, kw[k]]));
      }
    } catch {
      // Kennwerte nicht lesbar: Rückfallwerte behalten.
    }
    lastPegelSeries = series;
    renderPegel();
  } catch (error) {
    console.error(error);
    setText("pegelValue", "--");
    setText("pegelTrend", t("noData"));
  }
}

function renderPegel() {
  const series = lastPegelSeries;
  if (!series || !series.length) return;

  const latest = series[series.length - 1];
  const current = Math.round(latest.value);
  setText("pegelValue", current + " cm");
  setText("pegelTime", t("standPrefix") + " " + formatClock(latest.timestamp));

  const zone = pegelZones(pegelKennwerte).find((z) => current >= z.from && current < z.to);
  const zoneEl = $("pegelZone");
  if (zoneEl) {
    zoneEl.hidden = false;
    zoneEl.className = "pegel-zone is-" + zone.key;
    zoneEl.textContent = t("pegelZone_" + zone.key);
  }

  // Tendenz über 24 Stunden: Messwert von vor 24 h mit dem aktuellen
  // vergleichen. Unter 2 cm gilt als stabil (Messauflösung 1 cm).
  const dayAgo = new Date(latest.timestamp).getTime() - 24 * 3600 * 1000;
  const ref = series.find((p) => new Date(p.timestamp).getTime() >= dayAgo) || series[0];
  const diff = Math.round(latest.value - ref.value);
  const trendKey = diff >= 2 ? "steigend" : diff <= -2 ? "fallend" : "stabil";
  const diffText = diff === 0 ? "±0" : (diff > 0 ? "+" : "−") + Math.abs(diff);
  setText("pegelTrend", `${t("trendPrefix")} ${trendLabel(trendKey)} · ${diffText} cm / 24 h`);

  speechState.pegel = current;
  speechState.trend = trendLabel(trendKey);

  registerChart("pegel", $("pegelChart"), null, () => drawPegelGauge($("pegelChart"), current));
  charts.pegel.draw();
}

// Pegellatte links (Skala, farbige Bereiche, Wassersäule bis zum aktuellen
// Stand), rechts stilisierter Flussquerschnitt mit Kennwert-Linien.
function drawPegelGauge(svg, current) {
  if (!svg) return;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("preserveAspectRatio");

  const kw = pegelKennwerte;
  const fs = chartLabelFontSize();
  const lo = Math.min(kw.NNW - 8, current - 5);
  const hi = Math.max(kw.HHW + 7, current + 5);
  const top = 4;
  const bottom = h - 4;
  const y = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);

  // Pegellatte
  const x0 = Math.round(fs * 2.9);
  const barW = Math.round(Math.max(14, Math.min(fs * 2.2, w * 0.09)));
  let out = "";
  for (const z of pegelZones(kw)) {
    const a = Math.max(z.from, lo);
    const b = Math.min(z.to, hi);
    if (b <= a) continue;
    out += `<rect class="pegel-zone-fill is-${z.key}" x="${x0}" y="${y(b)}" width="${barW}" height="${y(a) - y(b)}"></rect>`;
  }
  const inset = Math.round(barW * 0.27);
  out += `<rect x="${x0 + inset}" y="${y(current)}" width="${barW - 2 * inset}" height="${bottom - y(current)}" rx="2" fill="var(--series-pegel)"></rect>`;
  out += `<rect x="${x0}" y="${top}" width="${barW}" height="${bottom - top}" rx="4" fill="none" stroke="var(--chart-grid)"></rect>`;
  // Skala: Teilstriche alle 10 cm, Zahlen alle 20 cm (bei wenig Höhe alle 40)
  const labelStep = (bottom - top) / (hi - lo) * 20 < fs * 1.6 ? 40 : 20;
  for (let v = Math.ceil(lo / 10) * 10; v <= hi; v += 10) {
    const major = v % labelStep === 0;
    out += `<line x1="${x0 - (major ? 6 : 3)}" x2="${x0}" y1="${y(v)}" y2="${y(v)}" stroke="var(--muted)" stroke-opacity="0.6"></line>`;
    if (major && Math.abs(y(v) - y(current)) > fs) {
      out += `<text x="${x0 - 9}" y="${y(v) + fs * 0.35}" text-anchor="end" fill="var(--muted)" font-size="${fs}">${v}</text>`;
    }
  }
  const cy = y(current);
  out += `<path d="M${x0 - 1},${cy} l-8,-5 v10 z" fill="var(--text)"></path>`;
  out += `<line x1="${x0}" x2="${x0 + barW}" y1="${cy}" y2="${cy}" stroke="var(--text)" stroke-width="2"></line>`;

  // Flussquerschnitt
  const sx = x0 + barW + 10;
  const sR = w - 2;
  const W = sR - sx;
  const bank = (f) => sx + f * W;
  const bankTop = Math.min(hi, kw.HHW - 15);
  const bedBottom = Math.max(lo + 2, kw.NNW - 4);
  const bed =
    `M${sx},${y(bankTop)} C${bank(0.12)},${y(bankTop)} ${bank(0.2)},${y(bedBottom + 3)} ${bank(0.36)},${y(bedBottom)} ` +
    `L${bank(0.66)},${y(bedBottom)} C${bank(0.82)},${y(bedBottom + 3)} ${bank(0.88)},${y(bankTop)} ${sR},${y(bankTop)}`;
  const wy = y(current);
  let wave = `M${sx},${wy}`;
  for (let i = 1; i <= 12; i++) wave += ` L${sx + (i / 12) * W},${wy + Math.sin(i * 1.4) * 1.2}`;
  out += `<defs><clipPath id="pegelBedClip"><path d="${bed} L${sR},${y(bankTop)} L${sx},${y(bankTop)} Z"></path></clipPath></defs>`;
  out += `<path class="pegel-ground" d="${bed} L${sR},${bottom} L${sx},${bottom} Z"></path>`;
  out += `<path d="${wave} L${sR},${bottom} L${sx},${bottom} Z" fill="var(--series-pegel)" fill-opacity="0.55" clip-path="url(#pegelBedClip)"></path>`;
  out += `<path d="${bed}" fill="none" stroke="var(--muted)" stroke-opacity="0.7" stroke-width="1.5"></path>`;

  // Kennwert-Linien über die ganze Breite; Beschriftungen, die zu dicht
  // liegen, werden auseinandergeschoben (bei sehr wenig Höhe ohne NNW).
  const marks = [["HHW", kw.HHW], ["MHW", kw.MHW], ["MW", kw.MW]];
  if (bottom - top > fs * 9) marks.push(["NNW", kw.NNW]);
  const gap = fs + 2;
  const labels = marks.map(([k, v]) => ({ k, v, pos: y(v) - 3 })).sort((a, b) => a.pos - b.pos);
  for (let i = 1; i < labels.length; i++) labels[i].pos = Math.max(labels[i].pos, labels[i - 1].pos + gap);
  const overflow = labels.at(-1).pos - (bottom - 2);
  if (overflow > 0) labels.forEach((l) => (l.pos -= overflow));
  for (const { k, v, pos } of labels) {
    const isMW = k === "MW";
    out += `<line x1="${sx}" x2="${sR}" y1="${y(v)}" y2="${y(v)}" stroke="${isMW ? "var(--text)" : "var(--muted)"}" stroke-dasharray="4 3" stroke-opacity="0.6"></line>`;
    out += `<text x="${sR - 2}" y="${Math.max(top + fs, pos)}" text-anchor="end" font-size="${fs}" fill="var(--muted)" stroke="var(--panel)" stroke-width="4" stroke-linejoin="round" paint-order="stroke"><tspan font-weight="800" fill="${isMW ? "var(--text)" : "var(--muted)"}">${k}</tspan> ${v}</text>`;
  }
  const labelY = Math.min(wy + fs + 5, y(bedBottom) - 3);
  out += `<text x="${bank(0.5)}" y="${labelY}" text-anchor="middle" font-size="${fs + 1.5}" font-weight="800" fill="var(--text)">${current} cm</text>`;

  svg.innerHTML = out;
}

// ---------- Luftqualität (Open-Meteo Air Quality) ----------
// Rauch von Bränden kann die Luftqualität verschlechtern — daher als eigene
// Anzeige neben Bränden und Pegel sinnvoll für die Lagebeurteilung.

let lastAqiPayload = null;

function aqiStatusKey(eaqi) {
  if (eaqi == null) return null;
  if (eaqi <= 20) return "good";
  if (eaqi <= 40) return "warning";
  if (eaqi <= 60) return "serious";
  return "critical";
}

async function loadAirQuality() {
  try {
    const url = `${AIR_QUALITY_URL}?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}&current=pm10,pm2_5,european_aqi&timezone=Europe%2FBerlin`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Luftqualitätsdaten nicht erreichbar");
    lastAqiPayload = await res.json();
    renderAqi();
  } catch (error) {
    console.error(error);
    setText("aqiValue", "--");
    setText("aqiDetail", t("noData"));
  }
}

function renderAqi() {
  const data = lastAqiPayload;
  if (!data) return;
  const c = data.current;
  const key = aqiStatusKey(c.european_aqi);
  const cls = key ? "aqi-" + key : "";
  const label = key ? aqiLabel(key) : t("noData");

  const valueEl = $("aqiValue");
  if (valueEl) {
    valueEl.textContent = label;
    valueEl.className = "v " + cls;
  }
  const iconEl = $("aqiIcon");
  if (iconEl) iconEl.setAttribute("class", "ic " + cls);

  setText("aqiDetail", `PM2.5 ${c.pm2_5.toFixed(1)} · PM10 ${c.pm10.toFixed(1)} µg/m³`);
  speechState.aqi = label.toLowerCase();
}

// ---------- Warnungen ----------
// Die Warnungen selbst kommen bereits mehrsprachig (de/en/fr/pl/es) vom Bund
// und wurden zur Build-Zeit in Node.js geladen (siehe index.astro — die
// NINA-API erlaubt keinen Cross-Origin-Zugriff aus dem Browser). Sie stehen
// als JSON im Dokument und werden hier komplett client-seitig gerendert —
// genau wie die Tages-Vorhersage, damit ein Sprachwechsel ohne neuen
// Netzwerk-Request funktioniert.
//
// Sie sind deshalb nur so aktuell wie der letzte Seiten-Build. GitHub führt
// geplante Builds nicht garantiert pünktlich aus (gemessen: 3–7 Std. Abstand),
// also zeigen wir das Alter an und weisen ab WARN_STALE_MINUTES darauf hin.
const WARN_STALE_MINUTES = 60;

let warningsPayload = { warnings: [], warningsError: false, buildStamp: null };

function warningsAgeMinutes() {
  const stamp = warningsPayload.buildStamp;
  return stamp ? Math.max(0, (Date.now() - new Date(stamp).getTime()) / 60000) : null;
}

function formatWarningsAge(minutes) {
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto", style: "short" });
  if (minutes < 60) return rtf.format(-Math.round(minutes), "minute");
  if (minutes < 48 * 60) return rtf.format(-Math.round(minutes / 60), "hour");
  return rtf.format(-Math.round(minutes / 1440), "day");
}

function loadWarningsData() {
  const el = $("warnings-data");
  if (!el) return;
  try {
    warningsPayload = JSON.parse(el.textContent);
  } catch (error) {
    console.error("Warnungen-Daten konnten nicht gelesen werden:", error);
  }
}

function warningLang(w) {
  return w.langs[getLang()] || w.langs.de;
}

function formatWarnTime(iso) {
  if (!iso) return "–";
  return (
    new Date(iso).toLocaleString(locale(), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) +
    (t("clockSuffix") ? " " + t("clockSuffix") : "")
  );
}

function renderWarningsTile() {
  const { warnings, warningsError } = warningsPayload;
  const statusKey = warningsError ? null : warnings.length > 0 ? severityToAqiKey(warnings[0].severity) : "good";

  const valueEl = document.querySelector("#warningsOpen .v");
  if (valueEl) {
    valueEl.textContent = warningsError ? t("noData") : warnings.length > 0 ? `${warnings.length} ${t("warnActiveSuffix")}` : t("warnNoneActive");
    valueEl.className = "v " + (statusKey ? "aqi-" + statusKey : "");
  }

  const subEls = document.querySelectorAll("#warningsOpen .sub");
  if (subEls[0]) subEls[0].textContent = warningsError ? t("warnSubError") : t("warnSubOk");

  const preview = document.querySelector("#warningsOpen .warn-preview");
  if (preview) {
    const buildTime = warningsPayload.buildStamp
      ? new Date(warningsPayload.buildStamp).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })
      : null;
    const age = warningsAgeMinutes();
    const stale = age !== null && age > WARN_STALE_MINUTES;
    const updatedMarkup = buildTime
      ? `<p class="warn-updated${stale ? " is-stale" : ""}">${t("warnUpdated")}: ${buildTime} · ${formatWarningsAge(age)}` +
        `${stale ? `<br />${t("warnStaleTile")}` : ""}</p>`
      : "";

    if (warningsError) {
      preview.innerHTML = `<p>${t("warnPreviewError")}</p>${updatedMarkup}`;
    } else if (warnings.length === 0) {
      preview.innerHTML = `<p>${t("warnPreviewEmpty")}</p>${updatedMarkup}`;
    } else {
      const previewCount = window.matchMedia("(min-width: 1800px) and (min-height: 1000px)").matches ? 5 : 3;
      preview.innerHTML = warnings
        .slice(0, previewCount)
        .map((w) => `<p class="warn-preview-item"><span class="warn-dot aqi-${severityToAqiKey(w.severity)}"></span>${warningLang(w).headline}</p>`)
        .join("") + updatedMarkup;
    }
  }

  if (subEls[1]) subEls[1].textContent = t("detailsView");
}

function severityToAqiKey(severity) {
  if (severity === "Extreme") return "critical";
  if (severity === "Severe") return "serious";
  if (severity === "Moderate") return "warning";
  return "good";
}

// Auf Desktop scrollt nichts, auch kein Fenster. Mehrere Warnungen passen
// dort nicht untereinander, abschneiden kommt bei amtlichen Warnungen aber
// nicht in Frage — daher einzeln zum Blättern (schwerste zuerst). Mobil
// bleibt es eine scrollbare Liste.
let warnPage = 0;
const desktopLayout = window.matchMedia("(min-width: 1101px)");

function renderWarningsModal() {
  const { warnings, warningsError } = warningsPayload;
  const title = $("warnModalTitle");
  if (title) title.textContent = t("warnModalTitle");

  const body = $("warnModalBody");
  if (!body) return;

  if (warningsError) {
    body.innerHTML = `<p class="warn-empty">${t("warnModalError")}</p>`;
  } else if (warnings.length === 0) {
    body.innerHTML = `<p class="warn-empty">${t("warnPreviewEmpty")}</p>`;
  } else {
    const paged = desktopLayout.matches && warnings.length > 1;
    warnPage = Math.min(warnPage, warnings.length - 1);
    const shown = paged ? [warnings[warnPage]] : warnings;
    const pager = paged
      ? `<div class="warn-pager">
          <button type="button" class="warn-pager-btn" data-warn-step="-1" aria-label="${t("warnPrev")}" ${warnPage === 0 ? "disabled" : ""}>‹</button>
          <span aria-live="polite">${t("warnPageOf").replace("{i}", warnPage + 1).replace("{n}", warnings.length)}</span>
          <button type="button" class="warn-pager-btn" data-warn-step="1" aria-label="${t("warnNext")}" ${warnPage === warnings.length - 1 ? "disabled" : ""}>›</button>
        </div>`
      : "";
    body.innerHTML = `${pager}<div class="warn-list">${shown
      .map((w) => {
        const info = warningLang(w);
        const cls = "aqi-" + severityToAqiKey(w.severity);
        return `
          <article class="warn-card">
            <div class="warn-card-head">
              <span class="warn-badge ${cls}">${severityLabel(w.severity)}</span>
              <span class="warn-time">${t("validUntil")} ${formatWarnTime(w.expires)}</span>
            </div>
            <h3>${info.headline}</h3>
            ${info.description ? `<p class="warn-desc">${info.description}</p>` : ""}
            ${info.instruction ? `<p class="warn-instr">${info.instruction}</p>` : ""}
            <p class="warn-meta">${info.senderName}${w.areaDesc ? ` · ${w.areaDesc}` : ""}</p>
          </article>`;
      })
      .join("")}</div>`;
  }

  renderWarningsFootnote();

  speechState.warnCount = warningsError ? 0 : warnings.length;
  speechState.warnHeadline = warnings.length > 0 ? warningLang(warnings[0]).headline : "";
}

// Getrennt vom Rest des Modals, damit die Altersangabe jede Minute
// aktualisiert werden kann, ohne die Warnungsliste (und ihre Scrollposition)
// neu aufzubauen.
function renderWarningsFootnote() {
  const footnote = $("warnFootnote");
  if (!footnote) return;
  const { buildStamp } = warningsPayload;
  const stamp = buildStamp
    ? new Date(buildStamp).toLocaleString(locale(), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "–";
  const age = warningsAgeMinutes();
  const ageText = age !== null ? ` (${formatWarningsAge(age)})` : "";
  const staleText = age !== null && age > WARN_STALE_MINUTES ? `<span class="warn-stale-note">${t("warnStaleModal")}</span>` : "";
  footnote.innerHTML = `${t("warnSource")} · ${t("buildStandLabel")}: ${stamp}${ageText}${staleText}`;
}

function openWarnings() {
  const modal = $("warnModal");
  if (!modal) return;
  warnPage = 0;
  renderWarningsModal();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  $("warnModalClose")?.focus();
}

$("warnModalBody")?.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-warn-step]");
  if (!btn) return;
  warnPage += Number(btn.dataset.warnStep);
  renderWarningsModal();
  // Fokus auf dem gleichen Knopf halten (falls er jetzt deaktiviert ist, auf
  // dem anderen), damit man per Tastatur weiterblättern kann.
  const same = document.querySelector(`[data-warn-step="${btn.dataset.warnStep}"]`);
  (same && !same.disabled ? same : document.querySelector("[data-warn-step]:not(:disabled)"))?.focus();
});
desktopLayout.addEventListener?.("change", () => renderWarningsModal());

function closeWarnings() {
  const modal = $("warnModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

// ---------- Gefahrenkarte-Modal ----------
// Die Karte ist ein statisches WMS-Kartenbild (Umweltatlas Berlin), direkt
// als <img> im HTML verlinkt — kein Fetch/JS für die Daten nötig.

function openHazardMap() {
  const modal = $("hazardModal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  $("hazardModalClose")?.focus();
}

function closeHazardMap() {
  const modal = $("hazardModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

// ---------- Barrierefreiheit: Sprache, Farbenblind-Modus, Vorlesen ----------

function renderDynamicTexts() {
  // Alles neu rendern, was aus zwischengespeicherten Rohdaten zusammengesetzt
  // wird — ohne erneuten Netzwerk-Request, das reicht für einen Sprachwechsel.
  applyStaticTranslations();
  if (lastWeatherPayload) renderWeather();
  if (lastFireRows) renderFire();
  if (lastPegelSeries) renderPegel();
  if (lastAqiPayload) renderAqi();
  renderWarningsTile();
  renderWarningsModal();
  updateClock();
  redrawAllCharts();
}

// Simples Öffnen/Schließen-Panel ohne dynamischen Inhalt (Backdrop-Klick,
// ---------- Tastaturbedienung der Fenster ----------
// Gilt zentral für alle Fenster (.day-modal): Tab bleibt innerhalb des offenen
// Fensters, und nach dem Schließen kehrt der Fokus zu dem Element zurück, mit
// dem das Fenster geöffnet wurde.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
let lastFocusOutsideModal = null;

function openModalElement() {
  return document.querySelector(".day-modal:not([hidden])");
}

document.addEventListener("focusin", (e) => {
  if (!e.target.closest?.(".day-modal")) lastFocusOutsideModal = e.target;
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const modal = openModalElement();
  if (!modal) return;
  const focusable = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
});

new MutationObserver((mutations) => {
  const closed = mutations.some((m) => m.target.classList?.contains("day-modal") && m.target.hidden);
  const focusLost = document.activeElement === document.body || document.activeElement?.closest(".day-modal[hidden]");
  if (closed && focusLost && !openModalElement() && lastFocusOutsideModal?.isConnected) lastFocusOutsideModal.focus();
}).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });

// Schließen-Knopf, Escape) — von Hilfe- und Barrierefreiheit-Panel geteilt.
function setupSimplePanel(openId, panelId, backdropId, closeId) {
  const openBtn = $(openId);
  const panel = $(panelId);
  const backdrop = $(backdropId);
  const closeBtn = $(closeId);

  const open = () => {
    if (!panel) return;
    panel.hidden = false;
    document.body.classList.add("modal-open");
    closeBtn?.focus();
  };
  const close = () => {
    if (panel) panel.hidden = true;
    document.body.classList.remove("modal-open");
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel && !panel.hidden) close();
  });
}

function setupHelpTabs() {
  const tabs = [...document.querySelectorAll(".help-tab")];
  const selectTab = (selectedTab) => {
    tabs.forEach((tab) => {
      const active = tab === selectedTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.dataset.helpTarget)?.classList.toggle("is-active", active);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      selectTab(tabs[nextIndex]);
    });
  });
}

function setupA11yPanel() {
  setupSimplePanel("a11yOpen", "a11yPanel", "a11yPanelBackdrop", "a11yPanelClose");

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (tts.active) stopSpeaking();
      setLang(btn.dataset.lang);
      document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderDynamicTexts();
      updateSpeechAvailability();
    });
  });
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === getLang()));

  const hcToggle = $("highContrastToggle");
  if (hcToggle) {
    hcToggle.checked = getHighContrast();
    hcToggle.addEventListener("change", () => setHighContrast(hcToggle.checked));
  }

  const lightModeToggle = $("lightModeToggle");
  if (lightModeToggle) {
    lightModeToggle.checked = getTheme() === "light";
    lightModeToggle.addEventListener("change", () => setTheme(lightModeToggle.checked ? "light" : "dark"));
  }

  setupSpeech();
}

// ---------- Sprachausgabe ----------
// Zwei Wege, in dieser Reihenfolge:
//
// 1. Stimmen des Browsers (Web Speech API). Welche es gibt, hängt von Browser
//    und Betriebssystem ab: Windows bringt oft nur Stimmen für die
//    Systemsprache und Englisch mit, Chrome ergänzt Online-Stimmen („Google
//    français“ …), Edge natürliche Online-Stimmen („Microsoft … Online
//    (Natural)“). Nur `utterance.lang` zu setzen reicht nicht — ohne
//    Zuordnung liest der Browser mit seiner Standardstimme (meist Englisch)
//    vor. Deshalb wählen wir die Stimme selbst.
// 2. Fehlt eine passende Browser-Stimme (z. B. Firefox ohne installiertes
//    Sprachpaket), kann ein Sprachmodell (Piper TTS) direkt im Browser
//    laufen. Geladen wird es nie automatisch, sondern erst, wenn man im
//    Barrierefreiheit-Panel auf „Stimme herunterladen“ klickt (Stimme
//    ≈ 60 MB von Hugging Face, beim ersten Mal zusätzlich Laufzeit und
//    Aussprache-Daten ≈ 10 MB komprimiert von cdnjs/jsDelivr). Danach
//    bleibt die Stimme im Browser gespeichert. Der normale Seitenaufruf lädt
//    davon nichts.

const PIPER_VOICES = {
  de: "de_DE-thorsten-medium", // CC0
  en: "en_GB-cori-medium", // gemeinfrei
  fr: "fr_FR-siwis-medium", // CC BY 4.0, Namensnennung in den Quellen
  pl: "pl_PL-gosia-medium", // CC0
  es: "es_ES-davefx-medium", // CC0
};
// Download beim ersten Mal: Stimme ≈ 60 MB, beim allerersten Mal zusätzlich
// Laufzeit und Aussprache-Daten ≈ 10 MB (gemessen: 71 MB insgesamt).
const PIPER_VOICE_MB = 60;
const PIPER_FIRST_MB = 70;
// Ausspracheregeln nur für Piper (Browser-Stimmen bekommen den Originaltext).
// Polnisch: Piper schreibt „trz“ mit denselben Lauten wie „cz“, gosia liest
// „powietrza“ dann wie „powiecza“. Als „trsz“ geschrieben klingt es richtig.
const PIPER_TEXT_FIXES = {
  pl: (text) => text.replace(/trz/gi, (m) => m.slice(0, 2) + "sz"),
};

const tts = {
  active: false,
  run: 0, // erhöht sich bei jedem Start/Stopp; alte Läufe brechen dann ab
  audio: null,
  piperModule: null,
  sessions: new Map(),
  storedVoices: null, // Set der im Browser gespeicherten Piper-Stimmen
  downloading: null, // voiceId des laufenden Downloads
  progress: null,
};

function buildSpeechParts() {
  const parts = [speech("intro")];
  if (speechState.temp != null) parts.push(speech("temp", speechState.temp, speechState.cond || ""));
  if (speechState.pegel != null) parts.push(speech("pegel", speechState.pegel, speechState.trend || ""));
  if (speechState.fireCount != null) parts.push(speech("fire", speechState.fireCount));
  if (speechState.aqi) parts.push(speech("aqi", speechState.aqi));
  if (speechState.warnCount === 0) parts.push(speech("warnNone"));
  else if (speechState.warnCount > 0) parts.push(speech("warnSome", speechState.warnCount, speechState.warnHeadline));
  return parts.filter(Boolean);
}

function hasWebSpeech() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function canRunPiper() {
  return typeof WebAssembly === "object" && !!navigator.storage?.getDirectory;
}

function normalizeVoiceLang(lang) {
  return (lang || "").toLowerCase().replace("_", "-");
}

// Beste Browser-Stimme für die aktuelle Sprache: gleiche Sprache Pflicht,
// danach natürlich klingende Stimmen vor den klassischen Systemstimmen und
// die exakte Region (fr-FR statt fr-CA) vor anderen Varianten.
function pickVoice() {
  if (!hasWebSpeech()) return null;
  const voices = window.speechSynthesis.getVoices();
  const wanted = normalizeVoiceLang(locale());
  const base = wanted.split("-")[0];
  const score = (v) => {
    const lang = normalizeVoiceLang(v.lang);
    let s = 0;
    if (lang === wanted) s += 4;
    if (/natural|neural/i.test(v.name)) s += 8;
    else if (/online|google|premium|enhanced/i.test(v.name)) s += 6;
    return s;
  };
  return voices
    .filter((v) => normalizeVoiceLang(v.lang).split("-")[0] === base)
    .sort((a, b) => score(b) - score(a))[0] || null;
}

// Manche Browser melden ihre Stimmen erst kurz nach dem Laden (voiceschanged).
function waitForVoices(timeout = 1000) {
  if (!hasWebSpeech() || window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout);
    window.speechSynthesis.addEventListener?.(
      "voiceschanged",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

function loadPiper() {
  tts.piperModule ??= import("@mintplex-labs/piper-tts-web").catch((error) => {
    tts.piperModule = null;
    throw error;
  });
  return tts.piperModule;
}

// Eigene Sitzung pro Stimme: Das Paket hält sonst nur eine globale Sitzung
// und würde nach einem Sprachwechsel das zuvor geladene Modell weiterverwenden.
function getPiperSession(voiceId) {
  if (!tts.sessions.has(voiceId)) {
    const session = loadPiper()
      .then(({ TtsSession }) => {
        TtsSession._instance = null;
        return TtsSession.create({ voiceId, progress: (p) => tts.progress?.(p) });
      })
      .catch((error) => {
        tts.sessions.delete(voiceId);
        throw error;
      });
    tts.sessions.set(voiceId, session);
  }
  return tts.sessions.get(voiceId);
}

function showSpeakHint(text) {
  const hint = $("speakHint");
  if (!hint) return;
  hint.hidden = !text;
  hint.textContent = text || "";
}

async function getStoredVoices() {
  if (!tts.storedVoices) {
    try {
      tts.storedVoices = new Set(await (await loadPiper()).stored());
    } catch {
      tts.storedVoices = new Set();
    }
  }
  return tts.storedVoices;
}

// Zustand von Vorlesen- und Download-Knopf für die aktuelle Sprache:
// Browser-Stimme vorhanden → vorlesen; sonst lokale Stimme gespeichert →
// vorlesen; sonst Download-Knopf mit Hinweis anbieten (Vorlesen gesperrt).
let availabilityCheck = 0;
async function updateSpeechAvailability() {
  const btn = $("speakBtn");
  const downloadBtn = $("speakDownloadBtn");
  if (!btn) return;
  const check = ++availabilityCheck;
  await waitForVoices(1500);
  if (check !== availabilityCheck) return;

  if (pickVoice()) {
    btn.disabled = false;
    if (downloadBtn) downloadBtn.hidden = true;
    showSpeakHint("");
    return;
  }
  if (!canRunPiper()) {
    btn.disabled = true;
    if (downloadBtn) downloadBtn.hidden = true;
    showSpeakHint(hasWebSpeech() ? t("a11ySpeakNoVoice") : t("a11ySpeakUnsupported"));
    return;
  }

  const voiceId = PIPER_VOICES[getLang()];
  const stored = await getStoredVoices();
  if (check !== availabilityCheck) return;
  if (stored.has(voiceId)) {
    btn.disabled = false;
    if (downloadBtn) downloadBtn.hidden = true;
    showSpeakHint("");
    return;
  }
  btn.disabled = true;
  showSpeakHint(t("a11ySpeakDownload"));
  if (downloadBtn) {
    downloadBtn.hidden = false;
    if (tts.downloading === voiceId) return;
    downloadBtn.disabled = !!tts.downloading; // es läuft schon ein Download für eine andere Sprache
    setDownloadButtonState("idle", 0, stored.size ? PIPER_VOICE_MB : PIPER_FIRST_MB);
  }
}

// Lädt Stimme, KI-Laufzeit und Aussprache-Daten vollständig herunter. Erst
// danach wird das Vorlesen freigegeben, damit beim Vorlesen nichts mehr
// nachgeladen werden muss.
async function downloadPiperVoice() {
  const voiceId = PIPER_VOICES[getLang()];
  if (tts.downloading) return;
  tts.downloading = voiceId;
  const loaded = new Map();
  const reportProgress = () => {
    let done = 0, total = 0;
    for (const [l, t] of loaded.values()) {
      done += Math.min(l, t);
      total += t;
    }
    // Höchstens 99 %, bis wirklich alles geladen ist — 100 % zeigt dann der
    // freigegebene Vorlesen-Knopf.
    if (total && PIPER_VOICES[getLang()] === voiceId) setDownloadButtonState("loading", Math.min(done / total, 0.99));
  };
  // Erwartete Größen als Startwert, bis der Server die echten meldet.
  loaded.set("model", [0, 63e6]);
  setDownloadButtonState("loading", 0);
  try {
    const { TtsSession, HF_BASE, PATH_MAP } = await loadPiper();
    const { piperData, piperWasm } = TtsSession.WASM_LOCATIONS;
    const modelUrl = `${HF_BASE}/${PATH_MAP[voiceId]}`;
    const prefetch = [piperData, piperWasm].map((url, i) =>
      withRetries(() =>
        fetchWithProgress(url, (l, t) => {
          loaded.set("extra" + i, [l, t || (i === 0 ? 18e6 : 0.6e6)]);
          reportProgress();
        })
      )
    );
    // Stimme abschnittsweise laden und dort ablegen, wo das Piper-Paket sie
    // sucht (Browser-Speicher, Ordner „piper“). Die Konfiguration zuerst: eine
    // vorhandene .onnx-Datei bedeutet für stored(), dass die Stimme komplett ist.
    const model = (async () => {
      const config = await withRetries(() => fetchChunked(`${modelUrl}.json`, () => {}));
      const onnx = await fetchChunked(modelUrl, (l, t) => {
        loaded.set("model", [l, t]);
        reportProgress();
      });
      await writePiperFile(`${voiceId}.onnx.json`, config);
      await writePiperFile(`${voiceId}.onnx`, onnx);
    })();
    await Promise.all([model, ...prefetch]);
    // Sitzung anlegen: liest die Stimme jetzt aus dem Browser-Speicher und lädt
    // nur noch die KI-Laufzeit (≈ 2 MB).
    await getPiperSession(voiceId);
    (await getStoredVoices()).add(voiceId);
  } catch (error) {
    console.error("Stimme konnte nicht geladen werden:", error);
    tts.downloading = null;
    tts.progress = null;
    const downloadBtn = $("speakDownloadBtn");
    if (downloadBtn) downloadBtn.disabled = false;
    setDownloadButtonState("idle", 0, tts.storedVoices?.size ? PIPER_VOICE_MB : PIPER_FIRST_MB);
    showSpeakHint(t("a11ySpeakLoadError"));
    return;
  }
  tts.downloading = null;
  tts.progress = null;
  updateSpeechAvailability();
}

// Lädt eine Datei in Abschnitten (HTTP-Range). Jeder Abschnitt dauert selbst
// bei 0,4 Mbit/s unter einer Minute; schlägt einer fehl, wird nur dieser
// wiederholt. In einem Stück brach der Download der 60-MB-Stimme bei langsamem
// 3G nach etwa 10 Minuten ab und hätte von vorn beginnen müssen.
const CHUNK_BYTES = 2 * 1024 * 1024;

async function fetchChunked(url, onProgress) {
  const parts = [];
  let received = 0;
  let total = Infinity;
  let source = url; // nach der ersten Antwort direkt die CDN-Adresse nutzen
  while (received < total) {
    const end = received + CHUNK_BYTES - 1;
    const res = await withRetries(async (attempt) => {
      // Nach einem Fehler wieder über die Originaladresse gehen: die
      // weitergeleitete CDN-Adresse ist nur begrenzt gültig.
      const r = await fetch(attempt === 0 ? source : url, { headers: { Range: `bytes=${received}-${end}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status} für ${url}`);
      return r;
    });
    source = res.url || url;
    if (res.status === 200) {
      // Server ignoriert Range: die ganze Datei kam in einem Stück.
      const blob = await res.blob();
      onProgress(blob.size, blob.size);
      return blob;
    }
    const range = /\/(\d+)\s*$/.exec(res.headers.get("Content-Range") || "");
    if (range) total = Number(range[1]);
    const chunk = await res.blob();
    if (!chunk.size) throw new Error(`Leerer Abschnitt bei Byte ${received} von ${url}`);
    parts.push(chunk);
    received += chunk.size;
    // Ohne Größenangabe weiterladen, bis ein Abschnitt kürzer zurückkommt.
    if (!range && chunk.size < CHUNK_BYTES) total = received;
    onProgress(received, Number.isFinite(total) ? total : received);
  }
  return new Blob(parts);
}

async function withRetries(fn, attempts = 5) {
  for (let i = 0; ; i++) {
    try {
      return await fn(i);
    } catch (error) {
      if (i + 1 >= attempts) throw error;
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** i, 15000)));
    }
  }
}

async function writePiperFile(name, blob) {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle("piper", { create: true });
  const file = await dir.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} für ${url}`);
  // Bei komprimierter Auslieferung nennt Content-Length die komprimierte
  // Größe, gezählt werden aber entpackte Bytes — dann lieber schätzen.
  const total = res.headers.get("Content-Encoding") ? 0 : Number(res.headers.get("Content-Length")) || 0;
  const reader = res.body.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    onProgress(received, total);
  }
}

function setDownloadButtonState(state, progress = 0, mb = PIPER_VOICE_MB) {
  const btn = $("speakDownloadBtn");
  const label = $("speakDownloadLabel");
  if (!btn || !label) return;
  const loading = state === "loading";
  btn.classList.toggle("is-loading", loading);
  btn.setAttribute("aria-busy", loading ? "true" : "false");
  if (loading) btn.disabled = true;
  label.textContent = loading
    ? `${t("a11ySpeakLoading")} ${Math.round(progress * 100)} %`
    : t("a11ySpeakDownloadBtn").replace("{mb}", mb);
}

function stopSpeaking() {
  tts.run++;
  tts.active = false;
  tts.progress = null;
  if (hasWebSpeech()) window.speechSynthesis.cancel();
  tts.audio?.pause();
  setSpeakButtonState("idle");
}

function speakWithBrowser(voice, parts) {
  // Satzweise vorlesen: Chrome bricht Online-Stimmen bei langen Texten nach
  // etwa 15 Sekunden kommentarlos ab.
  window.speechSynthesis.cancel();
  setSpeakButtonState("speaking");
  parts.forEach((part, i) => {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    if (i === parts.length - 1) utterance.onend = () => stopSpeaking();
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") stopSpeaking();
    };
    window.speechSynthesis.speak(utterance);
  });
}

function playBlob(blob, run) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    tts.audio = audio;
    const done = () => {
      URL.revokeObjectURL(url);
      if (tts.audio === audio) tts.audio = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.onpause = () => {
      if (run !== tts.run) done();
    };
    audio.play().catch(done);
  });
}

// Nur für bereits heruntergeladene Stimmen (siehe downloadPiperVoice): Das
// Modell kommt aus dem Browser-Speicher, es wird nichts heruntergeladen.
async function speakWithPiper(parts, run) {
  setSpeakButtonState("preparing");
  const session = await getPiperSession(PIPER_VOICES[getLang()]);
  if (run !== tts.run) return;
  const fix = PIPER_TEXT_FIXES[getLang()];
  // Den ganzen Bericht in einem Durchgang berechnen statt Satz für Satz: Steht
  // „Raport sytuacyjny Berlin.“ allein, spricht gosia es als „Laport“/„Rapport“;
  // im Zusammenhang klappt es. Über 400 Zeichen teilt Piper selbst an Satzenden.
  const text = parts.map((part) => (fix ? fix(part) : part)).join(" ");
  const blob = await session.predict(text);
  if (run !== tts.run) return;
  setSpeakButtonState("speaking");
  await playBlob(blob, run);
  if (run !== tts.run) return;
  stopSpeaking();
}

function setupSpeech() {
  const btn = $("speakBtn");
  if (!btn) return;

  if (hasWebSpeech()) window.speechSynthesis.addEventListener?.("voiceschanged", updateSpeechAvailability);
  updateSpeechAvailability();
  $("speakDownloadBtn")?.addEventListener("click", downloadPiperVoice);

  btn.addEventListener("click", async () => {
    if (tts.active) {
      stopSpeaking();
      return;
    }
    const parts = buildSpeechParts();
    if (!parts.length) return;
    const run = ++tts.run;
    tts.active = true;
    await waitForVoices();
    if (run !== tts.run) return;
    const voice = pickVoice();
    const localVoiceReady = !voice && canRunPiper() && (await getStoredVoices()).has(PIPER_VOICES[getLang()]);
    if (run !== tts.run) return;
    try {
      if (voice) speakWithBrowser(voice, parts);
      else if (localVoiceReady) await speakWithPiper(parts, run);
      else {
        // Keine Stimme verfügbar: nie automatisch herunterladen, sondern den
        // Download-Knopf anbieten.
        stopSpeaking();
        updateSpeechAvailability();
      }
    } catch (error) {
      console.error("Sprachausgabe fehlgeschlagen:", error);
      if (run === tts.run) {
        stopSpeaking();
        showSpeakHint(t("a11ySpeakLoadError"));
      }
    }
  });
}

function setSpeakButtonState(state) {
  const btn = $("speakBtn");
  const label = $("speakBtnLabel");
  if (!btn) return;
  btn.classList.toggle("is-speaking", state === "speaking");
  btn.classList.toggle("is-loading", state === "preparing");
  btn.setAttribute("aria-busy", state === "preparing" ? "true" : "false");
  if (!label) return;
  label.textContent =
    state === "preparing" ? t("a11ySpeakPreparing") : state === "speaking" ? t("a11ySpeakStop") : t("a11ySpeak");
}

// ---------- Start ----------

function setRefreshButtonState(state) {
  const button = $("refreshData");
  const icon = $("refreshDataIcon");
  if (!button || !icon) return;

  const stateKeys = {
    idle: ["refreshData", "i-refresh"],
    loading: ["refreshingData", "i-hourglass"],
    done: ["refreshDataDone", "i-check"],
  };
  const [labelKey, iconName] = stateKeys[state];
  const label = t(labelKey);

  button.disabled = state === "loading";
  button.classList.toggle("is-updated", state === "done");
  button.setAttribute("aria-label", label);
  button.title = label;
  icon.querySelector("use")?.setAttribute("href", `#${iconName}`);
}

async function refreshAll(showRefreshStatus = false) {
  try {
    await Promise.all([loadWeather(), loadFireCount(), loadPegel(), loadAirQuality()]);
  } finally {
    if (showRefreshStatus) {
      try {
        sessionStorage.removeItem("dashboard-refresh-pending");
      } catch {
        // Ignore unavailable session storage.
      }
      setRefreshButtonState("done");
      setTimeout(() => setRefreshButtonState("idle"), 2000);
    }
  }
}

function updateHazardPreviewLoading() {
  const showInlineMap = window.matchMedia("(min-width: 1800px) and (min-height: 1000px)").matches;
  document.querySelectorAll(".hazard-inline-preview img").forEach((image) => {
    image.loading = showInlineMap ? "eager" : "lazy";
  });
}

initTheme();
initLang();
document.documentElement.toggleAttribute("data-high-contrast", getHighContrast());
let refreshPendingOnLoad = false;
try {
  refreshPendingOnLoad = sessionStorage.getItem("dashboard-refresh-pending") === "1";
} catch {
  // Ignore unavailable session storage.
}
if (refreshPendingOnLoad) setRefreshButtonState("loading");
loadWarningsData();
applyStaticTranslations();
renderWarningsTile();
renderWarningsModal();
// Altersangabe der Warnungen mitlaufen lassen (die Daten selbst ändern sich
// erst mit dem nächsten Seiten-Build).
setInterval(() => {
  renderWarningsTile();
  renderWarningsFootnote();
}, 60 * 1000);

$("dayModalClose")?.addEventListener("click", closeDayDetail);
$("dayModalBackdrop")?.addEventListener("click", closeDayDetail);
$("warningsOpen")?.addEventListener("click", openWarnings);
$("warnModalClose")?.addEventListener("click", closeWarnings);
$("warnModalBackdrop")?.addEventListener("click", closeWarnings);
$("hazardMapOpen")?.addEventListener("click", openHazardMap);
$("hazardModalClose")?.addEventListener("click", closeHazardMap);
$("hazardModalBackdrop")?.addEventListener("click", closeHazardMap);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("dayModal")?.hidden) closeDayDetail();
  if (!$("warnModal")?.hidden) closeWarnings();
  if (!$("hazardModal")?.hidden) closeHazardMap();
});

setupA11yPanel();
setupSimplePanel("helpOpen", "helpPanel", "helpPanelBackdrop", "helpPanelClose");
setupHelpTabs();
$("refreshData")?.addEventListener("click", () => {
  setRefreshButtonState("loading");
  try {
    sessionStorage.setItem("dashboard-refresh-pending", "1");
  } catch {
    // The reload still works when session storage is unavailable.
  }
  window.location.reload();
});

window.addEventListener("resize", debounce(() => {
  redrawAllCharts();
  updateHazardPreviewLoading();
}, 150));

updateClock();
updateHazardPreviewLoading();
setInterval(updateClock, 1000);

refreshAll(refreshPendingOnLoad);
setInterval(refreshAll, 5 * 60 * 1000); // alle 5 Minuten aktualisieren
