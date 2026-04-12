import { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { api } from '../api/client'
import { AppSettings, Exercise, MuscleGroup, Workout } from '../types'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { applyAccentColor } from '../data/themes'

export function useStore() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [settings, setSettings] = useState<AppSettings>({ weightUnit: 'lbs' })
  const [loading, setLoading] = useState(true)

  // Load all data on mount
  useEffect(() => {
    Promise.all([
      api.get<Workout[]>('/workouts'),
      api.get<Exercise[]>('/exercises'),
      api.get<AppSettings>('/settings'),
    ])
      .then(([w, ex, s]) => {
        setWorkouts(w)
        setCustomExercises(ex)
        setSettings(s)
      })
      .finally(() => setLoading(false))
  }, [])

  // Apply accent color CSS variables whenever settings change
  useEffect(() => {
    applyAccentColor(settings.accentColor)
  }, [settings.accentColor])

  const exercises: Exercise[] = [...DEFAULT_EXERCISES, ...customExercises]

  const addWorkout = useCallback(async (workout: Omit<Workout, 'id'>): Promise<Workout> => {
    const saved = await api.post<Workout>('/workouts', workout)
    setWorkouts((prev) => [...prev, saved])
    return saved
  }, [])

  const updateWorkout = useCallback(async (workout: Workout): Promise<void> => {
    const saved = await api.put<Workout>(`/workouts/${workout.id}`, workout)
    setWorkouts((prev) => prev.map((w) => (w.id === saved.id ? saved : w)))
  }, [])

  const removeWorkout = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/workouts/${id}`)
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const addCustomExercise = useCallback(
    async (name: string, muscleGroup: MuscleGroup): Promise<Exercise> => {
      const ex: Exercise = { id: uuidv4(), name, muscleGroup, custom: true }
      const saved = await api.post<Exercise>('/exercises', ex)
      setCustomExercises((prev) => [...prev, saved])
      return saved
    },
    []
  )

  const removeCustomExercise = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/exercises/${id}`)
    setCustomExercises((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateSettings = useCallback(async (s: AppSettings): Promise<void> => {
    setSettings(s) // optimistic — apply immediately so the UI responds on click
    await api.put('/settings', s)
  }, [])

  return {
    workouts,
    exercises,
    settings,
    loading,
    addWorkout,
    updateWorkout,
    removeWorkout,
    addCustomExercise,
    removeCustomExercise,
    updateSettings,
  }
}
