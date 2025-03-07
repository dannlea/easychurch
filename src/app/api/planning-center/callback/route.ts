import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'

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

    // Get the host from the request
    const requestUrl = new URL(request.url)
    const host = requestUrl.origin

    // Build a dynamic redirect URI based on the current host
    const dynamicRedirectUri = `${host}/api/planning-center/callback`

    // Use dynamic redirect URI or fall back to environment variable
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
    return NextResponse.redirect(`${host}/birthdays`)
  } catch (error: any) {
    console.error('Error during token exchange:', error)

    // Use the request origin as the base URL for redirects
    const baseUrl = new URL(request.url).origin

    return NextResponse.redirect(`${baseUrl}/login`)
  }
}
