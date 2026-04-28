# Changelog

All notable changes to LiftLogbook are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [0.5.0] - 2026-04-24

### Changed
- Analytics: smart default exercise selection based on most recent workout
- Analytics: added weekly 1RM trend chart and weekly peak weight chart per exercise
- Analytics: added set-count mode toggle for muscle group volume chart
- Analytics: added exercise sort by frequency option (alongside existing sort by volume)
- Analytics: added streak stats (current streak, longest streak, avg workouts/week, volume change %)
- History: improvements to workout detail display
- WorkoutLogger: UI and interaction updates
- Input component: refinements to mobile input handling

---

## [0.4.0] - 2026-04-15

### Fixed
- Mobile header branding now matches desktop branding (logo and title alignment)

---

## [0.3.0] - 2026-04-14

### Added
- Custom SVG barbell logo replacing the default Vite/React branding
- Contributors section in README powered by contrib.rocks
- Contributing guidelines in README (good first contributions, code conventions, ideas for bigger features)

### Fixed
- README clone URL had stale `.git` suffix — removed

---

## [0.2.0] - 2026-04-13

### Added
- **Bodyweight exercise support** — exercises marked as bodyweight use the user's stored bodyweight (lbs) for volume calculations; bodyweight can be set in Settings
- **Personal Records page** — dedicated PRs tab showing all-time bests per exercise: heaviest weight, most reps, estimated 1RM (Epley formula), and best session volume
- **Activity heatmap** — 52-week workout frequency and volume intensity grid in the History view
- **Export / Import / Backup** — export data as JSON (full backup) or CSV (spreadsheet-friendly); import a JSON backup to restore or migrate data
- MIT License added

### Fixed
- Mobile horizontal overflow on Analytics and History pages without breaking heatmap scroll
- `SQLITE_CANTOPEN` crash on first run: database directory now uses a named Docker volume

---

## [0.1.0] - 2026-04-12

### Added
- Initial release of LiftLogbook
- Workout logging with 60+ built-in exercises, custom exercise creation, and set tracking (weight, reps)
- History view: browse past workouts by month, expand for full set details, edit or delete entries
- Analytics: weekly volume charts by muscle group or individual exercise, all-time breakdowns
- "All" filter for muscle group weekly volume chart
- Multi-user support with fully isolated data per account
- Per-user settings: weight unit (lbs / kg) and accent color theme
- Dark mode following system preference with manual toggle
- JWT authentication (30-day tokens) with bcrypt password hashing
- Docker Compose deployment with named volume for SQLite data persistence
- React 18 + TypeScript + Vite frontend, Node.js + Express backend, SQLite via better-sqlite3

---

[Unreleased]: https://github.com/tm4rtin17/liftlogbook/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/tm4rtin17/liftlogbook/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tm4rtin17/liftlogbook/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tm4rtin17/liftlogbook/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tm4rtin17/liftlogbook/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tm4rtin17/liftlogbook/releases/tag/v0.1.0
