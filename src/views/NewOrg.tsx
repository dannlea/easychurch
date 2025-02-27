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
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Illustrations from '@components/Illustrations'
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

NEXT_PUBLIC_LOCAL_SERVER: process.env.LOCAL_SERVER

const NewOrg = ({ mode }: { mode: Mode }) => {
  // States
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    terms: '',
    address: '',
    state: '',
    zip_code: '',
    country: '',
    subscription_tier: 'Free'
  })

  const [message, setMessage] = useState('')

  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!formData.name || !formData.password) {
      setMessage('All fields are required.')

      return
    }

    if (!formData.terms) {
      setMessage('You must agree to our ')

      return
    }

    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(formData.name)) {
      setMessage('Please enter a valid email address.')

      return
    }

    // Basic password strength validation
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.')

      return
    }

    try {
      console.log('Fetch URL:', `${process.env.NEXT_PUBLIC_LOCAL_SERVER}/register`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}/register`, {
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
          <Typography variant='h4'>Welcome, [First Name]!</Typography>
          <div className='flex flex-col gap-5'>
            <Typography className='mbs-1'>
              We&apos;re almost there - Just tell us about the place you call home.
            </Typography>

            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Church Name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label='Address'
                name='address'
                value={formData.address}
                onChange={handleChange}
                required
              />
              <TextField fullWidth label='State' name='state' value={formData.state} onChange={handleChange} required />
              <TextField
                fullWidth
                label='Zip Code'
                name='zip_code'
                value={formData.zip_code}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label='Country'
                name='country'
                value={formData.country}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label='Subscription Tier'
                name='subscription_tier'
                value={formData.subscription_tier}
                onChange={handleChange}
                select
                required
              >
                <MenuItem value='Free'>Free</MenuItem>
                <MenuItem value='Basic'>Basic</MenuItem>
                <MenuItem value='Premium'>Premium</MenuItem>
              </TextField>
              <Button fullWidth variant='contained' type='submit'>
                Create Organization
              </Button>
              {message && <Typography color='error'>{message}</Typography>}
            </form>
            <Typography variant='body2' align='center' className='mt-4'>
              Is your organization already on EasyChurch?
            </Typography>
            <Typography variant='body2' align='center' className='mt-0'>
              Ask your organization admin to link your email to the organization in Org Settings.
            </Typography>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default NewOrg
