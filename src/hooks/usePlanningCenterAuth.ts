import { useCallback } from 'react'

import { AxiosError } from 'axios'

interface UsePlanningCenterAuthReturn {
  handlePlanningCenterRequest: <T>(requestFn: () => Promise<T>) => Promise<T>
}

export const usePlanningCenterAuth = (): UsePlanningCenterAuthReturn => {
  const handlePlanningCenterRequest = useCallback(async <T>(requestFn: () => Promise<T>): Promise<T> => {
    try {
      const result = await requestFn()

      // If the API returns HTML (e.g., a login page), trigger re-auth
      if (typeof result === 'string' && result.trim().startsWith('<!DOCTYPE html')) {
        window.location.href = '/api/planning-center/auth'

        return new Promise(() => {})
      }

      return result
    } catch (error: any) {
      // Axios network error or 401
      if ((error instanceof AxiosError && error.response?.status === 401) || error.message === 'Network Error') {
        window.location.href = '/api/planning-center/auth'

        return new Promise(() => {})
      }

      throw error
    }
  }, [])

  return { handlePlanningCenterRequest }
}
