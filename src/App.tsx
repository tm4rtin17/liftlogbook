import { useState } from 'react'
import { Navigation } from './components/Navigation'
import { WorkoutLogger } from './components/WorkoutLogger'
import { History } from './components/History'
import { Analytics } from './components/Analytics'
import { PersonalRecords } from './components/PersonalRecords'
import { Settings } from './components/Settings'
import { AuthScreen } from './screens/AuthScreen'
import { useStore } from './hooks/useStore'
import { useAuth } from './contexts/AuthContext'

type Tab = 'log' | 'history' | 'analytics' | 'prs' | 'settings'

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const {
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
    importBackup,
  } = useStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-3 animate-pulse">🏋️</div>
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-brand-700 dark:text-brand-400">LiftLogbook</h1>
        </header>

        <main className="flex-1 px-4 pt-2 pb-24 lg:px-8 lg:py-8 max-w-3xl w-full mx-auto">
          {activeTab === 'log' && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Log Workout</h2>
              <WorkoutLogger
                exercises={exercises}
                weightUnit={settings.weightUnit}
                bodyweightLbs={settings.bodyweightLbs}
                onSave={async (w) => {
                  await addWorkout(w)
                  setActiveTab('history')
                }}
                onAddCustomExercise={addCustomExercise}
              />
            </section>
          )}

          {activeTab === 'history' && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Workout History</h2>
              <History
                workouts={workouts}
                exercises={exercises}
                weightUnit={settings.weightUnit}
                bodyweightLbs={settings.bodyweightLbs}
                onDelete={removeWorkout}
                onUpdate={updateWorkout}
                onAddCustomExercise={addCustomExercise}
              />
            </section>
          )}

          {activeTab === 'analytics' && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Analytics</h2>
              <Analytics
                workouts={workouts}
                exercises={exercises}
                weightUnit={settings.weightUnit}
                bodyweightLbs={settings.bodyweightLbs}
              />
            </section>
          )}

          {activeTab === 'prs' && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Personal Records</h2>
              <PersonalRecords
                workouts={workouts}
                exercises={exercises}
                weightUnit={settings.weightUnit}
                bodyweightLbs={settings.bodyweightLbs}
              />
            </section>
          )}

          {activeTab === 'settings' && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Settings</h2>
              <Settings
                settings={settings}
                exercises={exercises}
                workouts={workouts}
                onUpdateSettings={updateSettings}
                onAddCustomExercise={addCustomExercise}
                onDeleteCustomExercise={removeCustomExercise}
                onImportBackup={importBackup}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🏋️</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />
  return <AppShell />
}
