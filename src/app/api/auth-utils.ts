import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import jwt from 'jsonwebtoken'

// Verify the JWT token from the request
export const verifyAuth = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      console.log('No authorization header found')

      return null
    }

    const parts = authHeader.split(' ')

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Authorization header is not in Bearer format')

      return null
    }

    const token = parts[1]

    if (!token) {
      console.log('No token found in authorization header')

      return null
    }

    const secret = process.env.JWT_SECRET_KEY

    if (!secret) {
      console.error('JWT_SECRET_KEY environment variable is not set')

      return null
    }

    const decoded = jwt.verify(token, secret)

    console.log('Token verified successfully:', decoded)

    return decoded
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification error:', error.message)
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired')
    } else {
      console.error('Error verifying JWT token:', error)
    }

    return null
  }
}

// Create an unauthorized response
export const unauthorized = () => {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
}

// Create a forbidden response
export const forbidden = () => {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
}
