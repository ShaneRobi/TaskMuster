# Habbit Rabbit — Project Changelog

## Project Overview

**Habbit Rabbit** is a daily habit and task tracking web app built with React, Vite, and Supabase. Users log daily habits, view activity heatmaps, track streaks, and manage their habit list. The app supports both dark and light themes and is designed to be mobile-friendly.

**Stack:** React 19, Vite, Supabase (auth + database), Lucide React icons

---

## Timeline

---

### 2026-05-09 — Initial Creation

**Commit:** `d670d26` — *"habit tracker"*

The project was created from scratch as a habit tracker web app.

**What was built:**
- React + Vite project scaffold
- Supabase integration for user authentication (email/password) and data storage
- Core habit tracking with daily check-ins
- Two default habit types: **Checkbox** (simple done/not done) and **Multi-select** (e.g. workout types)
- Data persistence per user via Supabase database

---

### 2026-05-10 — Feature Expansion & Heatmap Introduction

**Commit:** `49fd669` — *"Updated Heatmaps tab"*

Major feature additions across the app.

**What was added:**
- **Heatmap view** — one compact annual heatmap per habit
  - Simple habits show as binary green cells
  - Workout/multi-select habits scale cell intensity by number of sub-types logged
  - Clicking any cell opens a day-detail popover
- **Stats tab** — LeetCode-style stat cards in a 2-column grid, each showing:
  - Total completions
  - Current streak + best streak
  - This week / this month counts
  - Progress bar for the current month
  - Workout sub-type breakdown sorted by frequency

---

### 2026-05-10 — Renamed to "Tusk Muster"

**Commit:** `cb80d4e` — *"Updated name from habit tracker to Tusk Muster"*

The app was given its first proper name: **Tusk Muster**.

---

### 2026-05-10 — Renamed to "Task Muster"

**Commit:** `9b7342f` — *"Updated all names from habit tracker to task muster"*

Name corrected and applied consistently across all files.

---

### 2026-05-10 — Heatmap Mobile Fix & Habit Editing

**Commit:** `0778b18` — *"Fix heatmap month alignment on mobile; add habit editing in Settings"*

**What changed:**
- Fixed heatmap month alignment on mobile screens
- Added the ability to edit existing habits from the Settings panel (previously only add/delete was possible)

---

### 2026-05-10 — Workout Editing UI Improvement

**Commit:** `2b56069` — *"Improve workout editing UI"*

**What changed:**
- Polished the UI for editing workout-type (multi-select) habits in the settings panel

---

### 2026-05-10 — Heatmap Redesign (this session)

**What changed:**

#### Heatmap — full redesign
- Replaced the 12-month side-by-side grid with two distinct views:
  - **Month view (default):** shows only the current month as a compact horizontal strip (1–2 lines), with `‹ ›` buttons to navigate backward/forward through previous months, limited to the user's signup year
  - **Full Year view:** a continuous GitHub-style annual grid (weeks as columns, days as rows) — no month-block separation. Toggled via a "Full Year" button
- Added a **year selector** in the full year view to navigate across years when the account spans multiple years
- Month cells sized at **22×22px**; year cells at **11×11px**

#### Layout
- Container max-width reduced from **960px → 780px** to match the yearly heatmap width exactly
- **"Manage Habits & Tasks"** section moved to sit directly below the daily check-in section so users can add/edit/delete habits without scrolling past stats and heatmaps

#### Header streaks
- Habit streak pills now always arrange into exactly **2 rows** using CSS grid
- Pills made smaller: font 10px, tighter padding, labels truncate on overflow

#### App renamed to "Habbit Rabbit"
- Updated in `index.html` (browser tab title), `AuthScreen.jsx` (login screen heading), and `Header.jsx` (main app header)

#### Settings panel
- Renamed toggle label from "Settings" → **"Manage Habits & Tasks"**

---

## File Reference

| File | Purpose |
|---|---|
| `src/App.jsx` | Root component, state management, layout order |
| `src/App.css` | All styling and CSS variables |
| `src/components/Header.jsx` | App title, overall streak, per-habit streak pills |
| `src/components/Heatmap.jsx` | Month/year heatmap toggle, navigation, cell rendering |
| `src/components/CheckIn.jsx` | Daily habit check-in form |
| `src/components/Settings.jsx` | Add, edit, delete habits ("Manage Habits & Tasks") |
| `src/components/Stats.jsx` | Stat cards per habit |
| `src/components/HabitBreakdown.jsx` | Per-habit mini heatmaps + stat cards |
| `src/components/HeatmapPopover.jsx` | Day-detail popover on cell click |
| `src/components/AuthScreen.jsx` | Login / signup screen |
| `src/storage.js` | Supabase read/write helpers |
| `src/supabaseClient.js` | Supabase client initialisation |
| `index.html` | HTML entry point, browser tab title |
