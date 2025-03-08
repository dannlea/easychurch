import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID
const CLIENT_SECRET = process.env.PC_CLIENT_SECRET

export async function GET() {
  try {
    const refreshToken = cookies().get('refresh_token')?.value

    if (!refreshToken) {
      console.error('No refresh token found')

      return NextResponse.json({ error: 'No refresh token found' }, { status: 401 })
    }

    // Request new access token using the refresh token
    const response = await axios.post('https://api.planningcenteronline.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const { access_token, refresh_token, expires_in } = response.data

    // Calculate expiration time
    const expiresAt = new Date()

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    // Store the new tokens
    cookies().set('access_token', access_token, {
      httpOnly: true,
      secure: true
    })

    if (refresh_token) {
      cookies().set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: true
      })
    }

    cookies().set('token_expires_at', expiresAt.toISOString(), {
      httpOnly: true,
      secure: true
    })

    console.log('Token refreshed successfully')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error refreshing token:', error.response?.data || error.message)

    // Clear cookies on refresh failure
    cookies().delete('access_token')
    cookies().delete('refresh_token')
    cookies().delete('token_expires_at')

    return NextResponse.json({ error: 'Failed to refresh token' }, { status: error.response?.status || 500 })
  }
}
