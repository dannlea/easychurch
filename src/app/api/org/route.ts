import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { JwtPayload } from 'jsonwebtoken'

import pool from '../../../****api/db'
import { verifyAuth, unauthorized, forbidden } from '../../../****api/auth-utils'

// Define a type for our auth user
interface AuthUser extends JwtPayload {
  id: number
  role: string
  organizationId: number | null
  organizationRole: string | null
}

// GET all organizations
export async function GET(request: NextRequest) {
  // Check authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  try {
    const conn = await pool.getConnection()
    const sql = 'SELECT * FROM organizations'
    const result = await conn.query(sql)

    conn.release()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching organizations:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

// POST to create a new organization
export async function POST(request: NextRequest) {
  // Check authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth) {
    return unauthorized()
  }

  // Only admins can create organizations
  if (auth.role !== 'admin') {
    return forbidden()
  }

  try {
    const body = await request.json()
    const { name, description } = body

    const conn = await pool.getConnection()
    const sql = 'INSERT INTO organizations (name, description) VALUES (?, ?)'

    await conn.query(sql, [name, description])
    conn.release()

    return NextResponse.json({ message: 'Organization created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
