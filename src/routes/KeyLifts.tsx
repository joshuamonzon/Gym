import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Empty'
import { useExercisesById, useLatestBodyweight } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { KEY_LIFTS, keyLiftStatus } from '@/domain/keyLifts'
import { bestsForExercise } from '@/domain/prs'
import { formatWeight } from '@/domain/units'

export default function KeyLifts() {
  const settings = useSettings()
  const bw = useLatestBodyweight()
  const exercisesById = useExercisesById()
  const ids = KEY_LIFTS.map((k) => k.exerciseId)
  const workouts = useLiveQuery(() => db.workouts.where('exerciseIds').anyOf(ids).toArray(), [])
  if (!workouts) return <Spinner />
  const unit = settings.unit

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back="/profile" title="Key Lifts" />
      <p className="mb-3 text-sm text-muted">
        The four Kinobody key lifts. Absolute targets are for a 175-lb male; the bodyweight-relative targets use your latest logged weight
        {bw === null ? (
          <>
            {' '}
            (<Link to="/measures" className="text-accent">log your bodyweight</Link> to see them)
          </>
        ) : (
          ` (${formatWeight(bw, unit)})`
        )}
        .
      </p>
      {KEY_LIFTS.map((lift) => {
        const ex = exercisesById[lift.exerciseId]
        if (!ex) return null
        const bests = bestsForExercise(workouts.filter((w) => w.exerciseIds.includes(lift.exerciseId)), ex, bw)
        const st = keyLiftStatus(lift, bests, bw)
        const plus = lift.added ? '+' : ''
        return (
          <Card key={lift.exerciseId} className="mb-3">
            <div className="flex items-baseline justify-between">
              <Link to={`/exercises/${lift.exerciseId}`} className="text-lg font-semibold text-accent">
                {lift.name}
              </Link>
              <span className="text-sm text-muted">{st.bestSet && st.bestSet.reps !== null ? `best ${plus}${formatWeight(st.bestSet.weightLb, unit)} × ${st.bestSet.reps}` : 'not logged yet'}</span>
            </div>
            <Bar label={`Target ${plus}${formatWeight(lift.targetWeightLb, unit)} × ${lift.targetReps}`} pct={st.pctAbsolute} />
            {st.bwTargetWeightLb !== null && st.pctBodyweight !== null ? (
              <Bar label={`${lift.bwRatio}× bodyweight → ${plus}${formatWeight(st.bwTargetWeightLb, unit)} × ${lift.targetReps}`} pct={st.pctBodyweight} />
            ) : (
              <p className="mt-2 text-xs text-muted">{lift.bwRatio}× bodyweight{lift.added ? ' added' : ''}</p>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className={pct >= 100 ? 'font-semibold text-success' : ''}>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-2">
        <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}
