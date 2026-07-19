# Habit Rabbit History

This file records meaningful product and architecture changes. It complements `CHANGELOG.md` by preserving the reasoning behind larger feature decisions.

## Unreleased — Accountability system expansion

The Quant Developer Accountability workspace is being expanded without changing its established visual design.

### Product changes

- Replace generic evidence text with structured, track-specific records for Algorithms, Quant Math, Build, SQL, and English.
- Separate work-session effort from learning-item outcomes so time, evidence, and curriculum progress no longer imply the same thing.
- Add plain-language onboarding, examples, and clearer statuses such as Ready, In Progress, Evidence Needed, and Complete.
- Add configurable active days, future track targets, a daily ceiling, explicit waivers, and auditable corrections.
- Add historical daily snapshots and debt-ledger drill-down.
- Add the complete Blind 75 catalogue plus the 12-week Math, Build, SQL, and English curricula.
- Add problem attempts, 1/7/21-day reviews, error recurrence, and repair records.
- Add Supabase-backed accountability state with device-local fallback and migration from the original local format.

### Design constraint

The existing dashboard composition, cards, colors, spacing, typography, responsive behavior, dark/light themes, and two-workspace navigation remain unchanged. New behavior is added inside the current visual system.

## 2026-07-16 — Accountability workspace v1

Commit: `d4cbce9` (`Add quant accountability workspace`)

- Added top-level Habits and Accountability workspaces.
- Preserved the original habit tracker as a separate tab.
- Added five default Quant Developer tracks totaling six base hours per active day.
- Added evidence-gated effort credit, projected workload debt, and a 50% per-track recovery cap.
- Added local daily snapshots, debt transactions, a starter learning queue, a 24-milestone roadmap, and weekly summary metrics.
- Added Singapore timezone handling and rollover tests.
- Added responsive desktop and mobile layouts using the existing Habit Rabbit design language.

### Known limitations of v1

- Evidence validation only checked text length and was not track-specific.
- Effort completion and learning-item completion were coupled.
- Accountability data was stored only on the device.
- Closed days had no correction or waiver workflow.
- The debt ledger was not inspectable in the interface.
- The curriculum contained only starter records rather than the complete programme.

## 2026-05-26 — Multi-select task creation

- Added configurable option entry when creating a multi-select habit or task.
- Preserved sensible workout defaults while allowing them to be replaced before creation.

## 2026-05-23 — Session and date-navigation stability

- Prevented Supabase token-refresh events from reloading the entire application when returning to the browser tab.
- Removed the forced `CheckIn` remount during date navigation so local note state and pending saves survive navigation.
- Added architecture and data-flow notes to the project documentation.

## 2026-05 — Habit Rabbit mobile packaging

- Added Capacitor and generated the native iOS wrapper.
- Added App Store build and handoff documentation.
- Established `com.shanerobihemed.taskmuster` as the native bundle identifier.

## Original product

Habit Rabbit began as a focused daily habit tracker with:

- Daily checkbox and multi-select check-ins.
- GitHub-style activity heatmaps.
- Streak and completion statistics.
- Habit configuration with preserved historical labels.
- Supabase email/password authentication and storage.
- Dark and light themes.

