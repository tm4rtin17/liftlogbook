import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Exercise, MuscleGroup, Workout } from '../types'
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUPS } from '../data/exercises'
import { calculatePersonalRecords, toDisplayWeight } from '../utils/analytics'
import { MuscleGroupBadge } from './ui/Badge'

interface Props {
  workouts: Workout[]
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
  bodyweightLbs?: number
}

function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}

export function PersonalRecords({ workouts, exercises, weightUnit, bodyweightLbs }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'All'>('All')

  const prs = useMemo(
    () => calculatePersonalRecords(workouts, bodyweightLbs ?? 0),
    [workouts, bodyweightLbs]
  )

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  )

  // Only include exercises that are logged and known
  const prItems = useMemo(
    () =>
      prs
        .map((pr) => ({ pr, exercise: exerciseMap.get(pr.exerciseId) }))
        .filter((item): item is { pr: typeof prs[0]; exercise: Exercise } =>
          item.exercise !== undefined
        )
        .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name)),
    [prs, exerciseMap]
  )

  const filteredItems = useMemo(
    () =>
      selectedGroup === 'All'
        ? prItems
        : prItems.filter((item) => item.exercise.muscleGroup === selectedGroup),
    [prItems, selectedGroup]
  )

  // Only show muscle groups that have at least one logged exercise
  const activeGroups = useMemo(() => {
    const groups = new Set(prItems.map((item) => item.exercise.muscleGroup))
    return MUSCLE_GROUPS.filter((g) => groups.has(g))
  }, [prItems])

  if (workouts.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
        <div className="text-5xl mb-3">🏆</div>
        <p className="font-medium">No records yet</p>
        <p className="text-sm mt-1">Log some workouts to see your personal records here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Muscle group filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          active={selectedGroup === 'All'}
          onClick={() => setSelectedGroup('All')}
        />
        {activeGroups.map((g) => (
          <FilterChip
            key={g}
            label={g}
            active={selectedGroup === g}
            color={MUSCLE_GROUP_COLORS[g]}
            onClick={() => setSelectedGroup(g)}
          />
        ))}
      </div>

      {/* PR cards */}
      {filteredItems.length === 0 ? (
        <p className="text-center py-10 text-slate-400 dark:text-zinc-500 text-sm">
          No records for this muscle group yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map(({ pr, exercise }) => (
            <PRCard
              key={pr.exerciseId}
              pr={pr}
              exercise={exercise}
              weightUnit={weightUnit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="px-3 py-1 rounded-full text-xs font-medium bg-brand-600 dark:bg-brand-500 text-white transition-colors"
        style={color ? { backgroundColor: color, border: 'none' } : undefined}
      >
        {label}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
    >
      {label}
    </button>
  )
}

function PRCard({
  pr,
  exercise,
  weightUnit,
}: {
  pr: ReturnType<typeof calculatePersonalRecords>[0]
  exercise: Exercise
  weightUnit: 'lbs' | 'kg'
}) {
  const w = (lbs: number) => toDisplayWeight(lbs, weightUnit)
  const isBW = pr.isBodyweight

  const heaviestLabel = isBW ? 'Max Added Weight' : 'Heaviest Weight'
  const heaviestSub = isBW
    ? pr.heaviestWeight > 0
      ? `+ ${w(pr.heaviestWeight)} ${weightUnit} added`
      : 'bodyweight only'
    : `× ${pr.heaviestWeightReps} reps`

  const mostRepsSub = isBW
    ? pr.mostRepsWeight > 0
      ? `@ BW + ${w(pr.mostRepsWeight)} ${weightUnit}`
      : '@ bodyweight'
    : `@ ${w(pr.mostRepsWeight)} ${weightUnit}`

  const oneRMSub = isBW ? 'Epley · incl. BW if set' : 'Epley formula'

  const stats: { icon: string; label: string; value: string; sub: string; date: string }[] = [
    {
      icon: '🏋️',
      label: heaviestLabel,
      value: isBW
        ? pr.heaviestWeight > 0
          ? `+${w(pr.heaviestWeight)} ${weightUnit}`
          : 'BW'
        : `${w(pr.heaviestWeight)} ${weightUnit}`,
      sub: heaviestSub,
      date: formatDate(pr.heaviestWeightDate),
    },
    {
      icon: '🔁',
      label: 'Most Reps',
      value: `${pr.mostReps} reps`,
      sub: mostRepsSub,
      date: formatDate(pr.mostRepsDate),
    },
    {
      icon: '⚡',
      label: 'Est. 1-Rep Max',
      value: pr.best1RM > 0 ? `${Math.round(w(pr.best1RM))} ${weightUnit}` : '—',
      sub: oneRMSub,
      date: formatDate(pr.best1RMDate),
    },
    {
      icon: '📦',
      label: 'Best Session Volume',
      value: pr.bestVolume > 0
        ? `${Math.round(w(pr.bestVolume)).toLocaleString()} ${weightUnit}`
        : '—',
      sub: isBW ? 'incl. BW if set' : 'total weight moved',
      date: formatDate(pr.bestVolumeDate),
    },
  ]

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-zinc-100">{exercise.name}</span>
          {isBW && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
              BW
            </span>
          )}
        </div>
        <MuscleGroupBadge muscleGroup={exercise.muscleGroup} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-zinc-800">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 px-4 py-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{stat.label}</span>
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{stat.sub}</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-600 mt-1">{stat.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
