import { lazy, Suspense, useEffect, useState } from 'react'
import { marked } from 'marked'
import { api } from '../api/client'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}

interface CreatedApiKey extends ApiKey {
  key: string
}

const ApiReference = lazy(() =>
  import('./ApiReference').then((m) => ({ default: m.ApiReference }))
)

type DocsTab = 'guide' | 'reference'

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ApiDocs() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)

  const [docsTab, setDocsTab] = useState<DocsTab>('guide')
  const [guideHtml, setGuideHtml] = useState<string | null>(null)
  const [guideError, setGuideError] = useState('')
  const [docsCopied, setDocsCopied] = useState(false)

  async function loadKeys() {
    try {
      const data = await api.get<ApiKey[]>('/keys')
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
    // Guide markdown is static server content (server/src/apiGuide.ts), so
    // rendering it as HTML is safe. Plain fetch: the api client is JSON-only.
    fetch('/api/docs.md?part=guide')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((md) => setGuideHtml(marked.parse(md, { async: false })))
      .catch(() => setGuideError('Failed to load the API guide'))
  }, [])

  async function handleCopyDocs() {
    try {
      const res = await fetch('/api/docs.md')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await navigator.clipboard.writeText(await res.text())
      setDocsCopied(true)
      setTimeout(() => setDocsCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (insecure context) or fetch failed — fall
      // back to opening the raw Markdown so it can be copied by hand.
      window.open('/api/docs.md', '_blank', 'noopener')
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const result = await api.post<CreatedApiKey>('/keys', { name: newName.trim() })
      setShowCreate(false)
      setNewName('')
      setCreatedKey(result)
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    try {
      await api.delete(`/keys/${revokeTarget.id}`)
      setRevokeTarget(null)
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key')
    }
  }

  async function handleCopy(key: string) {
    try {
      await navigator.clipboard.writeText(key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the key is still
      // selectable text in the box, so this is a soft failure.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* API Keys */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">API Keys</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Read-only credentials for trusted integrations, like the LiftLogbook MCP server.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Key
          </Button>
        </div>

        {error && (
          <p className="px-4 py-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40">
            {error}
          </p>
        )}

        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-500 text-center">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-500 text-center">
            No API keys yet
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">
                    {k.name}
                  </p>
                  <p className="text-xs font-mono text-slate-400 dark:text-zinc-500 mt-0.5">
                    {k.keyPrefix}&hellip;
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    Created {formatDate(k.createdAt)} &middot; Last used {formatDate(k.lastUsedAt)}
                  </p>
                </div>
                <button
                  onClick={() => setRevokeTarget(k)}
                  className="shrink-0 text-xs font-medium text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Docs: human-readable guide + interactive reference */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Docs</h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                {docsTab === 'guide' ? (
                  <>
                    How the API works. Copy the full docs as{' '}
                    <a href="/api/docs.md" target="_blank" rel="noopener" className="underline hover:text-slate-600 dark:hover:text-zinc-300">
                      Markdown
                    </a>{' '}
                    to share them anywhere.
                  </>
                ) : (
                  <>
                    Click <span className="font-mono">Authorize</span> below and paste an API key to
                    try requests against your own data.
                  </>
                )}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleCopyDocs} className="shrink-0">
              {docsCopied ? 'Copied!' : 'Copy as Markdown'}
            </Button>
          </div>
          <div className="mt-3 inline-flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5">
            {(['guide', 'reference'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDocsTab(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  docsTab === t
                    ? 'bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-100 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                {t === 'guide' ? 'Guide' : 'Reference'}
              </button>
            ))}
          </div>
        </div>

        {docsTab === 'guide' ? (
          guideError ? (
            <p className="px-4 py-6 text-sm text-red-500 dark:text-red-400 text-center">{guideError}</p>
          ) : guideHtml == null ? (
            <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-500 text-center">Loading…</p>
          ) : (
            <article className="llb-prose px-4 py-4" dangerouslySetInnerHTML={{ __html: guideHtml }} />
          )
        ) : (
          <Suspense
            fallback={<p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-500 text-center">Loading…</p>}
          >
            <ApiReference />
          </Suspense>
        )}
      </section>

      {/* Create key */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New API Key">
        <div className="space-y-4">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. MCP server"
            autoFocus
          />
          <Button fullWidth onClick={handleCreate} disabled={!newName.trim() || creating}>
            {creating ? 'Creating…' : 'Create Key'}
          </Button>
        </div>
      </Modal>

      {/* Reveal full key, once */}
      <Modal open={createdKey != null} onClose={() => setCreatedKey(null)} title="API Key Created">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Copy this key now — for your security, it won't be shown again.
          </p>
          {createdKey && (
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap text-xs font-mono bg-slate-100 dark:bg-zinc-800 rounded-lg px-3 py-2.5 text-slate-700 dark:text-zinc-300">
                {createdKey.key}
              </code>
              <Button size="sm" variant="secondary" onClick={() => handleCopy(createdKey.key)}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          )}
          <Button fullWidth variant="ghost" onClick={() => setCreatedKey(null)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Revoke confirmation */}
      <Modal open={revokeTarget != null} onClose={() => setRevokeTarget(null)} title="Revoke API Key?">
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-5">
          "{revokeTarget?.name}" will stop working immediately, including for any integration
          using it. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={() => setRevokeTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleRevoke}>
            Revoke
          </Button>
        </div>
      </Modal>
    </div>
  )
}
