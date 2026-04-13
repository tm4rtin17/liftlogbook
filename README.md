# 🏋️ LiftLogbook

A self-hosted web app for tracking weight-lifting workouts. Log exercises, sets, reps, and weight — then review your history and visualize progress over time. Each user's data is kept fully isolated on your own server.

## Features

- **Workout logging** — build sessions from a library of 60+ built-in exercises, add custom exercises, and log sets with weight and reps
- **History** — browse past workouts by month, expand for full set details, edit or delete any entry
- **Activity heatmap** — 52-week grid in the History view showing workout frequency and volume intensity at a glance
- **Analytics** — weekly volume charts by muscle group or individual exercise, all-time breakdowns, and personal bests
- **Personal Records** — dedicated PRs page showing all-time bests per exercise: heaviest weight, most reps, estimated 1RM (Epley formula), and best session volume
- **Export / Import / Backup** — export your data as JSON (full backup) or CSV (spreadsheet-friendly), and import a JSON backup to restore or migrate data
- **Multi-user** — each account has fully isolated data; register as many users as you like
- **Per-user settings** — weight unit (lbs / kg) and accent color theme stored per account
- **Dark mode** — follows system preference, togglable at any time

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (30-day tokens), bcrypt |

## Requirements

- Node.js 18+
- npm 9+

## Development

```bash
# 1. Install dependencies for both frontend and server
npm install
cd server && npm install && cd ..

# 2. Start both the API server and Vite dev server together
npm run dev
```

The app is available at `http://localhost:5173`. API requests are proxied to the server at `http://localhost:3001`.

> **Note:** If you change `tailwind.config.js`, restart the Vite dev server for the change to take effect (`Ctrl+C` then `npm run dev` again).

## 🐳 Docker (recommended)

The easiest way to run LiftLogbook is with Docker Compose.

### Quick start

```bash
# 1. Clone the repo and enter the directory
git clone https://github.com/tm4rtin17/liftlogbook.git
cd liftlogbook

# 2. Create a .env file with a secure secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# 3. Build and start
docker compose up -d
```

The app is available at `http://localhost:3001`.

### Configuration

Create a `.env` file in the project root:

```env
# Required — use a long random string
JWT_SECRET=your-secret-here

# Optional — change the host port (default: 3001)
PORT=3001
```

### Data persistence

The SQLite database is stored in a named Docker volume (`liftlogbook_data`) and persists across container restarts and rebuilds. To back up your data, inspect the volume location with `docker volume inspect liftlogbook_data` and copy the `liftlogbook.db` file from there.

```bash
# Stop and remove containers (data is safe in the named volume)
docker compose down

# Rebuild after a code change (data volume is preserved)
docker compose up -d --build

# Remove containers AND delete all data (irreversible)
docker compose down -v
```

---

## Production Deployment

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Create the server environment file
cp server/.env.example server/.env
# Edit server/.env and set JWT_SECRET to a long random string:
#   openssl rand -hex 32

# 3. Build the frontend
npm run build

# 4. Start the server (serves the built frontend + API on port 3001)
cd server
NODE_ENV=production node dist/index.js
```

The app is available at `http://localhost:3001` (or whatever `PORT` is set to in `server/.env`).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes (production)** | Secret used to sign JWTs. Use a long random string. |
| `PORT` | No | Port the server listens on. Defaults to `3001`. |

> In development the server falls back to a hardcoded secret. Never deploy to production without setting `JWT_SECRET`.

## Project Structure

```
liftlogbook/
├── src/                    # Frontend (React)
│   ├── api/client.ts       # Fetch wrapper with JWT injection
│   ├── components/         # UI components
│   │   ├── Analytics.tsx       # Charts & volume analysis
│   │   ├── ExercisePicker.tsx  # Exercise selection modal
│   │   ├── History.tsx         # Past workouts + heatmap
│   │   ├── Navigation.tsx      # Tab-based navigation bar
│   │   ├── PersonalRecords.tsx # All-time bests by exercise
│   │   ├── Settings.tsx        # User settings, import/export
│   │   ├── WorkoutHeatmap.tsx  # 52-week activity grid
│   │   ├── WorkoutLogger.tsx   # Add/edit workout form
│   │   └── ui/                 # Reusable: Button, Input, Modal, Badge
│   ├── contexts/           # AuthContext, ThemeContext
│   ├── data/               # Built-in exercise list, accent color palettes
│   ├── hooks/useStore.ts   # All data state — fetches from API, exposes actions
│   ├── screens/            # Auth screen
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Volume calculations, weekly aggregation, storage helpers
├── server/
│   └── src/
│       ├── db.ts           # SQLite schema (users, workouts, exercises, settings)
│       ├── index.ts        # Express app entry point
│       ├── middleware/     # JWT auth middleware
│       └── routes/         # auth, workouts, exercises, settings, backup
├── public/
└── data/                   # SQLite database files (gitignored)
```

## Data Storage

The SQLite database is created automatically at `data/liftlogbook.db` on first run. The `data/` directory is gitignored — back it up separately if you care about the data.

Weights are always stored internally in lbs. Switching a user's unit preference converts the display only.

## License

This project is licensed under the [MIT License](LICENSE).
