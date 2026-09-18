import type { Program } from '../types'
import { EX } from './exercises'
import { PROGRAM_ID, RT } from './routines'

export const PH = {
  one: 'ph_ggp_1',
  two: 'ph_ggp_2',
  three: 'ph_ggp_3',
  advanced: 'ph_ggp_adv',
} as const

export const seedPrograms: Program[] = [
  {
    id: PROGRAM_ID,
    name: 'Greek God Program 2.0',
    description:
      '3 days per week, at least 48 h between sessions. Reverse Pyramid Training on heavy compounds, micro-loading for continuous progression.',
    builtIn: true,
    phases: [
      {
        id: PH.one,
        name: 'Phase One — Strength & Density',
        description: 'Workout A and B alternated (A-B-A, then B-A-B). Add ~50 lb to incline bench and weighted chin-ups over 3–6 months.',
        durationWeeks: 24,
        routineIds: [RT.a, RT.b],
      },
      {
        id: PH.two,
        name: 'Phase Two — Specialization',
        description: 'Same A/B. Pick ONE lagging muscle per workout; its exercise gets 2 extra sets. Never more than one per workout.',
        durationWeeks: 10,
        routineIds: [RT.a, RT.b],
        specialization: {
          extraSets: 2,
          choices: {
            [RT.a]: [EX.ohp, EX.lateralRaise, EX.inclineBench, EX.dips, EX.pushdown],
            [RT.b]: [EX.chinup, EX.bbCurl, EX.bulgarian, EX.sumoDeadlift],
          },
        },
      },
      {
        id: PH.three,
        name: 'Phase Three — MEGA',
        description: 'Minimum Effort Growth Acceleration: rest-pause work layered on the strength base. Levels 1–3, 4 weeks each.',
        durationWeeks: 12,
        routineIds: [RT.megaA, RT.megaB],
        megaLevels: 3,
      },
      {
        id: PH.advanced,
        name: 'Advanced 3-Day Split',
        description: 'After 6 months: Mon shoulders/back/triceps, Wed legs & abs, Fri chest & biceps.',
        routineIds: [RT.advMon, RT.advWed, RT.advFri],
        pinnedWeekdays: { 1: RT.advMon, 3: RT.advWed, 5: RT.advFri },
      },
    ],
  },
]
