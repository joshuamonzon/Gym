/**
 * npm run validate — zod-check data/config.json and every data/days/*.json.
 * Exits non-zero on the first schema problem. Warns (but passes) on lift names
 * the UI will ignore.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ConfigSchema, DaySchema, KNOWN_LIFTS } from '../src/lib/schema'

const root = join(import.meta.dirname, '..')
const daysDir = join(root, 'data', 'days')
let failures = 0

function fail(file: string, msg: string) {
  failures++
  console.error(`✗ ${file}: ${msg}`)
}

const cfgRaw = JSON.parse(readFileSync(join(root, 'data', 'config.json'), 'utf8'))
const cfg = ConfigSchema.safeParse(cfgRaw)
if (!cfg.success) fail('data/config.json', cfg.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))

const files = readdirSync(daysDir).filter((f) => f.endsWith('.json')).sort()
const seen = new Set<string>()
for (const f of files) {
  const rel = `data/days/${f}`
  let json: unknown
  try {
    json = JSON.parse(readFileSync(join(daysDir, f), 'utf8'))
  } catch (e) {
    fail(rel, `not valid JSON (${(e as Error).message})`)
    continue
  }
  const r = DaySchema.safeParse(json)
  if (!r.success) {
    fail(rel, r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '))
    continue
  }
  if (`${r.data.date}.json` !== f) fail(rel, `filename does not match date field "${r.data.date}"`)
  if (seen.has(r.data.date)) fail(rel, `duplicate date ${r.data.date}`)
  seen.add(r.data.date)
  for (const s of r.data.lifts ?? []) {
    if (!(KNOWN_LIFTS as readonly string[]).includes(s.lift)) console.warn(`! ${rel}: lift "${s.lift}" is not a known lift and will be ignored by the UI`)
  }
}

if (failures > 0) {
  console.error(`\n${failures} problem${failures === 1 ? '' : 's'} in ${files.length} day file${files.length === 1 ? '' : 's'}`)
  process.exit(1)
}
console.log(`✓ config.json and ${files.length} day file${files.length === 1 ? '' : 's'} valid`)
