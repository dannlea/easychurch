'use client'

// React Imports
import type { ChangeEvent } from 'react'
import { useState, useEffect } from 'react'

import { useSearchParams, useRouter } from 'next/navigation'

import type { SelectChangeEvent } from '@mui/material/Select'

// Next Imports

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { toast, Toaster } from 'react-hot-toast'

// Import utility functions
import { buildApiUrl } from '@/core/utils/apiUtils'

// Import user context
import { useUser } from '@core/contexts/UserContext'

type Data = {
  firstName?: string
  lastName?: string
  email?: string
  organization?: string
  phoneNumber?: number | string
  address?: string
  state?: string
  zipCode?: string
  country?: string
  language?: string
  timezone?: string
  currency?: string
}

const languageData = ['English']

const AccountDetails = () => {
  // States
  const [formData, setFormData] = useState<Data>({
    firstName: '',
    lastName: '',
    email: '',
    organization: '',
    phoneNumber: '',
    address: '',
    state: '',
    zipCode: '',
    country: '',
    language: '',
    timezone: 'gmt-05', // Default value
    currency: 'usd' // Default value
  })

  const [imgSrc, setImgSrc] = useState<string>('/images/placeholder.png')
  const [language, setLanguage] = useState<string[]>(['English'])

  // Get user context and search params
  const { user, setUser } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Add loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data from API when component mounts or userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      setError(null)

      // Get user ID from URL params if available, otherwise use user context
      const urlUserId = searchParams.get('id')
      const userId = urlUserId || (user?.id ? String(user.id) : null)

      // If no user ID found, exit early
      if (!userId) {
        setError('Please log in to view account details')
        setIsLoading(false)

        return
      }

      try {
        // Get token from localStorage
        const token = localStorage.getItem('token')

        if (!token) {
          console.error('No authentication token found')
          setError('Authentication token missing. Please log in again.')
          setIsLoading(false)

          return
        }

        console.log(`Getting user data for ID: ${userId}`)
        console.log('Token available:', !!token)

        // Use the main users endpoint with proper authentication
        const response = await fetch(buildApiUrl(`users/${userId}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        // Log the response status for debugging
        console.log(`API response status: ${response.status}`)

        if (!response.ok) {
          // If we get a 401 error, the token might be expired
          if (response.status === 401) {
            console.error('Authentication failed: 401 Unauthorized')
            setError('Authentication failed (401). Please log in again to access your account details.')
            setIsLoading(false)

            return
          }

          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
        }

        const userData = await response.json()

        console.log('Successfully fetched user data:', userData)
        setFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          organization: userData.organization_name || (userData.org_id ? `Organization #${userData.org_id}` : ''),
          phoneNumber: userData.phone_number || '',
          address: userData.address || '',
          state: userData.state || '',
          zipCode: userData.zip_code || '',
          country: userData.country || '',
          language: userData.language || '',
          timezone: userData.time_zone || 'gmt-05',
          currency: userData.currency || 'usd'
        })

        // Set image source if profile picture exists
        if (userData.profile_picture) {
          const imgPath = userData.profile_picture

          // Only log in development mode and limit to one log
          if (process.env.NODE_ENV === 'development') {
            console.log('Profile picture path:', imgPath)
          }

          if (imgPath.startsWith('assets/')) {
            // Direct path to assets folder (new format)
            setImgSrc(`/${imgPath}`)
          } else if (imgPath.startsWith('/assets/')) {
            // Path already has leading slash
            setImgSrc(imgPath)
          } else if (imgPath.startsWith('/uploads/')) {
            // Handle uploads path
            setImgSrc(imgPath)
          } else if (imgPath.startsWith('/api/')) {
            // API path
            setImgSrc(imgPath)
          } else {
            // Try to infer the correct path
            setImgSrc(`/assets/avatars/${imgPath.split('/').pop()}`)
          }
        } else {
          // Fallback to placeholder
          setImgSrc('/images/placeholder.png')
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load your account details. Please try again later.')
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, searchParams])

  const handleDelete = (value: string) => {
    setLanguage(current => current.filter(item => item !== value))
  }

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    setLanguage(event.target.value as string[])
  }

  const handleFormChange = (field: keyof Data, value: Data[keyof Data]) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileInputChange = async (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    // Only log in development mode
    const isDev = process.env.NODE_ENV === 'development'

    if (!files || files.length === 0) {
      if (isDev) console.error('No files selected')
      toast.error('No file selected')

      return
    }

    const selectedFile = files[0]

    if (isDev) console.log(`Selected file: ${selectedFile.name}`)

    // Show local preview immediately using FileReader
    reader.onload = () => {
      setImgSrc(reader.result as string)
    }

    reader.onerror = () => {
      console.error('Error reading file')
      toast.error('Error reading file')
    }

    reader.readAsDataURL(selectedFile)

    try {
      // Get user ID from URL params if available, otherwise use user context
      const urlUserId = searchParams.get('id')
      const userId = urlUserId || (user?.id ? String(user.id) : null)

      if (!userId) {
        console.error('No user ID available for update')
        toast.error('Could not determine user ID')
        throw new Error('No user ID available for update')
      }

      // Send the file to the avatar endpoint
      const token = localStorage.getItem('token')
      const avatarUrl = `/api/users/${userId}/avatar`

      if (isDev) console.log('Uploading avatar')

      // Read file as ArrayBuffer for direct binary upload
      const arrayBuffer = await selectedFile.arrayBuffer()

      // Set up request options for direct binary upload
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': selectedFile.type
        },
        body: arrayBuffer
      }

      // Add auth token if available
      if (token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `Bearer ${token}`
        }
      }

      // Send the request
      const response = await fetch(avatarUrl, requestOptions)

      let responseData

      try {
        responseData = await response.json()
        if (isDev) console.log('Upload response data received')
      } catch (parseError) {
        console.error('Error parsing server response')
        toast.error('Error processing server response')

        return
      }

      if (response.ok) {
        if (responseData.profile_picture) {
          // Update the image source immediately
          if (responseData.profile_picture.startsWith('assets/')) {
            setImgSrc(`/${responseData.profile_picture}`)
          } else {
            setImgSrc(responseData.profile_picture)
          }

          // Update the user context to refresh the avatar globally
          if (user) {
            setUser({
              ...user,
              profilePicture: responseData.profile_picture
            })

            if (isDev) console.log('User context updated with new avatar')
          }
        }

        toast.success('Avatar updated successfully')
      } else {
        console.error('Failed to update avatar')
        toast.error(responseData.error || 'Failed to update avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar')
      toast.error('Error uploading avatar')
    }
  }

  const handleFileInputReset = () => {
    setImgSrc('/images/avatars/1.png')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get user ID from URL params if available, otherwise use user context
      const urlUserId = searchParams.get('id')
      const userId = urlUserId || (user?.id ? String(user.id) : null)

      if (!userId) {
        throw new Error('No user ID available for update')
      }

      const token = localStorage.getItem('token')

      // Map the form fields to the database column names
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          organization_name: formData.organization,
          phone_number: formData.phoneNumber,
          address: formData.address,
          state: formData.state,
          zip_code: formData.zipCode,
          country: formData.country,
          language: formData.language,
          time_zone: formData.timezone,
          currency: formData.currency
        })
      })

      if (!response.ok) {
        const errorData = await response.json()

        throw new Error(`Failed to update user: ${errorData.error || response.statusText}`)
      }

      setIsLoading(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      setIsLoading(false)
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error updating user:', error)
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className='flex flex-col gap-7'>
      <Toaster position='top-right' />

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className='flex justify-center'>
            <CircularProgress />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <>
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
          {error.includes('Authentication failed') && (
            <Card>
              <CardContent>
                <div className='flex flex-col gap-4 items-center'>
                  <Typography variant='h6'>Authentication Required</Typography>
                  <Typography>Please log in again to view your account details.</Typography>
                  <Button variant='contained' onClick={() => router.push('/login')}>
                    Go to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Main content - only show when not loading and no error */}
      {!isLoading && !error && (
        <>
          <Card>
            <CardContent className='mbe-5'>
              <div className='flex max-sm:flex-col items-center gap-6'>
                <img height={100} width={100} className='rounded' src={imgSrc} alt='Profile' />
                <div className='flex flex-grow flex-col gap-4'>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <Button component='label' size='small' variant='contained' htmlFor='account-settings-upload-image'>
                      Upload New Photo
                      <input
                        hidden
                        type='file'
                        accept='image/png, image/jpeg'
                        onChange={handleFileInputChange}
                        id='account-settings-upload-image'
                      />
                    </Button>
                    <Button size='small' variant='outlined' color='error' onClick={handleFileInputReset}>
                      Reset
                    </Button>
                  </div>
                  <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='mt-5'>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='First Name'
                      placeholder='John'
                      value={formData.firstName}
                      onChange={e => handleFormChange('firstName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Last Name'
                      placeholder='Doe'
                      value={formData.lastName}
                      onChange={e => handleFormChange('lastName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Email'
                      placeholder='wacky-duck@ducks.com'
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      disabled
                      fullWidth
                      label='Organization'
                      placeholder='Your Organization Admin needs to set this'
                      value={formData.organization}
                      onChange={e => handleFormChange('organization', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Phone Number'
                      placeholder='+1 (234) 567-8901'
                      value={formData.phoneNumber}
                      onChange={e => handleFormChange('phoneNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Address'
                      placeholder='Address'
                      value={formData.address}
                      onChange={e => handleFormChange('address', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Province/State'
                      placeholder='New Brunswick'
                      value={formData.state}
                      onChange={e => handleFormChange('state', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Postal Code'
                      placeholder='A1B 2C3'
                      value={formData.zipCode}
                      onChange={e => handleFormChange('zipCode', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Country'
                      placeholder='Canada'
                      value={formData.country}
                      onChange={e => handleFormChange('country', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        multiple
                        label='Language'
                        value={language}
                        onChange={handleChange}
                        renderValue={selected => (
                          <div className='flex flex-wrap gap-2'>
                            {(selected as string[]).map(value => (
                              <Chip
                                key={value}
                                clickable
                                deleteIcon={
                                  <i className='ri-close-circle-fill' onMouseDown={event => event.stopPropagation()} />
                                }
                                size='small'
                                label={value}
                                onDelete={() => handleDelete(value)}
                              />
                            ))}
                          </div>
                        )}
                      >
                        {languageData.map(name => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>TimeZone</InputLabel>
                      <Select
                        label='TimeZone'
                        value={formData.timezone}
                        onChange={e => handleFormChange('timezone', e.target.value)}
                        MenuProps={{ PaperProps: { style: { maxHeight: 250 } } }}
                      >
                        <MenuItem value='gmt-12'>(GMT-12:00) International Date Line West</MenuItem>
                        <MenuItem value='gmt-11'>(GMT-11:00) Midway Island, Samoa</MenuItem>
                        <MenuItem value='gmt-10'>(GMT-10:00) Hawaii</MenuItem>
                        <MenuItem value='gmt-09'>(GMT-09:00) Alaska</MenuItem>
                        <MenuItem value='gmt-08'>(GMT-08:00) Pacific Time (US & Canada)</MenuItem>
                        <MenuItem value='gmt-08-baja'>(GMT-08:00) Tijuana, Baja California</MenuItem>
                        <MenuItem value='gmt-07'>(GMT-07:00) Chihuahua, La Paz, Mazatlan</MenuItem>
                        <MenuItem value='gmt-07-mt'>(GMT-07:00) Mountain Time (US & Canada)</MenuItem>
                        <MenuItem value='gmt-06'>(GMT-06:00) Central America</MenuItem>
                        <MenuItem value='gmt-06-ct'>(GMT-06:00) Central Time (US & Canada)</MenuItem>
                        <MenuItem value='gmt-06-mc'>(GMT-06:00) Guadalajara, Mexico City, Monterrey</MenuItem>
                        <MenuItem value='gmt-06-sk'>(GMT-06:00) Saskatchewan</MenuItem>
                        <MenuItem value='gmt-05'>(GMT-05:00) Bogota, Lima, Quito, Rio Branco</MenuItem>
                        <MenuItem value='gmt-05-et'>(GMT-05:00) Eastern Time (US & Canada)</MenuItem>
                        <MenuItem value='gmt-05-ind'>(GMT-05:00) Indiana (East)</MenuItem>
                        <MenuItem value='gmt-04'>(GMT-04:00) Atlantic Time (Canada)</MenuItem>
                        <MenuItem value='gmt-04-clp'>(GMT-04:00) Caracas, La Paz</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant='contained' type='submit'>
                      Save Changes
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default AccountDetails
