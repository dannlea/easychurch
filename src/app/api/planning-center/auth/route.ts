import crypto from 'crypto'

import { NextResponse } from 'next/server'

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

    // Get the host from the request
    const requestUrl = new URL(request.url)
    const host = requestUrl.origin

    // Build a dynamic redirect URI based on the current host
    const dynamicRedirectUri = `${host}/api/planning-center/callback`

    // Use dynamic redirect URI or fall back to environment variable
    const redirectUri = dynamicRedirectUri || DEFAULT_REDIRECT_URI || ''
    const encodedUri = encodeURIComponent(redirectUri)

    console.log('Using redirect URI:', redirectUri)

    const authUrl =
      `https://api.planningcenteronline.com/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodedUri}&` +
      `response_type=code&` +
      `scope=people services&` + // Add services scope to the requested scopes
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
