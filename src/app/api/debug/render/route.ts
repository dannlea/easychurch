import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import pool, { executeQuery } from '../../db'

export async function GET(request: NextRequest) {
  // Get relevant environment information
  const environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platformInfo: {
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    database: {
      host: process.env.DB_HOST ? `${process.env.DB_HOST.split('.')[0]}...` : 'not-set', // Partially redacted
      port: process.env.DB_PORT || 'not-set',
      database: process.env.DB_NAME || 'not-set',
      user: process.env.DB_USER ? `${process.env.DB_USER.substring(0, 3)}...` : 'not-set' // Partially redacted
    },
    publicEnv: {
      NEXT_PUBLIC_API_BASE_PATH: process.env.NEXT_PUBLIC_API_BASE_PATH,
      NEXT_PUBLIC_LOCAL_SERVER: process.env.NEXT_PUBLIC_LOCAL_SERVER
    }
  }

  // Check database connectivity
  let dbStatus = 'not_checked'
  let dbError = null

  const poolInfo = {
    activeConnections: pool.activeConnections(),
    totalConnections: pool.totalConnections()
  }

  try {
    // Try a simple database query
    const result = await executeQuery(async conn => {
      return await conn.query('SELECT 1 as test')
    }, 1)

    dbStatus = 'connected'

    // Include the query result in the response
    dbStatus = `connected (${JSON.stringify(result)})`
  } catch (error) {
    dbStatus = 'error'
    dbError =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
          }
        : String(error)
  }

  // Test JWT functionality
  let jwtStatus = 'not_checked'
  let jwtError = null

  try {
    const jwt = require('jsonwebtoken')

    const testToken = process.env.JWT_SECRET_KEY
      ? jwt.sign({ test: true }, process.env.JWT_SECRET_KEY, { expiresIn: '1m' })
      : null

    jwtStatus = testToken ? 'working' : 'missing_secret'
  } catch (error) {
    jwtStatus = 'error'
    jwtError = error instanceof Error ? error.message : String(error)
  }

  // Get request details
  const requestInfo = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers)
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment,
    poolStatus: {
      status: dbStatus,
      error: dbError,
      ...poolInfo
    },
    jwtStatus: {
      status: jwtStatus,
      error: jwtError
    },
    requestInfo
  })
}
