import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import { executeQuery } from '../db'

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    organizationId: number
    organizationName: string
    organizationRole: string
    profilePicture: string | null
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    organizationId: number
    organizationName: string
    organizationRole: string
    profilePicture: string | null
  }
}

// Define the structure of our credentials
interface Credentials {
  email: string
  password: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: Credentials | undefined) {
        if (!credentials) {
          return null
        }

        try {
          // Query the database for the user
          const result = await executeQuery(async conn => {
            const sql = `
              SELECT
                u.id,
                u.email,
                u.password_hash,
                u.first_name,
                u.last_name,
                u.role,
                u.organization_id,
                u.organization_role,
                u.profile_picture,
                o.name as organization_name
              FROM users u
              LEFT JOIN organizations o ON u.organization_id = o.id
              WHERE u.email = ?
            `

            return await conn.query(sql, [credentials.email])
          })

          const user = Array.isArray(result) ? result[0] : result

          if (!user) {
            return null
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password_hash)

          if (!isValid) {
            return null
          }

          // Return user without password hash
          return {
            id: String(user.id), // Convert to string as required by NextAuth
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            organizationId: user.organization_id,
            organizationName: user.organization_name,
            organizationRole: user.organization_role,
            profilePicture: user.profile_picture
          }
        } catch (error) {
          console.error('Error in authorize:', error)

          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.organizationRole = user.organizationRole
        token.profilePicture = user.profilePicture
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          firstName: token.firstName,
          lastName: token.lastName,
          role: token.role,
          organizationId: token.organizationId,
          organizationName: token.organizationName,
          organizationRole: token.organizationRole,
          profilePicture: token.profilePicture
        }
      }

      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}
