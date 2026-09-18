import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { ActiveWorkout } from '@/db/types'

/** null while loading, undefined when nothing is in progress. */
export function useActiveWorkout(): ActiveWorkout | null | undefined {
  return useLiveQuery(() => db.activeWorkout.get('current'), [], null)
}
