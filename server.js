// Flight Radar - tiny zero-dependency server.
// Serves index.html and proxies live ADS-B data (the public feeds send no CORS
// headers, so the browser cannot call them directly).
//
// Usage:  node server.js   ->  http://localhost:8080

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 8080;
const CACHE_MS = 2000;
const cache = new Map();

const SOURCES = [
  { name: "adsb.lol", url: (la, lo, d) => `https://api.adsb.lol/v2/point/${la}/${lo}/${d}`, list: (j) => j.ac },
  { name: "adsb.fi", url: (la, lo, d) => `https://opendata.adsb.fi/api/v2/lat/${la}/lon/${lo}/dist/${d}`, list: (j) => j.aircraft },
];

async function fetchAircraft(lat, lon, dist) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${dist}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.data;

  let lastErr;
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url(lat.toFixed(4), lon.toFixed(4), dist), {
        headers: { "User-Agent": "flight-radar-local/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`${src.name} HTTP ${res.status}`);
      const json = await res.json();
      const data = { source: src.name, now: json.now || Date.now(), ac: src.list(json) || [] };
      cache.set(key, { t: Date.now(), data });
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// Look up one aircraft anywhere in the world by callsign, registration or ICAO hex.
const FIND = [
  { name: "adsb.lol", urls: (q) => [`https://api.adsb.lol/v2/callsign/${q}`, `https://api.adsb.lol/v2/reg/${q}`, `https://api.adsb.lol/v2/hex/${q}`] },
  { name: "adsb.fi", urls: (q) => [`https://opendata.adsb.fi/api/v2/callsign/${q}`, `https://opendata.adsb.fi/api/v2/registration/${q}`, `https://opendata.adsb.fi/api/v2/hex/${q}`] },
];
async function findAircraft(q) {
  const key = "find:" + q;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.data;
  const isHex = /^[0-9a-f]{6}$/i.test(q);
  let lastErr;
  for (const src of FIND) {
    try {
      let urls = src.urls(encodeURIComponent(q));
      if (!isHex) urls = urls.slice(0, 2);
      for (const u of urls) {
        const res = await fetch(u, { headers: { "User-Agent": "flight-radar-local/1.0" }, signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`${src.name} HTTP ${res.status}`);
        const json = await res.json();
        const ac = json.ac || json.aircraft || [];
        if (ac.length) {
          const data = { source: src.name, ac };
          cache.set(key, { t: Date.now(), data });
          return data;
        }
      }
      const data = { source: src.name, ac: [] };
      cache.set(key, { t: Date.now(), data });
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/find") {
    const q = (url.searchParams.get("q") || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,10}$/.test(q)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "q must be a callsign, registration or hex" }));
    }
    try {
      const data = await findAircraft(q);
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (url.pathname === "/api/aircraft") {
    const lat = parseFloat(url.searchParams.get("lat"));
    const lon = parseFloat(url.searchParams.get("lon"));
    const dist = Math.min(250, Math.max(1, Math.round(parseFloat(url.searchParams.get("dist")) || 50)));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "lat/lon required" }));
    }
    try {
      const data = await fetchAircraft(lat, lon, dist);
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  }

  if (url.pathname.startsWith("/data/") && url.pathname.endsWith(".json")) {
    const file = path.join(__dirname, "data", path.basename(url.pathname));
    if (fs.existsSync(file)) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "max-age=86400" });
      return fs.createReadStream(file).pipe(res);
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log(`Flight Radar running at http://localhost:${PORT}`));
