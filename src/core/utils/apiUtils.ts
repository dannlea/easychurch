/**
 * API Utility Functions
 *
 * This module provides functions for working with API URLs and requests
 * to ensure consistent formatting and error handling.
 */

/**
 * Gets the base URL for API requests, ensuring proper format
 * - Removes trailing slashes from NEXT_PUBLIC_LOCAL_SERVER
 * - Returns the normalized server URL without the API path
 */
export const getApiBaseUrl = (): string => {
  // Get configured server URL from env with fallback
  const serverUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || 'https://easychurch.onrender.com'

  // Remove trailing slash if present
  const normalizedServerUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl

  // Log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`API Base URL (server): ${normalizedServerUrl}`)
  }

  return normalizedServerUrl
}

/**
 * Gets the API path prefix from environment variable
 * - Ensures it starts with a slash
 * - Does not end with a slash
 */
export const getApiPath = (): string => {
  // Get API base path from env with fallback
  const apiPath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api'

  // Ensure it starts with a slash
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`

  // Remove trailing slash if present
  return normalizedPath.endsWith('/') ? normalizedPath.slice(0, -1) : normalizedPath
}

/**
 * Builds a complete API endpoint URL
 * @param endpoint The API endpoint path (without /api prefix)
 * @returns The full URL to the API endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  const apiPath = getApiPath()

  // Ensure endpoint doesn't start with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Return the complete URL
  const fullUrl = `${baseUrl}${apiPath}/${normalizedEndpoint}`

  if (process.env.NODE_ENV === 'development') {
    console.log(`Built API URL: ${fullUrl}`)
  }

  return fullUrl
}

/**
 * Builds a server-side API URL for internal API calls
 * Used within API routes to make internal API calls
 *
 * @param endpoint - The API endpoint to call (without leading slash)
 * @param request - Optional NextRequest object to extract host information
 * @returns Full URL to the API endpoint
 */
export function buildServerApiUrl(endpoint: string, request?: Request): string {
  // Don't use request.nextUrl.origin as it returns localhost which fails for server-side fetches
  const baseUrl =
    process.env.NEXT_PUBLIC_LOCAL_SERVER ||
    (request?.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000')

  // Ensure baseUrl doesn't have trailing slash
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  // Get API path
  const apiPath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api'

  // Ensure API path starts with a slash and doesn't end with one
  const normalizedApiPath = !apiPath.startsWith('/') ? `/${apiPath}` : apiPath
  const cleanApiPath = normalizedApiPath.endsWith('/') ? normalizedApiPath.slice(0, -1) : normalizedApiPath

  // Ensure endpoint doesn't start with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Build the complete URL
  const url = `${normalizedBaseUrl}${cleanApiPath}/${normalizedEndpoint}`

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Server] API URL: ${url}`)
  }

  return url
}
