import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import pool from '../../db'

// This endpoint creates a test user for development purposes only
export async function POST() {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'This endpoint is disabled in production' }, { status: 403 })
  }

  try {
    // Generate a test user with random email
    const randomNum = Math.floor(Math.random() * 10000)

    const testUser = {
      first_name: 'Test',
      last_name: 'User',
      email: `testuser${randomNum}@example.com`,
      password: 'password123',
      role: 'user'
    }

    const password_hash = bcrypt.hashSync(testUser.password, 8)

    const conn = await pool.getConnection()

    // Check if this is the first user
    const countQuery = 'SELECT COUNT(*) as count FROM users'
    const [countResult] = await conn.query(countQuery)

    // If this is the first user, make them an admin
    const role = countResult.count === 0 ? 'admin' : testUser.role

    // Insert the test user
    const insertQuery = 'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'

    await conn.query(insertQuery, [testUser.first_name, testUser.last_name, testUser.email, password_hash, role])

    // Get the inserted user ID
    const [newUser] = await conn.query('SELECT id, email, role FROM users WHERE email = ?', [testUser.email])

    conn.release()

    return NextResponse.json({
      status: 'success',
      message: 'Test user created successfully',
      user: {
        id: newUser.id,
        email: testUser.email,
        password: testUser.password, // Sending back password for testing only!
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('Error creating test user:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create test user',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
