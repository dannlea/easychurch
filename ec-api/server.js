import path from 'path'
import { fileURLToPath } from 'url'

import express from 'express'
import mariadb from 'mariadb'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import orgRoutes from './routes/org.js'

dotenv.config()

const app = express()

app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
)

app.options('*', cors())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/org', orgRoutes)

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default pool
