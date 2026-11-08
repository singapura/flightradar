# Flight Radar

Live air traffic shown on a full-screen radar scope in your browser, styled after the old green phosphor screens.

- Rotating sweep: aircraft positions only update when the sweep passes them, then fade, like a real radar
- Labels with callsign, flight level, climb/descent arrow and ground speed; emergency squawks (7500/7600/7700) show in red
- Traffic list sorted by distance, plus a detail panel per aircraft
- Country borders (dashed), coastlines and major cities; at 100 NM and up, city names appear on hover
- Range from 5 to 250 NM

## Run

Requires [Node.js](https://nodejs.org) 18 or newer. No packages to install.

```bash
node server.js
```

Then open http://localhost:8080. On Windows you can also double-click `start.cmd`.

The small server is needed because the public ADS-B feeds don't allow browsers to call them directly (no CORS headers). It serves the page and fetches the data for it.

## Controls

| Key / action | Effect |
|---|---|
| Mouse wheel, `+` / `-` | Change range |
| Click aircraft | Show details |
| `L` | Toggle aircraft labels |
| `M` | Toggle borders and cities |
| `P` | Toggle traffic panel |
| `F` | Fullscreen |
| SET button | Location, sweep speed, refresh rate, filters |

## Data sources

- Live aircraft: [adsb.lol](https://adsb.lol) (fallback: [adsb.fi](https://adsb.fi)), free community feeds with fair-use limits
- Borders: [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth 1:10m)
- Cities: [Natural Earth](https://www.naturalearthdata.com) populated places (public domain), trimmed to places with 15.000+ people plus all capitals
