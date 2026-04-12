import { AppSettings, Exercise, Workout } from '../types'
import { DEFAULT_EXERCISES } from '../data/exercises'

const KEYS = {
  workouts: 'llb_workouts',
  exercises: 'llb_exercises',
  settings: 'llb_settings',
} as const

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// Workouts
export function loadWorkouts(): Workout[] {
  return load<Workout[]>(KEYS.workouts, [])
}

export function saveWorkout(workout: Workout): void {
  const workouts = loadWorkouts()
  const idx = workouts.findIndex((w) => w.id === workout.id)
  if (idx >= 0) {
    workouts[idx] = workout
  } else {
    workouts.push(workout)
  }
  save(KEYS.workouts, workouts)
}

export function deleteWorkout(id: string): void {
  const workouts = loadWorkouts().filter((w) => w.id !== id)
  save(KEYS.workouts, workouts)
}

// Exercises
export function loadExercises(): Exercise[] {
  const custom = load<Exercise[]>(KEYS.exercises, [])
  return [...DEFAULT_EXERCISES, ...custom]
}

export function saveCustomExercise(exercise: Exercise): void {
  const custom = load<Exercise[]>(KEYS.exercises, [])
  custom.push(exercise)
  save(KEYS.exercises, custom)
}

export function deleteCustomExercise(id: string): void {
  const custom = load<Exercise[]>(KEYS.exercises, []).filter((e) => e.id !== id)
  save(KEYS.exercises, custom)
}

// Settings
export function loadSettings(): AppSettings {
  return load<AppSettings>(KEYS.settings, { weightUnit: 'lbs' })
}

export function saveSettings(settings: AppSettings): void {
  save(KEYS.settings, settings)
}
