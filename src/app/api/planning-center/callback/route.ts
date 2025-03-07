import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID
const CLIENT_SECRET = process.env.PC_CLIENT_SECRET
const REDIRECT_URI = process.env.PC_REDIRECT_URI
const BASE_URL = process.env.BASE_URL

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

    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post('https://api.planningcenteronline.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Calculate expiration time
    const expiresAt = new Date()

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    // Store the access token, refresh token and expiration in cookies
    cookies().set('access_token', access_token, {
      httpOnly: true,
      secure: true
    })

    cookies().set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true
    })

    cookies().set('token_expires_at', expiresAt.toISOString(), {
      httpOnly: true,
      secure: true
    })

    console.log('Access token and refresh token received and stored')

    // Redirect to the dashboard or another page
    return NextResponse.redirect(`${BASE_URL}/`)
  } catch (error: any) {
    console.error('Error during token exchange:', error)

    return NextResponse.redirect(`${BASE_URL}/login`)
  }
}
