import type { GetServerSideProps } from 'next'

export default function GardenFallback() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const segments = Array.isArray(params?.slug) ? params.slug : [params?.slug ?? '']
  const slug = segments.filter(Boolean).join('/')

  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http'
  const host = req.headers.host!
  const gardenRes = await fetch(`${proto}://${host}/api/garden/${slug}`)

  if (!gardenRes.ok) {
    return { notFound: true }
  }

  const html = await gardenRes.text()
  res.setHeader('Content-Type', gardenRes.headers.get('content-type') ?? 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  res.end(html)

  return { props: {} }
}
