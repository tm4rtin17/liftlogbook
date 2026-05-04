import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'liftlogbook-dev-secret-change-in-production'
export const JWT_EXPIRES_IN = '30d'

export interface AuthPayload {
  userId: string
  email: string
}

export interface AuthedRequest extends Request {
  user?: AuthPayload
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.userId) as { is_admin: number } | undefined
  if (!row?.is_admin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}
