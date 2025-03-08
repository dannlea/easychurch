import crypto from 'crypto'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID

//console.log('Client ID:', CLIENT_ID)

export async function GET(request: Request) {
  try {
    // Generate a random state parameter for security
    const state = crypto.randomBytes(16).toString('hex')

    // Get host information from headers
    const headersList = headers()
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto') || 'https'
    const host = headersList.get('host')

    // Determine base URL
    let baseUrl

    if (forwardedHost) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
      console.log('Auth using forwarded host:', baseUrl)
    } else if (host) {
      baseUrl = `https://${host}`
      console.log('Auth using host header:', baseUrl)
    } else {
      const reqUrl = new URL(request.url)

      baseUrl = reqUrl.origin
      console.log('Auth using request URL origin:', baseUrl)
    }

    // Create callback URL using the same host
    const callbackUrl = `${baseUrl}/api/planning-center/callback`

    console.log('Using redirect URI:', callbackUrl)

    // Build the authorization URL with the correct callback URL
    const authUrl =
      `https://api.planningcenteronline.com/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=people services&` +
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
