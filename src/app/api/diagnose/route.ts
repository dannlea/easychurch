import fs from 'fs'

import path from 'path'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the directory structure for API routes
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api')

    // Function to get directory structure
    const getDirStructure = (dir: string, basePath = ''): any => {
      const result: Record<string, any> = {}

      try {
        const files = fs.readdirSync(dir)

        for (const file of files) {
          const filePath = path.join(dir, file)
          const relativePath = path.join(basePath, file)
          const stat = fs.statSync(filePath)

          if (stat.isDirectory()) {
            result[file] = getDirStructure(filePath, relativePath)
          } else {
            result[file] = {
              size: stat.size,
              path: relativePath
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error)

        return { error: String(error) }
      }

      return result
    }

    // Get environment variables (removing sensitive ones)
    const safeEnv: Record<string, string> = {}

    for (const [key, value] of Object.entries(process.env)) {
      if (value && !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY')) {
        safeEnv[key] = value
      } else if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
        safeEnv[key] = '[REDACTED]'
      }
    }

    // Return diagnostic information
    return NextResponse.json({
      status: 'ok',
      message: 'Diagnostic information',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      apiRoutes: getDirStructure(apiDir),
      env: safeEnv,
      requestInfo: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers)
      }
    })
  } catch (error) {
    console.error('Error in diagnostic endpoint:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Error retrieving diagnostic information',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
