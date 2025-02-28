import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('API is working', {
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}
