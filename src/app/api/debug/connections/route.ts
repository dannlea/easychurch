import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import pool from '../../db'

export async function GET(request: NextRequest) {
  // Get pool status
  const activeConnections = pool.activeConnections()
  const totalConnections = pool.totalConnections()

  // Get the query parameter to reset the pool if needed
  const params = new URL(request.url).searchParams
  const shouldReset = params.get('reset') === 'true'

  let resetStatus = 'not_requested'

  // If reset is requested, try to end and recreate the pool
  if (shouldReset) {
    try {
      await pool.end()
      resetStatus = 'success'
    } catch (error) {
      resetStatus = `failed: ${String(error)}`
    }
  }

  return NextResponse.json({
    poolStatus: {
      activeConnections,
      totalConnections
    },
    resetStatus,
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version
    }
  })
}
