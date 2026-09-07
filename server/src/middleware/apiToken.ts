import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import db from '../db'

export interface ApiTokenRequest extends Request {
  apiUserId?: string
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Guards the read-only /api/external routes with a static bearer token,
 * separate from user JWTs — used by trusted service clients (e.g. the
 * LiftLogbook MCP server) rather than the web app.
 */
export function requireApiToken(req: ApiTokenRequest, res: Response, next: NextFunction): void {
  const configuredToken = process.env.API_TOKEN
  const ownerEmail = process.env.API_TOKEN_USER_EMAIL
  if (!configuredToken || !ownerEmail) {
    res.status(503).json({ error: 'External API is not configured' })
    return
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ') || !safeEqual(header.slice(7), configuredToken)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(ownerEmail) as
    | { id: string }
    | undefined
  if (!row) {
    res.status(500).json({ error: 'API_TOKEN_USER_EMAIL does not match any user' })
    return
  }

  req.apiUserId = row.id
  next()
}
