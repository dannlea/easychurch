import { NextResponse } from 'next/server'

import pool, { executeQuery } from '../../db'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use the executeQuery helper function with a timeout
    const result = await Promise.race([
      executeQuery(async conn => {
        // Simple query to test database connection
        return await conn.query('SELECT 1 as test')
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000))
    ])

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      result: result,
      poolInfo: {
        activeConnections: pool.activeConnections(),
        totalConnections: pool.totalConnections()
      }
    })
  } catch (error) {
    console.error('Database connection test failed:', error)

    // More detailed error information for debugging
    let errorMessage: string
    let errorDetails: any

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }
    } else {
      errorMessage = String(error)
      errorDetails = { raw: String(error) }
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        errorMessage: errorMessage,
        error: errorDetails,
        poolInfo: {
          activeConnections: pool.activeConnections(),
          totalConnections: pool.totalConnections()
        }
      },
      { status: 500 }
    )
  }
}
