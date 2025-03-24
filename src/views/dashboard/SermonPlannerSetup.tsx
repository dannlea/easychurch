'use client'
import React, { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Icons
import CloudIcon from '@mui/icons-material/Cloud'
import FolderIcon from '@mui/icons-material/Folder'

interface SetupFormData {
  serviceDays: number[]
  servicesPerDay: number
  planningCenterFolderId?: string
  storageIntegration?: 'onedrive' | 'dropbox'
  storageFolderId?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const SermonPlannerSetup: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<SetupFormData>({
    serviceDays: [0], // Default to Sunday
    servicesPerDay: 1
  })

  const steps = ['Service Schedule', 'Planning Center', 'File Storage']

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      serviceDays: prev.serviceDays.includes(day)
        ? prev.serviceDays.filter(d => d !== day)
        : [...prev.serviceDays, day].sort()
    }))
  }

  const handleServicesPerDayChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      servicesPerDay: event.target.value
    }))
  }

  const handleStorageIntegrationChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      storageIntegration: event.target.value
    }))
  }

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/organization-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // TODO: Redirect to sermon planner
    } catch (error) {
      console.error('Error saving settings:', error)

      // TODO: Show error message
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant='subtitle1' gutterBottom>
              Select service days:
            </Typography>
            <FormGroup>
              {DAYS_OF_WEEK.map(day => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={formData.serviceDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                    />
                  }
                  label={day.label}
                />
              ))}
            </FormGroup>
            <Box sx={{ mt: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Services per day</InputLabel>
                <Select value={formData.servicesPerDay} label='Services per day' onChange={handleServicesPerDayChange}>
                  {[1, 2, 3].map(num => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant='subtitle1' gutterBottom>
              Connect to Planning Center:
            </Typography>
            <Button
              variant='outlined'
              startIcon={<CloudIcon />}
              onClick={() => {
                // TODO: Implement Planning Center OAuth
              }}
            >
              Connect Planning Center
            </Button>
          </Box>
        )

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant='subtitle1' gutterBottom>
              Choose file storage:
            </Typography>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Storage Integration</InputLabel>
              <Select
                value={formData.storageIntegration || ''}
                label='Storage Integration'
                onChange={handleStorageIntegrationChange}
              >
                <MenuItem value='onedrive'>OneDrive</MenuItem>
                <MenuItem value='dropbox'>Dropbox</MenuItem>
              </Select>
            </FormControl>
            {formData.storageIntegration && (
              <Button
                variant='outlined'
                startIcon={<FolderIcon />}
                onClick={() => {
                  // TODO: Implement storage OAuth
                }}
              >
                Select Folder
              </Button>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' component='h2' gutterBottom>
          Sermon Planner Setup
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Finish
            </Button>
          ) : (
            <Button variant='contained' onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default SermonPlannerSetup
