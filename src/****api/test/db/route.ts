import { NextResponse } from 'next/server'

import pool from '../../db'

export async function GET() {
  let conn = null

  try {
    // Get a connection from the pool
    conn = await pool.getConnection()

    // Simple query to test database connection
    const result = await conn.query('SELECT 1 as test')

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      result: result
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
        error: errorDetails
      },
      { status: 500 }
    )
  } finally {
    // Ensure the connection is released even if there's an error
    if (conn) {
      try {
        conn.release()
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError)
      }
    }
  }
}
