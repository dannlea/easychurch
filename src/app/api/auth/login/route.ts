import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { executeQuery } from '../../db'

export async function POST(request: NextRequest) {
  try {
    // Log request information for debugging
    console.log('Login request received', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers)
    })

    // Parse request body
    let body

    try {
      body = await request.json()
      console.log('Request body parsed successfully')
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)

      return NextResponse.json(
        {
          message: 'Invalid request format',
          error: String(parseError)
        },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Verify we have the required fields
    if (!email || !password) {
      console.warn('Missing required fields in login request')

      return NextResponse.json(
        {
          message: 'Email and password are required'
        },
        { status: 400 }
      )
    }

    console.log(`Attempting login for email: ${email}`)

    // Use executeQuery helper to safely handle connections
    try {
      const user = await executeQuery(async conn => {
        // Get user data with organization information
        const sql = `
          SELECT
            users.*,
            organizations.name AS organization_name,
            organizations.id AS organization_id
          FROM users
          LEFT JOIN organizations ON users.org_id = organizations.id
          WHERE users.email = ?
        `

        const [user] = await conn.query(sql, [email])

        return user
      }, 3) // Use 3 retries for login

      if (!user) {
        console.log(`No user found with email: ${email}`)

        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      console.log(`User found, verifying password for user ID: ${user.id}`)

      const passwordIsValid = bcrypt.compareSync(password, user.password_hash)

      if (!passwordIsValid) {
        console.log(`Invalid password for user ID: ${user.id}`)

        return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
      }

      console.log(`Password verified for user ID: ${user.id}, generating token`)

      const SECRET_KEY = process.env.JWT_SECRET_KEY

      if (!SECRET_KEY) {
        console.error('JWT_SECRET_KEY is not set in environment variables')

        return NextResponse.json(
          {
            message: 'Authentication error: Server configuration issue'
          },
          { status: 500 }
        )
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.first_name,
          lastName: user.last_name,
          role: user.role,
          profilePicture: user.profile_picture
            ? user.profile_picture.startsWith('/')
              ? user.profile_picture
              : `/${user.profile_picture}`
            : null,
          organization: user.organization_name || null,
          organizationId: user.organization_id || null,
          organizationRole: user.org_role || null
        },
        SECRET_KEY,
        { expiresIn: '1h' }
      )

      console.log(`Login successful for user ID: ${user.id}`)

      return NextResponse.json({ token })
    } catch (dbError) {
      console.error('Database error during login:', dbError)

      // Provide a more detailed error response with connection information
      return NextResponse.json(
        {
          message: 'Server error',
          error: process.env.NODE_ENV === 'production' ? 'Database connection error' : String(dbError),
          details:
            process.env.NODE_ENV !== 'production'
              ? {
                  message: dbError instanceof Error ? dbError.message : String(dbError),
                  stack: dbError instanceof Error ? dbError.stack : undefined
                }
              : undefined
        },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('Unexpected error during login:', err)

    // Provide more detailed error information while keeping it secure
    return NextResponse.json(
      {
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : String(err)
      },
      { status: 500 }
    )
  }
}
