import type { Settings } from '../types'
import { seedExercises } from './exercises'
import { seedRoutines, PROGRAM_ID } from './routines'
import { seedPrograms, PH } from './programs'

export { seedExercises, seedRoutines, seedPrograms, PROGRAM_ID, PH }
export { EX } from './exercises'
export { RT } from './routines'

export const SEED_VERSION = 1

export function defaultSettings(now = Date.now()): Settings {
  return {
    id: 'app',
    unit: 'lb',
    trainingDays: [1, 3, 5],
    weekStartsOn: 1,
    activeProgramId: PROGRAM_ID,
    activePhaseId: PH.one,
    specialization: {},
    megaLevel: 1,
    nextOverrideRoutineId: null,
    restDefaults: { rpt: 180, restPause: 20, accessory: 90, warmup: 60 },
    autoWarmups: true,
    heightIn: null,
    absPerWeek: 2,
    mobilityPerWeek: 3,
    timerSound: true,
    keepAwakeAudio: false,
    seedVersion: SEED_VERSION,
    lastBackupAt: null,
    createdAt: now,
  }
}
