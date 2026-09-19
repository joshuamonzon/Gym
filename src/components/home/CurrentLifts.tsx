import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { ChevronRight } from '@/components/ui/Icons'
import { Empty } from '@/components/ui/Empty'
import { useActiveProgram, useExercisesById, useLatestBodyweight, useRoutines } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { useWorkingWeights } from '@/hooks/useWorkingWeights'
import { bestsForExercise } from '@/domain/prs'
import { formatWeight } from '@/domain/units'

/** Current working weight and best set for every loaded lift in the active phase. */
export function CurrentLifts() {
  const { phase } = useActiveProgram()
  const routines = useRoutines()
  const exercisesById = useExercisesById()
  const settings = useSettings()
  const bw = useLatestBodyweight()
  const navigate = useNavigate()

  const exerciseIds = useMemo(() => {
    const ids: string[] = []
    for (const rid of phase?.routineIds ?? []) {
      const r = routines?.find((x) => x.id === rid)
      for (const e of r?.exercises ?? []) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)
    }
    return ids.filter((id) => {
      const lt = exercisesById[id]?.loadType
      return lt === 'external' || lt === 'bodyweight_plus'
    })
  }, [phase, routines, exercisesById])
  const key = exerciseIds.join(',')
  const weights = useWorkingWeights(exerciseIds)
  const workouts = useLiveQuery(() => (key ? db.workouts.where('exerciseIds').anyOf(key.split(',')).toArray() : []), [key])

  if (exerciseIds.length === 0) return <Empty title="No lifts in the active program" />
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
      {exerciseIds.map((id) => {
        const ex = exercisesById[id]
        if (!ex) return null
        const bests = bestsForExercise((workouts ?? []).filter((w) => w.exerciseIds.includes(id)), ex, bw)
        const plus = ex.loadType === 'bodyweight_plus' ? '+' : ''
        const w = weights[id] ?? null
        return (
          <button key={id} type="button" onClick={() => navigate(`/exercises/${id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate">{ex.name}</span>
              <span className="block text-sm text-muted">
                {bests.bestSet && bests.bestSet.reps !== null ? `Best ${plus}${formatWeight(bests.bestSet.weightLb, settings.unit)} × ${bests.bestSet.reps}` : 'Not logged yet'}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-lg font-semibold">{w === null ? '—' : `${plus}${formatWeight(w, settings.unit)}`}</span>
              <span className="block text-xs text-muted">next top set</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        )
      })}
    </div>
  )
}
