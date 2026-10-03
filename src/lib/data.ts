/**
 * Loads every data/days/*.json at build time and validates it. A bad file fails
 * loudly in dev; `npm run validate` catches it before it ever gets here.
 */
import { ConfigSchema, DaySchema, type Config, type Day } from './schema'
import { sortByDate } from './rollups'
import rawConfig from '../../data/config.json'

const modules = import.meta.glob('../../data/days/*.json', { eager: true, import: 'default' })

export const config: Config = ConfigSchema.parse(rawConfig)

export const days: Day[] = sortByDate(
  Object.entries(modules).map(([path, json]) => {
    const parsed = DaySchema.safeParse(json)
    if (!parsed.success) {
      throw new Error(`${path}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
    }
    return parsed.data
  }),
)
