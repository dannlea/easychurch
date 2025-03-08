import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID
const CLIENT_SECRET = process.env.PC_CLIENT_SECRET

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      console.log('No authorization code found')

      return NextResponse.redirect('/login')
    }

    // Get host information from headers
    const headersList = headers()
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto') || 'https'
    const host = headersList.get('host')

    // Determine base URL
    let baseUrl

    if (forwardedHost) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
      console.log('Callback using forwarded host:', baseUrl)
    } else if (host) {
      baseUrl = `https://${host}`
      console.log('Callback using host header:', baseUrl)
    } else {
      const reqUrl = new URL(request.url)

      baseUrl = reqUrl.origin
      console.log('Callback using request URL origin:', baseUrl)
    }

    // Create callback URL using the same host
    const callbackUrl = `${baseUrl}/api/planning-center/callback`

    console.log('Using redirect URI for token exchange:', callbackUrl)

    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post('https://api.planningcenteronline.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
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

    // Redirect to the service plans page using the same host
    return NextResponse.redirect(`${baseUrl}/service-plans`)
  } catch (error: any) {
    console.error('Error during token exchange:', error)

    // Get host for error redirect
    const headersList = headers()
    const forwardedHost = headersList.get('x-forwarded-host')
    const forwardedProto = headersList.get('x-forwarded-proto') || 'https'
    const host = headersList.get('host')

    let baseUrl = 'https://localhost:3000'

    if (forwardedHost) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
    } else if (host) {
      baseUrl = `https://${host}`
    }

    return NextResponse.redirect(`${baseUrl}/login`)
  }
}
