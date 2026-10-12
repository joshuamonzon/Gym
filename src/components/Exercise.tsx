import type { PlanExercise, PlanSet } from '../lib/schema'
import { setKey } from '../lib/done'
import { mmss, num } from '../lib/format'
import { Check } from './Check'

function Weight({ w }: { w: PlanSet['w'] }) {
  if (typeof w === 'number') {
    return (
      <>
        {num(w)}
        <small>lb</small>
      </>
    )
  }
  // "+55" is added load; "BW" and anything else is shown as written.
  if (/^[+-]\d/.test(w)) {
    return (
      <>
        {w}
        <small>lb</small>
      </>
    )
  }
  return <>{w}</>
}

function Reps({ r }: { r: PlanSet['r'] }) {
  if (typeof r === 'number') {
    return (
      <>
        {r}
        <small>reps</small>
      </>
    )
  }
  return <>{r}</>
}

/**
 * One exercise as a set table. Working sets have a check circle; warm-ups
 * are listed smaller and can't be ticked. Tap anywhere on a working row.
 */
export function Exercise({
  exercise,
  last,
  done,
  toggle,
}: {
  exercise: PlanExercise
  /** "230 × 5 · Oct 11" — the last logged top set for this lift, if known */
  last?: string
  done: Set<string>
  toggle: (key: string) => void
}) {
  const sets = exercise.sets ?? []
  let work = 0
  return (
    <div className="ex">
      <div className="exh">
        <h4>{exercise.name}</h4>
        {last && <span className="last">last {last}</span>}
      </div>
      {exercise.note && <div className="note">{exercise.note}</div>}
      {sets.length > 0 && (
        <table className="sets">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
              <th>
                <span className="sr-only">Done</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s, i) => {
              if (s.warmup) {
                return (
                  <tr key={i} className="warm">
                    <td className="s">warm</td>
                    <td className="w">
                      <Weight w={s.w} />
                    </td>
                    <td className="r">
                      <Reps r={s.r} />
                      {s.note && <small>({s.note})</small>}
                    </td>
                    <td className="c" />
                  </tr>
                )
              }
              const key = setKey(exercise.name, i)
              const isDone = done.has(key)
              const label = String(++work)
              return (
                <tr key={i} className={`work${isDone ? ' done' : ''}`} onClick={() => toggle(key)}>
                  <td className="s">{label}</td>
                  <td className="w">
                    <Weight w={s.w} />
                  </td>
                  <td className="r">
                    <Reps r={s.r} />
                    {s.note && <small>({s.note})</small>}
                  </td>
                  <td className="c">
                    <Check checked={isDone} onToggle={() => toggle(key)} label={`${exercise.name} set ${label} done`} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {exercise.rest_s !== undefined && <div className="note faint">Rest {mmss(exercise.rest_s)}</div>}
    </div>
  )
}
