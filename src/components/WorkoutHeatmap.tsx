import { CSSProperties } from 'react'
import { format, startOfWeek, addDays, subWeeks, isAfter } from 'date-fns'
import { Workout } from '../types'
import { workoutTotalVolume, toDisplayWeight } from '../utils/analytics'

interface Props {
  workouts: Workout[]
  weightUnit: 'lbs' | 'kg'
}

const WEEKS = 52
// Show only Mon / Wed / Fri labels to keep left gutter narrow
const ROW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function WorkoutHeatmap({ workouts, weightUnit }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build volume-by-day map (sum volumes if multiple workouts on the same day)
  const volumeByDay = new Map<string, number>()
  for (const workout of workouts) {
    const key = workout.date.slice(0, 10)
    volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + workoutTotalVolume(workout))
  }

  const maxVolume = Math.max(...Array.from(volumeByDay.values()), 1)

  // Grid start: Sunday of the week that is (WEEKS-1) weeks before this week
  const thisWeekSunday = startOfWeek(today, { weekStartsOn: 0 })
  const gridStart = subWeeks(thisWeekSunday, WEEKS - 1)

  // Build 52 columns, each with 7 days (Sun → Sat)
  const weeks: Date[][] = Array.from({ length: WEEKS }, (_, w) => {
    const weekSunday = addDays(gridStart, w * 7)
    return Array.from({ length: 7 }, (_, d) => addDays(weekSunday, d))
  })

  // Month label per column (only when month changes)
  const monthLabels: (string | null)[] = weeks.map((week, i) => {
    const firstDay = week[0]
    if (i === 0) return format(firstDay, 'MMM')
    if (firstDay.getMonth() !== weeks[i - 1][0].getMonth()) return format(firstDay, 'MMM')
    return null
  })

  function intensity(dateStr: string): 0 | 1 | 2 | 3 | 4 {
    const vol = volumeByDay.get(dateStr) ?? 0
    if (vol === 0) return 0
    const r = vol / maxVolume
    if (r <= 0.25) return 1
    if (r <= 0.5) return 2
    if (r <= 0.75) return 3
    return 4
  }

  // Map intensity → brand CSS variable shade
  const SHADE: Record<1 | 2 | 3 | 4, string> = {
    1: '200',
    2: '400',
    3: '600',
    4: '900',
  }

  function cellStyle(lvl: 0 | 1 | 2 | 3 | 4): CSSProperties {
    if (lvl === 0) return {}
    return { backgroundColor: `rgb(var(--brand-${SHADE[lvl]}))` }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
      <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
        Activity
      </h3>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
          {/* Day-of-week label column */}
          <div className="flex flex-col gap-[3px] mr-0.5">
            {/* Spacer for the month-label row */}
            <div className="h-4" />
            {ROW_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-[11px] w-7 text-right pr-1 flex items-center justify-end
                           text-[8px] leading-none text-slate-400 dark:text-zinc-500"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {/* Month label */}
              <div className="h-4 text-[9px] leading-4 text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                {monthLabels[wi]}
              </div>

              {/* Day cells */}
              {week.map((day, di) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const future = isAfter(day, today)
                const lvl = future ? 0 : intensity(dateStr)
                const vol = volumeByDay.get(dateStr) ?? 0
                const displayVol = toDisplayWeight(vol, weightUnit)

                const baseClass =
                  'w-[11px] h-[11px] rounded-[2px] cursor-default'
                const emptyClass = future
                  ? 'bg-slate-50 dark:bg-zinc-800/30'
                  : 'bg-slate-100 dark:bg-zinc-800'

                const title =
                  vol > 0
                    ? `${format(day, 'MMM d, yyyy')} — ${displayVol.toLocaleString()} ${weightUnit}`
                    : format(day, 'MMM d, yyyy')

                return (
                  <div
                    key={di}
                    className={`${baseClass} ${lvl === 0 ? emptyClass : ''}`}
                    style={cellStyle(lvl)}
                    title={title}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-[3px] mt-2">
        <span className="text-[9px] text-slate-400 dark:text-zinc-500 mr-0.5">Less</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div
            key={lvl}
            className={`w-[11px] h-[11px] rounded-[2px] ${lvl === 0 ? 'bg-slate-100 dark:bg-zinc-800' : ''}`}
            style={cellStyle(lvl)}
          />
        ))}
        <span className="text-[9px] text-slate-400 dark:text-zinc-500 ml-0.5">More</span>
      </div>
    </div>
  )
}
