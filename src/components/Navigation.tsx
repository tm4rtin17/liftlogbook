import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Logo } from './Logo'

type Tab = 'log' | 'history' | 'analytics' | 'prs' | 'settings'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '🏋️' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'prs', label: 'Records', icon: '🏆' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export function Navigation({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-3 gap-1">
        <div className="px-3 mb-6">
          <Logo iconSize={32} />
        </div>

        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}

        {/* Bottom actions */}
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {user && (
            <div className="px-3 py-2 flex flex-col gap-1">
              <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{user.email}</p>
              <button
                onClick={logout}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 text-left transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex safe-bottom">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              activeTab === t.id
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
