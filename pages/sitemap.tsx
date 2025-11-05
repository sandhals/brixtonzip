// minimal sitemap that lists routes from the pages folder only
// tweak OWNER, REPO, REF, SITE_URL to your needs

const OWNER = process.env.GITHUB_OWNER || 'sandhals'
const REPO = process.env.GITHUB_REPO || 'brixtonzip'
const REF = process.env.GITHUB_REF || 'main' // branch
const SITE_URL = process.env.SITE_URL || ''

type GHItem = {
  name: string
  path: string
  type: 'file' | 'dir'
}

const exts = ['.tsx', '.jsx', '.ts', '.js', '.mdx']

function isPageFile(name: string) {
  return exts.some(ext => name.endsWith(ext))
}

function toRoute(p: string) {
  // drop leading pages/
  let s = p.replace(/^pages\//, '')

  // ignore special files and api
  if (s.startsWith('api/')) return null
  if (/_app\./.test(s) || /_document\./.test(s) || /_error\./.test(s) || /middleware\./.test(s)) return null

  // drop extension
  for (const ext of exts) if (s.endsWith(ext)) s = s.slice(0, -ext.length)

  // index handling
  if (s === 'index') return '/'
  s = s.replace(/\/index$/, '')

  return `/${s}`
}

async function listDir(path: string): Promise<GHItem[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(REF)}`
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub contents failed ${res.status}`)
  return await res.json()
}

async function listPageFiles(root = 'pages'): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const items = await listDir(dir)
    for (const it of items) {
      if (it.type === 'dir') {
        await walk(it.path)
      } else if (it.type === 'file' && isPageFile(it.name)) {
        out.push(it.path)
      }
    }
  }
  await walk(root)
  return out
}

export const revalidate = 1800

export default async function SiteMap() {
  const files = await listPageFiles('pages')

  const routes = Array.from(
    new Set(
      files
        .map(toRoute)
        .filter((r): r is string => !!r)
        // optional hide dynamic routes like /blog/[slug]
        .filter(r => !/\[.*\]/.test(r))
    )
  ).sort((a, b) => a.localeCompare(b))

  return (
    <main style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Site map</h1>
      <p style={{ marginBottom: 24 }}>Auto generated from the pages folder on GitHub</p>
      <ul style={{ lineHeight: 1.9 }}>
        {routes.map(r => (
          <li key={r}>
            <a href={`${SITE_URL}${r}`}>{r}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
