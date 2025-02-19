const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: 'https://terminally-pure-cardinal.ngrok-free.app', // Replace with your frontend's domain
    methods: ['GET', 'POST'],
    credentials: true
  })
)

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

db.connect(err => {
  if (err) throw err
  console.log('Connected to MySQL database')
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
