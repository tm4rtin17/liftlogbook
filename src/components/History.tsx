import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Exercise, MuscleGroup, Workout } from '../types'
import { toDisplayWeight, workoutTotalVolume } from '../utils/analytics'
import { MuscleGroupBadge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { WorkoutLogger } from './WorkoutLogger'
import { WorkoutHeatmap } from './WorkoutHeatmap'

interface Props {
  workouts: Workout[]
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
  bodyweightLbs?: number
  onDelete: (id: string) => Promise<void>
  onUpdate: (workout: Workout) => Promise<void>
  onAddCustomExercise: (name: string, muscleGroup: MuscleGroup) => Promise<Exercise>
}

export function History({
  workouts,
  exercises,
  weightUnit,
  bodyweightLbs,
  onDelete,
  onUpdate,
  onAddCustomExercise,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const sorted = [...workouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-slate-400">
        <span className="text-5xl">📋</span>
        <p className="text-base font-medium">No workouts logged yet</p>
        <p className="text-sm">Head to the Log tab to record your first session</p>
      </div>
    )
  }

  const byMonth = new Map<string, Workout[]>()
  for (const w of sorted) {
    const key = format(parseISO(w.date), 'MMMM yyyy')
    const arr = byMonth.get(key) ?? []
    arr.push(w)
    byMonth.set(key, arr)
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkoutHeatmap workouts={workouts} weightUnit={weightUnit} />

      {Array.from(byMonth.entries()).map(([month, mWorkouts]) => (
        <div key={month}>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            {month}
          </h2>
          <div className="flex flex-col gap-2">
            {mWorkouts.map((workout) => {
              const isExpanded = expandedId === workout.id
              const volume = workoutTotalVolume(workout, bodyweightLbs ?? 0)
              const muscleGroups = [
                ...new Set(
                  workout.exercises
                    .map((we) => exerciseMap.get(we.exerciseId)?.muscleGroup)
                    .filter(Boolean)
                ),
              ] as MuscleGroup[]

              return (
                <div
                  key={workout.id}
                  className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900"
                >
                  <button
                    className="w-full flex items-start justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-zinc-100">{workout.name}</span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500 truncate">
                        {format(parseISO(workout.date), 'EEE, MMM d')}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {muscleGroups.map((mg) => (
                          <MuscleGroupBadge key={mg} muscleGroup={mg} />
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-brand-700 dark:text-brand-400">
                        {toDisplayWeight(volume, weightUnit).toLocaleString()}
                        <span className="text-xs font-normal text-slate-400 ml-1">{weightUnit}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                      </p>
                      <span className="text-slate-300 dark:text-zinc-600 text-sm mt-1 inline-block">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-zinc-800 px-4 pb-3 pt-3 bg-slate-50 dark:bg-zinc-800/40 flex flex-col gap-3">
                      {workout.notes && (
                        <p className="text-sm italic text-slate-500 dark:text-zinc-400 border-l-2 border-brand-400 pl-3">
                          {workout.notes}
                        </p>
                      )}
                      {workout.exercises.map((we) => {
                        const ex = exerciseMap.get(we.exerciseId)
                        if (!ex) return null
                        return (
                          <div key={we.id}>
                            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                              {ex.name}
                            </p>
                            <div className="grid grid-cols-3 gap-x-2 text-xs text-slate-400 dark:text-zinc-500 mb-1">
                              <span>Set</span>
                              <span>Weight</span>
                              <span>Reps</span>
                            </div>
                            {we.sets.map((s, idx) => (
                              <div key={s.id} className="grid grid-cols-3 gap-x-2 text-sm py-0.5">
                                <span className="text-slate-400 dark:text-zinc-500">{idx + 1}</span>
                                <span className="font-medium text-slate-800 dark:text-zinc-200">
                                  {s.isBodyweight
                                    ? s.weight > 0
                                      ? `BW + ${toDisplayWeight(s.weight, weightUnit)} ${weightUnit}`
                                      : 'BW'
                                    : `${toDisplayWeight(s.weight, weightUnit)} ${weightUnit}`}
                                </span>
                                <span className="font-medium text-slate-800 dark:text-zinc-200">{s.reps} reps</span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                      <div className="flex gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditingWorkout(workout)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(workout.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <Modal open={editingWorkout != null} onClose={() => setEditingWorkout(null)} title="Edit Workout">
        {editingWorkout && (
          <WorkoutLogger
            exercises={exercises}
            weightUnit={weightUnit}
            bodyweightLbs={bodyweightLbs}
            existingWorkout={editingWorkout}
            onAddCustomExercise={onAddCustomExercise}
            onSave={async (updated) => {
              await onUpdate({ ...editingWorkout, ...updated })
              setEditingWorkout(null)
            }}
          />
        )}
      </Modal>

      <Modal open={confirmDelete != null} onClose={() => setConfirmDelete(null)} title="Delete Workout?">
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-5">
          This will permanently remove this workout and all its data. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={async () => {
              if (confirmDelete) {
                await onDelete(confirmDelete)
                setExpandedId(null)
              }
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
