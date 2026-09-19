import type { Exercise, WorkoutExercise, WorkoutSet } from '@/db/types'

export interface ProgressionSuggestion {
  exerciseId: string
  name: string
  currentLb: number
  nextLb: number
  hit: boolean
  belowRange: boolean
  incrementLb: number
}

function topSet(we: WorkoutExercise): WorkoutSet | undefined {
  if (we.scheme === 'rest_pause') return we.sets.find((s) => s.completed && s.kind === 'activation')
  return we.sets.find((s) => s.completed && s.kind === 'working')
}

/**
 * Double-progression rule: when the top set reaches the top of its rep range,
 * add the exercise's increment next time. Returns null for untracked loads.
 */
export function suggestProgression(we: WorkoutExercise, ex: Exercise | undefined): ProgressionSuggestion | null {
  if (!ex) return null
  if (ex.loadType === 'time' || ex.loadType === 'bodyweight') return null
  const top = topSet(we)
  if (!top || top.weightLb === null || top.reps === null) return null
  const max = top.targetRepMax
  const min = top.targetRepMin
  let hit: boolean
  if (we.scheme === 'straight') {
    const working = we.sets.filter((s) => s.completed && s.kind === 'working')
    hit = working.length > 0 && working.every((s) => s.reps !== null && s.targetRepMax !== null && s.reps >= s.targetRepMax)
  } else {
    hit = max !== null && top.reps >= max
  }
  const belowRange = min !== null && top.reps < min
  const increment = ex.incrementLb
  return {
    exerciseId: ex.id,
    name: we.nameSnapshot,
    currentLb: top.weightLb,
    nextLb: hit ? Math.round((top.weightLb + increment) * 100) / 100 : top.weightLb,
    hit,
    belowRange,
    incrementLb: increment,
  }
}
