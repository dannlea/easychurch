'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

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
import Divider from '@mui/material/Divider'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Illustrations from '@components/Illustrations'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

NEXT_PUBLIC_LOCAL_SERVER: process.env.LOCAL_SERVER

const Register = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  const [formData, setFormData] = useState({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  })

  const [message, setMessage] = useState('')

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setMessage('All fields are required.')
      
return
    }

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(formData.email)) {
      setMessage('Please enter a valid email address.')
      
return
    }

    // Basic password strength validation
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      
return
    }

    try {
      console.log('Fetch URL:', `${process.env.NEXT_PUBLIC_LOCAL_SERVER}/api/register`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      console.log('API Response:', data) // Log the response for debugging

      if (response.ok) {
        setMessage(data.message || 'Registration successful!')
      } else {
        setMessage(`Error: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error:', error) // Log detailed error information
      setMessage('An error occurred. Please try again.')
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/' className='flex justify-center items-start mbe-6'>
            <Logo />
          </Link>
          <Typography variant='h4'>Adventure starts here 🚀</Typography>
          <div className='flex flex-col gap-5'>
            <Typography className='mbs-1'>Make your app management easy and fun!</Typography>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='First Name'
                name='first_name'
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label='Last Name'
                name='last_name'
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              <TextField fullWidth label='Email' name='email' value={formData.email} onChange={handleChange} required />
              <TextField
                fullWidth
                label='Password'
                name='password'
                type={isPasswordShown ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
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
              <FormControlLabel
                control={<Checkbox />}
                label={
                  <>
                    <span>I agree to </span>
                    <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                      privacy policy & terms
                    </Link>
                  </>
                }
              />
              <Button fullWidth variant='contained' type='submit'>
                Sign Up
              </Button>
              {message && <Typography color='error'>{message}</Typography>}
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Already have an account?</Typography>
                <Typography component={Link} href='/login' color='primary'>
                  Sign in instead
                </Typography>
              </div>
              <Divider className='gap-3'>Or</Divider>
              <div className='flex justify-center items-center gap-2'>
                <IconButton size='small' className='text-facebook'>
                  <i className='ri-facebook-fill' />
                </IconButton>
                <IconButton size='small' className='text-twitter'>
                  <i className='ri-twitter-fill' />
                </IconButton>
                <IconButton size='small' className='text-github'>
                  <i className='ri-github-fill' />
                </IconButton>
                <IconButton size='small' className='text-googlePlus'>
                  <i className='ri-google-fill' />
                </IconButton>
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
