import crypto from 'crypto'

import { NextResponse } from 'next/server'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.PC_CLIENT_ID
const REDIRECT_URI = process.env.PC_REDIRECT_URI
const ENCODED_URI = encodeURIComponent(REDIRECT_URI || '')

//console.log('Client ID:', CLIENT_ID)
//console.log('Redirect URI:', REDIRECT_URI)

export async function GET() {
  try {
    // Generate a random state parameter for security
    const state = crypto.randomBytes(16).toString('hex')

    const authUrl =
      `https://api.planningcenteronline.com/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${ENCODED_URI}&` +
      `response_type=code&` +
      `scope=people services&` +
      `state=${state}`

    //console.log('Generated Authorization URL:', authUrl)

    // Always redirect to Planning Center's authorization page
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
