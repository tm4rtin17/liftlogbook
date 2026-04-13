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
