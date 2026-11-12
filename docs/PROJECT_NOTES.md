# AmMaJo Project Notes

## Product intent

AmMaJo is a private, browser-first American Mahjong hand-practice tool. It helps a player make hand-shaping decisions quickly; it is explicitly **not** a full multiplayer game or a legal-hand validator. The initial experience is a simplified solo loop: random 13-tile deal, three Charleston passes, then up to 25 draw-and-discard rounds, with optional early Mahjong declaration and self-scored history.

## Current implementation

- Static application: `dist/index.html`, `dist/app.js`, `dist/styles.css`, and `dist/tile-overrides.css`.
- 152-tile deck with an unbiased Fisher–Yates shuffle.
- Charleston cannot pass Jokers; face-up discarded Jokers cannot be claimed.
- Rack supports drag-to-insert ordering, new-tile highlighting, and six bundled Joker & Bloom SVG tile sets.
- History and settings live only in browser `localStorage`; no accounts, server, or shared data.
- Rack organization includes persistent configurable Auto-sort rules, temporary per-hand reject marks, and a one-shot **By value** sort for suited 1–9 pattern scanning. A marked reject belongs to the enabled `Known rejects` sort category rather than its suit.

## Deliberate decisions

- Keep the build framework-free and portable: static files can run on GitHub Pages, a basic web host, PWA shell, or Android WebView.
- Preserve a clear separation between user-defined strategic organization (Auto-sort) and temporary visual inspection (By value).
- Keep rejects session-only: they represent the player’s current hand direction, not a permanent assertion about a tile.
- Use licensed, locally bundled artwork. See `ASSET_LICENSES.md`.

## Deferred work

- Real multiplayer play, calls/exposures, opponent simulation, and official scoring.
- NMJL-card pattern data or validation; do not reproduce a current card without appropriate rights.
- More tile artwork exploration, richer decision explanations, and long-term/cloud-synced history.
- Touch-based manual rack reordering. Desktop tile dragging remains available, but mobile work is deferred because configurable Auto-sort is the primary rack-ordering mechanism.
- Automated tests and a formal build/dev command. For now, use `node --check dist/app.js` and open `dist/index.html` through a static server for manual QA.

## Hosting

The existing private Sites deployment is configured in `.openai/hosting.json`; its static root is `dist/`. Deployment is a convenience, not an architectural dependency—keep the application usable as a standalone static folder.
