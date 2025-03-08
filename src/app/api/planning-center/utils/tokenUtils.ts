import { cookies } from 'next/headers'

import axios from 'axios'

// Validate if token is still valid and refresh if needed
export async function validateToken() {
  const accessToken = cookies().get('access_token')?.value
  const refreshToken = cookies().get('refresh_token')?.value
  const expiresAtStr = cookies().get('token_expires_at')?.value

  // If no access token, can't proceed
  if (!accessToken) {
    return {
      isValid: false,
      token: null,
      needsAuth: true
    }
  }

  // If token expires_at is in the future, token is still valid
  if (expiresAtStr) {
    const expiresAt = new Date(expiresAtStr)
    const now = new Date()

    // Add a 30-second buffer to account for processing time
    now.setSeconds(now.getSeconds() + 30)

    if (expiresAt > now) {
      return {
        isValid: true,
        token: accessToken,
        needsAuth: false
      }
    }
  }

  // If we have a refresh token, try to refresh
  if (refreshToken) {
    try {
      // Call our refresh endpoint
      const response = await axios.get(`${process.env.BASE_URL}/api/planning-center/refresh`)

      if (response.data.success) {
        // Get the new access token
        const newAccessToken = cookies().get('access_token')?.value

        return {
          isValid: true,
          token: newAccessToken,
          needsAuth: false
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }

  // If we get here, token validation failed
  return {
    isValid: false,
    token: null,
    needsAuth: true
  }
}
