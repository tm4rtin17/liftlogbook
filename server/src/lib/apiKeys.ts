import crypto from 'crypto'

// Key shape: llb_<40 hex chars>. The prefix (first 11 chars, e.g. "llb_3f9a2b1") is
// stored alongside the hash so the UI can show "which key is which" without ever
// persisting or re-displaying the full secret.
const KEY_PREFIX = 'llb_'
const PREFIX_DISPLAY_LEN = 7 // hex chars shown after "llb_"

export interface GeneratedApiKey {
  /** Full secret — only ever returned once, at creation time. Never stored. */
  key: string
  /** sha256 hex digest of `key` — what gets persisted. */
  hash: string
  /** Short, non-secret prefix for display in the UI, e.g. "llb_3f9a2b1". */
  prefix: string
}

export function generateApiKey(): GeneratedApiKey {
  const secret = crypto.randomBytes(20).toString('hex') // 160 bits
  const key = `${KEY_PREFIX}${secret}`
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, KEY_PREFIX.length + PREFIX_DISPLAY_LEN),
  }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
