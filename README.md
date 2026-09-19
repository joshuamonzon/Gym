# Gym

Personal workout tracker for the Kinobody Greek God Program 2.0, styled after Hevy.
Everything is stored on-device (IndexedDB); there is no account and no server.

## Run locally

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/
```

To preview with the GitHub Pages sub-path: `VITE_BASE_PATH=/Gym/ npm run build && npm run preview`
and open `http://localhost:4173/Gym/`.

## Deploy (GitHub Pages)

1. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions** (one time).
2. Merge to `main`. The `Deploy to GitHub Pages` workflow builds and publishes to
   `https://joshuamonzon.github.io/Gym/`.

## Install on iPhone

Open the site in Safari → Share → **Add to Home Screen**. The app then runs full screen,
works offline, and Safari will not evict its data.

Back up now and then from **Profile → Settings → Data → Export**; the file can be imported on
any device.
