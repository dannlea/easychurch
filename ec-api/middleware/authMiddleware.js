import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.sendStatus(401) // If there's no token, return unauthorized

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403) // If token is invalid, return forbidden
    req.user = user // Attach user info to request object
    next() // Proceed to the next middleware or route handler
  })
}

export default authenticateToken
