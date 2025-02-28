import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyAuth, unauthorized } from '../../auth-utils'

// Public endpoint that does not require authentication
export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'This is a public endpoint that does not require authentication',
    endpoints: {
      'GET /api/health': 'Health check endpoint',
      'GET /api/test/db': 'Test database connectivity',
      'GET /api/test/auth': 'Test authentication (requires token)',
      'POST /api/test/upload': 'Test file uploads (requires token)',
      'POST /api/test/user': 'Create a test user (development only)',
      'GET /api/test/endpoints': 'This list of endpoints (public)',
      'POST /api/test/endpoints': 'Secured version of this endpoint (requires token)'
    }
  })
}

// Secured endpoint that requires authentication
export async function POST(request: NextRequest) {
  // Check authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  return NextResponse.json({
    status: 'success',
    message: 'This is a secured endpoint that requires authentication',
    user: user,
    serverTime: new Date().toISOString()
  })
}
