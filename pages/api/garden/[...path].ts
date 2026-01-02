import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { path } = req.query
    
    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Invalid path' })
    }

    // Filter out empty strings (from trailing slashes) and join
    const pathString = path.filter(p => p).join('/')
    const publicGardenPath = join(process.cwd(), 'public', 'garden', pathString)
    
    // Check if the last segment has a file extension (is a specific file)
    const lastSegment = pathString.split('/').pop() || ''
    const hasExtension = lastSegment.includes('.') && lastSegment.split('.').length > 1
    
    let filePath: string
    let contentType = 'text/html; charset=utf-8'
    
    if (hasExtension) {
      // Requesting a specific file (e.g., omikuji.js, mon.jpg)
      filePath = publicGardenPath
      
      // Set appropriate content type based on file extension
      const ext = lastSegment.split('.').pop()?.toLowerCase()
      const contentTypes: Record<string, string> = {
        'js': 'application/javascript',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'wav': 'audio/wav',
        'mp3': 'audio/mpeg',
        'css': 'text/css',
        'json': 'application/json',
        'html': 'text/html; charset=utf-8'
      }
      contentType = contentTypes[ext || ''] || 'application/octet-stream'
    } else {
      // Requesting a directory, serve index.html
      filePath = join(publicGardenPath, 'index.html')
    }

    try {
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' })
      }
      
      // Read file as binary for non-text files, UTF-8 for text files
      const isBinary = !contentType.includes('text') && !contentType.includes('javascript') && !contentType.includes('json')
      let content = isBinary 
        ? await readFile(filePath) 
        : await readFile(filePath, 'utf-8')
      
      // For HTML files served from a directory path, inject a base tag to fix relative paths
      if (!hasExtension && typeof content === 'string') {
        const baseUrl = `/garden/${pathString}/`
        // Check if base tag already exists
        if (!content.includes('<base')) {
          // Inject base tag right after <head>
          content = content.replace('<head>', `<head>\n    <base href="${baseUrl}">`)
        }
      }
      
      res.setHeader('Content-Type', contentType)
      return res.status(200).send(content)
    } catch (fileError) {
      // File doesn't exist
      return res.status(404).json({ error: 'Not found' })
    }
  } catch (err) {
    console.error('Error serving garden file:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

