import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyAuth, unauthorized } from '../../auth-utils'

// Force dynamic rendering for this route since it uses request properties
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Test authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  // If authentication successful, return user info
  return NextResponse.json({
    status: 'authenticated',
    message: 'Authentication successful',
    user: user
  })
}
