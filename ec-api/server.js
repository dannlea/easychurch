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

// Update CORS to accept requests from your production domain
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://easychurch.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
)

app.options('*', cors())

// Mount all API routes under /ec-api prefix
const apiRouter = express.Router()

apiRouter.use('/backend/auth', authRoutes)
apiRouter.use('/backend/users', userRoutes)
apiRouter.use('/backend/org', orgRoutes)

// Apply the router to the /ec-api path
app.use('/backend', apiRouter)

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from the 'assets' directory
app.use('/backend/assets', express.static(path.join(__dirname, 'assets')))

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
})

const PORT = process.env.PORT || 3001

// Root endpoint
app.get('/backend', (req, res) => {
  res.send('API is running')
})

// This is critical - add a catch-all route handler for the /ec-api path
app.all('/backend/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default pool
