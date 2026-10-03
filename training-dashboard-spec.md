# Training Dashboard — Build Spec

Repo: `joshuamonzon/training` (GitHub)
Owner: Josh. Built by Claude Code. Data entered daily by Claude (chat) from Josh's logs.

## Purpose

A bird's-eye view of training progress so that in January Josh can read one weekly row and say: "eating X cals / Y carbs while running Z miles → lost N lbs, lifts went up." Weekly rollups are the primary unit. Daily data is input, not the headline.

Design rule: **no data that won't answer a January question.** If a field isn't listed here, don't add it.

## Stack

- Vite + React + TypeScript, Tailwind
- Recharts for charts
- Static site, no backend, no auth. Deploy to Vercel (preferred) or GitHub Pages.
- Data = JSON files in the repo. Rollups computed client-side at load.
- PWA: `manifest.webmanifest`, service worker (vite-plugin-pwa), `display: standalone`, theme-color, apple-touch-icon. Must be installable to iPhone home screen and open full-screen with no browser chrome.

## "Applified" requirements (non-negotiable)

- Mobile-first, designed for a 390px iPhone. Desktop is a wider column, nothing more.
- Dark mode default (`prefers-color-scheme`), light mode supported.
- Bottom tab bar, thumb-reachable: **Now · Weeks · Charts · Log**
- Weekly table: swipe horizontally between weeks or scroll a sticky-first-column table — not a 12-column table squeezed into 390px.
- Big numbers, tabular figures, no decorative UI. Fast: <100KB JS gzipped ideally.
- Safe-area insets respected (notch, home indicator).

## Data model

One file per day: `data/days/YYYY-MM-DD.json`. Append-only, no merges. Missing fields are omitted, not nulled. Every field optional except `date`.

```json
{
  "date": "2026-10-02",
  "weight_lb": 171.2,
  "cals": 2650,
  "protein_g": 180,
  "carbs_g": 310,
  "sleep_h": 6.5,
  "shift": false,
  "run": { "miles": 3.10, "seconds": 2295, "avg_hr": 126, "surface": "treadmill" },
  "bike_min": 40,
  "lifts": [
    { "lift": "leg_press", "weight": 270, "reps": 10 }
  ],
  "note": "leg slightly better than Day 1, low constant ache"
}
```

Rules:
- `run` is the main run of the day (the 5K). `seconds` is run-only time, not including warm-up walk. Distance is the **treadmill** number, never Garmin.
- `lifts[]` holds the **top working set only** per tracked lift. Multiple entries for the same lift on one day are allowed; use the best e1RM.
- `lift` enum: `bench`, `pullup` (weighted; `weight` = added load, bodyweight not included), `row`, `leg_press`, plus `squat` / `deadlift` reserved for later. Anything else is ignored by the UI.
- `shift`: true on a 24-hr shift day.
- `sleep_h`: hours slept, decimal (from Garmin).
- `data/config.json` holds `challenge: { "name": "October 5K", "start": "2026-10-01", "end": "2026-10-31" }`, `tracked_lifts: ["bench","pullup","row","leg_press"]`, `start_weight_lb: 167.4`, and `week_start: "monday"`.

## Derived metrics (compute, don't store)

- **Weekly rollups** (Mon–Sun): avg weight (of logged days) and Δ vs prior week; avg cals / protein / carbs; total miles; avg pace; avg run HR; days with a run; shift days; avg sleep; best top set + e1RM per tracked lift.
- **e1RM**: Epley, `w × (1 + reps/30)`. For pull-ups use `(bodyweight + added) × (1 + reps/30)` with bodyweight = latest logged weight — display added-load top set, chart the e1RM.
- **Aerobic efficiency** per run: `speed_m_per_min / avg_hr`. This is the real running-fitness signal (same pace at lower HR = better). Weekly value = mean of runs.
- **7-day rolling weight average** for the weight chart.
- **Challenge streak**: consecutive days with a run ≥ 3.1 mi since `challenge.start`.

## Screens

### 1. Now
Top strip of big numbers:
- Weight today (or latest) · Δ vs `start_weight_lb` · 7-day avg
- 7-day avg cals · 7-day avg carbs
- Challenge: day X/31, streak
- Best 5K time this month
- Bench e1RM (current)
One small "this week so far" line: miles, run days, lift days.

### 2. Weeks (the main event)
One card or row per week, newest first. Fields, in this order:
avg weight (Δ) · avg cals · protein · carbs · miles · avg pace · avg run HR · efficiency · bench / pull-up / row / leg press top set · shift days · sleep.
Tap a week → expands to its daily rows.
Color Δ-weight and e1RM changes (green/red) vs prior week. Nothing else colored.

### 3. Charts (exactly four)
1. **Weight** — daily dots + 7-day average line. Shift days as small markers on the x-axis.
2. **Fuel vs weight** — weekly bars: cals (primary) and carbs (secondary axis), with weekly avg weight as an overlaid line.
3. **Running** — weekly miles bars + aerobic efficiency line. Secondary toggle: avg pace.
4. **Lifts** — e1RM lines for each tracked lift, one chart, toggleable legend.

All charts: range selector `4w · 8w · All`. Default `All` (it's a 3-month view).

### 4. Log
Reverse-chronological table of raw daily entries, exactly as stored. Note field shown. This is the audit view.

## Daily update loop

Claude (chat) produces the day's JSON from Josh's logs. Commit path: `data/days/<date>.json`. Claude Code should add:
- `npm run validate` — JSON schema check on all day files (zod or ajv), run in CI.
- `npm run add -- <date>` — optional CLI that scaffolds a day file.
- Vercel auto-deploys on push to `main`.

## Seed data

`data/config.json`
```json
{
  "challenge": { "name": "October 5K", "start": "2026-10-01", "end": "2026-10-31" },
  "tracked_lifts": ["bench", "pullup", "row", "leg_press"],
  "start_weight_lb": 167.4,
  "week_start": "monday"
}
```

`data/days/2026-10-01.json`
```json
{ "date": "2026-10-01", "sleep_h": 7.27, "shift": false,
  "run": { "miles": 3.18, "seconds": 2401, "avg_hr": 128, "surface": "treadmill" },
  "lifts": [
    { "lift": "bench", "weight": 225, "reps": 5 },
    { "lift": "pullup", "weight": 50, "reps": 5 },
    { "lift": "row", "weight": 165, "reps": 5 }
  ],
  "note": "Day 1/31. R calf+hamstring grade 1 strain from Sep 30 TT. 3 cortaditos until lunch — cals not logged." }
```

`data/days/2026-10-02.json`
```json
{ "date": "2026-10-02", "sleep_h": 7.2, "shift": false,
  "run": { "miles": 3.10, "seconds": 2295, "avg_hr": 126, "surface": "treadmill" },
  "lifts": [ { "lift": "leg_press", "weight": 270, "reps": 10 } ],
  "note": "Day 2/31. Quad-only lower, strain-modified. Leg slightly better." }
```

`data/days/2026-10-03.json`
```json
{ "date": "2026-10-03", "weight_lb": 167.4, "sleep_h": 7.58, "shift": false,
  "note": "Day 3/31. First weigh-in (baseline). Legs stiff in the morning, loosen through the day." }
```

(Leg press weight = 3 plates/side = 270 lb of plates; sled not included. Keep it consistent.)

## Out of scope

Cadence, max HR, kcal burned, mobility sessions, accessory lifts, Garmin sync, Strava sync, MFP import, auth, multi-user. Don't build any of it.

## Definition of done

- Installs to iPhone home screen and opens standalone.
- Seed data renders on all four screens with no console errors.
- Weekly rollups match a hand calculation for Oct 1–3.
- `npm run validate` passes and runs in GitHub Actions on PR.
- Deployed URL in the README.
