'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

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
import type { SelectChangeEvent } from '@mui/material/Select'

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

  const [fileInput, setFileInput] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>('/images/placeholder.png')
  const [language, setLanguage] = useState<string[]>(['English'])

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}/users/2`)
        const [data] = await response.json()

        console.log('Fetched user data:', data)
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          organization: data.organization_name || '',
          phoneNumber: data.phone_number || '',
          address: data.address || '',
          state: data.state || '',
          zipCode: data.zip_code || '',
          country: data.country || '',
          language: data.language || '',
          timezone: data.time_zone || 'gmt-05', // Default value
          currency: data.currency || 'usd' // Default value
        })

        // Set the avatar image source
        setImgSrc(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}${data.profile_picture || '/images/placeholder.png'}`)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])

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

    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result as string)
      reader.readAsDataURL(files[0])

      if (reader.result !== null) {
        setFileInput(reader.result as string)
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
        // Send the file and form data to the server
        const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}/users/2`, {
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
    setFileInput('')
    setImgSrc('/images/avatars/1.png')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formDataToSend = new FormData()

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

    if (fileInput) {
      formDataToSend.append('avatar', fileInput) // Append the file
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_SERVER}/users/2`, {
        method: 'PUT',
        body: formDataToSend
      })

      if (response.ok) {
        console.log('User updated successfully')
      } else {
        console.error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  return (
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
                    value={fileInput}
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
                  value={formData?.firstName}
                  placeholder='John'
                  onChange={e => handleFormChange('firstName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Last Name'
                  value={formData?.lastName}
                  placeholder='Doe'
                  onChange={e => handleFormChange('lastName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Email'
                  value={formData?.email}
                  placeholder='wacky-duck@ducks.com'
                  onChange={e => handleFormChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  disabled
                  fullWidth
                  label='Organization'
                  value={formData?.organization}
                  placeholder='Your Organization Admin needs to set this'
                  onChange={e => handleFormChange('organization', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Phone Number'
                  value={formData?.phoneNumber}
                  placeholder='+1 (234) 567-8901'
                  onChange={e => handleFormChange('phoneNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Address'
                  value={formData?.address}
                  placeholder='Address'
                  onChange={e => handleFormChange('address', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Province/State'
                  value={formData?.state}
                  placeholder='New Brunswick'
                  onChange={e => handleFormChange('state', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Postal Code'
                  value={formData?.zipCode}
                  placeholder='A1B 2C3'
                  onChange={e => handleFormChange('zipCode', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Country'
                  value={formData?.country}
                  placeholder='Canada'
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
                    value={formData?.timezone}
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

              <Grid item xs={12} className='flex gap-4 flex-wrap'>
                <Button variant='contained' type='submit'>
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AccountDetails
