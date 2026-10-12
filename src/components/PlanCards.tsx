import type { Day, Plan, PlanCardio, PlanLift } from '../lib/schema'
import { num } from '../lib/format'
import { lastForExercise } from '../lib/lifts'
import { Check } from './Check'
import { Exercise } from './Exercise'

const CARDIO_KIND: Record<PlanCardio['type'], string> = {
  run: 'Run',
  bike: 'Bike',
  walk: 'Walk',
  swim: 'Swim',
  rest: 'Rest',
}

/** The cardio card: label, target chips, done check. Rest days render without a check. */
export function CardioCard({ cardio, done, toggle }: { cardio: PlanCardio; done: Set<string>; toggle: (k: string) => void }) {
  const isDone = done.has('cardio')
  const rest = cardio.type === 'rest'
  return (
    <div className={`card${rest ? '' : isDone ? ' done' : ' hero'}`}>
      <div className="title">
        <div>
          <div className="kind">{CARDIO_KIND[cardio.type]}</div>
          <h3>{cardio.label ?? CARDIO_KIND[cardio.type]}</h3>
        </div>
        {!rest && <Check checked={isDone} onToggle={() => toggle('cardio')} label="Cardio done" />}
      </div>
      {(cardio.target || cardio.duration_min !== undefined) && (
        <div className="rx">
          {cardio.target && <span>{cardio.target}</span>}
          {cardio.duration_min !== undefined && (
            <span>
              <b>{num(cardio.duration_min)}</b> min
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/** The lift card: exercises as set tables with per-set checks, then the session's rules. */
export function LiftCard({
  lift,
  days,
  kind,
  hero,
  done,
  toggle,
}: {
  lift: PlanLift
  days: Day[]
  /** small label above the name */
  kind: string
  hero?: boolean
  done: Set<string>
  toggle: (k: string) => void
}) {
  return (
    <div className={`card${hero ? ' hero' : ''}`}>
      <div className="title">
        <div>
          <div className="kind">{kind}</div>
          <h3>{lift.name ?? 'Lift'}</h3>
        </div>
      </div>
      {lift.exercises?.map((ex, i) => (
        <Exercise key={`${i}:${ex.name}`} exercise={ex} last={lastForExercise(ex.name, days)} done={done} toggle={toggle} />
      ))}
      {lift.notes && lift.notes.length > 0 && (
        <div className="note">
          <b>Rule.</b> {lift.notes.join(' · ')}
        </div>
      )}
    </div>
  )
}

export function MobilityCard({ items, done, toggle }: { items: string[]; done: Set<string>; toggle: (k: string) => void }) {
  const isDone = done.has('mobility')
  return (
    <div className={`card${isDone ? ' done' : ''}`}>
      <div className="title">
        <div>
          <div className="kind">Mobility</div>
          <h3>Routine</h3>
        </div>
        <Check checked={isDone} onToggle={() => toggle('mobility')} label="Mobility done" />
      </div>
      <div className="rx">
        {items.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
    </div>
  )
}

/** All of a day's plan cards in order: cardio, lift, mobility. */
export function PlanCards({ plan, days, done, toggle }: { plan: Plan; days: Day[]; done: Set<string>; toggle: (k: string) => void }) {
  return (
    <>
      {plan.cardio && <CardioCard cardio={plan.cardio} done={done} toggle={toggle} />}
      {plan.lift && <LiftCard lift={plan.lift} days={days} kind="Lift" done={done} toggle={toggle} />}
      {plan.mobility && plan.mobility.length > 0 && <MobilityCard items={plan.mobility} done={done} toggle={toggle} />}
    </>
  )
}
