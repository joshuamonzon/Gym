import type { Routine, RoutineExercise, SetPrescription } from '../types'
import { EX, SEED_TS } from './exercises'

export const RT = {
  a: 'rt_ggp_a',
  b: 'rt_ggp_b',
  megaA: 'rt_ggp_mega_a',
  megaB: 'rt_ggp_mega_b',
  advMon: 'rt_adv_mon',
  advWed: 'rt_adv_wed',
  advFri: 'rt_adv_fri',
  abs: 'rt_abs',
  trifecta: 'rt_trifecta',
  finishers: 'rt_finishers',
} as const

export const PROGRAM_ID = 'prog_ggp'

/** Reverse Pyramid: 4–6, then −10% for 6–8, then −10% for 8–10. */
export function rptSets(): SetPrescription[] {
  return [
    { kind: 'working', repMin: 4, repMax: 6 },
    { kind: 'working', repMin: 6, repMax: 8, pctOfPrev: 0.9 },
    { kind: 'working', repMin: 8, repMax: 10, pctOfPrev: 0.9 },
  ]
}
export function straightSets(n: number, repMin: number, repMax: number): SetPrescription[] {
  return Array.from({ length: n }, () => ({ kind: 'working', repMin, repMax }))
}
/** Activation set to failure (12–15) + mini-sets of 3–5 after 15–20 s. */
export function restPauseSets(minis = 3): SetPrescription[] {
  return [
    { kind: 'activation', repMin: 12, repMax: 15 },
    ...Array.from({ length: minis }, (): SetPrescription => ({ kind: 'mini', repMin: 3, repMax: 5, restSec: 20 })),
  ]
}
export function timedSets(n: number, durationSec: number): SetPrescription[] {
  return Array.from({ length: n }, () => ({ kind: 'working', durationSec }))
}

let counter = 0
function re(exerciseId: string, scheme: RoutineExercise['scheme'], sets: SetPrescription[], restSec: number, extra: Partial<RoutineExercise> = {}): RoutineExercise {
  counter += 1
  return { id: `re_${exerciseId}_${counter}`, exerciseId, scheme, sets, restSec, ...extra }
}

function routine(id: string, name: string, kind: Routine['kind'], exercises: RoutineExercise[], extra: Partial<Routine> = {}): Routine {
  return { id, name, kind, exercises, builtIn: true, createdAt: SEED_TS, updatedAt: SEED_TS, ...extra }
}

export const seedRoutines: Routine[] = [
  routine(RT.a, 'Workout A', 'main', [
    re(EX.inclineBench, 'rpt', rptSets(), 180),
    re(EX.ohp, 'rpt', rptSets(), 180),
    re(EX.dips, 'rpt', rptSets(), 180),
    re(EX.lateralRaise, 'straight', straightSets(3, 8, 15), 90, { notes: 'Or rest-pause to finish.' }),
    re(EX.pushdown, 'straight', straightSets(3, 8, 15), 90, { notes: 'Or rest-pause to finish.' }),
  ], { programId: PROGRAM_ID, shortLabel: 'A', description: 'Upper-body push: chest, shoulders, triceps.' }),

  routine(RT.b, 'Workout B', 'main', [
    re(EX.chinup, 'rpt', rptSets(), 180, { alternatives: [EX.pullup] }),
    re(EX.sumoDeadlift, 'rpt', rptSets(), 180, { alternatives: [EX.rdl] }),
    re(EX.bulgarian, 'rpt', rptSets(), 180, { alternatives: [EX.pistol] }),
    re(EX.bbCurl, 'rpt', rptSets(), 180, { alternatives: [EX.dbCurl] }),
  ], { programId: PROGRAM_ID, shortLabel: 'B', description: 'Pull and lower body: back, biceps, legs.' }),

  routine(RT.megaA, 'Workout A (MEGA)', 'main', [
    re(EX.inclineBench, 'rpt', rptSets(), 180),
    re(EX.ohp, 'rpt', rptSets(), 180),
    re(EX.dips, 'rpt', rptSets(), 180),
    re(EX.lateralRaise, 'rest_pause', restPauseSets(), 20),
    re(EX.pushdown, 'rest_pause', restPauseSets(), 20),
  ], { programId: PROGRAM_ID, shortLabel: 'A', description: 'Phase Three: rest-pause on the isolation moves for cumulative fatigue.' }),

  routine(RT.megaB, 'Workout B (MEGA)', 'main', [
    re(EX.chinup, 'rpt', rptSets(), 180, { alternatives: [EX.pullup] }),
    re(EX.sumoDeadlift, 'rpt', rptSets(), 180, { alternatives: [EX.rdl] }),
    re(EX.bulgarian, 'rpt', rptSets(), 180, { alternatives: [EX.pistol] }),
    re(EX.bbCurl, 'rest_pause', restPauseSets(), 20, { alternatives: [EX.dbCurl] }),
  ], { programId: PROGRAM_ID, shortLabel: 'B', description: 'Phase Three: rest-pause curls for cumulative fatigue.' }),

  routine(RT.advMon, 'Shoulders, Back & Triceps', 'main', [
    re(EX.chinup, 'rpt', rptSets(), 180, { alternatives: [EX.pullup] }),
    re(EX.ohp, 'rpt', rptSets(), 180),
    re(EX.skullCrusher, 'rpt', rptSets(), 180),
  ], { programId: PROGRAM_ID, shortLabel: 'Mon', description: 'Advanced split — Monday.' }),

  routine(RT.advWed, 'Legs & Abs', 'main', [
    re(EX.bulgarian, 'rpt', rptSets(), 180, { alternatives: [EX.pistol] }),
    re(EX.rdl, 'rpt', rptSets(), 180),
    re(EX.hangingLegRaise, 'straight', straightSets(4, 8, 12), 90),
  ], { programId: PROGRAM_ID, shortLabel: 'Wed', description: 'Advanced split — Wednesday.' }),

  routine(RT.advFri, 'Chest & Biceps', 'main', [
    re(EX.inclineBench, 'rpt', rptSets(), 180),
    re(EX.flatBench, 'rpt', rptSets(), 180),
    re(EX.bbCurl, 'rpt', rptSets(), 180, { alternatives: [EX.dbCurl] }),
  ], { programId: PROGRAM_ID, shortLabel: 'Fri', description: 'Advanced split — Friday.' }),

  routine(RT.abs, 'Abs', 'abs', [
    re(EX.hangingLegRaise, 'straight', straightSets(4, 8, 12), 90),
    re(EX.abWheel, 'straight', straightSets(3, 10, 15), 90),
    re(EX.lSit, 'timed', timedSets(3, 20), 45),
    re(EX.plank, 'timed', timedSets(3, 30), 45),
  ], { description: '2–3× per week. Strength over volume: thick, dense abdominal blocks.' }),

  routine(RT.trifecta, 'Trifecta Mobility', 'mobility', [
    re(EX.backBridge, 'timed', timedSets(3, 20), 30),
    re(EX.lSit, 'timed', timedSets(3, 20), 30),
    re(EX.twistStretch, 'timed', timedSets(3, 20), 30),
  ], { description: 'Three active stretches held 20 s each, to counter the stiffening effects of heavy lifting.' }),

  routine(RT.finishers, 'Finishers', 'finisher', [
    re(EX.walkingShrug, 'straight', [
      { kind: 'working', repMin: 20, repMax: 30 },
      { kind: 'mini', repMin: 10, repMax: 10, restSec: 30 },
      { kind: 'mini', repMin: 10, repMax: 10, restSec: 30 },
      { kind: 'mini', repMin: 10, repMax: 10, restSec: 30 },
    ], 45),
    re(EX.neck, 'straight', straightSets(3, 10, 15), 60, { notes: 'Optional.' }),
  ], { description: 'Optional trap and neck specialization for a more rugged look.' }),
]
