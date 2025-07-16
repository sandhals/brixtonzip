import type { NextApiRequest, NextApiResponse } from 'next'

interface LinkObj {
  title: string
  link: string
  createdDate: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      'https://curius.app/api/users/3954/searchLinks'
    )
    const json = await response.json()

    if (!Array.isArray(json.links)) {
      return res
        .status(500)
        .json({ error: 'Unexpected data format from Curius' })
    }

    const cleaned = json.links
      .filter((l: LinkObj) => l.title && l.link && l.createdDate)
      .map((l: LinkObj) => ({
        title: l.title,
        link: l.link,
        createdDate: l.createdDate,
      }))

    return res.status(200).json({ links: cleaned })
  } catch (err) {
    console.error('Failed to fetch Curius data', err)
    return res.status(500).json({ error: 'Failed to fetch Curius data' })
  }
}
