import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = req.query.page as string
  if (!page || page.includes('..')) return res.status(400).end()

  const filePath = path.join(process.cwd(), 'pages', `${page}.tsx`)
  try {
    const source = fs.readFileSync(filePath, 'utf-8')
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(source)
  } catch {
    res.status(404).end()
  }
}
