// Katastrophenschutz Berlin — Lagebild-Dashboard
// Alle Daten werden client-seitig geladen (statische GitHub-Pages-Seite, kein Server/Build-Step nötig).

const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.405;

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const FIRE_DATA_URL =
  "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/BFw_mission_data_daily.csv";

// PEGELONLINE (WSV) — Pegel Berlin-Köpenick an der Spree-Oder-Wasserstraße.
const PEGEL_UUID = "47d3e815-c556-4e1b-93de-9fe07329fb00";
const PEGEL_BASE = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_UUID}`;

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WEEKDAYS_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const WEATHER_ICON_BY_CODE = {
  0: "sun", 1: "cloud-sun", 2: "cloud-sun", 3: "cloud",
  45: "fog", 48: "fog",
  51: "rain", 53: "rain", 55: "rain", 56: "rain", 57: "rain",
  61: "rain", 63: "rain", 65: "rain", 66: "rain", 67: "rain",
  71: "snow", 73: "snow", 75: "snow", 77: "snow",
  80: "rain", 81: "rain", 82: "rain", 85: "snow", 86: "snow",
  95: "thunder", 96: "thunder", 99: "thunder",
};

const WEATHER_LABEL_BY_CODE = {
  0: "Klarer Himmel", 1: "Meistens klar", 2: "Teilweise bewölkt", 3: "Bewölkt",
  45: "Nebel", 48: "Raureifnebel",
  51: "Leichter Nieselregen", 53: "Nieselregen", 55: "Starker Nieselregen",
  56: "Leichter gefrierender Regen", 57: "Gefrierender Regen",
  61: "Leichter Regen", 63: "Regen", 65: "Starker Regen",
  66: "Leichter gefrierender Regen", 67: "Gefrierender Regen",
  71: "Leichter Schneefall", 73: "Schneefall", 75: "Starker Schneefall", 77: "Schneekörner",
  80: "Leichte Regenschauer", 81: "Regenschauer", 82: "Starke Regenschauer",
  85: "Leichte Schneeschauer", 86: "Starke Schneeschauer",
  95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Schweres Gewitter",
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
function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ---------- Zeitstempel ----------

function updateClock() {
  const now = new Date();
  setText(
    "liveDate",
    now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
  );
  setText(
    "liveClock",
    now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

function markUpdated(elId) {
  setText(elId, "Stand " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
}

// ---------- Generische Chart-Zeichenfunktionen ----------
// Wichtig: die viewBox jedes Charts entspricht exakt der tatsächlichen
// Pixelgröße seines Containers. Dadurch wird nie mit unterschiedlichen
// X/Y-Faktoren gestreckt (der Bug im ersten Prototyp: festes 420×220-Raster
// + preserveAspectRatio="none" auf einem anders großen Element -> verzerrte
// Linien UND Zahlen).

const charts = {}; // name -> { svg, tooltip, draw: fn() }

function registerChart(name, svg, tooltip, drawFn) {
  charts[name] = { svg, tooltip, draw: drawFn };
}

function redrawAllCharts() {
  Object.values(charts).forEach((c) => c.draw());
}

function drawLineChart(svg, tooltip, values, labels, opts) {
  if (!svg || !values || !values.length) return;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("preserveAspectRatio");

  const color = opts.color;
  const pad = opts.padding || { top: 10, right: 8, bottom: 20, left: 30 };
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
        ${opts.showYLabels === false ? "" : `<text x="2" y="${y + 4}" fill="var(--muted)" font-size="10.5">${Math.round(value)}${opts.unitShort || ""}</text>`}`;
    }).join("");
  }

  let xLabelsSvg = "";
  if (opts.xLabelCount) {
    const n = opts.xLabelCount;
    const idxs = [...new Set(Array.from({ length: n }, (_, i) => Math.round((i * (nums.length - 1)) / (n - 1))))];
    xLabelsSvg = idxs
      .map((i) => `<text x="${xFor(i)}" y="${h - 5}" text-anchor="middle" fill="var(--muted)" font-size="10.5">${opts.xLabelFormatter(labels[i])}</text>`)
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
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
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
      tooltip.style.left = (closest.x / w) * rect.width + "px";
      tooltip.style.top = (closest.y / h) * rect.height + "px";
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
        ? `<text x="${bars[0].x}" y="${h - 4}" fill="var(--muted)" font-size="10">${opts.xLabelFormatter(bars[0].label)}</text>
           <text x="${bars[bars.length - 1].x + bars[bars.length - 1].w}" y="${h - 4}" text-anchor="end" fill="var(--muted)" font-size="10">${opts.xLabelFormatter(bars[bars.length - 1].label)}</text>`
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
      tooltip.style.left = (closest.x + closest.w / 2) + "px";
      tooltip.style.top = closest.y + "px";
    };
    svg.onpointerleave = () => {
      tooltip.hidden = true;
    };
  }
}

// ---------- Wetter (aktuell + 24h-Verlauf + 7-Tage) ----------

let forecastDays = [];

async function loadWeather() {
  try {
    const url =
      `${WEATHER_URL}?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,uv_index` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_min,temperature_2m_max,weather_code,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max` +
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

    // Open-Meteo liefert Windwerte standardmäßig bereits in km/h (kein m/s) —
    // hier NICHT zusätzlich mit 3.6 umrechnen.
    setText("chipWind", Math.round(current.wind_speed_10m) + " km/h");
    setText("chipGust", Math.round(current.wind_gusts_10m) + " km/h");
    setText("chipHumidity", Math.round(current.relative_humidity_2m) + " %");
    setText("chipPressure", Math.round(current.surface_pressure) + " hPa");
    setText("chipPrecip", (current.precipitation ?? 0).toFixed(1) + " mm");
    setText("chipUV", Number(current.uv_index ?? 0).toFixed(1));
    setText("chipSun", `${formatClock(data.daily.sunrise[0])} · ${formatClock(data.daily.sunset[0])}`);

    renderForecast(data.daily);
    markUpdated("weatherStatus");

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
          xLabelCount: 4,
          nowLabelId: "chartNow",
          valueFormatter: (v) => Math.round(v) + "°C",
          labelFormatter: (t) => formatClock(t),
          xLabelFormatter: (t) => formatClock(t),
        })
      );
      charts.weather.draw();
    }
  } catch (error) {
    console.error(error);
    setText("description", "Wetterdaten nicht verfügbar");
    setText("weatherStatus", "Fehler beim Laden");
  }
}

function renderForecast(daily) {
  const row = $("forecastRow");
  if (!row) return;

  forecastDays = daily.time.map((dateStr, i) => {
    const date = new Date(dateStr + "T00:00:00");
    return {
      date,
      dateStr,
      dayLabel: i === 0 ? "Heute" : WEEKDAYS[date.getDay()],
      weekdayLong: WEEKDAYS_LONG[date.getDay()],
      code: daily.weather_code[i],
      icon: iconFor(daily.weather_code[i]),
      condLabel: labelFor(daily.weather_code[i]),
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
        ${iconMarkup(d.icon)}
        <div class="hi">${d.hi}°</div>
        <div class="lo">${d.lo}°</div>
        <svg class="ic chev"><use href="#i-chevron"/></svg>
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

  setText("dayModalDate", `${d.dayLabel === "Heute" ? "Heute · " : ""}${d.weekdayLong}, ${d.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`);
  setText("dayModalCond", d.condLabel);
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
}

// ---------- Brände (14-Tage-Verlauf, Feuerwehr Berlin) ----------

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

function formatShortDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
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
    .filter((entry) => entry.date && entry.date.length >= 8)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
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

    // Nur vollständige Tage bis (einschließlich) gestern berücksichtigen,
    // damit kein unvollständiger "heute"-Datensatz den Verlauf verfälscht.
    const completeRows = rows.filter((r) => r.date <= yesterdayKey);
    const last14 = completeRows.slice(-14);
    const latest = last14[last14.length - 1] || rows[rows.length - 1];

    setText("fireCount", Math.round(latest.fireCount));
    setText("fireDate", formatDisplayDate(latest.date));

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
            valueFormatter: (v) => Math.round(v) + " Brände",
            labelFormatter: (d) => formatDisplayDate(d),
            xLabelFirst: true,
            xLabelFormatter: (d) => formatShortDate(d),
          }
        )
      );
      charts.fire.draw();
    }
  } catch (error) {
    console.error(error);
    setText("fireCount", "--");
    setText("fireDate", "--");
  }
}

// ---------- Pegelstand Spree · Berlin-Köpenick (PEGELONLINE / WSV) ----------

async function loadPegel() {
  try {
    const res = await fetch(`${PEGEL_BASE}/W/measurements.json?start=P2D`);
    if (!res.ok) throw new Error("Pegeldaten nicht erreichbar");
    const series = await res.json();
    if (!series.length) throw new Error("Keine Pegeldaten");

    const latest = series[series.length - 1];
    setText("pegelValue", Math.round(latest.value) + " cm");
    setText("pegelTime", "Stand " + formatClock(latest.timestamp));

    // Tendenz aus den letzten ~3h (12 Messpunkte à 15 Min.) ableiten.
    const window = series.slice(-12);
    const diff = latest.value - window[0].value;
    const trend = diff >= 1 ? "steigend" : diff <= -1 ? "fallend" : "stabil";
    setText("pegelTrend", "Tendenz " + trend);

    registerChart("pegel", $("pegelChart"), $("pegelTooltip"), () =>
      drawLineChart(
        $("pegelChart"),
        $("pegelTooltip"),
        series.map((p) => p.value),
        series.map((p) => p.timestamp),
        {
          id: "pegel",
          color: "var(--series-pegel)",
          grid: false,
          padding: { top: 8, right: 4, bottom: 16, left: 4 },
          xLabelCount: 3,
          valueFormatter: (v) => Math.round(v) + " cm",
          labelFormatter: (t) => new Date(t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " " + formatClock(t),
          xLabelFormatter: (t) => new Date(t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        }
      )
    );
    charts.pegel.draw();
  } catch (error) {
    console.error(error);
    setText("pegelValue", "--");
    setText("pegelTrend", "Keine Daten");
  }
}

// ---------- Luftqualität (Open-Meteo Air Quality) ----------
// Rauch von Bränden kann die Luftqualität verschlechtern — daher als eigene
// Kachel neben Bränden und Pegel sinnvoll für die Lagebeurteilung.

function aqiStatus(eaqi) {
  if (eaqi == null) return { label: "Keine Daten", cls: "" };
  if (eaqi <= 20) return { label: "Gut", cls: "aqi-good" };
  if (eaqi <= 40) return { label: "Mäßig", cls: "aqi-warning" };
  if (eaqi <= 60) return { label: "Schlecht", cls: "aqi-serious" };
  return { label: "Sehr schlecht", cls: "aqi-critical" };
}

async function loadAirQuality() {
  try {
    const url = `${AIR_QUALITY_URL}?latitude=${BERLIN_LAT}&longitude=${BERLIN_LON}&current=pm10,pm2_5,european_aqi&timezone=Europe%2FBerlin`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Luftqualitätsdaten nicht erreichbar");
    const data = await res.json();
    const c = data.current;
    const status = aqiStatus(c.european_aqi);

    const valueEl = $("aqiValue");
    if (valueEl) {
      valueEl.textContent = status.label;
      valueEl.className = "v " + status.cls;
    }
    const iconEl = $("aqiIcon");
    if (iconEl) iconEl.setAttribute("class", "ic " + status.cls);

    setText("aqiDetail", `PM2.5 ${c.pm2_5.toFixed(1)} · PM10 ${c.pm10.toFixed(1)} µg/m³`);
    setText("aqiSub", `Europäischer Luftqualitätsindex ${Math.round(c.european_aqi)}`);
  } catch (error) {
    console.error(error);
    setText("aqiValue", "--");
    setText("aqiDetail", "Keine Daten");
  }
}

// ---------- Warnungen-Modal ----------
// Die Warnungen selbst werden bereits beim Bauen der Seite serverseitig
// geladen und fertig ins HTML gerendert (siehe index.astro) — hier wird nur
// noch geöffnet/geschlossen.

function openWarnings() {
  const modal = $("warnModal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  $("warnModalClose")?.focus();
}

function closeWarnings() {
  const modal = $("warnModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

// ---------- Start ----------

function refreshAll() {
  loadWeather();
  loadFireCount();
  loadPegel();
  loadAirQuality();
}

$("dayModalClose")?.addEventListener("click", closeDayDetail);
$("dayModalBackdrop")?.addEventListener("click", closeDayDetail);
$("warningsOpen")?.addEventListener("click", openWarnings);
$("warnModalClose")?.addEventListener("click", closeWarnings);
$("warnModalBackdrop")?.addEventListener("click", closeWarnings);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("dayModal")?.hidden) closeDayDetail();
  if (!$("warnModal")?.hidden) closeWarnings();
});

window.addEventListener("resize", debounce(redrawAllCharts, 150));

updateClock();
setInterval(updateClock, 1000);

refreshAll();
setInterval(refreshAll, 5 * 60 * 1000); // alle 5 Minuten aktualisieren
