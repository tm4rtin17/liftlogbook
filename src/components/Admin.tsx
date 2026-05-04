import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

interface AdminUser {
  id: string
  email: string
  created_at: string
  isAdmin: boolean
}

interface InviteResult {
  id: string
  email: string
  tempPassword: string
}

interface ResetResult {
  tempPassword: string
}

export function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  const [resetResult, setResetResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.get<AdminUser[]>('/admin/users')
      setUsers(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteResult(null)
    setInviting(true)
    try {
      const result = await api.post<InviteResult>('/admin/users', { email: inviteEmail })
      setInviteResult(result)
      setInviteEmail('')
      loadUsers()
    } catch (e) {
      setInviteError((e as Error).message)
    } finally {
      setInviting(false)
    }
  }

  async function handleResetPassword(user: AdminUser) {
    setActionError(null)
    setResetResult(null)
    try {
      const result = await api.post<ResetResult>(`/admin/users/${user.id}/reset-password`, {})
      setResetResult({ email: user.email, tempPassword: result.tempPassword })
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  async function handleToggleAdmin(user: AdminUser) {
    setActionError(null)
    try {
      await api.patch<{ isAdmin: boolean }>(`/admin/users/${user.id}/admin`, {})
      loadUsers()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete account for ${user.email}? This cannot be undone.`)) return
    setActionError(null)
    try {
      await api.delete(`/admin/users/${user.id}`)
      loadUsers()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-zinc-500 py-8 text-center">Loading…</p>
  }

  if (error) {
    return <p className="text-sm text-red-500 py-8 text-center">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Invite user */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Invite User</h3>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="flex-1 rounded-lg border border-slate-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {inviting ? 'Creating…' : 'Invite'}
            </button>
          </form>
          {inviteError && (
            <p className="text-xs text-red-500">{inviteError}</p>
          )}
          {inviteResult && (
            <TempPasswordBox
              label={`Account created for ${inviteResult.email}`}
              tempPassword={inviteResult.tempPassword}
              onDismiss={() => setInviteResult(null)}
            />
          )}
        </div>
      </div>

      {/* Reset result */}
      {resetResult && (
        <TempPasswordBox
          label={`Password reset for ${resetResult.email}`}
          tempPassword={resetResult.tempPassword}
          onDismiss={() => setResetResult(null)}
        />
      )}

      {actionError && (
        <p className="text-xs text-red-500 text-center">{actionError}</p>
      )}

      {/* User list */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Users <span className="ml-1 text-slate-400 dark:text-zinc-500 font-normal">({users.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">{u.email}</span>
                  {u.isAdmin && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400">
                      Admin
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400 dark:text-zinc-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetPassword(u)}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Reset password
                </button>
                <span className="text-slate-300 dark:text-zinc-600">·</span>
                <button
                  onClick={() => handleToggleAdmin(u)}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {u.isAdmin ? 'Remove admin' : 'Make admin'}
                </button>
                <span className="text-slate-300 dark:text-zinc-600">·</span>
                <button
                  onClick={() => handleDelete(u)}
                  className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TempPasswordBox({
  label,
  tempPassword,
  onDismiss,
}: {
  label: string
  tempPassword: string
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-green-700 dark:text-green-400">{label}</p>
        <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
          Dismiss
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800/50 rounded px-2 py-1 text-slate-800 dark:text-zinc-200 select-all">
          {tempPassword}
        </code>
        <button
          onClick={copy}
          className="shrink-0 text-xs px-2.5 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-green-600 dark:text-green-500">Share this temporary password. The user should change it after logging in.</p>
    </div>
  )
}
