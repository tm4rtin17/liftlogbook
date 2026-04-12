import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Mode = 'login' | 'register'

export function AuthScreen() {
  const { login, register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 rounded-lg"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏋️</div>
          <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">LiftLogbook</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Track your progress</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-slate-200 dark:border-zinc-700 p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  mode === m
                    ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            )}

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={submitting}>
              {submitting
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-6">
          Your data is stored on your home server.
        </p>
      </div>
    </div>
  )
}
