import fs from 'fs/promises'
import path from 'path'
import { createReadStream, stat } from 'fs'
import { promisify } from 'util'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyAuth } from '../../../auth-utils'

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
    '.webp': 'image/webp'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Verify authentication - only authenticated users can access avatar images
    const auth = verifyAuth(request)

    // Allow access without authentication for development/demo purposes
    const bypassAuth = process.env.NODE_ENV === 'development'

    if (!auth && !bypassAuth) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Join the path segments
    const assetPath = params.path.join('/')

    // Construct the full path to the asset
    // We'll keep avatars in the /uploads/avatars folder (outside public)
    const fullPath = path.join(process.cwd(), 'uploads', 'avatars', assetPath)

    // Verify the file exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      console.error(`Avatar not found: ${fullPath}`)

      return new NextResponse('Avatar not found', { status: 404 })
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
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline'
      }
    })
  } catch (error) {
    console.error('Error serving avatar:', error)

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
