'use client'

// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

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
import Button from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

NEXT_PUBLIC_LOCAL_SERVER: process.env.LOCAL_SERVER

const Register = ({ mode }: { mode: Mode }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [role, setRole] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isPasswordConfirmShown, setIsPasswordConfirmShown] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowPasswordConfirm = () => setIsPasswordConfirmShown(show => !show)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwords do not match')

      return
    }

    if (role === '') {
      setError('Role is required')

      return
    }

    // Get the backend URL from environment variable with fallback for development
    const backendUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER || 'http://localhost:3001'

    // Ensure backendUrl doesn't end with a slash
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl

    try {
      console.log(`Attempting to register via: ${baseUrl}/auth/register`)

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed')

        return
      }

      // Redirect to login page after successful registration
      router.push('/login')
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred. Please try again.')
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
              <Typography variant='h4'>{`Adventure starts here 🚀`}</Typography>
              <Typography className='mbs-1'>Make your app management easy and fun!</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='First Name'
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
              <TextField fullWidth label='Last Name' value={lastName} onChange={e => setLastName(e.target.value)} />
              <TextField fullWidth label='Email' type='email' value={email} onChange={e => setEmail(e.target.value)} />
              <FormControl fullWidth>
                <InputLabel id='role-label'>Role</InputLabel>
                <Select labelId='role-label' value={role} label='Role' onChange={e => setRole(e.target.value)}>
                  <MenuItem value='admin'>Admin</MenuItem>
                  <MenuItem value='user'>User</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel htmlFor='auth-register-password'>Password</InputLabel>
                <OutlinedInput
                  label='Password'
                  id='auth-register-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel htmlFor='auth-register-password-confirm'>Confirm Password</InputLabel>
                <OutlinedInput
                  label='Confirm Password'
                  id='auth-register-password-confirm'
                  type={isPasswordConfirmShown ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  endAdornment={
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPasswordConfirm}
                        onMouseDown={e => e.preventDefault()}
                        aria-label='toggle password visibility'
                      >
                        <i className={isPasswordConfirmShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              {error && <FormHelperText error>{error}</FormHelperText>}
              <Button fullWidth variant='contained' type='submit'>
                Sign up
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Already have an account?</Typography>
                <Typography component={Link} href='/login' color='primary'>
                  Sign in instead
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

export default Register
