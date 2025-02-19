// CRUD for Users
app.get('/users', (req, res) => {
  console.log('Received request to fetch users') // Log the request

  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err) // Log the error
      return res.status(500).send('Error fetching users')
    }
    console.log('Fetched users successfully') // Log success
    res.status(200).json(results)
  })
})

// CRUD for Organizations
app.get('/organizations', (req, res) => {
  console.log('Received request to fetch organizations') // Log the request

  db.query('SELECT * FROM organizations', (err, results) => {
    if (err) {
      console.error('Error fetching organizations:', err) // Log the error
      return res.status(500).send('Error fetching organizations')
    }
    console.log('Fetched organizations successfully') // Log success
    res.status(200).json(results)
  })
})
