import path from 'path'

import fs from 'fs'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Join all path segments to form the complete file path
    const filePath = path.join(process.cwd(), 'public', 'assets', ...params.path)

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream' // Default content type

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.txt':
        contentType = 'text/plain'
        break
      case '.html':
        contentType = 'text/html'
        break
      case '.json':
        contentType = 'application/json'
        break
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)

    return NextResponse.json({ message: 'Error serving file' }, { status: 500 })
  }
}
