# Roam

A quiet first-person walking game, starting with a **stylized Venice-inspired scene** near Piazza San Marco.

**Play:** https://amthqng.github.io/roam/

## What's included

- Procedurally generated Piazza San Marco-inspired square, basilica silhouette, bell tower, arcades, side street, canal, and bridge
- First-person mouse look and WASD/arrow-key movement, with Shift to walk faster
- Simple walkable-zone and building collision boundaries to keep you out of canals and buildings
- Reset-position control, location HUD, and an information panel
- No account, API key, or Google Map Tiles usage fees

## Setup

There is no build step or local setup required. This is a static site with `index.html`, `styles.css`, and `app.js`.

GitHub Pages runs through `.github/workflows/deploy.yml` on updates to `main`. To activate, set **Settings → Pages → Source: GitHub Actions**.

For local development, use a static HTTP server such as `python3 -m http.server 8000` and visit http://localhost:8000. Do not open the HTML via `file://`, because ES modules are blocked by many browsers there.

Three.js is loaded from the jsDelivr public CDN. There are no paid map data requests, but the initial page does require an internet connection to load the Three.js module. To make this offline-capable, vendor the dependency locally in a future revision.

## Controls

- Click **Begin exploring**, then move mouse to look around.
- **WASD** or **arrow keys**: walk
- **Shift**: move faster
- **Esc**: release mouse
- **Reset position**: return to the square

## Design and limitations

This is an **artistic interpretation** of the Venice environment, not an exact geographic map or photogrammetry. The visual landmarks are simplified architectural silhouettes. Walking uses a fixed eye height and rough rectangular collision areas. Pedestrians, detailed canal navigation, weather, realistic bridges/stairs, and sound are planned but not yet implemented.

There is no user analytics or persistence, and no embedded secrets. No Google Maps API key is required. If you previously used a Google Map Tiles API key with an older Roam version, disable it or set its quota to zero in your Google Cloud project if you no longer need it.

## Technology

- [Three.js](https://threejs.org/) (MIT License)
- Plain HTML, CSS, JavaScript ES modules
- GitHub Pages deployment
