import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import pool, { executeQuery } from '../db'

// Define the type for health check entries
type HealthCheckEntry = {
  status: string
  message: string
  poolInfo?: {
    activeConnections: number
    totalConnections: number
  }
}

export async function GET(request: NextRequest) {
  const healthChecks: Record<string, HealthCheckEntry> = {
    api: { status: 'ok', message: 'API is responding' },
    nextJs: { status: 'ok', message: 'Next.js is running' },
    environment: { status: 'pending', message: 'Checking environment variables...' },
    database: { status: 'pending', message: 'Not checked yet' },
    routing: { status: 'pending', message: 'Checking routing...' },
    fallback: { status: 'pending', message: 'Checking fallback data...' }
  }

  // Check environment variables
  try {
    const requiredEnvVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_SECRET_KEY',
      'NEXT_PUBLIC_API_BASE_PATH',
      'NEXT_PUBLIC_LOCAL_SERVER'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      healthChecks.environment = {
        status: 'warning',
        message: `Missing environment variables: ${missingVars.join(', ')}`
      }
    } else {
      healthChecks.environment = {
        status: 'ok',
        message: 'All required environment variables are set'
      }
    }

    // Check if NEXT_PUBLIC_LOCAL_SERVER ends with /api
    if (process.env.NEXT_PUBLIC_LOCAL_SERVER?.endsWith('/api')) {
      healthChecks.environment = {
        status: 'warning',
        message: 'NEXT_PUBLIC_LOCAL_SERVER should not end with /api'
      }
    }
  } catch (error) {
    healthChecks.environment = {
      status: 'error',
      message: `Error checking environment: ${String(error)}`
    }
  }

  // Check routing
  try {
    // Check if we're using ngrok and if so, validate the host header
    const hostHeader = request.headers.get('host') || ''
    const baseUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || ''

    if (baseUrl.includes('ngrok') && !hostHeader.includes('ngrok')) {
      healthChecks.routing = {
        status: 'warning',
        message: `Possible ngrok configuration issue. Expected ${baseUrl} but host is ${hostHeader}`
      }
    } else {
      healthChecks.routing = {
        status: 'ok',
        message: `Routing appears to be set up correctly: ${baseUrl}`
      }
    }
  } catch (error) {
    healthChecks.routing = {
      status: 'error',
      message: `Error checking routing: ${String(error)}`
    }
  }

  // Check database connection using our connection pool and executeQuery helper
  let databaseIsConnected = false

  try {
    await executeQuery(async conn => {
      const result = await conn.query('SELECT 1 as test')

      return result
    }, 2) // Add 2 retries for database connection

    databaseIsConnected = true
    healthChecks.database = {
      status: 'ok',
      message: `Successfully connected to ${process.env.DB_NAME} at ${process.env.DB_HOST}`,
      poolInfo: {
        activeConnections: pool.activeConnections(),
        totalConnections: pool.totalConnections()
      }
    }
  } catch (error) {
    healthChecks.database = {
      status: 'error',
      message: `Database connection failed: ${String(error)}`,
      poolInfo: {
        activeConnections: pool.activeConnections(),
        totalConnections: pool.totalConnections()
      }
    }
  }

  // Static check for fallback functionality
  healthChecks.fallback = {
    status: databaseIsConnected ? 'ok' : 'info',
    message: databaseIsConnected
      ? 'Database is online, fallback not needed'
      : 'Database is offline, fallback would be used'
  }

  // Get overall status
  const hasError = Object.values(healthChecks).some(check => check.status === 'error')
  const hasWarning = Object.values(healthChecks).some(check => check.status === 'warning')
  const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'ok'

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: healthChecks,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version
    }
  })
}
