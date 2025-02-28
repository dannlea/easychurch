import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {}

  try {
    // Determine the correct base URL for server-side API calls
    // Don't use request.nextUrl.origin as it returns localhost which fails for server-side fetches
    const baseUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || request.headers.get('host') || 'http://localhost:3000'

    // Ensure baseUrl doesn't have trailing slash
    const apiBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    console.log(`Using base URL for API tests: ${apiBase}`)

    // Test the users/2 endpoint with auth
    try {
      // Try without auth first
      const response1 = await fetch(`${apiBase}/api/users/2`)

      results['users/2-no-auth'] = {
        status: response1.status,
        statusText: response1.statusText,
        headers: Object.fromEntries(response1.headers.entries()),
        ok: response1.ok
      }

      if (response1.ok) {
        try {
          results['users/2-no-auth'].body = await response1.json()
        } catch (e) {
          results['users/2-no-auth'].body = 'Error parsing JSON'
        }
      } else {
        try {
          results['users/2-no-auth'].text = await response1.text()
        } catch (e) {
          results['users/2-no-auth'].text = 'Error getting text'
        }
      }
    } catch (error) {
      results['users/2-no-auth'] = { error: String(error) }
    }

    // Test the users-simple/2 endpoint
    try {
      const response2 = await fetch(`${apiBase}/api/users-simple/2`)

      results['users-simple/2'] = {
        status: response2.status,
        statusText: response2.statusText,
        headers: Object.fromEntries(response2.headers.entries()),
        ok: response2.ok
      }

      if (response2.ok) {
        try {
          results['users-simple/2'].body = await response2.json()
        } catch (e) {
          results['users-simple/2'].body = 'Error parsing JSON'
        }
      } else {
        try {
          results['users-simple/2'].text = await response2.text()
        } catch (e) {
          results['users-simple/2'].text = 'Error getting text'
        }
      }
    } catch (error) {
      results['users-simple/2'] = { error: String(error) }
    }

    // Check if the assets route handles /assets correctly
    try {
      const response3 = await fetch(`${apiBase}/api/assets/avatar-c984ebee-5bc5-4ba4-be3c-ae0f716a9166.png`)

      results['assets/avatar'] = {
        status: response3.status,
        statusText: response3.statusText,
        headers: Object.fromEntries(response3.headers.entries()),
        ok: response3.ok,
        type: response3.type
      }
    } catch (error) {
      results['assets/avatar'] = { error: String(error) }
    }

    return NextResponse.json({
      message: 'API Endpoint Test Results',
      timestamp: new Date().toISOString(),
      requestOrigin: request.nextUrl.origin,
      actualBaseUrl: apiBase,
      envBaseUrl: process.env.NEXT_PUBLIC_LOCAL_SERVER,
      requestHost: request.headers.get('host'),
      results
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Error testing endpoints',
        error: String(error)
      },
      { status: 500 }
    )
  }
}
