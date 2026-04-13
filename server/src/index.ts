import express from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import workoutRoutes from './routes/workouts'
import exerciseRoutes from './routes/exercises'
import settingsRoutes from './routes/settings'
import backupRoutes from './routes/backup'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Health check (used by Docker)
app.get('/health', (_req, res) => res.json({ ok: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/backup', backupRoutes)

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`LiftLogbook server running on http://localhost:${PORT}`)
})
