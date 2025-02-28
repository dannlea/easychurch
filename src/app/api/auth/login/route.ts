import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { executeQuery } from '../../db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Use executeQuery helper to safely handle connections
    const user = await executeQuery(async conn => {
      // Get user data with organization information
      const sql = `
        SELECT
          users.*,
          organizations.name AS organization_name,
          organizations.id AS organization_id
        FROM users
        LEFT JOIN organizations ON users.org_id = organizations.id
        WHERE users.email = ?
      `

      const [user] = await conn.query(sql, [email])

      return user
    })

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash)

    if (!passwordIsValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const SECRET_KEY = process.env.JWT_SECRET_KEY as string

    const token = jwt.sign(
      {
        id: user.id,
        name: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profilePicture: user.profile_picture
          ? user.profile_picture.startsWith('/')
            ? user.profile_picture
            : `/${user.profile_picture}`
          : null,
        organization: user.organization_name || null,
        organizationId: user.organization_id || null,
        organizationRole: user.org_role || null
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    )

    return NextResponse.json({ token })
  } catch (err) {
    console.error('Error during login:', err)

    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
