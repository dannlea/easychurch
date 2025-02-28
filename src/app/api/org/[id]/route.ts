import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { JwtPayload } from 'jsonwebtoken'

import { executeQuery } from '../../db'
import { verifyAuth, unauthorized, forbidden } from '../../auth-utils'

// Define a type for our auth user
interface AuthUser extends JwtPayload {
  id: number
  role: string
  organizationId: number | null
  organizationRole: string | null
}

// GET a specific organization
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const user = verifyAuth(request)

  if (!user) {
    return unauthorized()
  }

  try {
    // Use executeQuery helper to safely handle connections
    const result = await executeQuery(async conn => {
      const sql = 'SELECT * FROM organizations WHERE id = ?'
      const [result] = await conn.query(sql, [params.id])

      return result
    })

    if (!result) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching organization:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

// PUT to update an organization
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth) {
    return unauthorized()
  }

  // Only admins or organization admins can update organizations
  if (auth.role !== 'admin' && (auth.organizationId !== parseInt(params.id) || auth.organizationRole !== 'admin')) {
    return forbidden()
  }

  try {
    const body = await request.json()
    const { name, description } = body

    // Use executeQuery helper to safely handle connections
    await executeQuery(async conn => {
      const sql = 'UPDATE organizations SET name = ?, description = ? WHERE id = ?'

      return await conn.query(sql, [name, description, params.id])
    })

    return NextResponse.json({ message: 'Organization updated successfully' })
  } catch (error) {
    console.error('Error updating organization:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

// DELETE an organization
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const auth = verifyAuth(request) as AuthUser

  if (!auth) {
    return unauthorized()
  }

  // Only system admins can delete organizations
  if (auth.role !== 'admin') {
    return forbidden()
  }

  try {
    // Use executeQuery helper to safely handle connections
    await executeQuery(async conn => {
      const sql = 'DELETE FROM organizations WHERE id = ?'

      return await conn.query(sql, [params.id])
    })

    return NextResponse.json({ message: 'Organization deleted successfully' })
  } catch (error) {
    console.error('Error deleting organization:', error)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
