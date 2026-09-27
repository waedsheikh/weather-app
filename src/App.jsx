import { useEffect, useState } from "react";
import "./App.css";

const WEATHER_CODES = {
  0: ["Clear sky", "☀️", "clear"],
  1: ["Mainly clear", "🌤️", "clear"],
  2: ["Partly cloudy", "⛅", "cloud"],
  3: ["Overcast", "☁️", "cloud"],
  45: ["Foggy", "🌫️", "cloud"],
  48: ["Rime fog", "🌫️", "cloud"],
  51: ["Light drizzle", "🌦️", "rain"],
  53: ["Drizzle", "🌦️", "rain"],
  55: ["Heavy drizzle", "🌧️", "rain"],
  56: ["Freezing drizzle", "🌧️", "rain"],
  57: ["Freezing drizzle", "🌧️", "rain"],
  61: ["Light rain", "🌦️", "rain"],
  63: ["Rain", "🌧️", "rain"],
  65: ["Heavy rain", "🌧️", "rain"],
  66: ["Freezing rain", "🌧️", "rain"],
  67: ["Freezing rain", "🌧️", "rain"],
  71: ["Light snow", "🌨️", "snow"],
  73: ["Snow", "🌨️", "snow"],
  75: ["Heavy snow", "❄️", "snow"],
  77: ["Snow grains", "❄️", "snow"],
  80: ["Rain showers", "🌦️", "rain"],
  81: ["Rain showers", "🌧️", "rain"],
  82: ["Heavy showers", "⛈️", "rain"],
  85: ["Snow showers", "🌨️", "snow"],
  86: ["Heavy snow showers", "❄️", "snow"],
  95: ["Thunderstorm", "⛈️", "storm"],
  96: ["Thunderstorm with hail", "⛈️", "storm"],
  99: ["Thunderstorm with hail", "⛈️", "storm"],
};

const getWeather = (code) =>
  WEATHER_CODES[code] ?? ["Conditions unavailable", "🌡️", "cloud"];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      "Weather data is temporarily unavailable. Try again shortly.",
    );
  return response.json();
}

async function fetchCityWeather(city) {
  const geocodingUrl = new URL(
    "https://geocoding-api.open-meteo.com/v1/search",
  );
  geocodingUrl.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });
  const places = await fetchJson(geocodingUrl);
  const place = places.results?.[0];
  if (!place)
    throw new Error(
      `We couldn't find "${city}". Check the spelling and try again.`,
    );

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    forecast_days: "5",
    timezone: "auto",
  });
  const forecast = await fetchJson(forecastUrl);
  return {
    ...forecast,
    place: {
      name: place.name,
      region: [place.admin1, place.country].filter(Boolean).join(", "),
    },
  };
}

const temperature = (value, unit) =>
  Math.round(unit === "F" ? (value * 9) / 5 + 32 : value);

const formatWeekday = (date) =>
  new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

const formatHour = (timestamp, timezone) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", timeZone: timezone }).format(
    new Date(`${timestamp}:00Z`),
  );

function App() {
  const [query, setQuery] = useState("New York");
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("C");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  async function searchCity(city) {
    setStatus("loading");
    setError("");
    try {
      const result = await fetchCityWeather(city);
      setWeather(result);
      setQuery(result.place.name);
      setStatus("ready");
    } catch (fetchError) {
      setError(fetchError.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  useEffect(() => {
    searchCity("New York");
  }, []);

  const current = weather?.current;
  const condition = current ? getWeather(current.weather_code) : null;
  const hourly = weather?.hourly;
  const currentHour =
    hourly?.time.findIndex((time) => time >= current?.time) ?? 0;
  const upcomingHours =
    hourly?.time.slice(
      Math.max(currentHour, 0),
      Math.max(currentHour, 0) + 8,
    ) ?? [];
  const daily = weather?.daily;

  function handleSubmit(event) {
    event.preventDefault();
    const city = query.trim();
    if (city) searchCity(city);
  }

  return (
    <main className="weather-app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Forecast home">
          <span className="brand-mark" aria-hidden="true">
            ✳
          </span>
          <span>
            daylight<span className="brand-period">.</span>
          </span>
        </a>
        <form className="search" onSubmit={handleSubmit} role="search">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            aria-label="Search city"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city"
            value={query}
          />
          <button aria-label="Search" className="search-button" type="submit">
            Search
          </button>
        </form>
        <div className="unit-switch" aria-label="Temperature unit" role="group">
          <button
            aria-pressed={unit === "C"}
            onClick={() => setUnit("C")}
            type="button"
          >
            °C
          </button>
          <button
            aria-pressed={unit === "F"}
            onClick={() => setUnit("F")}
            type="button"
          >
            °F
          </button>
        </div>
      </header>

      <section
        aria-label="Current weather"
        className={`current-weather ${condition?.[2] ?? "clear"}`}
        id="top"
      >
        <div className="weather-copy">
          <p className="eyebrow">
            {status === "loading" ? "FINDING YOUR FORECAST" : "RIGHT NOW"}
          </p>
          {weather && current ? (
            <>
              <h1>{weather.place.name}</h1>
              <p className="location-region">{weather.place.region}</p>
              <div className="temperature-line">
                <span className="temperature">
                  {temperature(current.temperature_2m, unit)}°
                </span>
                <span className="condition-label">
                  {condition[0]}
                  <br />
                  <span>
                    Feels like {temperature(current.apparent_temperature, unit)}
                    °
                  </span>
                </span>
              </div>
              <p className="today-range">
                H: {temperature(daily.temperature_2m_max[0], unit)}°{" "}
                <span>·</span> L:{" "}
                {temperature(daily.temperature_2m_min[0], unit)}°
              </p>
            </>
          ) : (
            <div aria-live="polite" className="loading-message">
              {status === "error"
                ? "Forecast unavailable"
                : "The sky is loading…"}
            </div>
          )}
        </div>
        <div aria-hidden="true" className="weather-art">
          <span className="weather-emoji">{condition?.[1] ?? "☀️"}</span>
          <span className="weather-art-caption">A little look outside</span>
        </div>
        <div className="hero-footer">
          <span>
            {current
              ? new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  timeZone: weather.timezone,
                }).format(new Date(`${current.time}:00Z`))
              : "LOCAL FORECAST"}
          </span>
          <span className="live-label">
            <i /> LIVE CONDITIONS
          </span>
        </div>
      </section>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {weather && current && (
        <>
          <section aria-label="Weather details" className="details-row">
            <div className="detail-item">
              <span className="detail-icon">↗</span>
              <div>
                <span className="detail-label">WIND</span>
                <strong>
                  {Math.round(current.wind_speed_10m)} <small>km/h</small>
                </strong>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">◌</span>
              <div>
                <span className="detail-label">HUMIDITY</span>
                <strong>
                  {current.relative_humidity_2m}
                  <small>%</small>
                </strong>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">⌁</span>
              <div>
                <span className="detail-label">PRECIPITATION</span>
                <strong>
                  {current.precipitation}
                  <small>mm</small>
                </strong>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">☼</span>
              <div>
                <span className="detail-label">SUNRISE</span>
                <strong>
                  {formatHour(daily.sunrise[0].slice(0, 16), weather.timezone)}
                </strong>
              </div>
            </div>
          </section>

          <section aria-label="Hourly forecast" className="forecast-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE NEXT FEW HOURS</p>
                <h2>Through the day</h2>
              </div>
              <span className="section-note">Chance of rain</span>
            </div>
            <div className="hourly-list">
              {upcomingHours.map((time) => {
                const index = hourly.time.indexOf(time);
                const hourlyCondition = getWeather(hourly.weather_code[index]);
                return (
                  <div className="hour-item" key={time}>
                    <span className="hour-time">
                      {index === currentHour
                        ? "Now"
                        : formatHour(time, weather.timezone)}
                    </span>
                    <span aria-hidden="true" className="hour-icon">
                      {hourlyCondition[1]}
                    </span>
                    <strong>
                      {temperature(hourly.temperature_2m[index], unit)}°
                    </strong>
                    <span className="rain-chance">
                      {hourly.precipitation_probability[index] ?? 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-label="Five-day forecast"
            className="forecast-section week-section"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">PLAN AHEAD</p>
                <h2>Five-day outlook</h2>
              </div>
              <span className="section-note">
                {weather.timezone_abbreviation}
              </span>
            </div>
            <div className="daily-list">
              {daily.time.map((date, index) => {
                const dailyCondition = getWeather(daily.weather_code[index]);
                return (
                  <div className="day-item" key={date}>
                    <span className="day-name">
                      {index === 0 ? "Today" : formatWeekday(date)}
                    </span>
                    <span aria-hidden="true" className="day-icon">
                      {dailyCondition[1]}
                    </span>
                    <span className="day-condition">{dailyCondition[0]}</span>
                    <span className="day-temperatures">
                      <strong>
                        {temperature(daily.temperature_2m_max[index], unit)}°
                      </strong>
                      <span>
                        {temperature(daily.temperature_2m_min[index], unit)}°
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <footer className="page-footer">
        <span>Weather for wherever you are.</span>
        <span>Powered by Open-Meteo</span>
      </footer>
    </main>
  );
}

export default App;
