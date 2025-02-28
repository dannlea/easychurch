'use client'

import { useState } from 'react'

// Helper component to display error details
const ErrorDisplay = ({ error }: { error: any }) => {
  return (
    <div className='bg-red-50 border border-red-200 text-red-800 p-3 rounded mt-2'>
      <p className='font-semibold'>Error:</p>
      <p>{error.message || String(error)}</p>
      {error.status && <p>Status: {error.status}</p>}
      {error.responseText && (
        <div>
          <p className='font-semibold mt-2'>Response:</p>
          <pre className='bg-red-100 p-2 rounded text-xs overflow-auto max-h-32'>{error.responseText}</pre>
        </div>
      )}
      {error.stack && (
        <details className='mt-2'>
          <summary className='cursor-pointer'>Stack Trace</summary>
          <pre className='bg-red-100 p-2 rounded text-xs overflow-auto max-h-32'>{error.stack}</pre>
        </details>
      )}
    </div>
  )
}

// Example React component that tests the API endpoints
export function ApiTester() {
  const [health, setHealth] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [token, setToken] = useState<string>('')
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [envVars, setEnvVars] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  // Enhanced fetch function with better error handling
  const fetchWithErrorHandling = async (url: string, options = {}) => {
    try {
      const response = await fetch(url, options)

      // Log response details for debugging
      console.log(`[DEBUG] Response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        type: response.type,
        url: response.url
      })

      // Try to parse as JSON
      try {
        const data = await response.json()

        return { success: true, data }
      } catch (error: any) {
        // If JSON parsing fails, get the text content
        const text = await response.clone().text()

        throw {
          message: `JSON parsing error: ${error.message}`,
          status: response.status,
          statusText: response.statusText,
          responseText: text
        }
      }
    } catch (error) {
      // If it's already our error format, just pass it along
      if (error && typeof error === 'object' && 'message' in error) {
        throw error
      }

      // Otherwise format the error
      const errorMessage = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined

      throw {
        message: `Request failed: ${errorMessage}`,
        stack
      }
    }
  }

  // Check health endpoint
  const checkHealth = async () => {
    setLoading({ ...loading, health: true })
    setHealth(null)

    try {
      const result = await fetchWithErrorHandling('/api/health')

      setHealth(result.data)
    } catch (error) {
      console.error('Health check error:', error)
      setHealth({ error })
    } finally {
      setLoading({ ...loading, health: false })
    }
  }

  // Check DB connection
  const checkDb = async () => {
    setLoading({ ...loading, db: true })
    setDbStatus(null)

    try {
      const result = await fetchWithErrorHandling('/api/test/db')

      setDbStatus(result.data)
    } catch (error) {
      console.error('DB check error:', error)
      setDbStatus({ error })
    } finally {
      setLoading({ ...loading, db: false })
    }
  }

  // Generate a test token
  const generateToken = async () => {
    setLoading({ ...loading, token: true })

    try {
      const result = await fetchWithErrorHandling('/api/test/generate-token')

      if (result.data.token) {
        setToken(result.data.token)
      }
    } catch (error) {
      console.error('Token generation error:', error)

      // Show error in UI
      setAuthStatus({ error })
    } finally {
      setLoading({ ...loading, token: false })
    }
  }

  // Test authentication
  const testAuth = async () => {
    if (!token) {
      alert('Please generate a token first')

      return
    }

    setLoading({ ...loading, auth: true })
    setAuthStatus(null)

    try {
      const result = await fetchWithErrorHandling('/api/test/auth', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setAuthStatus(result.data)
    } catch (error) {
      console.error('Auth test error:', error)
      setAuthStatus({ error })
    } finally {
      setLoading({ ...loading, auth: false })
    }
  }

  // Check environment variables
  const checkEnv = async () => {
    setLoading({ ...loading, env: true })
    setEnvVars(null)

    try {
      const result = await fetchWithErrorHandling('/api/test/config')

      setEnvVars(result.data)
    } catch (error) {
      console.error('Env check error:', error)
      setEnvVars({ error })
    } finally {
      setLoading({ ...loading, env: false })
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  // Upload a file
  const uploadFile = async () => {
    if (!file) {
      alert('Please select a file first')

      return
    }

    setLoading({ ...loading, upload: true })
    setUploadResult(null)

    try {
      const formData = new FormData()

      formData.append('file', file)

      const response = await fetch('/api/test/upload', {
        method: 'POST',
        body: formData
      })

      // Log response details
      console.log('[DEBUG] File Upload Response:', {
        status: response.status,
        statusText: response.statusText
      })

      try {
        const data = await response.json()

        setUploadResult(data)
      } catch (error: any) {
        const text = await response.text()

        setUploadResult({
          error: {
            message: `JSON parsing error: ${error.message}`,
            responseText: text
          }
        })
      }
    } catch (error) {
      console.error('File upload error:', error)
      setUploadResult({ error })
    } finally {
      setLoading({ ...loading, upload: false })
    }
  }

  // Helper to render response or error
  const renderResponse = (data: any) => {
    if (!data) return null

    if (data.error) {
      return <ErrorDisplay error={data.error} />
    }

    return <pre className='mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-60'>{JSON.stringify(data, null, 2)}</pre>
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>API Tester</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Health Check */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>Health Check</h2>
          <button onClick={checkHealth} disabled={loading.health} className='bg-blue-500 text-white px-4 py-2 rounded'>
            {loading.health ? 'Checking...' : 'Check Health'}
          </button>
          {renderResponse(health)}
        </div>

        {/* Database Check */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>Database Check</h2>
          <button onClick={checkDb} disabled={loading.db} className='bg-blue-500 text-white px-4 py-2 rounded'>
            {loading.db ? 'Checking...' : 'Check Database'}
          </button>
          {renderResponse(dbStatus)}
        </div>

        {/* Token Generation */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>Token Generation</h2>
          <button onClick={generateToken} disabled={loading.token} className='bg-blue-500 text-white px-4 py-2 rounded'>
            {loading.token ? 'Generating...' : 'Generate Token'}
          </button>
          {token && (
            <div className='mt-2'>
              <p className='font-semibold'>Token:</p>
              <div className='bg-gray-100 p-2 rounded break-all'>
                <small>{token}</small>
              </div>
            </div>
          )}
        </div>

        {/* Auth Test */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>Authentication Test</h2>
          <button
            onClick={testAuth}
            disabled={loading.auth || !token}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            {loading.auth ? 'Testing...' : 'Test Auth'}
          </button>
          {!token && <p className='text-sm text-red-500 mt-1'>Generate a token first</p>}
          {renderResponse(authStatus)}
        </div>

        {/* Environment Variables */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>Environment Variables</h2>
          <button onClick={checkEnv} disabled={loading.env} className='bg-blue-500 text-white px-4 py-2 rounded'>
            {loading.env ? 'Checking...' : 'Check Env Variables'}
          </button>
          {renderResponse(envVars)}
        </div>

        {/* File Upload */}
        <div className='border p-4 rounded'>
          <h2 className='text-xl font-semibold mb-2'>File Upload</h2>
          <div className='mb-2'>
            <input type='file' onChange={handleFileChange} className='mb-2' />
          </div>
          <button
            onClick={uploadFile}
            disabled={loading.upload || !file}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            {loading.upload ? 'Uploading...' : 'Upload File'}
          </button>
          {renderResponse(uploadResult)}
          {uploadResult && !uploadResult.error && uploadResult.url && (
            <div className='mt-2'>
              <a href={uploadResult.url} target='_blank' rel='noopener noreferrer' className='text-blue-500 underline'>
                View Uploaded File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
