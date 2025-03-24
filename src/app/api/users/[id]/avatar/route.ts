import path from 'path'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

import { executeQuery } from '../../../db'
import { verifyAuth, unauthorized, forbidden } from '../../../auth-utils'

// Define a type for our auth user
interface AuthUser {
  id: number
  role: string
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Avatar upload request received for user ID: ${params.id}`)

  // For development/demo purposes, we'll allow access to /users/2 without authentication
  // In production, this should be removed and proper auth enforcement applied
  const bypassAuth = process.env.NODE_ENV === 'development' && params.id === '2'

  if (bypassAuth) {
    console.log('🟢 Development auth bypass enabled for user ID 2')
  }

  // Check for auth header
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    console.log('⚠️ No authorization header found in request')
  } else {
    console.log(`Authorization header found: ${authHeader.substring(0, 20)}...`)
  }

  // Log content-type header to debug the request format
  const contentType = request.headers.get('content-type')

  console.log(`Content-Type: ${contentType}`)

  // Verify authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth && !bypassAuth) {
    console.log('❌ Authentication required and not provided or invalid')

    return unauthorized()
  }

  if (auth) {
    console.log(`✅ Authenticated as user ID: ${auth.id}, role: ${auth.role}`)
  }

  // Only allow users to update their own avatar or admins to update any user's avatar
  if (!bypassAuth && auth.id !== parseInt(params.id) && auth.role !== 'admin') {
    console.log(`❌ Permission denied: User ${auth.id} tried to update avatar for user ${params.id}`)

    return forbidden()
  }

  console.log(`✅ Permission granted to update avatar for user ${params.id}`)

  try {
    console.log(`Processing avatar upload for user ${params.id}`)

    // SIMPLIFIED APPROACH: Get the raw binary data directly
    console.log('Using simplified direct binary approach')

    // Read request body as array buffer
    const arrayBuffer = await request.arrayBuffer()

    console.log(`Received raw data: ${arrayBuffer.byteLength} bytes`)

    if (arrayBuffer.byteLength === 0) {
      console.error('No data received in request body')

      return NextResponse.json(
        {
          error: 'Empty request body',
          details: 'No file data received'
        },
        { status: 400 }
      )
    }

    // If content type is multipart/form-data, we need to parse it differently
    // For now, as a fallback, just assume any non-empty body is an image file

    // Create a buffer from the array buffer
    const buffer = Buffer.from(arrayBuffer)

    console.log(`Created buffer with ${buffer.length} bytes`)

    // Try to detect if this is a valid image
    let imageType

    try {
      // Check the magic bytes to identify the image type
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        imageType = 'image/png'
      } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        imageType = 'image/jpeg'
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        imageType = 'image/gif'
      } else {
        console.log('Unknown image type, first bytes:', buffer.slice(0, 8))

        // Analyze the content type to try to extract the boundary
        if (contentType?.includes('multipart/form-data')) {
          console.log('Multipart form detected, but direct binary extraction attempted')

          return NextResponse.json(
            {
              error: 'Multipart parsing not implemented',
              details: 'Please use a direct file upload without multipart/form-data'
            },
            { status: 400 }
          )
        }
      }

      console.log(`Detected image type: ${imageType || 'unknown'}`)
    } catch (detectionError) {
      console.error('Error detecting image type:', detectionError)
    }

    // Define upload directory paths - save to both locations for compatibility
    const publicAssetsDir = path.join(process.cwd(), 'public', 'assets', 'avatars')
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    // Ensure the directories exist
    try {
      if (!existsSync(publicAssetsDir)) {
        await mkdir(publicAssetsDir, { recursive: true })
        console.log(`Created directory: ${publicAssetsDir}`)
      }

      if (!existsSync(publicUploadsDir)) {
        await mkdir(publicUploadsDir, { recursive: true })
        console.log(`Created directory: ${publicUploadsDir}`)
      }
    } catch (dirError) {
      console.error('Error creating directories:', dirError)

      return NextResponse.json(
        {
          error: 'Failed to create storage directories',
          details: dirError instanceof Error ? dirError.message : String(dirError)
        },
        { status: 500 }
      )
    }

    // Generate a unique filename
    const fileName = `avatar-${uuidv4()}.png`
    const assetsFilePath = path.join(publicAssetsDir, fileName)
    const uploadsFilePath = path.join(publicUploadsDir, fileName)

    console.log(`Generated file paths:\n- ${assetsFilePath}\n- ${uploadsFilePath}`)

    // Resize and optimize the image using sharp
    let optimizedBuffer

    try {
      optimizedBuffer = await sharp(buffer).resize(200, 200, { fit: 'cover' }).toFormat('png').toBuffer()
      console.log('Image processed successfully with sharp')
    } catch (sharpError) {
      console.error('Error processing image with sharp:', sharpError)

      return NextResponse.json(
        {
          error: 'Error processing image',
          details: sharpError instanceof Error ? sharpError.message : String(sharpError)
        },
        { status: 500 }
      )
    }

    // Write the files to both locations
    try {
      await writeFile(assetsFilePath, optimizedBuffer)
      await writeFile(uploadsFilePath, optimizedBuffer)
      console.log('Files saved successfully to both locations')
    } catch (writeError) {
      console.error('Error writing files:', writeError)

      return NextResponse.json(
        {
          error: 'Error saving file',
          details: writeError instanceof Error ? writeError.message : String(writeError)
        },
        { status: 500 }
      )
    }

    // Update the database with the new profile picture path
    // Store a path that matches what the UserDropdown component expects
    const relativePath = `assets/avatars/${fileName}`

    try {
      await executeQuery(async conn => {
        const sql = 'UPDATE users SET profile_picture = ? WHERE id = ?'
        const result = await conn.query(sql, [relativePath, params.id])

        console.log('Database updated successfully:', result)

        return result
      })
    } catch (dbError) {
      console.error('Error updating database:', dbError)

      return NextResponse.json(
        {
          error: 'Error updating user record',
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      )
    }

    console.log('Avatar upload completed successfully')

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      profile_picture: relativePath
    })
  } catch (error) {
    console.error('Unexpected error during avatar upload:', error)

    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
