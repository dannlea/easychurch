import { NextResponse } from 'next/server'

// This handles all requests to /api root and ensures CORS is properly handled
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  })
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT',
      'Access-Control-Allow-Headers':
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    }
  })
}
