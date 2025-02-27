import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { v4 as uuidv4 } from 'uuid'

import express from 'express'
import multer from 'multer'
import sharp from 'sharp'

import pool from '../server.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set up multer for file uploads
const storage = multer.memoryStorage() // Store files in memory temporarily
const upload = multer({ storage })

// Define the assets directory
const assetsDir = path.join(__dirname, '../assets')

// CRUD for Users

// Get All Users
router.get('/get', async (req, res) => {
  try {
    const conn = await pool.getConnection() // Get a connection from the pool

    const sql = `SELECT users.*,
    organizations.name AS organization_name,
    organizations.photo AS organization_photo,
    organizations.address AS organization_address,
    organizations.state AS organization_state,
    organizations.zip_code AS organization_zip_code,
    organizations.country AS organization_country,
    organizations.subscription_tier AS organization_subscription_tier,
    organizations.created_at AS organization_created_at
FROM users
LEFT JOIN organizations ON users.org_id = organizations.id`

    const result = await conn.query(sql) // Execute the query

    res.json(result) // Send the result as a JSON response
    conn.release() // Release the connection back to the pool
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ message: 'Server error' }) // Send an error response
  }
})

// Get User by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params // Destructure id from req.params

  try {
    const sql = `SELECT users.*,
    organizations.name AS organization_name,
    organizations.photo AS organization_photo,
    organizations.address AS organization_address,
    organizations.state AS organization_state,
    organizations.zip_code AS organization_zip_code,
    organizations.country AS organization_country,
    organizations.subscription_tier AS organization_subscription_tier,
    organizations.created_at AS organization_created_at
FROM users
LEFT JOIN organizations ON users.org_id = organizations.id
WHERE users.id = ?;`

    const conn = await pool.getConnection() // Get a connection from the pool
    const result = await conn.query(sql, [id]) // Execute the query with id

    res.json(result) // Send the result as a JSON response
    conn.release() // Release the connection back to the pool
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ message: 'Server error' }) // Send an error response
  }
})

// Update User with File Upload
router.put('/:id', upload.single('avatar'), async (req, res) => {
  const { id } = req.params
  const { firstName, lastName, email, phoneNumber, address, state, zipCode, country, timezone } = req.body

  try {
    const conn = await pool.getConnection()

    // Process the uploaded file
    if (req.file) {
      let fileName
      let filePath

      // Generate a unique file name
      do {
        fileName = `avatar-${uuidv4()}.png` // Use UUID to generate a unique file name
        filePath = path.join(assetsDir, fileName)
      } while (fs.existsSync(filePath)) // Check if the file already exists

      // Resize and compress the image
      await sharp(req.file.buffer)
        .resize({ width: 200, height: 200 }) // Resize to 200x200 pixels
        .toFormat('png')
        .toFile(filePath)

      // Store the relative file path in the database
      const relativeFilePath = `/assets/${fileName}`

      // Update the user's avatar path in the database
      const sql = `UPDATE users SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone_number = ?,
        address = ?,
        state = ?,
        zip_code = ?,
        country = ?,
        time_zone = ?,
        profile_picture = ?
      WHERE id = ?`

      await conn.query(sql, [
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        state,
        zipCode,
        country,
        timezone,
        relativeFilePath, // Store the relative file path in the database
        id
      ])
    } else {
      // Update user without changing the avatar
      const sql = `UPDATE users SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone_number = ?,
        address = ?,
        state = ?,
        zip_code = ?,
        country = ?,
        time_zone = ?
      WHERE id = ?`

      await conn.query(sql, [firstName, lastName, email, phoneNumber, address, state, zipCode, country, timezone, id])
    }

    conn.release()
    res.status(200).send('User updated successfully')
  } catch (err) {
    console.error('Error updating user:', err)
    res.status(500).send('Error updating user')
  }
})

export default router
