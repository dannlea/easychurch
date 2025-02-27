// import express from 'express'

// import pool from '../server.js'

// const router = express.Router()

// // // CRUD for Users
// router.get('/users', async (req, res) => {
//   console.log('Trying to fetch....') // Log the request

//   try {
//     const conn = await pool.getConnection()

//     console.log('Received request to fetch users') // Log the request

//     conn.query('SELECT * FROM users', (err, results) => {
//       conn.release() // Release the connection back to the pool

//       if (err) {
//         console.error('Error fetching users:', err) // Log the error

//         return res.status(500).send('Error fetching users')
//       }

//       console.log('Fetched users successfully') // Log success
//       res.status(200).json(results)
//     })
//   } catch (err) {
//     console.error('Error in connection:', err)
//     res.status(500).send('Error in connection')
//   }
// })

// app.put('/users/:id', (req, res) => {
//   const { id } = req.params
//   const { name, email } = req.body

//   db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], err => {
//     if (err) {
//       console.error('Error updating user:', err)

//       return res.status(500).send('Error updating user')
//     }

//     res.status(200).send('User updated successfully')
//   })
// })

// app.delete('/users/:id', (req, res) => {
//   const { id } = req.params

//   db.query('DELETE FROM users WHERE id = ?', [id], err => {
//     if (err) {
//       console.error('Error deleting user:', err)

//       return res.status(500).send('Error deleting user')
//     }

//     res.status(200).send('User deleted successfully')
//   })
// })

// // CRUD for Organizations
// app.get('/organizations', (req, res) => {
//   console.log('Received request to fetch organizations') // Log the request

//   db.query('SELECT * FROM organizations', (err, results) => {
//     if (err) {
//       console.error('Error fetching organizations:', err) // Log the error

//       return res.status(500).send('Error fetching organizations')
//     }

//     console.log('Fetched organizations successfully') // Log success
//     res.status(200).json(results)
//   })
// })

// app.post('/organizations', (req, res) => {
//   const { name, address, state, zip_code, country, subscription_tier } = req.body

//   db.query(
//     'INSERT INTO organizations (name, address, state, zip_code, country, subscription_tier) VALUES (?, ?, ?, ?, ?, ?)',
//     [name, address, state, zip_code, country, subscription_tier],
//     err => {
//       if (err) {
//         console.error('Error creating organization:', err)

//         return res.status(500).send('Error creating organization')
//       }

//       res.status(201).send('Organization created successfully')
//     }
//   )
// })

// app.put('/organizations/:id', (req, res) => {
//   const { id } = req.params
//   const { name, address, state, zip_code, country, subscription_tier } = req.body

//   db.query(
//     'UPDATE organizations SET name = ?, address = ?, state = ?, zip_code = ?, country = ?, subscription_tier = ? WHERE id = ?',
//     [name, address, state, zip_code, country, subscription_tier, id],
//     err => {
//       if (err) {
//         console.error('Error updating organization:', err)

//         return res.status(500).send('Error updating organization')
//       }

//       res.status(200).send('Organization updated successfully')
//     }
//   )
// })

// app.delete('/organizations/:id', (req, res) => {
//   const { id } = req.params

//   db.query('DELETE FROM organizations WHERE id = ?', [id], err => {
//     if (err) {
//       console.error('Error deleting organization:', err)

//       return res.status(500).send('Error deleting organization')
//     }

//     res.status(200).send('Organization deleted successfully')
//   })
// })

// // Fetch a single organization by ID
// app.get('/organizations/:id', (req, res) => {
//   const { id } = req.params

//   db.query('SELECT * FROM organizations WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       console.error('Error fetching organization:', err)

//       return res.status(500).send('Error fetching organization')
//     }

//     if (results.length === 0) {
//       return res.status(404).send('Organization not found')
//     }

//     res.status(200).json(results[0])
//   })
// })
