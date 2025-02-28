import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import { executeQuery } from '../../db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, password } = body
    const password_hash = bcrypt.hashSync(password, 8)

    // Use executeQuery helper to safely handle connections
    await executeQuery(async conn => {
      const query = 'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)'

      return await conn.query(query, [first_name, last_name, email, password_hash])
    })

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error registering user:', error)

    return NextResponse.json({ message: 'Error registering user' }, { status: 500 })
  }
}
