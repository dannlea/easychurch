import mariadb from 'mariadb'

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'

// Create a connection pool with environment-specific settings
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: isProduction ? 2 : 1, // Slightly higher for production
  acquireTimeout: isProduction ? 20000 : 10000, // Longer timeout for production
  idleTimeout: isProduction ? 10000 : 5000, // Close idle connections after 10 seconds in production
  connectTimeout: isProduction ? 15000 : 5000, // Longer connect timeout for production
  // Add a trace option for better debugging
  trace: !isProduction
})

// Add a shutdown handler to properly close all connections when the app is terminated
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    pool.end().catch(err => {
      console.error('Error closing connection pool on SIGINT:', err)
    })
  })
}

// Log pool status on interval in development
if (!isProduction && typeof setInterval !== 'undefined') {
  setInterval(() => {
    console.log(`[DB Pool Status] Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}`)
  }, 60000) // Log every minute
}

export default pool

// Helper function to safely execute a database query with retry mechanism
export async function executeQuery<T>(
  queryFn: (connection: mariadb.PoolConnection) => Promise<T>,
  retries = isProduction ? 3 : 1 // More retries in production
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

      // Add timeout for connection acquisition
      const connectionPromise = pool.getConnection()

      // Set a timeout for connection acquisition
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => {
            reject(new Error(`Connection acquisition timed out after ${isProduction ? 20 : 10} seconds`))
          },
          isProduction ? 20000 : 10000
        )
      })

      // Race the connection acquisition against the timeout
      conn = (await Promise.race([connectionPromise, timeoutPromise])) as mariadb.PoolConnection

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
