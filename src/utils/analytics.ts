import { startOfWeek, format, parseISO, isWithinInterval, subWeeks } from 'date-fns'
import { Exercise, MuscleGroup, Workout } from '../types'

const KG_TO_LBS = 2.20462

export function toDisplayWeight(lbs: number, unit: 'lbs' | 'kg'): number {
  if (unit === 'kg') return Math.round((lbs / KG_TO_LBS) * 10) / 10
  return lbs
}

export function toStoredLbs(value: number, unit: 'lbs' | 'kg'): number {
  if (unit === 'kg') return Math.round(value * KG_TO_LBS * 10) / 10
  return value
}

/** Volume for a single set = weight (lbs) × reps */
export function setVolume(weight: number, reps: number): number {
  return weight * reps
}

/** Total volume across all sets in a workout for a given exercise */
export function exerciseVolume(
  workout: Workout,
  exerciseId: string
): number {
  return workout.exercises
    .filter((we) => we.exerciseId === exerciseId)
    .flatMap((we) => we.sets)
    .reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0)
}

/** Total volume across the entire workout */
export function workoutTotalVolume(workout: Workout): number {
  return workout.exercises
    .flatMap((we) => we.sets)
    .reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0)
}

export interface WeeklyVolume {
  weekLabel: string   // "Apr 7"
  weekStart: string   // ISO date of Monday
  volume: number
}

/**
 * Aggregate weekly volume for a specific exercise over the past N weeks.
 */
export function weeklyVolumeForExercise(
  workouts: Workout[],
  exerciseId: string,
  weeks = 12
): WeeklyVolume[] {
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    exerciseVolume(workout, exerciseId)
  )
}

/**
 * Aggregate weekly volume across all muscle groups over the past N weeks.
 */
export function weeklyVolumeForAllMuscleGroups(
  workouts: Workout[],
  weeks = 12
): WeeklyVolume[] {
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    workout.exercises
      .flatMap((we) => we.sets)
      .reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0)
  )
}

/**
 * Aggregate weekly volume for a muscle group over the past N weeks.
 */
export function weeklyVolumeForMuscleGroup(
  workouts: Workout[],
  muscleGroup: MuscleGroup,
  exercises: Exercise[],
  weeks = 12
): WeeklyVolume[] {
  const groupExerciseIds = new Set(
    exercises.filter((e) => e.muscleGroup === muscleGroup).map((e) => e.id)
  )
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    workout.exercises
      .filter((we) => groupExerciseIds.has(we.exerciseId))
      .flatMap((we) => we.sets)
      .reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0)
  )
}

function buildWeeklyBuckets(
  workouts: Workout[],
  weeks: number,
  volumeFn: (w: Workout) => number
): WeeklyVolume[] {
  const now = new Date()
  const buckets: WeeklyVolume[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }) // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const volume = workouts
      .filter((w) => {
        const d = parseISO(w.date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      })
      .reduce((sum, w) => sum + volumeFn(w), 0)

    buckets.push({
      weekLabel: format(weekStart, 'MMM d'),
      weekStart: weekStart.toISOString(),
      volume: Math.round(volume),
    })
  }

  return buckets
}

export interface PersonalRecord {
  exerciseId: string
  /** Heaviest single set weight (lbs) */
  heaviestWeight: number
  heaviestWeightDate: string
  heaviestWeightReps: number
  /** Set with the most reps (at any weight) */
  mostReps: number
  mostRepsDate: string
  mostRepsWeight: number
  /** Best estimated 1-rep max using Epley formula: weight × (1 + reps / 30) */
  best1RM: number
  best1RMDate: string
  /** Best single-session total volume for this exercise */
  bestVolume: number
  bestVolumeDate: string
}

/**
 * Calculate all-time personal records for every exercise that appears in the
 * provided workouts.  All weight values are stored / returned in lbs.
 */
export function calculatePersonalRecords(workouts: Workout[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>()

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

  for (const workout of sorted) {
    // Aggregate per-exercise volume for this single session
    const sessionVolume = new Map<string, number>()
    for (const we of workout.exercises) {
      const vol = we.sets.reduce((s, st) => s + setVolume(st.weight, st.reps), 0)
      sessionVolume.set(we.exerciseId, (sessionVolume.get(we.exerciseId) ?? 0) + vol)
    }

    for (const we of workout.exercises) {
      const existing = map.get(we.exerciseId)
      const pr: PersonalRecord = existing ?? {
        exerciseId: we.exerciseId,
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

      for (const s of we.sets) {
        // Heaviest weight (tie-break: more reps)
        if (
          s.weight > pr.heaviestWeight ||
          (s.weight === pr.heaviestWeight && s.reps > pr.heaviestWeightReps)
        ) {
          pr.heaviestWeight = s.weight
          pr.heaviestWeightReps = s.reps
          pr.heaviestWeightDate = workout.date
        }

        // Most reps (tie-break: more weight)
        if (
          s.reps > pr.mostReps ||
          (s.reps === pr.mostReps && s.weight > pr.mostRepsWeight)
        ) {
          pr.mostReps = s.reps
          pr.mostRepsWeight = s.weight
          pr.mostRepsDate = workout.date
        }

        // Best estimated 1RM (Epley: weight × (1 + reps / 30))
        const estimated1RM = s.weight * (1 + s.reps / 30)
        if (estimated1RM > pr.best1RM) {
          pr.best1RM = estimated1RM
          pr.best1RMDate = workout.date
        }
      }

      // Best single-session volume
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

/**
 * Per-exercise breakdown of total volume over all time (or filtered).
 */
export function totalVolumeByExercise(
  workouts: Workout[],
  exercises: Exercise[]
): { exerciseName: string; muscleGroup: MuscleGroup; volume: number }[] {
  const map = new Map<string, number>()
  for (const workout of workouts) {
    for (const we of workout.exercises) {
      const vol = we.sets.reduce((s, st) => s + setVolume(st.weight, st.reps), 0)
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

/**
 * Muscle group breakdown of total volume.
 */
export function totalVolumeByMuscleGroup(
  workouts: Workout[],
  exercises: Exercise[]
): { muscleGroup: MuscleGroup; volume: number }[] {
  const map = new Map<MuscleGroup, number>()
  for (const workout of workouts) {
    for (const we of workout.exercises) {
      const ex = exercises.find((e) => e.id === we.exerciseId)
      if (!ex) continue
      const vol = we.sets.reduce((s, st) => s + setVolume(st.weight, st.reps), 0)
      map.set(ex.muscleGroup, (map.get(ex.muscleGroup) ?? 0) + vol)
    }
  }
  return Array.from(map.entries())
    .map(([muscleGroup, volume]) => ({ muscleGroup, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
}
