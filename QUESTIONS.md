# Open questions

Things the spec leaves open. I did not guess on the ones marked **blocked**; for
the rest I picked a default, stated here, and the code is a one-line change if you
want the other reading.

## Repo and deploy

1. **Repo.** The spec names `joshuamonzon/training`, but this session was pointed
   at `joshuamonzon/Gym` on branch `claude/training-dashboard-build-s9ntlt`. That
   repo held the Greek God workout tracker (Dexie + Zustand + react-router). I
   replaced it on this branch; `main` still has the old app until this branch is
   merged. If you want the tracker kept, say so and I'll move the dashboard to
   `joshuamonzon/training` instead.

2. **Vercel auto-deploy on `main` — blocked.** The Vercel GitHub integration is
   not installed on your Vercel account, and the token this session has cannot
   see the `joshmzn` team, so I could not link the repo. I created the Vercel
   project `training` and deployed `dist/` to it directly so the URL in the
   README is live. To turn on deploy-on-push: Vercel dashboard → project
   `training` → Settings → Git → Connect GitHub → `joshuamonzon/Gym`, production
   branch `main`. One click, no code change. Until then, redeploy with
   `npx vercel --prod` after merging.

## Math defaults I chose

3. **Weekly avg pace** is distance-weighted: total run seconds ÷ total run miles.
   The other reading (mean of each run's pace) differs slightly when run
   distances differ. Oct 1–3: 4696 s ÷ 6.28 mi = 12:28 /mi either way within a
   second.

4. **Pull-up bodyweight** = latest `weight_lb` logged on or before the lift's
   date; if none yet (Oct 1 and 2 have no weigh-in), `start_weight_lb`. Both give
   167.4 for the seed data.

5. **Challenge streak and today.** The streak counts back from *yesterday*; today
   adds 1 if its run is already logged but never breaks the streak, since the day
   isn't over. So on Oct 3 (weigh-in logged, run not yet) the streak reads 2, not
   0. Tomorrow, if Oct 3 stays run-less, it reads 0.

6. **Best 5K this month** = fastest `run.seconds` among runs ≥ 3.1 mi in the
   current calendar month, as stored (not normalised to exactly 3.107 mi). Oct 1
   at 3.18 mi / 40:01 and Oct 2 at 3.10 mi / 38:15 → 38:15.

7. **"7-day" on the Now screen** = the 7 calendar days ending today, averaging
   whatever is logged in them. Weight chart's 7-day line is the same window
   trailing each day.

8. **Range selector** `4w` / `8w` = the current week plus the 3 / 7 before it,
   anchored to today, not to the last data point.

## UI defaults

9. **Weeks screen** uses one card per week (the spec allows card *or* row) with
   the fields in spec order, and the tapped week expands to a horizontally
   scrollable daily table with the date column stuck left.

10. **Lift names not in the enum** (`bench`, `pullup`, `row`, `leg_press`,
    `squat`, `deadlift`) pass validation, since the spec says the UI ignores
    them, but `npm run validate` prints a warning so a typo like `bnech` is
    noticed.

11. **Dual-axis charts.** The spec asks for cals + carbs on two y-axes with a
    weight line (Fuel chart) and miles bars + efficiency/pace line (Running
    chart). Built as specified. Dual axes are a known readability trap (the
    alignment of the two scales is arbitrary); if the Fuel chart ever reads
    wrong, the fix is two stacked small charts sharing an x-axis.

12. **Bundle size.** Initial JS is 82 KB gzipped; opening Charts loads another
    115 KB (Recharts). The spec's "<100 KB ideally" holds for first paint but
    not for the whole app. Recharts is the spec's chosen library; dropping under
    100 KB total would mean replacing it with hand-drawn SVG.
