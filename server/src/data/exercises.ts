// Mirrors src/data/exercises.ts (frontend). Update both together if the
// built-in exercise library changes — server needs its own copy since it
// builds independently of the frontend bundle.
import { Exercise, MuscleGroup } from '../lib/types'

const BUILT_IN_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Decline Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest' },
  { name: 'Cable Fly', muscleGroup: 'Chest' },
  { name: 'Push-Up', muscleGroup: 'Chest', isBodyweight: true },
  { name: 'Chest Dip', muscleGroup: 'Chest', isBodyweight: true },

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

  { name: 'Barbell Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Front Raise', muscleGroup: 'Shoulders' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { name: 'Upright Row', muscleGroup: 'Shoulders' },

  { name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { name: 'Cable Curl', muscleGroup: 'Biceps' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps' },

  { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { name: 'Close-Grip Bench Press', muscleGroup: 'Triceps' },
  { name: 'Tricep Kickback', muscleGroup: 'Triceps' },
  { name: 'Tricep Dip', muscleGroup: 'Triceps', isBodyweight: true },

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

  { name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { name: 'Cable Kickback', muscleGroup: 'Glutes' },

  { name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves' },
  { name: 'Leg Press Calf Raise', muscleGroup: 'Calves' },

  { name: 'Plank', muscleGroup: 'Core' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { name: 'Cable Crunch', muscleGroup: 'Core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', isBodyweight: true },
  { name: 'Russian Twist', muscleGroup: 'Core' },
  { name: 'Decline Sit-Up', muscleGroup: 'Core' },

  { name: 'Wrist Curl', muscleGroup: 'Forearms' },
  { name: 'Reverse Wrist Curl', muscleGroup: 'Forearms' },
  { name: 'Farmer Carry', muscleGroup: 'Forearms' },

  { name: 'Power Clean', muscleGroup: 'Full Body' },
  { name: 'Kettlebell Swing', muscleGroup: 'Full Body' },
  { name: 'Thruster', muscleGroup: 'Full Body' },
]

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs',
  'Glutes', 'Calves', 'Core', 'Forearms', 'Full Body',
]

export const DEFAULT_EXERCISES: Exercise[] = BUILT_IN_EXERCISES.map((e, i) => ({
  ...e,
  id: `builtin-${i}`,
}))
