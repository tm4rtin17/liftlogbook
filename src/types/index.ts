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
  /** True for exercises where the user's own bodyweight is the primary load (push-ups, pull-ups, dips, etc.) */
  isBodyweight?: boolean
}

export interface WorkoutSet {
  id: string
  reps: number
  /**
   * Always stored in lbs.
   * For bodyweight sets this is the ADDITIONAL weight added on top of the user's bodyweight (0 = pure BW).
   */
  weight: number
  /** Inherited from the exercise when the set is created; stored here so analytics never need an exercise lookup. */
  isBodyweight?: boolean
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
  /** User's bodyweight in lbs — used to compute volume for bodyweight exercises. Optional. */
  bodyweightLbs?: number
}
