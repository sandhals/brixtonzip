// Stamps data/now.json's `lastUpdated` with the current time.
//
// Run from the pre-commit hook whenever now.json is part of a commit, so the
// date always reflects when the file was actually edited rather than when the
// site happened to be deployed.
//
// The replace is a targeted regex, NOT JSON.parse + stringify: now.json is
// hand-formatted (blank lines between sections, one-line objects) and
// re-serialising it would flatten all of that on every commit.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'data/now.json'

// Seoul wall-clock, matching the existing "YYYY-MM-DDTHH:mm" shape. It is
// deliberately timezone-less, because that is what the page already parses.
const p = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
  hourCycle: 'h23',                    // h23 so midnight is 00, never 24
}).formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {})

const stamp = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`

const before = readFileSync(FILE, 'utf8')
const after = before.replace(/("lastUpdated"\s*:\s*")[^"]*(")/, `$1${stamp}$2`)

if (after === before) {
  // Either the key is missing or the stamp is already current; only the former
  // is a problem, so say so rather than failing silently.
  if (!/"lastUpdated"\s*:/.test(before)) {
    console.error(`stamp-now: no "lastUpdated" key in ${FILE}`)
    process.exit(1)
  }
  process.exit(0)
}

writeFileSync(FILE, after)
console.log(`stamp-now: lastUpdated -> ${stamp}`)
