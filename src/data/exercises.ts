import { Exercise, MuscleGroup } from '../types'

const BUILT_IN_EXERCISES: Omit<Exercise, 'id'>[] = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Decline Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest' },
  { name: 'Cable Fly', muscleGroup: 'Chest' },
  { name: 'Push-Up', muscleGroup: 'Chest', isBodyweight: true },
  { name: 'Chest Dip', muscleGroup: 'Chest', isBodyweight: true },

  // Back
  { name: 'Conventional Deadlift', muscleGroup: 'Back' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Pendlay Row', muscleGroup: 'Back' },
  { name: 'Dumbbell Row', muscleGroup: 'Back' },
  { name: 'Pull-Up', muscleGroup: 'Back', isBodyweight: true },
  { name: 'Chin-Up', muscleGroup: 'Back', isBodyweight: true },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'T-Bar Row', muscleGroup: 'Back' },
  { name: 'Face Pull', muscleGroup: 'Back' },

  // Shoulders
  { name: 'Barbell Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Front Raise', muscleGroup: 'Shoulders' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { name: 'Upright Row', muscleGroup: 'Shoulders' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { name: 'Cable Curl', muscleGroup: 'Biceps' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps' },

  // Triceps
  { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { name: 'Close-Grip Bench Press', muscleGroup: 'Triceps' },
  { name: 'Tricep Kickback', muscleGroup: 'Triceps' },
  { name: 'Tricep Dip', muscleGroup: 'Triceps', isBodyweight: true },

  // Legs
  { name: 'Barbell Back Squat', muscleGroup: 'Legs' },
  { name: 'Front Squat', muscleGroup: 'Legs' },
  { name: 'Goblet Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { name: 'Leg Curl', muscleGroup: 'Legs' },
  { name: 'Leg Extension', muscleGroup: 'Legs' },
  { name: 'Walking Lunge', muscleGroup: 'Legs' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
  { name: 'Hack Squat', muscleGroup: 'Legs' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { name: 'Cable Kickback', muscleGroup: 'Glutes' },

  // Calves
  { name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves' },
  { name: 'Leg Press Calf Raise', muscleGroup: 'Calves' },

  // Core
  { name: 'Plank', muscleGroup: 'Core' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { name: 'Cable Crunch', muscleGroup: 'Core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', isBodyweight: true },
  { name: 'Russian Twist', muscleGroup: 'Core' },
  { name: 'Decline Sit-Up', muscleGroup: 'Core' },

  // Forearms
  { name: 'Wrist Curl', muscleGroup: 'Forearms' },
  { name: 'Reverse Wrist Curl', muscleGroup: 'Forearms' },
  { name: 'Farmer Carry', muscleGroup: 'Forearms' },

  // Full Body
  { name: 'Power Clean', muscleGroup: 'Full Body' },
  { name: 'Kettlebell Swing', muscleGroup: 'Full Body' },
  { name: 'Thruster', muscleGroup: 'Full Body' },
]

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Calves',
  'Core',
  'Forearms',
  'Full Body',
]

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  Chest: '#ef4444',
  Back: '#3b82f6',
  Shoulders: '#f59e0b',
  Biceps: '#8b5cf6',
  Triceps: '#ec4899',
  Legs: '#10b981',
  Glutes: '#f97316',
  Calves: '#14b8a6',
  Core: '#6366f1',
  Forearms: '#84cc16',
  'Full Body': '#64748b',
}

export const DEFAULT_EXERCISES: Exercise[] = BUILT_IN_EXERCISES.map((e, i) => ({
  ...e,
  id: `builtin-${i}`,
}))
