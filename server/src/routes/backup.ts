import { Router, Response } from 'express'
import db from '../db'
import { requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// POST /api/backup/import
// Accepts a JSON backup payload and inserts any workouts/custom exercises
// that don't already exist for the user (skip duplicates by id).
router.post('/import', (req: AuthedRequest, res: Response): void => {
  const userId = req.user!.userId
  const backup = req.body

  if (!backup || typeof backup !== 'object') {
    res.status(400).json({ error: 'Invalid backup format' })
    return
  }

  const workouts: unknown[] = Array.isArray(backup.workouts) ? backup.workouts : []
  const customExercises: unknown[] = Array.isArray(backup.customExercises)
    ? backup.customExercises
    : []

  const doImport = db.transaction(() => {
    let workoutsImported = 0
    let exercisesImported = 0

    for (const w of workouts) {
      const workout = w as Record<string, unknown>
      if (typeof workout.id !== 'string' || typeof workout.date !== 'string') continue
      const existing = db
        .prepare('SELECT id FROM workouts WHERE id = ? AND user_id = ?')
        .get(workout.id, userId)
      if (!existing) {
        db.prepare(
          'INSERT INTO workouts (id, user_id, date, data, updated_at) VALUES (?, ?, ?, ?, ?)'
        ).run(
          workout.id,
          userId,
          workout.date,
          JSON.stringify(workout),
          new Date().toISOString()
        )
        workoutsImported++
      }
    }

    for (const e of customExercises) {
      const exercise = e as Record<string, unknown>
      if (
        typeof exercise.id !== 'string' ||
        typeof exercise.name !== 'string' ||
        typeof exercise.muscleGroup !== 'string'
      )
        continue
      const existing = db
        .prepare('SELECT id FROM custom_exercises WHERE id = ? AND user_id = ?')
        .get(exercise.id, userId)
      if (!existing) {
        db.prepare('INSERT INTO custom_exercises (id, user_id, data) VALUES (?, ?, ?)').run(
          exercise.id,
          userId,
          JSON.stringify({ ...exercise, custom: true })
        )
        exercisesImported++
      }
    }

    return { workoutsImported, exercisesImported }
  })

  try {
    const result = doImport()
    res.json({ ok: true, ...result })
  } catch {
    res.status(500).json({ error: 'Import failed' })
  }
})

export default router
