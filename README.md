# EasyChurch - Church Management System

A modern, user-friendly church management system built with Next.js and Material UI.

## Features

- User authentication and authorization
- Profile management with profile pictures
- Organization management
- Integration with Planning Center
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14.2, React 18, Material UI
- **Backend**: Express.js
- **Database**: MySQL/MariaDB
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MySQL/MariaDB database

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/easychurch.git
cd easychurch
```

### 2. Install dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd ec-api
npm install
cd ..
```

### 3. Environment Configuration

Create `.env` files for both frontend and backend:

For the frontend (root directory), copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

For the backend (ec-api directory):

```bash
cd ec-api
cp .env.example .env
cd ..
```

Then edit both `.env` files to fill in your specific configuration values.

### 4. Database Setup

Create a MySQL/MariaDB database and tables using the schema provided in `ec-api/schema.sql` (if available).

## Development

### Running in development mode

```bash
# Start the backend server
cd ec-api
npm run dev

# In a separate terminal, start the frontend
cd ..
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Production Deployment

### Environment Variable Configuration for Production

Before deploying to production, make sure to:

1. Set all required environment variables in your production environment
2. Set `NEXT_PUBLIC_LOCAL_SERVER` to your production API URL
3. Set proper database credentials and JWT secrets
4. Configure Planning Center integration if needed

### Building for Production

```bash
# Build the frontend
npm run build

# Start the frontend production server
npm start

# In a separate process, start the backend
cd ec-api
npm start
```

### Deployment Platforms

This application can be deployed on various platforms:

- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: Render, Heroku, AWS EC2, DigitalOcean

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## Security

- Never commit `.env` files to Git
- Rotate JWT secrets regularly
- Keep all dependencies up to date

## License

[Your License Information]

---

## Troubleshooting

### Common Issues

1. **Profile pictures not loading**: Make sure `NEXT_PUBLIC_LOCAL_SERVER` is set correctly to the backend URL
2. **Authentication issues**: Check JWT secret configuration and token expiration
3. **Database connection errors**: Verify database credentials and network access

For more help, please create an issue on the GitHub repository.
