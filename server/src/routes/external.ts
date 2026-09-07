import { Router, Response } from 'express'
import db from '../db'
import { requireApiToken, ApiTokenRequest } from '../middleware/apiToken'
import { DEFAULT_EXERCISES } from '../data/exercises'
import { Exercise, Workout } from '../lib/types'
import {
  calculatePersonalRecords,
  totalVolumeByExercise,
  totalVolumeByMuscleGroup,
  currentStreak,
  longestStreak,
  avgWorkoutsPerWeek,
} from '../lib/analytics'

const router = Router()
router.use(requireApiToken)

function getWorkouts(userId: string): Workout[] {
  const rows = db
    .prepare('SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC')
    .all(userId) as { data: string }[]
  return rows.map((r) => JSON.parse(r.data))
}

function getCustomExercises(userId: string): Exercise[] {
  const rows = db
    .prepare('SELECT data FROM custom_exercises WHERE user_id = ?')
    .all(userId) as { data: string }[]
  return rows.map((r) => JSON.parse(r.data))
}

function getSettings(userId: string): { weightUnit: 'lbs' | 'kg'; bodyweightLbs?: number } {
  const row = db
    .prepare('SELECT data FROM user_settings WHERE user_id = ?')
    .get(userId) as { data: string } | undefined
  return row ? JSON.parse(row.data) : { weightUnit: 'lbs' }
}

router.get('/profile', (req: ApiTokenRequest, res: Response): void => {
  const userId = req.apiUserId!
  const user = db
    .prepare('SELECT email, created_at FROM users WHERE id = ?')
    .get(userId) as { email: string; created_at: string }
  res.json({
    email: user.email,
    memberSince: user.created_at,
    settings: getSettings(userId),
    totalWorkouts: getWorkouts(userId).length,
  })
})

router.get('/workouts', (req: ApiTokenRequest, res: Response): void => {
  const userId = req.apiUserId!
  let workouts = getWorkouts(userId)
  const { since, limit } = req.query
  if (typeof since === 'string') {
    workouts = workouts.filter((w) => w.date >= since)
  }
  if (typeof limit === 'string') {
    const n = parseInt(limit, 10)
    if (!Number.isNaN(n)) workouts = workouts.slice(0, n)
  }
  res.json(workouts)
})

router.get('/workouts/:id', (req: ApiTokenRequest, res: Response): void => {
  const workout = getWorkouts(req.apiUserId!).find((w) => w.id === req.params.id)
  if (!workout) {
    res.status(404).json({ error: 'Workout not found' })
    return
  }
  res.json(workout)
})

router.get('/exercises', (req: ApiTokenRequest, res: Response): void => {
  res.json([...DEFAULT_EXERCISES, ...getCustomExercises(req.apiUserId!)])
})

router.get('/personal-records', (req: ApiTokenRequest, res: Response): void => {
  const userId = req.apiUserId!
  const settings = getSettings(userId)
  const exercises = [...DEFAULT_EXERCISES, ...getCustomExercises(userId)]
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  const prs = calculatePersonalRecords(getWorkouts(userId), settings.bodyweightLbs ?? 0)
    .map((pr) => ({ ...pr, exercise: exerciseMap.get(pr.exerciseId) }))
    .filter((pr) => pr.exercise !== undefined)

  res.json(prs)
})

router.get('/analytics/summary', (req: ApiTokenRequest, res: Response): void => {
  const userId = req.apiUserId!
  const settings = getSettings(userId)
  const workouts = getWorkouts(userId)
  const exercises = [...DEFAULT_EXERCISES, ...getCustomExercises(userId)]
  const bwLbs = settings.bodyweightLbs ?? 0

  res.json({
    totalWorkouts: workouts.length,
    currentStreak: currentStreak(workouts),
    longestStreak: longestStreak(workouts),
    avgWorkoutsPerWeek: avgWorkoutsPerWeek(workouts),
    volumeByMuscleGroup: totalVolumeByMuscleGroup(workouts, exercises, bwLbs),
    topExercisesByVolume: totalVolumeByExercise(workouts, exercises, bwLbs).slice(0, 20),
  })
})

export default router
