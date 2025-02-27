'use client'

import type { ReactNode } from 'react'
import React, { createContext, useState, useContext, useEffect } from 'react'

import { jwtDecode } from 'jwt-decode'

export interface User {
  id: number
  name: string
  lastName?: string
  role: string
  profilePicture: string
  organization?: string | null
  organizationId?: number | null
  organizationRole?: string | null
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for token in localStorage on initialization
    const token = localStorage.getItem('token')

    if (token) {
      try {
        // Decode the token to get user information
        const decodedUser = jwtDecode<User>(token)

        setUser(decodedUser)
        console.log('User loaded from token:', decodedUser)
      } catch (error) {
        console.error('Error decoding token:', error)
        localStorage.removeItem('token') // Remove invalid token
      }
    }
  }, [])

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
