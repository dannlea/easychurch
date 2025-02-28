import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import jwt from 'jsonwebtoken'

// Verify the JWT token from the request
export const verifyAuth = (request: NextRequest) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string)

    return decoded
  } catch (error) {
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
