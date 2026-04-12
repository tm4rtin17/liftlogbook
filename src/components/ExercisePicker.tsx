import { useState, useMemo } from 'react'
import { Exercise, MuscleGroup } from '../types'
import { MUSCLE_GROUPS } from '../data/exercises'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

interface Props {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onAddCustom: (name: string, muscleGroup: MuscleGroup) => Promise<Exercise>
  open: boolean
  onClose: () => void
}

export function ExercisePicker({ exercises, onSelect, onAddCustom, open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [filterGroup, setFilterGroup] = useState<MuscleGroup | 'All'>('All')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Chest')

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase())
      const matchesGroup = filterGroup === 'All' || e.muscleGroup === filterGroup
      return matchesQuery && matchesGroup
    })
  }, [exercises, query, filterGroup])

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>()
    for (const ex of filtered) {
      const arr = map.get(ex.muscleGroup) ?? []
      arr.push(ex)
      map.set(ex.muscleGroup, arr)
    }
    return map
  }, [filtered])

  async function handleCreateNew() {
    if (!newName.trim()) return
    const ex = await onAddCustom(newName.trim(), newGroup)
    onSelect(ex)
    setNewName('')
    setShowNew(false)
    onClose()
  }

  function handleSelect(ex: Exercise) {
    onSelect(ex)
    setQuery('')
    setFilterGroup('All')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Select Exercise">
      <div className="space-y-3">
        <Input
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {/* Muscle group filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(['All', ...MUSCLE_GROUPS] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filterGroup === g
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-800 -mx-5">
          {Array.from(grouped.entries()).map(([group, exs]) => (
            <div key={group}>
              <p className="px-5 py-2 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-slate-50 dark:bg-zinc-800/50">
                {group}
              </p>
              {exs.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-brand-50 dark:hover:bg-brand-950/30 active:bg-brand-100 dark:active:bg-brand-950/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{ex.name}</span>
                  {ex.custom && (
                    <span className="text-xs text-slate-400 italic">custom</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-slate-400">No exercises found</p>
          )}
        </div>

        {/* Create new */}
        {!showNew ? (
          <Button variant="secondary" fullWidth onClick={() => setShowNew(true)}>
            + Create custom exercise
          </Button>
        ) : (
          <div className="border border-slate-200 dark:border-zinc-700 rounded-xl p-4 space-y-3 bg-slate-50 dark:bg-zinc-800/50">
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">New Exercise</p>
            <Input
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Spider Curl"
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
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateNew} className="flex-1" disabled={!newName.trim()}>
                Create & Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
