import { writeFile } from 'fs/promises'

import path from 'path'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyAuth, unauthorized } from '../../auth-utils'

export async function POST(request: NextRequest) {
  // Check authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create assets directory in public folder if it doesn't exist
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'temp')

    // Save the file to the temporary assets directory
    const filePath = path.join(assetsDir, file.name)

    await writeFile(filePath, buffer)

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `/api/assets/temp/${file.name}`
    })
  } catch (error) {
    console.error('Error handling file upload:', error)

    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
  }
}
