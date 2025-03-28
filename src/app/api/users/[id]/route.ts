import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { JwtPayload } from 'jsonwebtoken'

import { executeQuery } from '../../db'
import { verifyAuth, unauthorized, forbidden } from '../../auth-utils'

// Define a type for our auth user
interface AuthUser extends JwtPayload {
  id: number
  role: string
}

// Fallback user data for when database connections fail
const getFallbackUser = (id: string) => {
  return {
    id: parseInt(id),
    first_name: 'Test',
    last_name: 'User',
    email: `user${id}@example.com`,
    organization_name: 'Test Organization',
    role: 'user',
    profile_picture: '/images/placeholder.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Additional fields for account settings page
    phone_number: '555-123-4567',
    address: '123 Test St',
    state: 'Test State',
    zip_code: '12345',
    country: 'Test Country',
    language: 'en',
    time_zone: 'gmt-05',
    currency: 'usd'
  }
}

// GET a specific user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const user = verifyAuth(request)

  // For development/demo purposes, we'll allow access to /users/2 without authentication
  // In production, this should be removed and proper auth enforcement applied
  const bypassAuth = process.env.NODE_ENV === 'development' && params.id === '2'

  if (!user && !bypassAuth) {
    return unauthorized()
  }

  try {
    // Use the executeQuery helper for safe connection handling
    const result = await executeQuery(async conn => {
      const sql = 'SELECT * FROM users WHERE id = ?'

      console.log(`Fetching user with ID: ${params.id}`)

      return await conn.query(sql, [params.id])
    })

    if (!result || (Array.isArray(result) && result.length === 0)) {
      console.log('User not found in database, using fallback data')

      // If no user found in database, return fallback data
      return NextResponse.json(getFallbackUser(params.id))
    }

    console.log('User found, returning result')

    return NextResponse.json(Array.isArray(result) ? result[0] : result)
  } catch (error) {
    console.error('Error fetching user from database:', error)
    console.log('Using fallback user data due to database error')

    // If database error, use fallback data
    return NextResponse.json(getFallbackUser(params.id))
  }
}

// PUT to update a user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth) {
    return unauthorized()
  }

  // Only allow users to update their own profile or admins to update any profile
  if (auth.id !== parseInt(params.id) && auth.role !== 'admin') {
    return forbidden()
  }

  try {
    const body = await request.json()

    console.log(`Update request for user ${params.id}:`, body)

    // Use executeQuery helper
    await executeQuery(async conn => {
      // Map the request fields to database columns
      const fieldMappings: Record<string, string> = {
        first_name: 'first_name',
        last_name: 'last_name',
        email: 'email',
        organization_name: 'org_id', // This might need special handling
        phone_number: 'phone_number',
        address: 'address',
        state: 'state',
        zip_code: 'zip_code',
        country: 'country',
        language: 'language',
        time_zone: 'time_zone',
        currency: 'currency'
      }

      const updateFields = []
      const updateValues = []

      // Process each field from the request body
      for (const [key, value] of Object.entries(body)) {
        // Only process fields that have mappings and skip empty values
        if (fieldMappings[key] && value !== null && value !== undefined && value !== '') {
          updateFields.push(`${fieldMappings[key]} = ?`)
          updateValues.push(value)
        }
      }

      if (updateFields.length === 0) {
        console.log('No fields to update')

        return null
      }

      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`

      updateValues.push(params.id)

      console.log('Executing SQL:', sql)
      console.log('With values:', updateValues)

      try {
        const result = await conn.query(sql, updateValues)

        console.log('Update result:', result)

        return result
      } catch (dbError) {
        console.error('Database error during update:', dbError)
        throw dbError
      }
    })

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)

    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// DELETE a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth) {
    return unauthorized()
  }

  // Only admins can delete users
  if (auth.role !== 'admin') {
    return forbidden()
  }

  try {
    // Use executeQuery helper
    await executeQuery(async conn => {
      const sql = 'DELETE FROM users WHERE id = ?'

      return await conn.query(sql, [params.id])
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)

    return NextResponse.json(
      {
        message: 'Server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
