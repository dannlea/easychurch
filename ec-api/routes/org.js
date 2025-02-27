import express from 'express'

import pool from '../server.js'

const router = express.Router()

// CRUD for Organizations
router.get('/get', async (req, res) => {
  try {
    const conn = await pool.getConnection() // Get a connection from the pool
    const sql = 'SELECT * FROM organizations'
    const result = await conn.query(sql) // Execute the query

    res.json(result) // Send the result as a JSON response
    conn.release() // Release the connection back to the pool
  } catch (err) {
    console.error('Error fetching organizations:', err)
    res.status(500).json({ message: 'Server error' }) // Send an error response
  }
})

router.get('/:id', async (req, res) => {
  const { id } = req.params // Destructure id from req.params

  try {
    const sql = 'SELECT * FROM organizations WHERE id = ?'
    const conn = await pool.getConnection() // Get a connection from the pool
    const result = await conn.query(sql, [id]) // Execute the query with id

    res.json(result) // Send the result as a JSON response
    conn.release() // Release the connection back to the pool
  } catch (err) {
    console.error('Error fetching organizations:', err)
    res.status(500).json({ message: 'Server error' }) // Send an error response
  }
})

export default router
