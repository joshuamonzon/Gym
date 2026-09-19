import { beforeEach, describe, expect, it } from 'vitest'
import { GymDB, ensureSeeds } from '../db'
import { seedExercises, seedRoutines, seedPrograms, SEED_VERSION } from '../seed'

let n = 0
function fresh() {
  n += 1
  return new GymDB(`gym_test_${n}_${Date.now()}`)
}

describe('GymDB', () => {
  let db: GymDB
  beforeEach(() => {
    db = fresh()
  })

  it('populates seeds and default settings on first open', async () => {
    await db.open()
    expect(await db.exercises.count()).toBe(seedExercises.length)
    expect(await db.routines.count()).toBe(seedRoutines.length)
    expect(await db.programs.count()).toBe(seedPrograms.length)
    const s = await db.settings.get('app')
    expect(s?.trainingDays).toEqual([1, 3, 5])
    expect(s?.activePhaseId).toBe('ph_ggp_1')
    expect(s?.seedVersion).toBe(SEED_VERSION)
  })

  it('ensureSeeds is idempotent and never overwrites edits', async () => {
    await db.open()
    await db.exercises.update(seedExercises[0].id, { name: 'My Bench' })
    await db.settings.update('app', { seedVersion: 0 })
    await db.routines.delete(seedRoutines[0].id)
    await ensureSeeds(db)
    expect((await db.exercises.get(seedExercises[0].id))?.name).toBe('My Bench')
    expect(await db.routines.count()).toBe(seedRoutines.length)
    expect((await db.settings.get('app'))?.seedVersion).toBe(SEED_VERSION)
    await ensureSeeds(db)
    expect(await db.exercises.count()).toBe(seedExercises.length)
  })

  it('every routine references seeded exercises and every phase seeded routines', async () => {
    const exIds = new Set(seedExercises.map((e) => e.id))
    const rtIds = new Set(seedRoutines.map((r) => r.id))
    for (const r of seedRoutines) {
      for (const e of r.exercises) {
        expect(exIds.has(e.exerciseId), `${r.name} → ${e.exerciseId}`).toBe(true)
        for (const alt of e.alternatives ?? []) expect(exIds.has(alt)).toBe(true)
      }
    }
    for (const p of seedPrograms) for (const ph of p.phases) for (const id of ph.routineIds) expect(rtIds.has(id)).toBe(true)
    const ids = seedRoutines.flatMap((r) => r.exercises.map((e) => e.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('multiEntry exerciseIds index finds workouts', async () => {
    await db.open()
    const now = Date.now()
    await db.workouts.add({
      id: 'w1', title: 't', routineId: null, routineName: null, startedAt: now, finishedAt: now, localDate: '2026-09-18',
      durationSec: 0, volumeLb: 0, totalReps: 0, prCount: 0, exercises: [], exerciseIds: ['ex_a', 'ex_b'], source: 'app',
    })
    expect(await db.workouts.where('exerciseIds').equals('ex_b').count()).toBe(1)
    expect(await db.workouts.where('localDate').between('2026-09-01', '2026-09-30', true, true).count()).toBe(1)
  })
})
