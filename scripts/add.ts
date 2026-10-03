/**
 * npm run add -- <YYYY-MM-DD>
 * Scaffolds data/days/<date>.json with just the date, ready to fill in.
 * Refuses to overwrite an existing file (day files are append-only).
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const date = process.argv[2]
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
  console.error('usage: npm run add -- YYYY-MM-DD')
  process.exit(1)
}
const file = join(import.meta.dirname, '..', 'data', 'days', `${date}.json`)
if (existsSync(file)) {
  console.error(`${file} already exists — day files are append-only, edit it directly if needed`)
  process.exit(1)
}
writeFileSync(file, JSON.stringify({ date }, null, 2) + '\n')
console.log(`created data/days/${date}.json`)
