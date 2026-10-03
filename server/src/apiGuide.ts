/**
 * Hand-written, human-readable guide for the /api/external surface. Rendered on
 * the in-app API Docs page ("Guide" tab) and prepended to the generated
 * endpoint reference in GET /api/docs.md (see docsMarkdown.ts).
 *
 * Kept as a TS string rather than a .md file because `tsc` doesn't copy
 * non-TS assets into dist/. Backticks are escaped (\`) inside the template.
 * Keep the facts here in sync with routes/external.ts and lib/analytics.ts.
 */
export function apiGuideMarkdown(baseUrl: string): string {
  const api = `${baseUrl}/api/external`
  return `# LiftLogbook API Guide

The LiftLogbook API gives **read-only** access to one user's workout data: workouts, sets, exercises, personal records, and summary analytics. It's meant for scripts, dashboards, and other trusted integrations. It can't create, change, or delete anything.

- **Base URL:** \`${api}\`
- **Format:** JSON over HTTPS, \`GET\` requests only
- **Auth:** an API key sent as a Bearer token
- **Machine-readable spec:** [\`${baseUrl}/api/openapi.json\`](${baseUrl}/api/openapi.json) (OpenAPI 3.0)
- **This document as Markdown:** [\`${baseUrl}/api/docs.md\`](${baseUrl}/api/docs.md)

## Quick start

1. Open **API Keys & Docs** in LiftLogbook and click **+ New Key**. Copy the key; it starts with \`llb_\` and is only shown once.
2. Make a request:

\`\`\`bash
curl -H "Authorization: Bearer llb_your_key_here" \\
  "${api}/workouts?limit=1"
\`\`\`

3. You'll get back an array with your most recent workout:

\`\`\`json
[
  {
    "id": "6f1c…",
    "date": "2026-10-01",
    "name": "Push Day",
    "exercises": [
      {
        "id": "a81e…",
        "exerciseId": "builtin-0",
        "sets": [
          { "id": "c2d4…", "reps": 8, "weight": 185 },
          { "id": "e9f0…", "reps": 6, "weight": 195 }
        ]
      }
    ]
  }
]
\`\`\`

## Authentication

Send the key on every request:

\`\`\`
Authorization: Bearer llb_<40 hex characters>
\`\`\`

- An API key is separate from your account password. It can only read the endpoints below, and only for the account that created it.
- The app shows a short prefix (e.g. \`llb_3f9a2b1…\`) so you can tell keys apart. The full key isn't stored and can't be shown again.
- Revoking a key takes effect immediately.
- A missing, malformed, or revoked key returns \`401\` with \`{ "error": "Unauthorized" }\`.

## Data model

\`\`\`
Workout            one training session on one date
└─ exercises[]     WorkoutExercise: which exercise was done
   └─ sets[]       SetEntry: reps × weight
\`\`\`

- **Workout:** \`date\` is a plain calendar date (\`YYYY-MM-DD\`) with no time or timezone. A user can log more than one workout on the same date. \`notes\` is left out when empty.
- **WorkoutExercise:** \`exerciseId\` points into the exercise catalog. Workouts don't include exercise names, so call \`GET /exercises\` once and look names up by \`id\`.
- **Exercise:** built-in exercises have IDs like \`builtin-12\`. Custom exercises the user created have \`custom: true\`. Match exercises by \`id\` rather than by name, because names aren't guaranteed to be unique.
- **SetEntry:** \`reps\` and \`weight\` for one set. Sets are in the order they were logged.

## Units and bodyweight

**All weights are in pounds (lbs).** This includes set weights, personal records, and volume. The \`weightUnit\` in \`GET /profile\` is only how the app *displays* weights. To show kilograms, divide by 2.20462.

For **bodyweight sets** (\`isBodyweight: true\`, e.g. pull-ups or dips), \`weight\` is only the **added** load. A set with \`weight: 0\` was done at bodyweight alone, and \`weight: 25\` means bodyweight plus 25 lbs.

When LiftLogbook does math on a bodyweight set, it uses an *effective weight*:

\`\`\`
effectiveWeight = bodyweightLbs + weight     (bodyweight sets)
effectiveWeight = weight                     (all other sets)
\`\`\`

\`bodyweightLbs\` comes from the user's settings (\`GET /profile\` → \`settings.bodyweightLbs\`). If it isn't set, it counts as 0, so bodyweight sets only count their added weight.

## How computed values work

These values come from the user's **full history** at request time. They can't be filtered by date.

**Volume** = Σ effectiveWeight × reps over the sets you're totalling. Volumes in \`/analytics/summary\` are rounded to whole lbs.

**Personal records** (\`GET /personal-records\`) contain one object per exercise that has at least one logged set:

| Field | Meaning |
|---|---|
| \`heaviestWeight\` (+ \`Reps\`, \`Date\`) | Heaviest logged \`weight\`. For bodyweight exercises this is the most *added* weight. A tie goes to the set with more reps. |
| \`mostReps\` (+ \`Weight\`, \`Date\`) | Most reps in a single set. A tie goes to the heavier effective weight. |
| \`best1RM\` (+ \`Date\`) | Best estimated one-rep max, using the Epley formula: effectiveWeight × (1 + reps ÷ 30). Not rounded. |
| \`bestVolume\` (+ \`Date\`) | Most volume for that exercise within a single workout. |

**Analytics summary** (\`GET /analytics/summary\`):

- \`currentStreak\`: consecutive days with a workout, counting back from today (server date, UTC). It is \`0\` if there's no workout today, so the streak resets at midnight UTC.
- \`longestStreak\`: the longest run of consecutive calendar days that have a workout.
- \`avgWorkoutsPerWeek\`: total workouts ÷ weeks between the first and last workout, rounded to one decimal place.
- \`volumeByMuscleGroup\`: all-time volume per muscle group, highest first.
- \`topExercisesByVolume\`: up to 20 exercises by all-time volume, highest first. These entries include \`exerciseName\` but not \`exerciseId\`.

## Filtering and limits

- \`GET /workouts\` returns workouts **newest first**, and each workout includes all of its sets. There is **no pagination**, so use the filters below to keep responses small:
  - \`since=YYYY-MM-DD\` returns workouts on or after that date.
  - \`limit=N\` returns at most N workouts, applied after \`since\`.
- Use \`GET /workouts/{id}\` to fetch one workout again by ID.
- There's currently no rate limit. Please be reasonable: LiftLogbook runs on a Raspberry Pi.

## Errors

Every error has the same JSON body:

\`\`\`json
{ "error": "Workout not found" }
\`\`\`

| Status | When |
|---|---|
| \`401\` | Missing, invalid, or revoked API key |
| \`404\` | \`GET /workouts/{id}\` with an ID that doesn't exist or belongs to another user |

## Common tasks

**Workouts since a date** (e.g. the start of a training block)

\`\`\`bash
curl -H "Authorization: Bearer $LLB_KEY" "${api}/workouts?since=2026-09-01"
\`\`\`

**History for one exercise** (e.g. bench press)

1. \`GET /exercises\` and find the exercise's \`id\`.
2. \`GET /workouts\`, and in each workout keep the \`exercises[]\` entries with that \`exerciseId\`.
3. Each entry's \`sets\` holds that day's reps and weights. Pair them with the workout's \`date\`.

**Weekly volume**

Group workouts by week using \`date\`. For each week, total effectiveWeight × reps across every set. (The summary endpoint only gives all-time totals.)

**Current best lifts**

Call \`GET /personal-records\`. Each record already includes its full \`exercise\` object, so no lookup is needed.

`
}
