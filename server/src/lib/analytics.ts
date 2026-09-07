// Server-side subset of src/utils/analytics.ts (frontend), ported without
// date-fns so the server doesn't need the dependency. Keep logic in sync
// with the frontend version if PR/volume math changes.
import { Exercise, MuscleGroup, Workout, WorkoutSet } from './types'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function effectiveSetWeight(set: WorkoutSet, userBodyweightLbs = 0): number {
  if (set.isBodyweight) return userBodyweightLbs + set.weight
  return set.weight
}

export function setVolume(weight: number, reps: number): number {
  return weight * reps
}

export function currentStreak(workouts: Workout[]): number {
  const dateSet = new Set(workouts.map((w) => w.date))
  let streak = 0
  const current = new Date()
  current.setHours(0, 0, 0, 0)
  while (dateSet.has(isoDate(current))) {
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

export function longestStreak(workouts: Workout[]): number {
  const dates = [...new Set(workouts.map((w) => w.date))].sort()
  if (dates.length === 0) return 0
  let max = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
    if (diff === 1) {
      run++
      if (run > max) max = run
    } else {
      run = 1
    }
  }
  return max
}

export function avgWorkoutsPerWeek(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  const diffDays =
    (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) /
    86400000
  const weeks = Math.max(1, Math.floor(diffDays / 7) + 1)
  return Math.round((workouts.length / weeks) * 10) / 10
}

export interface PersonalRecord {
  exerciseId: string
  isBodyweight: boolean
  heaviestWeight: number
  heaviestWeightDate: string
  heaviestWeightReps: number
  mostReps: number
  mostRepsDate: string
  mostRepsWeight: number
  best1RM: number
  best1RMDate: string
  bestVolume: number
  bestVolumeDate: string
}

export function calculatePersonalRecords(
  workouts: Workout[],
  userBodyweightLbs = 0
): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>()
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

  for (const workout of sorted) {
    const sessionVolume = new Map<string, number>()
    for (const we of workout.exercises) {
      const vol = we.sets.reduce(
        (s, st) => s + setVolume(effectiveSetWeight(st, userBodyweightLbs), st.reps),
        0
      )
      sessionVolume.set(we.exerciseId, (sessionVolume.get(we.exerciseId) ?? 0) + vol)
    }

    for (const we of workout.exercises) {
      const isBW = we.sets.some((s) => s.isBodyweight)
      const existing = map.get(we.exerciseId)
      const pr: PersonalRecord = existing ?? {
        exerciseId: we.exerciseId,
        isBodyweight: isBW,
        heaviestWeight: 0,
        heaviestWeightDate: workout.date,
        heaviestWeightReps: 0,
        mostReps: 0,
        mostRepsDate: workout.date,
        mostRepsWeight: 0,
        best1RM: 0,
        best1RMDate: workout.date,
        bestVolume: 0,
        bestVolumeDate: workout.date,
      }
      if (isBW) pr.isBodyweight = true

      for (const s of we.sets) {
        const trackWeight = s.weight
        if (
          trackWeight > pr.heaviestWeight ||
          (trackWeight === pr.heaviestWeight && s.reps > pr.heaviestWeightReps)
        ) {
          pr.heaviestWeight = trackWeight
          pr.heaviestWeightReps = s.reps
          pr.heaviestWeightDate = workout.date
        }

        const effectiveW = effectiveSetWeight(s, userBodyweightLbs)
        if (s.reps > pr.mostReps || (s.reps === pr.mostReps && effectiveW > pr.mostRepsWeight)) {
          pr.mostReps = s.reps
          pr.mostRepsWeight = effectiveW
          pr.mostRepsDate = workout.date
        }

        const estimated1RM = effectiveW * (1 + s.reps / 30)
        if (estimated1RM > pr.best1RM) {
          pr.best1RM = estimated1RM
          pr.best1RMDate = workout.date
        }
      }

      const vol = sessionVolume.get(we.exerciseId) ?? 0
      if (vol > pr.bestVolume) {
        pr.bestVolume = vol
        pr.bestVolumeDate = workout.date
      }

      map.set(we.exerciseId, pr)
    }
  }

  return Array.from(map.values())
}

export function totalVolumeByExercise(
  workouts: Workout[],
  exercises: Exercise[],
  userBodyweightLbs = 0
): { exerciseName: string; muscleGroup: MuscleGroup; volume: number }[] {
  const map = new Map<string, number>()
  for (const workout of workouts) {
    for (const we of workout.exercises) {
      const vol = we.sets.reduce(
        (s, st) => s + setVolume(effectiveSetWeight(st, userBodyweightLbs), st.reps),
        0
      )
      map.set(we.exerciseId, (map.get(we.exerciseId) ?? 0) + vol)
    }
  }
  return Array.from(map.entries())
    .map(([id, volume]) => {
      const ex = exercises.find((e) => e.id === id)
      return {
        exerciseName: ex?.name ?? 'Unknown',
        muscleGroup: ex?.muscleGroup ?? 'Full Body',
        volume: Math.round(volume),
      }
    })
    .sort((a, b) => b.volume - a.volume)
}

export function totalVolumeByMuscleGroup(
  workouts: Workout[],
  exercises: Exercise[],
  userBodyweightLbs = 0
): { muscleGroup: MuscleGroup; volume: number }[] {
  const map = new Map<MuscleGroup, number>()
  for (const workout of workouts) {
    for (const we of workout.exercises) {
      const ex = exercises.find((e) => e.id === we.exerciseId)
      if (!ex) continue
      const vol = we.sets.reduce(
        (s, st) => s + setVolume(effectiveSetWeight(st, userBodyweightLbs), st.reps),
        0
      )
      map.set(ex.muscleGroup, (map.get(ex.muscleGroup) ?? 0) + vol)
    }
  }
  return Array.from(map.entries())
    .map(([muscleGroup, volume]) => ({ muscleGroup, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
}
