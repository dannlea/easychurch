import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { executeQuery } from '../db'
import { verifyAuth, unauthorized } from '../auth-utils'

// Force dynamic rendering for this route since it uses request properties
export const dynamic = 'force-dynamic'

// GET all users
export async function GET(request: NextRequest) {
  // Check authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  try {
    // Use executeQuery helper to safely handle connections
    const result = await executeQuery(async conn => {
      const sql = 'SELECT * FROM users'

      return await conn.query(sql)
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
