import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import dotenv from 'dotenv'

import pool from '../server.js'

dotenv.config()

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  console.log('Received registration request:', req.body)

  const { first_name, last_name, email, password } = req.body
  const password_hash = bcrypt.hashSync(password, 8)

  try {
    const conn = await pool.getConnection()
    const query = 'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)'
    const result = await pool.query(query, [first_name, last_name, email, password_hash])

    console.log('User registered successfully:', result)
    res.status(201).json({ message: 'User registered successfully' })
    conn.release()
  } catch (err) {
    console.error('Error registering user:', err)
    res.status(500).json({ message: 'Error registering user' })
  }
})

// CRUD for Users
router.get('/users/get', async (req, res) => {
  try {
    const conn = await pool.getConnection() // Get a connection from the pool
    const sql = 'SELECT * FROM users'
    const result = await conn.query(sql) // Execute the query

    res.json(result) // Send the result as a JSON response
    conn.release() // Release the connection back to the pool
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ message: 'Server error' }) // Send an error response
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const conn = await pool.getConnection()

    // Updated query to use the org_role field from the users table
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

    if (!user) {
      conn.release()

      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash)

    if (!passwordIsValid) {
      conn.release()

      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const SECRET_KEY = process.env.JWT_SECRET_KEY

    console.log('SECRET_KEY:', SECRET_KEY)

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

        // Use the org_role field from the users table
        organizationRole: user.org_role || null
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    )

    console.log('User data for token:', {
      id: user.id,
      name: user.first_name,
      profilePicture: user.profile_picture,
      formattedProfilePicture: user.profile_picture
        ? user.profile_picture.startsWith('/')
          ? user.profile_picture
          : `/${user.profile_picture}`
        : null
    })

    res.status(200).json({ token })
    conn.release()
  } catch (err) {
    console.error('Error during login:', err.stack)
    res.status(500).json({ message: 'Server error' })
  }
})

// // Email Verification (simplified)
// router.get('/auth/verify-email', (req, res) => {
//   const { token } = req.query

//   // Verify token and update user's email_verified status
// })

export default router
