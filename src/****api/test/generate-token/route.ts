import { NextResponse } from 'next/server'

import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    // In a production environment, this route should be disabled
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          status: 'error',
          message: 'This endpoint is only available in development mode'
        },
        { status: 403 }
      )
    }

    const SECRET_KEY = process.env.JWT_SECRET_KEY as string

    if (!SECRET_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'JWT_SECRET_KEY not configured in environment variables'
        },
        { status: 500 }
      )
    }

    // Create a test user token
    const token = jwt.sign(
      {
        id: 9999,
        name: 'Test',
        lastName: 'User',
        role: 'admin',
        profilePicture: null,
        organization: 'Test Organization',
        organizationId: 1,
        organizationRole: 'admin'
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    )

    return NextResponse.json({
      status: 'ok',
      message: 'Test token generated successfully',
      token,
      usage: 'Include this token in the Authorization header as: Bearer [token]'
    })
  } catch (error) {
    console.error('Error generating test token:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Token generation failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
