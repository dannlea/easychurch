import { writeFile, mkdir } from 'fs/promises'

import path from 'path'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name

    // Create asset directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'assets', 'uploads')

    await mkdir(uploadDir, { recursive: true })

    // Write the file to the uploads directory
    const filePath = path.join(uploadDir, filename)

    await writeFile(filePath, buffer)

    // Return the URL to access the file
    const fileUrl = `/api/assets/uploads/${filename}`

    return NextResponse.json({
      status: 'ok',
      message: 'File uploaded successfully',
      filename,
      url: fileUrl
    })
  } catch (error) {
    console.error('Error uploading file:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'File upload failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
