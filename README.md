# TaskMuster

A daily habit and task tracking app built with React, Vite, and Supabase.

## Features

- **Daily check-in** — Log habits each day with checkbox or multi-select types
- **Activity heatmap** — GitHub-style annual heatmap per habit, with day-detail popover
- **Stats** — Streak tracking, completion counts, weekly/monthly breakdowns, habit sub-type breakdowns
- **Habit management** — Create, edit, and delete habits; historical logs are preserved after deletion
- **Auth** — Email/password authentication via Supabase
- **Themes** — Dark and light mode

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
  App.jsx               — root component, auth + data loading
  storage.js            — Supabase database operations
  supabaseClient.js     — Supabase client init
  dateUtils.js          — date helpers
resources/              — source images for icon/splash generation (1024×1024 icon.png)
ios/                    — generated Xcode project (Capacitor)
```
