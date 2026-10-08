import * as z from 'zod/mini'

/** Lifts the UI knows how to display. Anything else validates but is ignored by the UI. */
export const KNOWN_LIFTS = ['bench', 'pullup', 'row', 'leg_press', 'squat', 'deadlift'] as const
export type KnownLift = (typeof KNOWN_LIFTS)[number]

const isoDate = z.string().check(
  z.regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  z.refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'date must be a real calendar day'),
)

const positive = () => z.number().check(z.positive())
const nonneg = () => z.number().check(z.nonnegative())
const posInt = () => z.int().check(z.positive())

/** `.strictObject` rejects fields the spec doesn't list. */
export const RunSchema = z.strictObject({
  miles: z.optional(positive()),
  seconds: z.optional(posInt()),
  avg_hr: z.optional(posInt()),
  surface: z.optional(z.string().check(z.minLength(1))),
})

export const LiftSetSchema = z.strictObject({
  lift: z.string().check(z.minLength(1)),
  weight: nonneg(),
  reps: posInt(),
})

/** A planned set: `w` is lb (number) or a string like "BW" / "+45"; `r` is reps or a short string. */
export const PlanSetSchema = z.strictObject({
  w: z.union([nonneg(), z.string().check(z.minLength(1))]),
  r: z.union([posInt(), z.string().check(z.minLength(1))]),
  warmup: z.optional(z.boolean()),
  note: z.optional(z.string()),
})

export const PlanExerciseSchema = z.strictObject({
  name: z.string().check(z.minLength(1)),
  note: z.optional(z.string()),
  sets: z.optional(z.array(PlanSetSchema)),
  rest_s: z.optional(posInt()),
})

export const PlanCardioSchema = z.strictObject({
  type: z.enum(['run', 'bike', 'walk', 'rest']),
  label: z.optional(z.string()),
  target: z.optional(z.string()),
  duration_min: z.optional(positive()),
})

export const PlanLiftSchema = z.strictObject({
  name: z.optional(z.string()),
  exercises: z.optional(z.array(PlanExerciseSchema)),
  notes: z.optional(z.array(z.string())),
})

/**
 * The day's plan. Display only: nothing here feeds rollups or charts, and
 * done-state for sets lives in localStorage, never in this file.
 */
export const PlanSchema = z.strictObject({
  cardio: z.optional(PlanCardioSchema),
  lift: z.optional(PlanLiftSchema),
})

/**
 * One day file: data/days/YYYY-MM-DD.json.
 * Every field optional except `date`. Missing fields are omitted, never null.
 */
export const DaySchema = z.strictObject({
  date: isoDate,
  weight_lb: z.optional(positive()),
  cals: z.optional(nonneg()),
  protein_g: z.optional(nonneg()),
  carbs_g: z.optional(nonneg()),
  sleep_h: z.optional(nonneg()),
  shift: z.optional(z.boolean()),
  run: z.optional(RunSchema),
  bike_min: z.optional(nonneg()),
  lifts: z.optional(z.array(LiftSetSchema)),
  note: z.optional(z.string()),
  plan: z.optional(PlanSchema),
})

export type Day = z.infer<typeof DaySchema>
export type Plan = z.infer<typeof PlanSchema>
export type PlanSet = z.infer<typeof PlanSetSchema>
export type PlanExercise = z.infer<typeof PlanExerciseSchema>
export type PlanCardio = z.infer<typeof PlanCardioSchema>
export type Run = z.infer<typeof RunSchema>
export type LiftSet = z.infer<typeof LiftSetSchema>

export const ConfigSchema = z.strictObject({
  challenge: z.strictObject({ name: z.string(), start: isoDate, end: isoDate }),
  tracked_lifts: z.array(z.string().check(z.minLength(1))),
  start_weight_lb: positive(),
  week_start: z.literal('monday'),
})

export type Config = z.infer<typeof ConfigSchema>
