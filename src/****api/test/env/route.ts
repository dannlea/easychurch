import { NextResponse } from 'next/server'

export async function GET() {
  // Only return non-sensitive environment variables
  return NextResponse.json({
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV,

      // We'll mask sensitive values but confirm they exist
      DB_HOST: process.env.DB_HOST ? '[SET]' : '[NOT SET]',
      DB_PORT: process.env.DB_PORT ? '[SET]' : '[NOT SET]',
      DB_USER: process.env.DB_USER ? '[SET]' : '[NOT SET]',
      DB_NAME: process.env.DB_NAME ? '[SET]' : '[NOT SET]',
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? '[SET]' : '[NOT SET]'
    }
  })
}
