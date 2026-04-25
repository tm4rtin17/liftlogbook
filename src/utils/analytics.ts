import { startOfWeek, format, parseISO, isWithinInterval, subWeeks, addDays } from 'date-fns'
import { Exercise, MuscleGroup, Workout, WorkoutSet } from '../types'

const KG_TO_LBS = 2.20462

export function toDisplayWeight(lbs: number, unit: 'lbs' | 'kg'): number {
  if (unit === 'kg') return Math.round((lbs / KG_TO_LBS) * 10) / 10
  return lbs
}

export function toStoredLbs(value: number, unit: 'lbs' | 'kg'): number {
  if (unit === 'kg') return Math.round(value * KG_TO_LBS * 10) / 10
  return value
}

/**
 * Returns the effective weight (lbs) for a set.
 * For bodyweight sets: userBodyweightLbs + additional weight stored in set.weight.
 * Falls back to just the additional weight if user bodyweight is not set.
 */
export function effectiveSetWeight(set: WorkoutSet, userBodyweightLbs = 0): number {
  if (set.isBodyweight) return userBodyweightLbs + set.weight
  return set.weight
}

/** Volume for a single set = weight (lbs) × reps */
export function setVolume(weight: number, reps: number): number {
  return weight * reps
}

/** Total volume across all sets in a workout for a given exercise */
export function exerciseVolume(
  workout: Workout,
  exerciseId: string,
  userBodyweightLbs = 0
): number {
  return workout.exercises
    .filter((we) => we.exerciseId === exerciseId)
    .flatMap((we) => we.sets)
    .reduce((sum, s) => sum + setVolume(effectiveSetWeight(s, userBodyweightLbs), s.reps), 0)
}

/** Total volume across the entire workout */
export function workoutTotalVolume(workout: Workout, userBodyweightLbs = 0): number {
  return workout.exercises
    .flatMap((we) => we.sets)
    .reduce((sum, s) => sum + setVolume(effectiveSetWeight(s, userBodyweightLbs), s.reps), 0)
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
  weeks = 12,
  userBodyweightLbs = 0
): WeeklyVolume[] {
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    exerciseVolume(workout, exerciseId, userBodyweightLbs)
  )
}

/**
 * Aggregate weekly volume across all muscle groups over the past N weeks.
 */
export function weeklyVolumeForAllMuscleGroups(
  workouts: Workout[],
  weeks = 12,
  userBodyweightLbs = 0
): WeeklyVolume[] {
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    workout.exercises
      .flatMap((we) => we.sets)
      .reduce((sum, s) => sum + setVolume(effectiveSetWeight(s, userBodyweightLbs), s.reps), 0)
  )
}

/**
 * Aggregate weekly volume for a muscle group over the past N weeks.
 */
export function weeklyVolumeForMuscleGroup(
  workouts: Workout[],
  muscleGroup: MuscleGroup,
  exercises: Exercise[],
  weeks = 12,
  userBodyweightLbs = 0
): WeeklyVolume[] {
  const groupExerciseIds = new Set(
    exercises.filter((e) => e.muscleGroup === muscleGroup).map((e) => e.id)
  )
  return buildWeeklyBuckets(workouts, weeks, (workout) =>
    workout.exercises
      .filter((we) => groupExerciseIds.has(we.exerciseId))
      .flatMap((we) => we.sets)
      .reduce((sum, s) => sum + setVolume(effectiveSetWeight(s, userBodyweightLbs), s.reps), 0)
  )
}

export function buildWeeklyBuckets(
  workouts: Workout[],
  weeks: number,
  volumeFn: (w: Workout) => number
): WeeklyVolume[] {
  const now = new Date()
  const buckets: WeeklyVolume[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }) // Monday
    const weekEnd = addDays(weekStart, 6)

    const volume = workouts
      .filter((w) => isWithinInterval(parseISO(w.date), { start: weekStart, end: weekEnd }))
      .reduce((sum, w) => sum + volumeFn(w), 0)

    buckets.push({
      weekLabel: format(weekStart, 'MMM d'),
      weekStart: weekStart.toISOString(),
      volume: Math.round(volume),
    })
  }

  return buckets
}

// --- Streak & summary stats ---

export function currentStreak(workouts: Workout[]): number {
  const dateSet = new Set(workouts.map((w) => w.date))
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)
  while (dateSet.has(format(current, 'yyyy-MM-dd'))) {
    streak++
    current = addDays(current, -1)
  }
  return streak
}

export function longestStreak(workouts: Workout[]): number {
  const dates = [...new Set(workouts.map((w) => w.date))].sort()
  if (dates.length === 0) return 0
  let max = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = (parseISO(dates[i]).getTime() - parseISO(dates[i - 1]).getTime()) / 86400000
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
    (parseISO(sorted[sorted.length - 1].date).getTime() - parseISO(sorted[0].date).getTime()) /
    86400000
  const weeks = Math.max(1, Math.floor(diffDays / 7) + 1)
  return Math.round((workouts.length / weeks) * 10) / 10
}

export function volumeChangePercent(
  workouts: Workout[],
  userBodyweightLbs = 0
): number | null {
  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekEnd = addDays(thisWeekStart, 6)
  const lastWeekStart = subWeeks(thisWeekStart, 1)
  const lastWeekEnd = addDays(lastWeekStart, 6)

  const sumVol = (start: Date, end: Date) =>
    workouts
      .filter((w) => isWithinInterval(parseISO(w.date), { start, end }))
      .reduce((s, w) => s + workoutTotalVolume(w, userBodyweightLbs), 0)

  const thisVol = sumVol(thisWeekStart, thisWeekEnd)
  const lastVol = sumVol(lastWeekStart, lastWeekEnd)

  if (lastVol === 0 && thisVol === 0) return null
  if (lastVol === 0) return Infinity
  return Math.round(((thisVol - lastVol) / lastVol) * 100)
}

// --- Per-exercise weekly trend functions ---

export function weekly1RMForExercise(
  workouts: Workout[],
  exerciseId: string,
  weeks = 12,
  userBodyweightLbs = 0
): { weekLabel: string; weekStart: string; oneRM: number }[] {
  const now = new Date()
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    let best = 0
    for (const w of workouts) {
      if (!isWithinInterval(parseISO(w.date), { start: weekStart, end: weekEnd })) continue
      for (const we of w.exercises) {
        if (we.exerciseId !== exerciseId) continue
        for (const s of we.sets) {
          const eff = effectiveSetWeight(s, userBodyweightLbs)
          const oneRM = eff * (1 + s.reps / 30)
          if (oneRM > best) best = oneRM
        }
      }
    }
    return {
      weekLabel: format(weekStart, 'MMM d'),
      weekStart: weekStart.toISOString(),
      oneRM: Math.round(best * 10) / 10,
    }
  })
}

export function weeklyPeakWeightForExercise(
  workouts: Workout[],
  exerciseId: string,
  weeks = 12,
  userBodyweightLbs = 0
): { weekLabel: string; weekStart: string; peakWeight: number }[] {
  const now = new Date()
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    let peak = 0
    for (const w of workouts) {
      if (!isWithinInterval(parseISO(w.date), { start: weekStart, end: weekEnd })) continue
      for (const we of w.exercises) {
        if (we.exerciseId !== exerciseId) continue
        for (const s of we.sets) {
          const eff = effectiveSetWeight(s, userBodyweightLbs)
          if (eff > peak) peak = eff
        }
      }
    }
    return {
      weekLabel: format(weekStart, 'MMM d'),
      weekStart: weekStart.toISOString(),
      peakWeight: Math.round(peak * 10) / 10,
    }
  })
}

// --- Weekly set count functions ---

export function weeklySetCountForMuscleGroup(
  workouts: Workout[],
  muscleGroup: MuscleGroup,
  exercises: Exercise[],
  weeks = 12
): { weekLabel: string; weekStart: string; sets: number }[] {
  const groupIds = new Set(exercises.filter((e) => e.muscleGroup === muscleGroup).map((e) => e.id))
  const now = new Date()
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    let sets = 0
    for (const w of workouts) {
      if (!isWithinInterval(parseISO(w.date), { start: weekStart, end: weekEnd })) continue
      for (const we of w.exercises) {
        if (groupIds.has(we.exerciseId)) sets += we.sets.length
      }
    }
    return { weekLabel: format(weekStart, 'MMM d'), weekStart: weekStart.toISOString(), sets }
  })
}

export function weeklySetCountForAll(
  workouts: Workout[],
  weeks = 12
): { weekLabel: string; weekStart: string; sets: number }[] {
  const now = new Date()
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    let sets = 0
    for (const w of workouts) {
      if (!isWithinInterval(parseISO(w.date), { start: weekStart, end: weekEnd })) continue
      for (const we of w.exercises) sets += we.sets.length
    }
    return { weekLabel: format(weekStart, 'MMM d'), weekStart: weekStart.toISOString(), sets }
  })
}

export function exerciseSessionCounts(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const w of workouts) {
    for (const we of w.exercises) {
      map.set(we.exerciseId, (map.get(we.exerciseId) ?? 0) + 1)
    }
  }
  return map
}

export interface PersonalRecord {
  exerciseId: string
  /** True when all sets for this exercise are bodyweight-based */
  isBodyweight: boolean
  /**
   * For regular exercises: heaviest single-set weight (lbs).
   * For bodyweight exercises: most additional weight added on top of BW (lbs).
   */
  heaviestWeight: number
  heaviestWeightDate: string
  heaviestWeightReps: number
  /** Set with the most reps (at any weight) */
  mostReps: number
  mostRepsDate: string
  mostRepsWeight: number
  /**
   * Best estimated 1-rep max using Epley formula: effectiveWeight × (1 + reps / 30).
   * For bodyweight exercises this uses (userBodyweightLbs + additionalWeight) when BW is set.
   */
  best1RM: number
  best1RMDate: string
  /** Best single-session total volume for this exercise */
  bestVolume: number
  bestVolumeDate: string
}

/**
 * Calculate all-time personal records for every exercise that appears in the
 * provided workouts.  All weight values are stored / returned in lbs.
 *
 * @param userBodyweightLbs - Used to compute effective weight for bodyweight sets (default 0 = only additional weight counts).
 */
export function calculatePersonalRecords(
  workouts: Workout[],
  userBodyweightLbs = 0
): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>()

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

  for (const workout of sorted) {
    // Aggregate per-exercise volume for this single session
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

      // Keep isBodyweight up to date (in case earlier sets lacked the flag due to old data)
      if (isBW) pr.isBodyweight = true

      for (const s of we.sets) {
        // For bodyweight exercises, "heaviest" means most additional weight added.
        // For regular exercises, it's the full weight moved.
        const trackWeight = s.isBodyweight ? s.weight : s.weight

        // Heaviest weight (tie-break: more reps)
        if (
          trackWeight > pr.heaviestWeight ||
          (trackWeight === pr.heaviestWeight && s.reps > pr.heaviestWeightReps)
        ) {
          pr.heaviestWeight = trackWeight
          pr.heaviestWeightReps = s.reps
          pr.heaviestWeightDate = workout.date
        }

        // Most reps (tie-break: more weight)
        const effectiveW = effectiveSetWeight(s, userBodyweightLbs)
        if (
          s.reps > pr.mostReps ||
          (s.reps === pr.mostReps && effectiveW > pr.mostRepsWeight)
        ) {
          pr.mostReps = s.reps
          pr.mostRepsWeight = effectiveW
          pr.mostRepsDate = workout.date
        }

        // Best estimated 1RM (Epley: effectiveWeight × (1 + reps / 30))
        const estimated1RM = effectiveW * (1 + s.reps / 30)
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

/**
 * Muscle group breakdown of total volume.
 */
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
