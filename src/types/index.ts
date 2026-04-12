export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Core'
  | 'Glutes'
  | 'Calves'
  | 'Forearms'
  | 'Full Body'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  custom?: boolean
}

export interface WorkoutSet {
  id: string
  reps: number
  weight: number // always stored in lbs
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  date: string // ISO date string YYYY-MM-DD
  name: string
  exercises: WorkoutExercise[]
  notes?: string
}

export type WeightUnit = 'lbs' | 'kg'

export type AccentColor = 'sky' | 'violet' | 'emerald' | 'rose' | 'amber' | 'pink'

export interface AppSettings {
  weightUnit: WeightUnit
  accentColor?: AccentColor
}
