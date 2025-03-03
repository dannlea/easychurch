'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

// Remove the incorrect static router import
// import router from 'next/router'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'

// Type Imports
import { jwtDecode } from 'jwt-decode'

// Import utility functions
import { buildApiUrl } from '@/core/utils/apiUtils'

import type { Mode } from '@core/types'
import type { User } from '@core/contexts/UserContext'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useUser } from '@core/contexts/UserContext'

interface JwtPayload {
  id: number
  name: string
  lastName?: string
  role: string
  profilePicture: string
  organization?: string | null
  organizationId?: number | null
  organizationRole?: string | null
}

const Login = ({ mode }: { mode: Mode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const { user, setUser } = useUser()

  useEffect(() => {
    console.log('User context updated:', user)
  }, [user])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      // Build the API URL using our utility function
      const loginUrl = buildApiUrl('auth/login')

      console.log(`Attempting to login via: ${loginUrl}`)

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const responseText = await response.text()

      if (process.env.NODE_ENV === 'development') {
        console.log('Raw response text:', responseText)
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${responseText}`)
      }

      try {
        const data = JSON.parse(responseText)
        const { token } = data

        if (process.env.NODE_ENV === 'development') {
          console.log('Token received:', token)
        }

        localStorage.setItem('token', token)

        // Decode the token to get user information
        const userInfo = jwtDecode<JwtPayload>(token) as User

        if (process.env.NODE_ENV === 'development') {
          console.log('Decoded User Info:', userInfo)
        }

        // Update the user context
        setUser(userInfo)
        console.log('User set in context:', userInfo)

        // Use the router hook to navigate to the home page
        router.push('/')
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        console.error('Raw response was:', responseText)
        setError('Server returned invalid data. Please try again later.')
      }
    } catch (error) {
      console.error('Error during login:', error)
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/' className='flex justify-center items-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
              <Typography className='mbs-1'>Please sign-in to your account and start the adventure</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField autoFocus fullWidth label='Email' value={email} onChange={e => setEmail(e.target.value)} />
              <TextField
                fullWidth
                label='Password'
                type={isPasswordShown ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {error && <Typography color='error'>{error}</Typography>}
              <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                <FormControlLabel control={<Checkbox />} label='Remember me' />
                <Typography className='text-end' color='primary' component={Link} href='/forgot-password'>
                  Forgot password?
                </Typography>
              </div>
              <Button fullWidth variant='contained' type='submit'>
                Log In
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>New on our platform?</Typography>
                <Typography component={Link} href='/register' color='primary'>
                  Create an account
                </Typography>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Login
