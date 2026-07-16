# Habit Rabbit

A daily habit tracking app built with React, Vite, and Supabase.

## Features

- **Daily check-in** — Log habits each day with checkbox or multi-select types
- **Activity heatmap** — GitHub-style annual heatmap per habit, with day-detail popover
- **Stats** — Streak tracking, completion counts, weekly/monthly breakdowns, habit sub-type breakdowns
- **Habit management** — Create, edit, and delete habits; historical logs are preserved after deletion
- **Auth** — Email/password authentication via Supabase
- **Themes** — Dark and light mode
- **Two workspaces** — Switch between the original habit tracker and the Quant Developer Accountability workspace
- **Evidence-gated daily contract** — Track base work, capped recovery, credited effort, and exact completion causes across five skill tracks
- **Durable debt and curriculum queue** — Missed effort remains visible, while unfinished learning items keep their identity and dependencies
- **Weekly readiness review** — Inspect base coverage, evidence rate, roadmap proof, and the 12-week progression

## Tech stack

- **React 19** + **Vite**
- **Supabase** — Postgres database + Auth
- **Capacitor** — Native iOS wrapper for App Store distribution

## Development

```bash
npm install
npm run dev
```

Requires a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## iOS / App Store

The app is wrapped with Capacitor to produce a native iOS build.

After any code change:
```bash
npm run build
npx cap sync ios
npx cap open ios    # open in Xcode
```

See [HANDOFF.md](./HANDOFF.md) for the full App Store submission checklist.

## Project structure

```
src/
  components/
    AuthScreen.jsx      — login/signup screen
    CheckIn.jsx         — daily habit logging
    Heatmap.jsx         — annual activity heatmap
    HeatmapPopover.jsx  — day-detail popover
    Stats.jsx           — streaks and completion stats
    HabitBreakdown.jsx  — sub-type breakdown for multi-select habits
    Header.jsx          — top nav / theme toggle
    Settings.jsx        — habit management
    Accountability.jsx  — daily contract, debt, queue, and weekly review
  App.jsx               — root component, auth + data loading
  accountabilityStore.js — accountability rules and device-local snapshots
  storage.js            — Supabase database operations
  supabaseClient.js     — Supabase client init
  dateUtils.js          — date helpers
resources/              — source images for icon/splash generation (1024×1024 icon.png)
ios/                    — generated Xcode project (Capacitor)
```

## Architecture notes

**State management** — All app state lives in `App.jsx` (no external state library). Auth state, habits, logs, and preferences are fetched once on sign-in and updated optimistically on user actions.

**Auth / Supabase session handling** — Supabase's JS client internally fires a `SIGNED_IN` event on every browser tab-focus via its `visibilitychange` → `_recoverAndRefresh()` chain. The `onAuthStateChange` handler uses a functional `setUser` update that compares user IDs and bails out when the user hasn't changed, preventing spurious data reloads on tab switch.

**Data flow**
1. User signs in → `onAuthStateChange` fires with a new user ID → `[user]` effect fetches all data in parallel
2. User actions (check habit, edit note, change theme) → optimistic local state update → async Supabase write
3. Date navigation → `[selectedDate, allLogs]` effect syncs the active log; `CheckIn` stays mounted and syncs via its own effects
