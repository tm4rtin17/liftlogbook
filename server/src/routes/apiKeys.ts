import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { requireAuth, AuthedRequest } from '../middleware/auth'
import { generateApiKey } from '../lib/apiKeys'

interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

function toPublic(row: ApiKeyRow) {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }
}

const router = Router()
router.use(requireAuth)

// List the current user's keys. Never returns the full secret.
router.get('/', (req: AuthedRequest, res: Response): void => {
  const rows = db
    .prepare(
      'SELECT id, name, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(req.user!.userId) as ApiKeyRow[]
  res.json(rows.map(toPublic))
})

// Create a new key. The full secret is returned exactly once, here.
router.post('/', (req: AuthedRequest, res: Response): void => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }

  const { key, hash, prefix } = generateApiKey()
  const id = uuidv4()
  const createdAt = new Date().toISOString()

  db.prepare(
    'INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.user!.userId, name, hash, prefix, createdAt)

  res.status(201).json({
    id,
    name,
    key, // shown once — the client must copy this now
    keyPrefix: prefix,
    createdAt,
    lastUsedAt: null,
  })
})

// Revoke (delete) a key. Takes effect immediately.
router.delete('/:id', (req: AuthedRequest, res: Response): void => {
  const result = db
    .prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.userId)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Key not found' })
    return
  }
  res.json({ ok: true })
})

export default router
