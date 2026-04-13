import { useRef, useState } from 'react'
import { AppSettings, AccentColor, Exercise, MuscleGroup, Workout } from '../types'
import { MUSCLE_GROUPS } from '../data/exercises'
import { THEME_OPTIONS, applyAccentColor } from '../data/themes'
import { MuscleGroupBadge } from './ui/Badge'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

interface ImportResult {
  workoutsImported: number
  exercisesImported: number
}

interface Props {
  settings: AppSettings
  exercises: Exercise[]
  workouts: Workout[]
  onUpdateSettings: (s: AppSettings) => Promise<void>
  onAddCustomExercise: (name: string, group: MuscleGroup) => Promise<Exercise>
  onDeleteCustomExercise: (id: string) => Promise<void>
  onImportBackup: (backup: unknown) => Promise<ImportResult>
}

function triggerDownload(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function Settings({
  settings,
  exercises,
  workouts,
  onUpdateSettings,
  onAddCustomExercise,
  onDeleteCustomExercise,
  onImportBackup,
}: Props) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Chest')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pendingColor, setPendingColor] = useState<AccentColor>(settings.accentColor ?? 'sky')
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExportJSON() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      workouts,
      customExercises: exercises.filter((e) => e.custom),
      settings,
    }
    const dateStr = new Date().toISOString().slice(0, 10)
    triggerDownload(
      JSON.stringify(backup, null, 2),
      `liftlogbook-backup-${dateStr}.json`,
      'application/json'
    )
  }

  function handleExportCSV() {
    const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]))
    const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`
    const lines: string[] = ['date,workout_name,exercise_name,set_number,reps,weight_lbs,notes']
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

    for (const workout of sorted) {
      for (const ex of workout.exercises) {
        const exerciseName = exerciseMap.get(ex.exerciseId) ?? ex.exerciseId
        for (let i = 0; i < ex.sets.length; i++) {
          const set = ex.sets[i]
          lines.push(
            [
              workout.date,
              csvEscape(workout.name),
              csvEscape(exerciseName),
              i + 1,
              set.reps,
              set.weight,
              workout.notes ? csvEscape(workout.notes) : '',
            ].join(',')
          )
        }
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    triggerDownload(lines.join('\n'), `liftlogbook-${dateStr}.csv`, 'text/csv')
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset the input so the same file can be re-selected if needed
    e.target.value = ''

    setImportStatus('loading')
    setImportMessage('')

    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      const result = await onImportBackup(backup)
      setImportStatus('success')
      setImportMessage(
        `Imported ${result.workoutsImported} workout${result.workoutsImported !== 1 ? 's' : ''} and ${result.exercisesImported} exercise${result.exercisesImported !== 1 ? 's' : ''}.`
      )
    } catch (err) {
      setImportStatus('error')
      setImportMessage(err instanceof Error ? err.message : 'Import failed. Check the file format.')
    }
  }

  function handleApplyColor() {
    applyAccentColor(pendingColor)
    onUpdateSettings({ ...settings, accentColor: pendingColor })
  }

  const customExercises = exercises.filter((e) => e.custom)

  async function handleCreate() {
    if (!newName.trim()) return
    await onAddCustomExercise(newName.trim(), newGroup)
    setNewName('')
    setShowNew(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Account</h2>
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">{user?.email}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Signed in</p>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Appearance</h2>
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Saved to this browser
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              theme === 'dark' ? 'bg-brand-600' : 'bg-slate-200'
            }`}
            role="switch"
            aria-checked={theme === 'dark'}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Accent color */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Accent Color</h2>
        </div>
        <div className="px-4 pt-4 pb-2 flex flex-wrap gap-3">
          {THEME_OPTIONS.map((t) => {
            const selected = pendingColor === t.id
            return (
              <button
                key={t.id}
                onClick={() => setPendingColor(t.id)}
                title={t.label}
                className="flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: t.swatch,
                    outline: selected ? `3px solid ${t.swatch}` : '3px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {selected && (
                    <span className="text-white text-sm font-bold leading-none">✓</span>
                  )}
                </span>
                <span className={`text-xs font-medium ${selected ? 'text-slate-800 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <Button
            size="sm"
            onClick={handleApplyColor}
            disabled={pendingColor === (settings.accentColor ?? 'sky')}
          >
            Apply
          </Button>
        </div>
      </section>

      {/* Units */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Weight Unit</h2>
        </div>
        <div className="px-4 py-4 flex gap-3">
          {(['lbs', 'kg'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => onUpdateSettings({ ...settings, weightUnit: unit })}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                settings.weightUnit === unit
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              {unit.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="px-4 pb-4 text-xs text-slate-400 dark:text-zinc-500">
          Weights are stored internally in lbs. Switching units converts the display.
        </p>
      </section>

      {/* Custom exercises */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Custom Exercises</h2>
          <Button size="sm" onClick={() => setShowNew(true)}>
            + Add
          </Button>
        </div>

        {customExercises.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-500 text-center">
            No custom exercises yet
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {customExercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{ex.name}</span>
                  <MuscleGroupBadge muscleGroup={ex.muscleGroup} />
                </div>
                <button
                  onClick={() => setConfirmDelete(ex.id)}
                  className="text-slate-300 dark:text-zinc-600 hover:text-red-500 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Data & Storage</h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-5">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            All data is stored on your home server in a local SQLite database. Nothing is sent to
            third-party services.
          </p>

          {/* Export */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-0.5">Export</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">
              Download a backup of your workouts and custom exercises.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleExportJSON} disabled={workouts.length === 0}>
                Export JSON
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExportCSV}
                disabled={workouts.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Import */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-0.5">Import</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">
              Restore from a previously exported JSON backup. Existing records are kept; only new
              entries are added.
            </p>
            <Button
              size="sm"
              variant="ghost"
              disabled={importStatus === 'loading'}
              onClick={() => fileInputRef.current?.click()}
            >
              {importStatus === 'loading' ? 'Importing…' : 'Import from backup'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            {importStatus === 'success' && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{importMessage}</p>
            )}
            {importStatus === 'error' && (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400">{importMessage}</p>
            )}
          </div>
        </div>
      </section>

      {/* New exercise modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Custom Exercise">
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Spider Curl"
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
              Muscle Group
            </label>
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <Button fullWidth onClick={handleCreate} disabled={!newName.trim()}>
            Create Exercise
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={confirmDelete != null} onClose={() => setConfirmDelete(null)} title="Delete Exercise?">
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-5">
          This will remove the custom exercise from your library. Past workouts that used it will still show the name.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={async () => {
              if (confirmDelete) await onDeleteCustomExercise(confirmDelete)
              setConfirmDelete(null)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
