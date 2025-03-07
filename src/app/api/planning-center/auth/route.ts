import crypto from 'crypto'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID

// Get default redirect URI from environment
const DEFAULT_REDIRECT_URI = process.env.PC_REDIRECT_URI

//console.log('Client ID:', CLIENT_ID)
//console.log('Redirect URI:', DEFAULT_REDIRECT_URI)

export async function GET(request: Request) {
  try {
    // Generate a random state parameter for security
    const state = crypto.randomBytes(16).toString('hex')

    // Get headers to check for forwarded host
    const headersList = headers()
    const xForwardedHost = headersList.get('x-forwarded-host')
    const xForwardedProto = headersList.get('x-forwarded-proto') || 'https'
    const host = headersList.get('host')

    // Determine the actual host, prioritizing forwarded headers for proxies like ngrok
    let actualHost: string

    if (xForwardedHost) {
      // Use forwarded host (e.g., from ngrok)
      actualHost = `${xForwardedProto}://${xForwardedHost}`
      console.log('Using forwarded host:', actualHost)
    } else if (host) {
      // Fall back to the regular host header
      actualHost = `https://${host}`
      console.log('Using host header:', actualHost)
    } else {
      // Last resort - parse from request URL
      const requestUrl = new URL(request.url)

      actualHost = requestUrl.origin
      console.log('Using request URL origin:', actualHost)
    }

    // Build a dynamic redirect URI based on the detected host
    const dynamicRedirectUri = `${actualHost}/api/planning-center/callback`
    const redirectUri = dynamicRedirectUri || DEFAULT_REDIRECT_URI || ''
    const encodedUri = encodeURIComponent(redirectUri)

    console.log('Using redirect URI:', redirectUri)

    const authUrl =
      `https://api.planningcenteronline.com/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodedUri}&` +
      `response_type=code&` +
      `scope=people services&` + // Include both people and services scopes
      `state=${state}`

    console.log('Generated Authorization URL:', authUrl)

    // Redirect to the Planning Center authorization page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Auth route error:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate authorization URL',
        details: error.message
      },
      {
        status: 500
      }
    )
  }
}
