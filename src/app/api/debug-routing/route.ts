import path from 'path'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Get information about the request
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)

  // Extract the base URL (protocol + hostname) from the request
  const baseUrl = `${url.protocol}//${url.host}`

  // Get the correct URL for server-side API calls
  const ngrokUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || ''
  const hostHeader = request.headers.get('host') || ''
  const xForwardedHost = request.headers.get('x-forwarded-host') || ''

  // Create a server-side safe base URL
  const serverSideBaseUrl = ngrokUrl || (xForwardedHost ? `https://${xForwardedHost}` : baseUrl)

  // Construct various test URLs
  const testUrls = [
    '/api/diagnose',
    '/api/users/2',
    '/api/users-simple/2',
    '/api/debug',
    '/api/assets/avatar-c984ebee-5bc5-4ba4-be3c-ae0f716a9166.png'
  ]

  // Create full URLs for client and server side
  const clientUrls = testUrls.map(url => `${baseUrl}${url}`)
  const serverUrls = testUrls.map(url => `${serverSideBaseUrl}${url}`)

  // Create a summary of environment variables that might affect routing
  const routingEnvVars: Record<string, string | undefined> = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_PATH: process.env.NEXT_PUBLIC_API_BASE_PATH,
    NEXT_PUBLIC_LOCAL_SERVER: process.env.NEXT_PUBLIC_LOCAL_SERVER,
    BASE_URL: process.env.BASE_URL
  }

  // Return the diagnostic information
  return NextResponse.json({
    message: 'Routing Diagnostic Information',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    requestInfo: {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      params
    },
    baseUrl,
    ngrokUrl,
    hostHeader,
    xForwardedHost,
    serverSideBaseUrl,
    clientUrls,
    serverUrls,
    routingEnvironment: routingEnvVars,
    pathInfo: {
      currentFilePath: __filename,
      relativePath: path.relative(process.cwd(), __filename),
      cwd: process.cwd()
    }
  })
}
