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
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    email.toLowerCase(),
    hash,
    new Date().toISOString()
  )

  // Seed default settings
  db.prepare('INSERT INTO user_settings (user_id, data) VALUES (?, ?)').run(
    id,
    JSON.stringify({ weightUnit: 'lbs' })
  )

  const token = signToken({ userId: id, email: email.toLowerCase() })
  res.status(201).json({ token, user: { id, email: email.toLowerCase() } })
})

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase()) as { id: string; email: string; password_hash: string } | undefined

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email } })
})

router.get('/me', requireAuth, (req: AuthedRequest, res: Response): void => {
  res.json({ user: req.user })
})

export default router
