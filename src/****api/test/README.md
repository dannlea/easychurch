# API Testing Guide

This directory contains several endpoints for testing the Next.js API functionality that was converted from the Express backend.

## Available Test Endpoints

### Health Check

- URL: `/api/test/health`
- Method: `GET`
- Description: Confirms that the API is running properly

### Database Test

- URL: `/api/test/db`
- Method: `GET`
- Description: Tests the database connection

### Authentication Test

- URL: `/api/test/auth`
- Method: `GET`
- Description: Tests JWT authentication
- Headers Required: `Authorization: Bearer [your-token]`

### Environment Variables Test

- URL: `/api/test/env`
- Method: `GET`
- Description: Shows which environment variables are set (values masked for security)

### Generate Test Token

- URL: `/api/test/generate-token`
- Method: `GET`
- Description: Generates a test JWT token for use with authenticated endpoints
- Note: Only available in development mode

### File Upload Test

- URL: `/api/test/file-upload`
- Method: `POST`
- Description: Tests file upload functionality
- Body: Form data with a file field named 'file'

## Testing with cURL

Here are some example cURL commands to test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/test/health

# Database test
curl http://localhost:3000/api/test/db

# Generate a test token
curl http://localhost:3000/api/test/generate-token

# Authentication test (replace with your token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/test/auth

# Environment variables
curl http://localhost:3000/api/test/env

# Upload a file
curl -X POST -F "file=@/path/to/your/file.jpg" http://localhost:3000/api/test/file-upload
```

## Testing with Postman or similar tools

1. Import the following collection (or create requests manually):

   - Health check: GET request to `/api/test/health`
   - DB test: GET request to `/api/test/db`
   - Get token: GET request to `/api/test/generate-token`
   - Auth test: GET request to `/api/test/auth` with Authorization header
   - Env test: GET request to `/api/test/env`
   - File upload: POST request to `/api/test/file-upload` with form-data

2. For authenticated requests, add an Authorization header:
   - Type: Bearer Token
   - Token: (copy from the /api/test/generate-token response)

## Environment Setup

Make sure your `.env` file includes these variables:

```
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET_KEY=your_jwt_secret
```

Happy testing!
