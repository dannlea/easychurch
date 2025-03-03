'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import { useSearchParams } from 'next/navigation'

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
import type { SelectChangeEvent } from '@mui/material/Select'
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

  const [fileInput, setFileInput] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string>('/images/placeholder.png')
  const [language, setLanguage] = useState<string[]>(['English'])

  // Get user context and search params
  const { user } = useUser()
  const searchParams = useSearchParams()

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
        const token = localStorage.getItem('token')

        console.log(`Getting user data for ID: ${userId}`)

        // Use the main users endpoint with proper authentication
        const response = await fetch(buildApiUrl(`users/${userId}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
        }

        const userData = await response.json()

        if (!userData) {
          throw new Error('No user data returned from API')
        }

        console.log('Fetched user data:', userData)
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

          // Handle assets path
          if (imgPath.startsWith('/assets/')) {
            setImgSrc(buildApiUrl(`assets/${imgPath.substring(8)}`))
          } else if (imgPath.startsWith('/images/')) {
            // Public images path
            setImgSrc(imgPath)
          } else {
            // Fallback to placeholder
            setImgSrc('/images/placeholder.png')
          }
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

    if (files && files.length > 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])

      if (reader.result !== null) {
        setFileInput(files[0])
      }

      // Create a new FormData instance
      const formDataToSend = new FormData()

      // Append the current form data
      formDataToSend.append('firstName', formData.firstName || '')
      formDataToSend.append('lastName', formData.lastName || '')
      formDataToSend.append('email', formData.email || '')
      formDataToSend.append('phoneNumber', formData.phoneNumber?.toString() || '')
      formDataToSend.append('address', formData.address || '')
      formDataToSend.append('state', formData.state || '')
      formDataToSend.append('zipCode', formData.zipCode || '')
      formDataToSend.append('country', formData.country || '')
      formDataToSend.append('timezone', formData.timezone || '')
      formDataToSend.append('currency', formData.currency || '')

      // Append the file
      formDataToSend.append('avatar', files[0])

      try {
        // Get user ID from URL params if available, otherwise use user context
        const urlUserId = searchParams.get('id')
        const userId = urlUserId || (user?.id ? String(user.id) : null)

        // Send the file and form data to the server
        const userApiUrl = userId ? buildApiUrl(`users/${userId}`) : buildApiUrl('users/me')

        const response = await fetch(userApiUrl, {
          method: 'PUT',
          body: formDataToSend
        })

        if (response.ok) {
          console.log('User avatar updated successfully')
        } else {
          console.error('Failed to update user avatar')
        }
      } catch (error) {
        console.error('Error updating user avatar:', error)
      }
    }
  }

  const handleFileInputReset = () => {
    setFileInput(null)
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

      const response = await fetch(buildApiUrl(`users/${userId}`), {
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
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`)
      }

      // Update the file if it was changed
      if (fileInput) {
        const fileFormData = new FormData()

        fileFormData.append('avatar', fileInput)

        const fileResponse = await fetch(buildApiUrl(`users/${userId}/avatar`), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fileFormData
        })

        if (!fileResponse.ok) {
          console.warn('Failed to upload profile picture:', fileResponse.status, fileResponse.statusText)

          // Don't fail the whole operation if just the image upload fails
          toast('Profile updated but image upload failed', {
            icon: '⚠️',
            style: {
              borderRadius: '10px',
              background: '#FFF3CD',
              color: '#856404'
            }
          })
        }
      }

      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-7'>
      <Toaster position='top-right' />
      {isLoading && (
        <Card>
          <CardContent className='flex justify-center'>
            <CircularProgress />
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert severity='error' sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
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
