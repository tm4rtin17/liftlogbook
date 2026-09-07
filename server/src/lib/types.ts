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
  isBodyweight?: boolean
}

export interface WorkoutSet {
  id: string
  reps: number
  weight: number
  isBodyweight?: boolean
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  date: string
  name: string
  exercises: WorkoutExercise[]
  notes?: string
}
