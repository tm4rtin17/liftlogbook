import { Request, Response, NextFunction } from 'express'
import db from '../db'
import { hashApiKey } from '../lib/apiKeys'

export interface ApiTokenRequest extends Request {
  apiUserId?: string
  apiKeyId?: string
}

/**
 * Guards the read-only /api/external routes with a database-backed API key,
 * separate from user JWTs — used by trusted service clients (e.g. the
 * LiftLogbook MCP server) rather than the web app.
 *
 * Keys are generated and revoked from the API Docs page in the app
 * (Settings → API Keys is not where this lives — see src/components/ApiDocs.tsx).
 * Only the sha256 hash is ever stored; the raw key is shown once, at creation.
 */
export function requireApiToken(req: ApiTokenRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const presented = header.slice(7).trim()
  if (!presented) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const hash = hashApiKey(presented)
  const row = db.prepare('SELECT id, user_id FROM api_keys WHERE key_hash = ?').get(hash) as
    | { id: string; user_id: string }
    | undefined

  if (!row) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.apiUserId = row.user_id
  req.apiKeyId = row.id

  // Best-effort last-used tracking — never block the request on it.
  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    row.id
  )

  next()
}
