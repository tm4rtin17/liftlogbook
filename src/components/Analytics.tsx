import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Exercise, MuscleGroup, Workout } from '../types'
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUPS } from '../data/exercises'
import {
  toDisplayWeight,
  weeklyVolumeForExercise,
  weeklyVolumeForMuscleGroup,
  weeklyVolumeForAllMuscleGroups,
  totalVolumeByMuscleGroup,
  totalVolumeByExercise,
} from '../utils/analytics'
import { useTheme } from '../contexts/ThemeContext'

interface Props {
  workouts: Workout[]
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
}

type ViewMode = 'overview' | 'muscleGroup' | 'exercise'
const WEEK_OPTIONS = [4, 8, 12, 24]

export function Analytics({ workouts, exercises, weightUnit }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [mode, setMode] = useState<ViewMode>('overview')
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'All'>('All')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [weeks, setWeeks] = useState(12)

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

  const muscleGroupVolume = useMemo(
    () => totalVolumeByMuscleGroup(workouts, exercises),
    [workouts, exercises]
  )
  const exerciseVolumes = useMemo(
    () => totalVolumeByExercise(workouts, exercises),
    [workouts, exercises]
  )
  const weeklyGroupData = useMemo(
    () =>
      (selectedGroup === 'All'
        ? weeklyVolumeForAllMuscleGroups(workouts, weeks)
        : weeklyVolumeForMuscleGroup(workouts, selectedGroup, exercises, weeks)
      ).map((d) => ({
        ...d,
        volume: toDisplayWeight(d.volume, weightUnit),
      })),
    [workouts, selectedGroup, exercises, weeks, weightUnit]
  )
  const weeklyExerciseData = useMemo(() => {
    if (!selectedExerciseId) return []
    return weeklyVolumeForExercise(workouts, selectedExerciseId, weeks).map((d) => ({
      ...d,
      volume: toDisplayWeight(d.volume, weightUnit),
    }))
  }, [workouts, selectedExerciseId, weeks, weightUnit])

  const pieData = useMemo(
    () =>
      muscleGroupVolume
        .filter((d) => d.volume > 0)
        .map((d) => ({
          name: d.muscleGroup,
          value: Math.round(toDisplayWeight(d.volume, weightUnit)),
          color: MUSCLE_GROUP_COLORS[d.muscleGroup],
        })),
    [muscleGroupVolume, weightUnit]
  )

  // Chart theme colors
  const axisColor = isDark ? '#71717a' : '#94a3b8'
  const gridColor = isDark ? '#27272a' : '#f1f5f9'
  const tooltipStyle = {
    backgroundColor: isDark ? '#27272a' : '#fff',
    border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
    borderRadius: 8,
    color: isDark ? '#e4e4e7' : '#1e293b',
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-slate-400">
        <span className="text-5xl">📊</span>
        <p className="text-base font-medium">No data yet</p>
        <p className="text-sm">Log some workouts to see your analytics</p>
      </div>
    )
  }

  const totalVolume = muscleGroupVolume.reduce((s, d) => s + d.volume, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
        {([
          ['overview', 'Overview'],
          ['muscleGroup', 'Muscle Group'],
          ['exercise', 'Exercise'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {mode === 'overview' && (
        <div className="flex flex-col gap-6">
          <StatCards workouts={workouts} weightUnit={weightUnit} />

          {pieData.length > 0 && (
            <Card title="Volume by Muscle Group">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val.toLocaleString()} ${weightUnit}`, 'Volume']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {exerciseVolumes.length > 0 && (
            <Card title="Top Exercises (all time)">
              <div className="flex flex-col gap-2">
                {exerciseVolumes.slice(0, 8).map((ev) => {
                  const pct = totalVolume > 0 ? ev.volume / totalVolume : 0
                  const dispVol = toDisplayWeight(ev.volume, weightUnit)
                  return (
                    <div key={ev.exerciseName} className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-zinc-300">{ev.exerciseName}</span>
                        <span className="text-slate-400 dark:text-zinc-500 text-xs">
                          {dispVol.toLocaleString()} {weightUnit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct * 100}%`,
                            backgroundColor: MUSCLE_GROUP_COLORS[ev.muscleGroup],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Muscle group trend */}
      {mode === 'muscleGroup' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedGroup('All')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                selectedGroup === 'All'
                  ? 'text-white border-transparent bg-slate-500'
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.filter((g) =>
              muscleGroupVolume.some((d) => d.muscleGroup === g && d.volume > 0)
            ).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  selectedGroup === g
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
                style={selectedGroup === g ? { backgroundColor: MUSCLE_GROUP_COLORS[g] } : {}}
              >
                {g}
              </button>
            ))}
          </div>

          <WeeksSelector value={weeks} onChange={setWeeks} />

          <Card title={`${selectedGroup === 'All' ? 'All Muscle Groups' : selectedGroup} — Weekly Volume`}>
            <VolumeBarChart
              data={weeklyGroupData}
              weightUnit={weightUnit}
              color={selectedGroup === 'All' ? '#64748b' : MUSCLE_GROUP_COLORS[selectedGroup]}
              axisColor={axisColor}
              gridColor={gridColor}
              tooltipStyle={tooltipStyle}
            />
          </Card>

          {selectedGroup !== 'All' && (
            <MuscleGroupSummary
              muscleGroup={selectedGroup}
              workouts={workouts}
              exercises={exercises}
              weightUnit={weightUnit}
            />
          )}
        </div>
      )}

      {/* Exercise trend */}
      {mode === 'exercise' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
              Exercise
            </label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none"
            >
              <option value="">Select an exercise…</option>
              {exerciseVolumes.map((ev) => {
                const id = exercises.find((e) => e.name === ev.exerciseName)?.id
                return (
                  <option key={id} value={id}>
                    {ev.exerciseName} ({ev.muscleGroup})
                  </option>
                )
              })}
            </select>
          </div>

          {selectedExerciseId && (
            <>
              <WeeksSelector value={weeks} onChange={setWeeks} />
              <Card title={`${exerciseMap.get(selectedExerciseId)?.name ?? ''} — Weekly Volume`}>
                <VolumeBarChart
                  data={weeklyExerciseData}
                  weightUnit={weightUnit}
                  color={MUSCLE_GROUP_COLORS[exerciseMap.get(selectedExerciseId)?.muscleGroup ?? 'Full Body']}
                  axisColor={axisColor}
                  gridColor={gridColor}
                  tooltipStyle={tooltipStyle}
                />
              </Card>
              <ExerciseSummary
                exerciseId={selectedExerciseId}
                workouts={workouts}
                exercises={exercises}
                weightUnit={weightUnit}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function StatCards({ workouts, weightUnit }: { workouts: Workout[]; weightUnit: 'lbs' | 'kg' }) {
  const totalVol = workouts.reduce(
    (s, w) =>
      s + w.exercises.flatMap((we) => we.sets).reduce((ss, st) => ss + st.weight * st.reps, 0),
    0
  )
  const totalSets = workouts.reduce(
    (s, w) => s + w.exercises.reduce((ss, we) => ss + we.sets.length, 0),
    0
  )
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Workouts" value={workouts.length.toString()} />
      <StatCard label="Total Sets" value={totalSets.toLocaleString()} />
      <StatCard
        label={`Volume (${weightUnit})`}
        value={(toDisplayWeight(totalVol, weightUnit) / 1000).toFixed(1) + 'k'}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 px-3 py-3 text-center">
      <p className="text-xl font-bold text-brand-700 dark:text-brand-400">{value}</p>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{label}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

interface ChartProps {
  data: { weekLabel: string; volume: number }[]
  weightUnit: 'lbs' | 'kg'
  color: string
  axisColor: string
  gridColor: string
  tooltipStyle: React.CSSProperties
}

function VolumeBarChart({ data, weightUnit, color, axisColor, gridColor, tooltipStyle }: ChartProps) {
  if (data.every((d) => d.volume === 0)) {
    return <p className="text-center text-sm text-slate-400 py-8">No data in this period</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fontSize: 11, fill: axisColor }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: axisColor }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
          width={40}
        />
        <Tooltip
          formatter={(val: number) => [`${val.toLocaleString()} ${weightUnit}`, 'Volume']}
          cursor={{ fill: gridColor }}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="volume" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function WeeksSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {WEEK_OPTIONS.map((w) => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === w
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          {w}w
        </button>
      ))}
    </div>
  )
}

function MuscleGroupSummary({
  muscleGroup,
  workouts,
  exercises,
  weightUnit,
}: {
  muscleGroup: MuscleGroup
  workouts: Workout[]
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
}) {
  const groupExerciseIds = new Set(
    exercises.filter((e) => e.muscleGroup === muscleGroup).map((e) => e.id)
  )
  const byExercise = new Map<string, number>()
  for (const w of workouts) {
    for (const we of w.exercises) {
      if (!groupExerciseIds.has(we.exerciseId)) continue
      const vol = we.sets.reduce((s, st) => s + st.weight * st.reps, 0)
      byExercise.set(we.exerciseId, (byExercise.get(we.exerciseId) ?? 0) + vol)
    }
  }
  const entries = Array.from(byExercise.entries())
    .map(([id, vol]) => ({
      name: exercises.find((e) => e.id === id)?.name ?? 'Unknown',
      volume: Math.round(toDisplayWeight(vol, weightUnit)),
    }))
    .sort((a, b) => b.volume - a.volume)

  if (entries.length === 0) return null

  return (
    <Card title={`${muscleGroup} — Exercise Breakdown`}>
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e.name} className="flex items-center justify-between text-sm">
            <span className="text-slate-700 dark:text-zinc-300">{e.name}</span>
            <span className="font-medium text-brand-700 dark:text-brand-400">
              {e.volume.toLocaleString()} {weightUnit}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ExerciseSummary({
  exerciseId,
  workouts,
  exercises,
  weightUnit,
}: {
  exerciseId: string
  workouts: Workout[]
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kg'
}) {
  const ex = exercises.find((e) => e.id === exerciseId)
  if (!ex) return null

  let bestWeight = 0
  let bestReps = 0
  for (const w of workouts) {
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue
      for (const s of we.sets) {
        if (s.weight > bestWeight || (s.weight === bestWeight && s.reps > bestReps)) {
          bestWeight = s.weight
          bestReps = s.reps
        }
      }
    }
  }

  const totalSessions = workouts.filter((w) =>
    w.exercises.some((we) => we.exerciseId === exerciseId)
  ).length

  return (
    <Card title="Personal Bests & Stats">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
            {toDisplayWeight(bestWeight, weightUnit)} {weightUnit}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Best Weight × {bestReps} reps</p>
        </div>
        <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-brand-700 dark:text-brand-400">{totalSessions}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Sessions logged</p>
        </div>
      </div>
    </Card>
  )
}
