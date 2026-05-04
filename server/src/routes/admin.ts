import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, requireAdmin, AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireAdmin)

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// List all users
router.get('/users', (_req: AuthedRequest, res: Response): void => {
  const rows = db
    .prepare('SELECT id, email, created_at, is_admin FROM users ORDER BY created_at ASC')
    .all() as { id: string; email: string; created_at: string; is_admin: number }[]
  res.json(rows.map((r) => ({ ...r, isAdmin: r.is_admin === 1 })))
})

// Invite (create) a new user
router.post('/users', (req: AuthedRequest, res: Response): void => {
  const { email } = req.body as { email?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' })
    return
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' })
    return
  }

  const tempPassword = generateTempPassword()
  const id = uuidv4()
  db.prepare('INSERT INTO users (id, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, 0)').run(
    id,
    email.toLowerCase(),
    bcrypt.hashSync(tempPassword, 12),
    new Date().toISOString()
  )
  db.prepare('INSERT INTO user_settings (user_id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify({ weightUnit: 'lbs' })
  )

  res.status(201).json({ id, email: email.toLowerCase(), tempPassword })
})

// Reset a user's password
router.post('/users/:id/reset-password', (req: AuthedRequest, res: Response): void => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const tempPassword = generateTempPassword()
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(tempPassword, 12),
    req.params.id
  )
  res.json({ tempPassword })
})

// Toggle admin status (cannot demote yourself)
router.patch('/users/:id/admin', (req: AuthedRequest, res: Response): void => {
  if (req.params.id === req.user!.userId) {
    res.status(400).json({ error: 'Cannot change your own admin status' })
    return
  }
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.params.id) as { is_admin: number } | undefined
  if (!row) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const newVal = row.is_admin ? 0 : 1
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newVal, req.params.id)
  res.json({ isAdmin: newVal === 1 })
})

// Delete a user (cannot delete yourself)
router.delete('/users/:id', (req: AuthedRequest, res: Response): void => {
  if (req.params.id === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete your own account here' })
    return
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ ok: true })
})

export default router
