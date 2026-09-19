import type { Equipment, Exercise, LoadType, MuscleGroup, Scheme } from '../types'

export const SEED_TS = 1700000000000

type Overrides = Partial<Omit<Exercise, 'id' | 'name' | 'muscleGroup' | 'equipment' | 'loadType'>>

function def(
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  loadType: LoadType,
  scheme: Scheme,
  o: Overrides = {},
): Exercise {
  const barbell = equipment === 'barbell'
  return {
    id,
    name,
    muscleGroup,
    equipment,
    loadType,
    defaultScheme: scheme,
    defaultRestSec: scheme === 'rpt' ? 180 : scheme === 'timed' ? 45 : 90,
    incrementLb: loadType === 'bodyweight' || loadType === 'time' ? 0 : barbell ? 5 : 2.5,
    roundingLb: loadType === 'bodyweight' || loadType === 'time' ? 0 : barbell ? 5 : 2.5,
    builtIn: true,
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
    ...o,
  }
}

export const EX = {
  inclineBench: 'ex_incline_bb_bench',
  ohp: 'ex_standing_bb_ohp',
  dips: 'ex_weighted_dips',
  lateralRaise: 'ex_lateral_raise',
  pushdown: 'ex_tricep_pushdown',
  chinup: 'ex_weighted_chinup',
  pullup: 'ex_weighted_pullup',
  sumoDeadlift: 'ex_sumo_deadlift',
  bulgarian: 'ex_bulgarian_split_squat',
  pistol: 'ex_pistol_squat',
  bbCurl: 'ex_bb_curl',
  dbCurl: 'ex_db_curl',
  skullCrusher: 'ex_skull_crusher',
  rdl: 'ex_romanian_deadlift',
  flatBench: 'ex_flat_bb_bench',
  hangingLegRaise: 'ex_hanging_leg_raise',
  abWheel: 'ex_ab_wheel_rollout',
  lSit: 'ex_l_sit',
  plank: 'ex_plank',
  backBridge: 'ex_back_bridge',
  twistStretch: 'ex_twist_stretch',
  walkingShrug: 'ex_walking_shrug',
  neck: 'ex_neck_training',
} as const

export const seedExercises: Exercise[] = [
  def(EX.inclineBench, 'Incline Barbell Bench Press', 'chest', 'barbell', 'external', 'rpt', {
    aliases: ['Incline Bench Press (Barbell)'],
    coachingNotes:
      'Primary chest movement. Builds the upper pecs for the square "armor-plate" look.\nRPT: heaviest set first while fresh, then drop ~10% and add reps.',
  }),
  def(EX.ohp, 'Standing Barbell Overhead Press', 'shoulders', 'barbell', 'external', 'rpt', {
    aliases: ['Overhead Press (Barbell)', 'Standing Press'],
    coachingNotes:
      'Foundational shoulder movement: front and medial delts, builds the V-taper.\nMicro-load (0.5–2.5 lb) — strength gains are slower here.',
  }),
  def(EX.dips, 'Weighted Dips', 'chest', 'weighted_bodyweight', 'bodyweight_plus', 'rpt', {
    aliases: ['Chest Dip (Weighted)', 'Dips'],
    coachingNotes: 'Lower chest and triceps. Log the ADDED weight (belt/dumbbell).',
  }),
  def(EX.lateralRaise, 'Lateral Raise (Dumbbell)', 'shoulders', 'dumbbell', 'external', 'straight', {
    aliases: ['Lateral Raise'],
    coachingNotes: '3 sets of 8–15, or switch to rest-pause to finish the workout.',
  }),
  def(EX.pushdown, 'Tricep Pushdown (Cable)', 'triceps', 'cable', 'external', 'straight', {
    aliases: ['Triceps Pushdown', 'Tricep Pushdown'],
    coachingNotes: '3 sets of 8–15, or switch to rest-pause to finish the workout.',
  }),
  def(EX.chinup, 'Weighted Chin-up', 'back', 'weighted_bodyweight', 'bodyweight_plus', 'rpt', {
    aliases: ['Chin Up (Weighted)', 'Chin-up'],
    coachingNotes:
      'The most important exercise for back and biceps.\nGoal: +80% of bodyweight for reps. Log the ADDED weight.\nPlateau? Switch to pull-ups for 6 weeks.',
  }),
  def(EX.pullup, 'Weighted Pull-up', 'back', 'weighted_bodyweight', 'bodyweight_plus', 'rpt', {
    aliases: ['Pull Up (Weighted)', 'Pull-up'],
    coachingNotes: 'Plateau-breaker alternative to chin-ups (6 weeks). Log the ADDED weight.',
  }),
  def(EX.sumoDeadlift, 'Sumo Deadlift', 'hamstrings', 'barbell', 'external', 'rpt', {
    aliases: ['Sumo Deadlift (Barbell)'],
    coachingNotes: 'Posterior chain and grip strength.',
  }),
  def(EX.bulgarian, 'Bulgarian Split Squat (Dumbbell)', 'legs', 'dumbbell', 'external', 'rpt', {
    aliases: ['Bulgarian Split Squat'],
    isUnilateral: true,
    coachingNotes:
      'Unilateral: athletic, powerful thighs without excessive mass. No heavy back squats.\nWeight = total dumbbell weight. Reps per leg.',
  }),
  def(EX.pistol, 'Pistol Squat', 'legs', 'weighted_bodyweight', 'bodyweight_plus', 'rpt', {
    isUnilateral: true,
    coachingNotes: 'Alternative to Bulgarian split squats. Log the ADDED weight (0 for bodyweight). Reps per leg.',
  }),
  def(EX.bbCurl, 'Barbell Curl', 'biceps', 'barbell', 'external', 'rpt', {
    aliases: ['Bicep Curl (Barbell)', 'Curl (EZ Bar)'],
    incrementLb: 2.5,
    roundingLb: 2.5,
    coachingNotes: 'Heavy curls for bicep peak and density. Micro-load; gains come slowly.',
  }),
  def(EX.dbCurl, 'Dumbbell Curl', 'biceps', 'dumbbell', 'external', 'rpt', {
    aliases: ['Bicep Curl (Dumbbell)'],
    coachingNotes: 'Alternative to barbell curls. Weight = per dumbbell.',
  }),
  def(EX.skullCrusher, 'Skull Crusher', 'triceps', 'barbell', 'external', 'rpt', {
    aliases: ['Skullcrusher (Barbell)', 'Skull Crushers'],
    incrementLb: 2.5,
    roundingLb: 2.5,
  }),
  def(EX.rdl, 'Romanian Deadlift (Barbell)', 'hamstrings', 'barbell', 'external', 'rpt', {
    aliases: ['Romanian Deadlift'],
  }),
  def(EX.flatBench, 'Flat Barbell Bench Press', 'chest', 'barbell', 'external', 'rpt', {
    aliases: ['Bench Press (Barbell)', 'Flat Bench'],
  }),
  def(EX.hangingLegRaise, 'Hanging Leg Raise', 'abs', 'bodyweight', 'bodyweight', 'straight', {
    coachingNotes: '4 sets of 8–12. Thick, dense abdominal blocks — strength over volume.',
  }),
  def(EX.abWheel, 'Ab Wheel Rollout', 'abs', 'bodyweight', 'bodyweight', 'straight', {
    coachingNotes: '3 sets of 10–15.',
  }),
  def(EX.lSit, 'L-Sit', 'abs', 'bodyweight', 'time', 'timed', {
    coachingNotes: 'Isometric. Strengthens the deep core and traps while stretching the posterior chain.',
  }),
  def(EX.plank, 'Plank', 'abs', 'bodyweight', 'time', 'timed', {
    coachingNotes: 'Isometric stability.',
  }),
  def(EX.backBridge, 'Back Bridge', 'mobility', 'bodyweight', 'time', 'timed', {
    coachingNotes: 'Trifecta: stretches the entire anterior chain (abs, quads) and strengthens the spine. Hold 20 s.',
  }),
  def(EX.twistStretch, 'Twist Stretch', 'mobility', 'bodyweight', 'time', 'timed', {
    coachingNotes: 'Trifecta: spinal rotation and rotator cuffs. Hold 20 s each side.',
  }),
  def(EX.walkingShrug, 'Walking Shrug (Dumbbell)', 'traps', 'dumbbell', 'external', 'straight', {
    defaultRestSec: 45,
    incrementLb: 5,
    roundingLb: 5,
    coachingNotes: 'Heavy dumbbells (65–80 lb). Walk for 20–30 reps, then 10-rep mini-sets with short rest.',
  }),
  def(EX.neck, 'Neck Training', 'neck', 'other', 'external', 'straight', {
    coachingNotes: 'Optional specialization finisher.',
  }),
]
