import fs from 'fs/promises'
import path from 'path'
import { createReadStream, stat } from 'fs'
import { promisify } from 'util'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const statAsync = promisify(stat)

// Helper function to determine MIME type based on file extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Join the path segments
    const assetPath = params.path.join('/')

    // Construct the full path to the asset
    // We'll keep assets in the /public/assets folder
    const fullPath = path.join(process.cwd(), 'public', 'assets', assetPath)

    // Verify the file exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      console.error(`Asset not found: ${fullPath}`)

      return new NextResponse('Asset not found', { status: 404 })
    }

    // Get file stats
    const stats = await statAsync(fullPath)

    // Create a readable stream
    const fileStream = createReadStream(fullPath)

    // Get the mime type
    const contentType = getMimeType(fullPath)

    // Return the file as a stream with appropriate headers
    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('Error serving asset:', error)

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
