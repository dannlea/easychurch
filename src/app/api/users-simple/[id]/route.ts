import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create a sample user for testing
    const user = {
      id: parseInt(params.id),
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      organization_name: 'Test Organization',
      phone_number: '555-123-4567',
      address: '123 Test St',
      state: 'Test State',
      zip_code: '12345',
      country: 'Test Country',
      language: 'en',
      time_zone: 'gmt-05',
      currency: 'usd',
      profile_picture: '/images/placeholder.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in users-simple API route:', error)

    return NextResponse.json({ error: 'Failed to get user', details: String(error) }, { status: 500 })
  }
}
