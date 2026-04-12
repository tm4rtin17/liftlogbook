import { Router, Response } from 'express'
import db from '../db'
import { requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', (req: AuthedRequest, res: Response): void => {
  const rows = db
    .prepare('SELECT data FROM custom_exercises WHERE user_id = ?')
    .all(req.user!.userId) as { data: string }[]
  res.json(rows.map((r) => JSON.parse(r.data)))
})

router.post('/', (req: AuthedRequest, res: Response): void => {
  const exercise = req.body as Record<string, unknown>
  if (!exercise.id || !exercise.name || !exercise.muscleGroup) {
    res.status(400).json({ error: 'id, name, and muscleGroup are required' })
    return
  }
  db.prepare('INSERT INTO custom_exercises (id, user_id, data) VALUES (?, ?, ?)').run(
    exercise.id as string,
    req.user!.userId,
    JSON.stringify(exercise)
  )
  res.status(201).json(exercise)
})

router.delete('/:id', (req: AuthedRequest, res: Response): void => {
  const result = db
    .prepare('DELETE FROM custom_exercises WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Exercise not found' })
    return
  }
  res.json({ ok: true })
})

export default router
