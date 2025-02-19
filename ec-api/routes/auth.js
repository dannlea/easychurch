// Register
app.post('/register', (req, res) => {
  console.log('Received registration request:', req.body) // Log the request body for debugging

  const { first_name, last_name, email, password } = req.body
  const password_hash = bcrypt.hashSync(password, 8)

  const query = 'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)'
  db.query(query, [first_name, last_name, email, password_hash], (err, result) => {
    if (err) {
      console.error('Error registering user:', err) // Log the error for debugging
      return res.status(500).json({ message: 'Error registering user' })
    }
    console.log('User registered successfully:', result) // Log success
    res.status(201).json({ message: 'User registered successfully' })
  })
})

// Login
app.post('/login', (req, res) => {
  console.log('Received login request:', req.body) // Log the request body for debugging

  const { email, password } = req.body

  const query = 'SELECT * FROM users WHERE email = ?'
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      console.error('User not found or error:', err) // Log the error or not found
      return res.status(401).send('User not found')
    }

    const user = results[0]
    const passwordIsValid = bcrypt.compareSync(password, user.password_hash)
    if (!passwordIsValid) {
      console.error('Invalid password for user:', email) // Log invalid password attempt
      return res.status(401).send('Invalid password')
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 86400 })
    console.log('User logged in successfully:', email) // Log success
    res.status(200).send({ auth: true, token })
  })
})

// Email Verification (simplified)
app.get('/verify-email', (req, res) => {
  const { token } = req.query
  // Verify token and update user's email_verified status
})
