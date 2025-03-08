import { NextResponse } from 'next/server'

// Utilities
import { validateToken } from '../utils/tokenUtils'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

// Add token validation but keep the rest simple
export async function GET(request: Request) {
  try {
    // Validate and potentially refresh the token
    const { token, needsAuth } = await validateToken()

    if (needsAuth) {
      console.log('Token validation failed, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    // Return a successful response with the token validation status
    return NextResponse.json({
      status: 'Services API is working',
      tokenValid: true,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none' // Include a safe part of the token for debugging
    })
  } catch (error: any) {
    console.error('Services route error:', error)

    return NextResponse.json({ error: 'Services API error', message: error.message }, { status: 500 })
  }
}
