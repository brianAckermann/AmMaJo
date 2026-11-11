# AmMaJo

AmMaJo is a private, browser-first American Mahjong hand-practice tool. It is designed to help players practice hand-shaping decisions quickly, without trying to be a multiplayer game or an official legal-hand validator.

## Practice loop

- Start with a random 13-tile hand.
- Make three Charleston passes.
- Play up to 25 draw-and-discard rounds.
- Optionally declare Mahjong early.
- Record a self-assessed result and review browser-local progress.

## Run locally

The application is framework-free and has no build step. Serve the repository's `dist` directory with any static HTTP server, then open it in a browser.

For example, if Python is installed:

```sh
python -m http.server 8000 --directory dist
```

Then visit <http://localhost:8000>.

## Validation

Check the JavaScript syntax with:

```sh
node --check dist/app.js
```

Manual browser testing is currently required; the project does not yet have an automated test suite.

## Data and privacy

Practice history, tile-set choice, and sorting preferences are stored only in the browser's `localStorage`. The application has no accounts, backend, or shared data.

## Project documentation

- [`docs/PROJECT_NOTES.md`](docs/PROJECT_NOTES.md) describes the product intent, implementation, and deferred work.
- [`docs/hand-management-research.md`](docs/hand-management-research.md) records the American Mahjong rule and strategy baseline.
- [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md) documents third-party artwork and licensing.

## Artwork

The bundled American Mahjong tile artwork is provided by [Joker & Bloom](https://jokerandbloom.com/free/tiles/) under the MIT License. See [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md) and [`dist/assets/joker-bloom/LICENSE`](dist/assets/joker-bloom/LICENSE).

