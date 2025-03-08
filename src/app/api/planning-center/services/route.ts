import { NextResponse } from 'next/server'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

// Simple test route that doesn't rely on imports
export async function GET() {
  try {
    // Return a simple response to test if the route is working
    return NextResponse.json({ status: 'Services API is working' })
  } catch (error: any) {
    console.error('Services route error:', error)

    return NextResponse.json({ error: 'Services API error' }, { status: 500 })
  }
}
