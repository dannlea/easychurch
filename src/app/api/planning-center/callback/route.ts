import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID
const CLIENT_SECRET = process.env.PC_CLIENT_SECRET

// Default values from environment
const DEFAULT_REDIRECT_URI = process.env.PC_REDIRECT_URI

/*console.log("Client ID:", CLIENT_ID);
console.log("Client Secret:", CLIENT_SECRET ? "Exists" : "Missing");
console.log("Redirect URI:", REDIRECT_URI);*/

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      console.log('No authorization code found')

      return NextResponse.redirect(new URL('/login', request.url))
    }

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
      console.log('Using forwarded host for callback:', actualHost)
    } else if (host) {
      // Fall back to the regular host header
      actualHost = `https://${host}`
      console.log('Using host header for callback:', actualHost)
    } else {
      // Last resort - parse from request URL
      const requestUrl = new URL(request.url)

      actualHost = requestUrl.origin
      console.log('Using request URL origin for callback:', actualHost)
    }

    // Build a dynamic redirect URI based on the detected host
    const dynamicRedirectUri = `${actualHost}/api/planning-center/callback`
    const redirectUri = dynamicRedirectUri || DEFAULT_REDIRECT_URI || ''

    console.log('Using redirect URI for token exchange:', redirectUri)

    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post('https://api.planningcenteronline.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })

    const accessToken = tokenResponse.data.access_token

    // Store the access token in cookies
    cookies().set('access_token', accessToken, {
      httpOnly: true,
      secure: true
    })

    console.log('Access token received and stored')

    // Use the same host for the redirect back to the application
    return NextResponse.redirect(`${actualHost}/service-plans`)
  } catch (error: any) {
    console.error('Error during token exchange:', error)

    // Get host for error redirect
    const headersList = headers()
    const xForwardedHost = headersList.get('x-forwarded-host')
    const xForwardedProto = headersList.get('x-forwarded-proto') || 'https'
    const host = headersList.get('host')

    let baseUrl = 'https://localhost:3000'

    if (xForwardedHost) {
      baseUrl = `${xForwardedProto}://${xForwardedHost}`
    } else if (host) {
      baseUrl = `https://${host}`
    }

    return NextResponse.redirect(`${baseUrl}/login`)
  }
}
