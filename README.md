# Roam

A peaceful, browser-based first-person exploration prototype. First destination: **Venice, Italy**, near Piazza San Marco.

## Prototype status

This is an early geographic viewer with game-style walking controls, **not** a collision-aware or street-accurate walking simulation. You can walk in any direction at a fixed approximate eye height. Buildings, bridges, water, and stairs currently have no gameplay collision or pathfinding. Photogrammetry may look rough close up.

## Getting started (no local development required)

1. In [Google Cloud Console](https://console.cloud.google.com/), create or choose a project with billing enabled.
2. Enable **Map Tiles API** and create a browser API key. Google Photorealistic 3D Tiles are usage-billed; review the [pricing and quotas](https://developers.google.com/maps/documentation/tile/usage-and-billing), and set a quota/budget alert.
3. Restrict the key to **Map Tiles API** and to the website origin(s) you'll use, such as `https://amthqng.github.io/*` for GitHub Pages. For a custom domain, add that domain separately.
4. Publish this static repository through **GitHub Pages** (Settings → Pages → Deploy from branch → `main` → `/ (root)`) or Cloudflare Pages (no build command; output directory `/`).
5. Open the site in a desktop browser. Paste your key into the on-screen setup field and choose **Explore Venice**.

The key is kept only in your browser's **session storage** so it is not committed to GitHub. Browser keys are exposed to the browser and network requests: use API and referrer restrictions, plus quotas. If a browser extension or privacy setting blocks tiles, try another desktop browser.

For local testing, serve the folder with any simple static server (for example `python3 -m http.server 8000`). Opening `index.html` as a `file://` URL is not supported.

## Controls

- Click the scene to capture the mouse; move mouse to look around.
- `W A S D` or arrow keys to walk; hold `Shift` to move faster.
- `Esc` releases the mouse.
- **Reset position** returns to the starting location.
- **Change key** allows swapping your Google Map Tiles API key.

## Implementation

Static HTML, CSS, JavaScript, and [CesiumJS](https://cesium.com/platform/cesiumjs/). The map is streamed from the Google Maps Photorealistic 3D Tiles service using your browser API key. The Cesium/Google attribution is displayed by the viewer.

## Next steps

Evaluate Venice's street-level visual quality, replace fixed-altitude movement with manually validated pedestrian routes or surface-aware navigation, add collision/bridge handling, optimize loading, and add subtle environmental audio.

## Data / licensing

Google Maps Platform terms and attribution requirements apply. Do not download or cache the geographic tiles into an offline game. This repo contains no Google API keys.
