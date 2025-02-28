import { NextResponse } from 'next/server'

// This endpoint reports on the environment configuration
export async function GET() {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    nextJsVersion: process.env.NEXT_RUNTIME || 'unknown',
    apiBasePath: process.env.NEXT_PUBLIC_API_BASE_PATH || '/api',
    databaseConfig: {
      host: process.env.DB_HOST ? 'configured' : 'missing',
      port: process.env.DB_PORT ? 'configured' : 'missing',
      user: process.env.DB_USER ? 'configured' : 'missing',
      password: process.env.DB_PASSWORD ? 'configured' : 'missing',
      database: process.env.DB_NAME ? 'configured' : 'missing'
    },
    jwtConfig: {
      secret: process.env.JWT_SECRET_KEY ? 'configured' : 'missing'
    },
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Environment configuration check',
    config: config
  })
}
