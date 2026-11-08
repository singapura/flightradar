# Flight Radar

Live air traffic shown on a full-screen radar scope in your browser, styled after the old green phosphor screens.

- Rotating sweep: aircraft positions only update when the sweep passes them, then fade, like a real radar
- Labels with callsign, flight level, climb/descent arrow and ground speed; emergency squawks (7500/7600/7700) blink in amber
- Colors per flight type: civilian (green), cargo (blue), military (violet), private jet (pink), unknown (gray). The legend shows counts; click a type to hide or show it. Military comes from the feed's database flag plus known military callsigns and aircraft types; cargo is recognized by the operator's ICAO callsign prefix (Cargolux, FedEx, UPS, DHL and others), so freighters flying under a passenger airline's callsign (e.g. Qatar Airways QTR, Turkish Airlines THY) show as civilian. Private jets are recognized by business jet type (Citation, Learjet, Gulfstream, Challenger, Global, Falcon, Phenom, PC-24 and others) or business aviation operator (NetJets, VistaJet, Flexjet, Luxaviation and others)
- Alerts: when a military or unknown aircraft enters the range, a toast pops up (click it to select the aircraft) with an optional beep. Every ENTER and EXIT is written to a log (LOG tab in the side panel) that is kept in the browser and can be saved as CSV (semicolon separated, decimal comma, ISO timestamps in UTC). Alerts and sound can be switched off under SET
- Follow a flight: it shows in red with a pulsing marker and stays pinned at the top of the list. Outside the range, a red arrow on the rim points to it with its distance (looked up worldwide by callsign, registration or ICAO hex)
- Traffic list sorted by distance, plus a detail panel per aircraft with the airline name (from the callsign prefix)
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
| Click aircraft | Show details, with a FOLLOW / UNFOLLOW button |
| Click the red FOLLOW line (top left) | Stop following |
| `L` | Toggle aircraft labels |
| `M` | Toggle borders and cities |
| `P` | Toggle traffic panel |
| `F` | Fullscreen |
| SET button | Location, sweep speed, refresh rate, filters, flight to follow |

## Data sources

- Live aircraft: [adsb.lol](https://adsb.lol) (fallback: [adsb.fi](https://adsb.fi)), free community feeds with fair-use limits
- Borders: [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth 1:10m)
- Airlines: [Virtual Radar Server standing data](https://github.com/vradarserver/standing-data) (CC0), ICAO code to airline name
- Cities: [Natural Earth](https://www.naturalearthdata.com) populated places (public domain), trimmed to places with 15.000+ people plus all capitals
