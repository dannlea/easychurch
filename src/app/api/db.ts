import mariadb from 'mariadb'

// Create a connection pool with reduced connections for shared hosting
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 1, // Further reduced to 1 to ensure we don't exceed limits
  acquireTimeout: 10000, // 10 seconds timeout for connection acquisition
  idleTimeout: 5000, // Close idle connections after 5 seconds
  connectTimeout: 5000 // 5 seconds to establish initial connection
})

// Add a shutdown handler to properly close all connections when the app is terminated
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    pool.end().catch(err => {
      console.error('Error closing connection pool on SIGINT:', err)
    })
  })
}

export default pool

// Helper function to safely execute a database query with retry mechanism
export async function executeQuery<T>(
  queryFn: (connection: mariadb.PoolConnection) => Promise<T>,
  retries = 1
): Promise<T> {
  let conn: mariadb.PoolConnection | undefined
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If this isn't the first attempt, wait a bit before retrying
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for database query`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
      }

      // Log connection pool status
      console.log(`[DB Pool Status] Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}`)

      conn = await pool.getConnection()
      console.log('Connection acquired successfully')

      const result = await queryFn(conn)

      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Database query error (attempt ${attempt + 1}/${retries + 1}):`, error)

      // If we have a connection and an error, try to release it
      if (conn) {
        try {
          await conn.release()
          console.log('Connection released after error')
        } catch (releaseError) {
          console.error('Error releasing connection after query error:', releaseError)
        } finally {
          conn = undefined
        }
      }

      // If this was our last retry, throw the error
      if (attempt === retries) {
        throw lastError
      }
    } finally {
      // Always try to release the connection if it exists
      if (conn) {
        try {
          await conn.release()
          console.log('Connection released successfully')
        } catch (releaseError) {
          console.error('Error releasing connection:', releaseError)
        }
      }
    }
  }

  // This should never happen, but TypeScript wants us to return something
  throw lastError || new Error('Unknown database error')
}
