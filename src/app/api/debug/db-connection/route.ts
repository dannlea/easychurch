import { NextResponse } from 'next/server'

import mariadb from 'mariadb'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME

      // Don't include password for security reasons
    }
  }

  // Create a standalone connection for testing
  let conn = null

  try {
    console.log('Attempting direct database connection...')

    // Test with explicit connection parameters
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000, // 30 seconds
      socketTimeout: 60000 // 1 minute
    })

    console.log('Database connection established successfully')

    // Run a simple query
    const rows = await conn.query('SELECT 1 as connection_test')

    results.directConnection = {
      success: true,
      message: 'Direct connection successful',
      result: rows
    }

    // Get server information
    const serverInfo = await conn.query('SELECT VERSION() as version')

    results.serverInfo = serverInfo[0]

    // Check connection count
    const processQuery = await conn.query('SHOW PROCESSLIST')

    results.processCount = processQuery.length

    // Show a summary of processes
    results.processes = processQuery.map((proc: any) => ({
      id: proc.Id,
      user: proc.User,
      host: proc.Host,
      db: proc.db,
      command: proc.Command,
      time: proc.Time,
      state: proc.State
    }))

    return NextResponse.json({
      status: 'success',
      message: 'Database connection test successful',
      results
    })
  } catch (error) {
    console.error('Database direct connection test failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection test failed',
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
        results
      },
      { status: 500 }
    )
  } finally {
    if (conn) {
      try {
        await conn.end()
        console.log('Connection closed successfully')
      } catch (error) {
        console.error('Error closing connection:', error)
      }
    }
  }
}
