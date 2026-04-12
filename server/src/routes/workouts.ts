import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', (req: AuthedRequest, res: Response): void => {
  const rows = db
    .prepare('SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC')
    .all(req.user!.userId) as { data: string }[]
  res.json(rows.map((r) => JSON.parse(r.data)))
})

router.post('/', (req: AuthedRequest, res: Response): void => {
  const workout = req.body as Record<string, unknown>
  const id = uuidv4()
  const date = (workout.date as string) ?? new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  const saved = { ...workout, id }
  db.prepare(
    'INSERT INTO workouts (id, user_id, date, data, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user!.userId, date, JSON.stringify(saved), now)
  res.status(201).json(saved)
})

router.put('/:id', (req: AuthedRequest, res: Response): void => {
  const { id } = req.params
  const row = db
    .prepare('SELECT id FROM workouts WHERE id = ? AND user_id = ?')
    .get(id, req.user!.userId)
  if (!row) {
    res.status(404).json({ error: 'Workout not found' })
    return
  }
  const workout = req.body as Record<string, unknown>
  const saved = { ...workout, id }
  db.prepare('UPDATE workouts SET data = ?, date = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
    JSON.stringify(saved),
    (workout.date as string) ?? new Date().toISOString().slice(0, 10),
    new Date().toISOString(),
    id,
    req.user!.userId
  )
  res.json(saved)
})

router.delete('/:id', (req: AuthedRequest, res: Response): void => {
  const { id } = req.params
  const result = db
    .prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?')
    .run(id, req.user!.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Workout not found' })
    return
  }
  res.json({ ok: true })
})

export default router
