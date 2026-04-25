import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { Exercise, MuscleGroup, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { effectiveSetWeight, toDisplayWeight, toStoredLbs } from '../utils/analytics'
import { MuscleGroupBadge } from './ui/Badge'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ExercisePicker } from './ExercisePicker'

interface Props {
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
  bodyweightLbs?: number
  onSave: (workout: Omit<Workout, 'id'>) => Promise<void>
  onAddCustomExercise: (name: string, muscleGroup: MuscleGroup) => Promise<Exercise>
  existingWorkout?: Workout
}

function emptySet(isBodyweight = false): WorkoutSet {
  return { id: uuidv4(), reps: 0, weight: 0, isBodyweight: isBodyweight || undefined }
}

function emptyWorkoutExercise(exercise: Exercise): WorkoutExercise {
  return { id: uuidv4(), exerciseId: exercise.id, sets: [emptySet(exercise.isBodyweight)] }
}

export function WorkoutLogger({
  exercises,
  weightUnit,
  bodyweightLbs,
  onSave,
  onAddCustomExercise,
  existingWorkout,
}: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [date, setDate] = useState(existingWorkout?.date ?? today)
  const [name, setName] = useState(existingWorkout?.name ?? '')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    existingWorkout?.exercises ?? []
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState(existingWorkout?.notes ?? '')

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  function addExercise(ex: Exercise) {
    setWorkoutExercises((prev) => [...prev, emptyWorkoutExercise(ex)])
  }

  function removeExercise(weId: string) {
    setWorkoutExercises((prev) => prev.filter((we) => we.id !== weId))
  }

  function addSet(weId: string) {
    setWorkoutExercises((prev) =>
      prev.map((we) => {
        if (we.id !== weId) return we
        const lastSet = we.sets[we.sets.length - 1]
        const ex = exerciseMap.get(we.exerciseId)
        const newSet: WorkoutSet = lastSet
          ? { id: uuidv4(), reps: lastSet.reps, weight: lastSet.weight, isBodyweight: lastSet.isBodyweight }
          : emptySet(ex?.isBodyweight)
        return { ...we, sets: [...we.sets, newSet] }
      })
    )
  }

  function removeSet(weId: string, setId: string) {
    setWorkoutExercises((prev) =>
      prev.map((we) => {
        if (we.id !== weId) return we
        return { ...we, sets: we.sets.filter((s) => s.id !== setId) }
      })
    )
  }

  const updateSet = useCallback(
    (weId: string, setId: string, field: 'reps' | 'weight', rawValue: string) => {
      const num = parseFloat(rawValue)
      const value = isNaN(num) ? 0 : num
      const stored = field === 'weight' ? toStoredLbs(value, weightUnit) : value
      setWorkoutExercises((prev) =>
        prev.map((we) => {
          if (we.id !== weId) return we
          return {
            ...we,
            sets: we.sets.map((s) =>
              s.id === setId ? { ...s, [field]: stored } : s
            ),
          }
        })
      )
    },
    [weightUnit]
  )

  async function handleSave() {
    const validExercises = workoutExercises
      .map((we) => ({ ...we, sets: we.sets.filter((s) => s.reps > 0) }))
      .filter((we) => we.sets.length > 0)

    setSaving(true)
    try {
      await onSave({
        date,
        name: name.trim() || format(new Date(date + 'T12:00:00'), 'EEEE, MMM d'),
        exercises: validExercises,
        notes: notes.trim() || undefined,
      })
      setSaved(true)
      if (!existingWorkout) {
        setWorkoutExercises([])
        setName('')
        setNotes('')
        setDate(today)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const totalSets = workoutExercises.reduce((s, we) => s + we.sets.length, 0)
  const totalVolume = workoutExercises
    .flatMap((we) => we.sets)
    .reduce((s, st) => s + effectiveSetWeight(st, bodyweightLbs ?? 0) * st.reps, 0)

  const hasBWExercise = workoutExercises.some((we) =>
    we.sets.some((s) => s.isBodyweight)
  )
  const bwNotSet = hasBWExercise && !bodyweightLbs

  return (
    <div className="flex flex-col gap-4">
      {/* Header fields */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <div className="flex-1">
          <Input
            label="Workout Name"
            placeholder="e.g. Push Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-full md:w-40 overflow-hidden">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="appearance-none md:text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
          Notes
        </label>
        <textarea
          rows={2}
          placeholder="How did it feel? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 px-3 py-2 text-base bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none resize-none"
        />
      </div>

      {/* Bodyweight notice */}
      {bwNotSet && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Set your bodyweight in Settings to include it in volume calculations for bodyweight exercises.
        </div>
      )}

      {/* Exercises */}
      {workoutExercises.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 py-12 flex flex-col items-center gap-3 text-slate-400">
          <span className="text-3xl">🏋️</span>
          <p className="md:text-sm">No exercises yet</p>
          <Button onClick={() => setPickerOpen(true)}>Add Exercise</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workoutExercises.map((we) => {
            const ex = exerciseMap.get(we.exerciseId)
            if (!ex) return null
            return (
              <ExerciseBlock
                key={we.id}
                we={we}
                exercise={ex}
                weightUnit={weightUnit}
                bodyweightLbs={bodyweightLbs}
                onAddSet={() => addSet(we.id)}
                onRemoveSet={(sid) => removeSet(we.id, sid)}
                onUpdateSet={(sid, field, val) => updateSet(we.id, sid, field, val)}
                onRemove={() => removeExercise(we.id)}
              />
            )
          })}
        </div>
      )}

      {workoutExercises.length > 0 && (
        <Button variant="secondary" onClick={() => setPickerOpen(true)} fullWidth>
          + Add Exercise
        </Button>
      )}

      {workoutExercises.length > 0 && (
        <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-0.5">
            <p>{workoutExercises.length} exercise{workoutExercises.length !== 1 ? 's' : ''} &middot; {totalSets} sets</p>
            <p className="font-medium text-slate-700 dark:text-zinc-300">
              Total volume: {toDisplayWeight(totalVolume, weightUnit).toLocaleString()} {weightUnit}
              {bwNotSet && <span className="text-amber-500 ml-1">(BW not included)</span>}
            </p>
          </div>
          <Button onClick={handleSave} size="lg" disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : existingWorkout ? 'Update Workout' : 'Save Workout'}
          </Button>
        </div>
      )}

      <ExercisePicker
        exercises={exercises}
        onSelect={addExercise}
        onAddCustom={onAddCustomExercise}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}

interface ExerciseBlockProps {
  we: WorkoutExercise
  exercise: Exercise
  weightUnit: 'lbs' | 'kg'
  bodyweightLbs?: number
  onAddSet: () => void
  onRemoveSet: (id: string) => void
  onUpdateSet: (setId: string, field: 'reps' | 'weight', value: string) => void
  onRemove: () => void
}

function ExerciseBlock({
  we,
  exercise,
  weightUnit,
  bodyweightLbs,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemove,
}: ExerciseBlockProps) {
  const isBW = exercise.isBodyweight
  const blockVolume = we.sets.reduce(
    (s, st) => s + effectiveSetWeight(st, bodyweightLbs ?? 0) * st.reps,
    0
  )

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-800 dark:text-zinc-100 truncate">{exercise.name}</span>
          <MuscleGroupBadge muscleGroup={exercise.muscleGroup} />
          {isBW && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
              BW
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
          aria-label="Remove exercise"
        >
          ✕
        </button>
      </div>

      <div className="px-4 pt-3 pb-2 bg-white dark:bg-zinc-900">
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-x-3 gap-y-2 items-center">
          <span className="text-xs font-medium text-slate-400 text-center">#</span>
          <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
            {isBW ? `Added Wt (${weightUnit})` : `Weight (${weightUnit})`}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Reps</span>
          <span />

          {we.sets.map((set, idx) => (
            <SetRow
              key={set.id}
              index={idx + 1}
              set={set}
              weightUnit={weightUnit}
              bodyweightLbs={bodyweightLbs}
              isBodyweightExercise={isBW}
              onUpdate={(field, val) => onUpdateSet(set.id, field, val)}
              onRemove={() => onRemoveSet(set.id)}
              canRemove={we.sets.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3 bg-white dark:bg-zinc-900">
        <button
          onClick={onAddSet}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
        >
          + Add set
        </button>
        {blockVolume > 0 && (
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {toDisplayWeight(blockVolume, weightUnit).toLocaleString()} {weightUnit}
            {isBW && !bodyweightLbs && blockVolume > 0 && (
              <span className="ml-1 text-amber-500">(+BW)</span>
            )}
          </span>
        )}
        {isBW && bodyweightLbs && blockVolume === 0 && (
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            BW only
          </span>
        )}
      </div>
    </div>
  )
}

interface SetRowProps {
  index: number
  set: WorkoutSet
  weightUnit: 'lbs' | 'kg'
  bodyweightLbs?: number
  isBodyweightExercise?: boolean
  onUpdate: (field: 'reps' | 'weight', value: string) => void
  onRemove: () => void
  canRemove: boolean
}

function SetRow({ index, set, weightUnit, bodyweightLbs, isBodyweightExercise, onUpdate, onRemove, canRemove }: SetRowProps) {
  const displayWeight = set.weight > 0 ? toDisplayWeight(set.weight, weightUnit) : ''

  // Show a "BW + X" hint when bodyweight is known and additional weight is logged
  const bwHint =
    isBodyweightExercise && bodyweightLbs && set.weight > 0
      ? `= ${toDisplayWeight(bodyweightLbs + set.weight, weightUnit)} ${weightUnit} total`
      : null

  return (
    <>
      <span className="text-xs text-slate-400 text-center font-mono">{index}</span>
      <div className="flex flex-col gap-0.5">
        <input
          type="number"
          min="0"
          step={weightUnit === 'kg' ? '0.5' : '5'}
          defaultValue={displayWeight || ''}
          placeholder={isBodyweightExercise ? '+0' : '0'}
          onBlur={(e) => onUpdate('weight', e.target.value)}
          onChange={(e) => onUpdate('weight', e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 px-2 py-1.5 text-base text-center
            bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100
            focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none"
        />
        {bwHint && (
          <span className="text-[10px] text-center text-violet-500 dark:text-violet-400 leading-tight">
            {bwHint}
          </span>
        )}
      </div>
      <input
        type="number"
        min="0"
        step="1"
        defaultValue={set.reps > 0 ? set.reps : ''}
        placeholder="0"
        onBlur={(e) => onUpdate('reps', e.target.value)}
        onChange={(e) => onUpdate('reps', e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 px-2 py-1.5 text-base text-center
          bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100
          focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none"
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="text-slate-300 dark:text-zinc-600 hover:text-red-400 disabled:opacity-0 transition-colors text-xs"
        aria-label="Remove set"
      >
        ✕
      </button>
    </>
  )
}
