import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * A simple endpoint to test URL routing
 * This will help diagnose if URLs are being constructed correctly
 */
export async function GET(request: NextRequest) {
  // Get request information
  const url = request.url
  const headers = Object.fromEntries(request.headers)

  // Get API configuration
  const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api'
  const serverUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || 'https://easychurch.onrender.com'

  // Construct example URLs for different endpoints
  const loginUrl = `${serverUrl}${apiBasePath}/auth/login`
  const userUrl = `${serverUrl}${apiBasePath}/users/2`

  return NextResponse.json({
    message: 'URL test endpoint',
    timestamp: new Date().toISOString(),
    requestInfo: {
      receivedUrl: url,
      method: request.method,
      headers: headers
    },
    environment: {
      apiBasePath: apiBasePath,
      serverUrl: serverUrl,
      nodeEnv: process.env.NODE_ENV
    },
    exampleUrls: {
      login: loginUrl,
      user: userUrl
    }
  })
}
