import mariadb from 'mariadb'

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'

// Create a connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: isProduction ? 5 : 2, // Increased for production
  acquireTimeout: 20000, // Reduced to 20 seconds
  idleTimeout: 30000,
  connectTimeout: 10000, // Reduced to 10 seconds
  trace: isProduction // Enable tracing in production for better debugging
})

console.log(`Database pool created with connection limit: ${isProduction ? 5 : 2}`)
console.log(
  `Database connection parameters: Host=${process.env.DB_HOST}, User=${process.env.DB_USER}, DB=${process.env.DB_NAME}`
)
console.log(`Timeouts: acquire=${20000}ms, idle=${30000}ms, connect=${10000}ms`)

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
  retries = isProduction ? 4 : 1 // More retries in production
): Promise<T> {
  let lastError: Error | null = null
  let conn: mariadb.PoolConnection | undefined = undefined

  // Log pool status at the beginning
  console.log(`[DB Query Start] Pool Status - Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}`)

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add more logging in production
      if (isProduction) {
        console.log(`Connection attempt ${attempt}/${retries}`)
      }

      // Acquire a connection from the pool with a longer timeout in production
      conn = await pool.getConnection()

      // Execute the user-provided function
      const result = await queryFn(conn)

      // Log successful query
      console.log(`Query executed successfully on attempt ${attempt}`)

      // Log pool status after success
      console.log(
        `[DB Query Success] Pool Status - Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}`
      )

      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      console.error(`Database query error (attempt ${attempt}/${retries}):`, lastError)

      // Wait a bit longer between retries in production (exponential backoff)
      if (attempt < retries && isProduction) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10 seconds

        console.log(`Waiting ${waitTime}ms before retry ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      console.log(`Retry attempt ${attempt} for database query`)

      if (attempt === retries) {
        console.error(`All ${retries} connection attempts failed. Last error:`, lastError)
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

  // Log pool status after all retries failed
  console.log(`[DB Query Failed] Pool Status - Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}`)

  // This should never happen, but TypeScript wants us to return something
  throw lastError || new Error('Unknown database error')
}
