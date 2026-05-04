import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { signToken, requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' })
    return
  }

  const id = uuidv4()
  const hash = bcrypt.hashSync(password, 12)
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  const isAdmin = userCount === 0 ? 1 : 0
  db.prepare('INSERT INTO users (id, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, ?)').run(
    id,
    email.toLowerCase(),
    hash,
    new Date().toISOString(),
    isAdmin
  )

  // Seed default settings
  db.prepare('INSERT INTO user_settings (user_id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify({ weightUnit: 'lbs' })
  )

  const token = signToken({ userId: id, email: email.toLowerCase() })
  res.status(201).json({ token, user: { id, email: email.toLowerCase(), isAdmin: isAdmin === 1 } })
})

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = db
    .prepare('SELECT id, email, password_hash, is_admin FROM users WHERE email = ?')
    .get(email.toLowerCase()) as { id: string; email: string; password_hash: string; is_admin: number } | undefined

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.is_admin === 1 } })
})

router.post('/change-password', requireAuth, (req: AuthedRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string }
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' })
    return
  }

  const user = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(req.user!.userId) as { password_hash: string } | undefined
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' })
    return
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(newPassword, 12),
    req.user!.userId
  )
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req: AuthedRequest, res: Response): void => {
  const row = db
    .prepare('SELECT id, email, is_admin FROM users WHERE id = ?')
    .get(req.user!.userId) as { id: string; email: string; is_admin: number } | undefined
  if (!row) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user: { id: row.id, email: row.email, isAdmin: row.is_admin === 1 } })
})

export default router
