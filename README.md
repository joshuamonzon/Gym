# Training

Weekly rollups of weight, fuel, running and lifts, so one row answers "eating X cals /
Y carbs while running Z miles → lost N lb, lifts went up." Spec:
[`training-dashboard-spec.md`](training-dashboard-spec.md). Open questions:
[`QUESTIONS.md`](QUESTIONS.md).

**Live:** https://training-joshmzn.vercel.app

Static site. Data is JSON in this repo; everything else (weekly rollups, e1RM, aerobic
efficiency, 7-day averages, streak) is computed in the browser at load.

## Daily data entry

One file per day, append-only, every field optional except `date`. Omit what wasn't
logged; never write `null`.

```sh
npm run add -- 2026-10-04          # scaffolds data/days/2026-10-04.json
# fill it in (or let Claude write it from the day's logs)
npm run validate                   # zod check over data/days/*.json
git add data/days/2026-10-04.json
git commit -m "Oct 4"
git push
```

A full day looks like this; include only the fields you have:

```json
{
  "date": "2026-10-04",
  "weight_lb": 167.0,
  "cals": 2650,
  "protein_g": 180,
  "carbs_g": 310,
  "sleep_h": 6.5,
  "shift": false,
  "run": { "miles": 3.10, "seconds": 2295, "avg_hr": 126, "surface": "treadmill" },
  "bike_min": 40,
  "lifts": [{ "lift": "bench", "weight": 225, "reps": 5 }],
  "note": "free text"
}
```

Rules from the spec:

- `run` is the main run (the 5K). `seconds` is run-only time. Distance is the treadmill
  number, never Garmin.
- `lifts[]` holds the top working set per tracked lift. `lift` is one of `bench`,
  `pullup` (`weight` = added load), `row`, `leg_press`, `squat`, `deadlift`. Other names
  validate but the UI ignores them.
- Leg press weight = plates only (3 plates/side = 270), sled not included.
- `shift` is true on a 24-hr shift day. `sleep_h` is hours slept from Garmin.

`npm run validate` runs in GitHub Actions on every pull request, alongside the unit tests
and a production build.

## Deploy

Vercel project `training`. Pushes to `main` deploy to the live URL once the GitHub
repository is connected to the project (Vercel dashboard → `training` → Settings → Git).
See QUESTIONS.md item 2 for the current state of that link. Until it is connected,
deploy from a checkout of `main` with `npx vercel --prod`.

## Install on iPhone

Open the live URL in Safari → Share → **Add to Home Screen**. It opens full-screen with
no browser chrome and works offline after the first load.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # vitest: rollup math incl. a hand-checked Oct 1–3 week
npm run validate     # schema-check the data files
npm run build        # production build into dist/
```

Layout:

- `data/config.json` — challenge window, tracked lifts, start weight, week start
- `data/days/*.json` — one file per day
- `src/lib/schema.ts` — zod schema for day files and config
- `src/lib/rollups.ts` — all derived metrics, pure functions, unit-tested
- `src/screens/` — Now, Weeks, Charts, Log
- `scripts/validate.ts`, `scripts/add.ts` — the two CLIs above
