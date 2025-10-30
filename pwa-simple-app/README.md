# Vetshub — Local Farm Manager (PWA)

## Overview
This is a small, personal Progressive Web App (PWA) for local/offline farm management. It stores all data in the browser (localStorage) and is designed for private use and experimentation — not for publishing or production use.

The app includes lightweight modules for:
- Crop management (planting records, field/plot)
- Livestock (animal records)
- Inventory (seeds, feed, fuel, etc.)
- Tasks & scheduling (assignments, due dates)
- Finance (simple income/expense records and a balance summary)

## Project Structure
```
pwa-simple-app
├── index.html          # Main UI and navigation
├── manifest.json       # PWA metadata
├── service-worker.js   # Caches app shell for offline use
├── src
│   ├── main.js        # App logic and UI wiring
│   ├── storage.js     # Simple namespaced localStorage CRUD
│   └── styles.css     # Minimal styles
├── assets             # static assets (icons)
├── package.json       # npm helper (optional server)
└── README.md
```

## How to run locally
You can open `index.html` directly in a browser for basic testing, but to use service worker and PWA features you should serve it over HTTP (e.g., a local static server):

```bash
# from repository root
cd pwa-simple-app
npm install    # optional: installs http-server listed in package.json
npm start      # runs http-server . (if installed) or use any static server
```

Then open http://localhost:8080 (or the address shown by your server).

## Data
All data is saved to the browser's `localStorage` and is private to the browser/profile where it's used. There's no syncing or cloud backup by default. Exporting or importing features can be added if you want to move data between devices.

## Notes & Next steps
- This is intentionally minimal. Possible improvements:
  - Add searchable field maps and CSV import/export
  - Replace localStorage with IndexedDB for larger datasets
  - Add authentication and remote sync (if you want cloud backup)
  - Improve icons and branding assets in `assets/`

## License
MIT