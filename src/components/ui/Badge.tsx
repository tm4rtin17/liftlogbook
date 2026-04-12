import { MuscleGroup } from '../../types'
import { MUSCLE_GROUP_COLORS } from '../../data/exercises'

interface Props {
  muscleGroup: MuscleGroup
  className?: string
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

export function MuscleGroupBadge({ muscleGroup, className = '' }: Props) {
  const color = MUSCLE_GROUP_COLORS[muscleGroup]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `rgb(${hexToRgb(color)} / 0.12)`,
        color,
        border: `1px solid rgb(${hexToRgb(color)} / 0.25)`,
      }}
    >
      {muscleGroup}
    </span>
  )
}
