import { Router, Response } from 'express'
import db from '../db'
import { requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', (req: AuthedRequest, res: Response): void => {
  const row = db
    .prepare('SELECT data FROM user_settings WHERE user_id = ?')
    .get(req.user!.userId) as { data: string } | undefined
  res.json(row ? JSON.parse(row.data) : { weightUnit: 'lbs' })
})

router.put('/', (req: AuthedRequest, res: Response): void => {
  const settings = req.body as Record<string, unknown>
  db.prepare(
    'INSERT INTO user_settings (user_id, data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data'
  ).run(req.user!.userId, JSON.stringify(settings))
  res.json(settings)
})

export default router
