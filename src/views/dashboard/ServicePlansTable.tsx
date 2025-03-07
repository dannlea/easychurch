'use client'
import React, { useState, useEffect } from 'react'

// MUI Imports
import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import PrintIcon from '@mui/icons-material/Print'
import Chip from '@mui/material/Chip'

// Third-party Imports
import axios from 'axios'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import tableStyles from '@core/styles/table.module.css'

interface ServicePlan {
  id: string
  title: string
  date: string
  time: string
  serviceName: string
  leaderName: string
  leaderId: string
  leaderAvatar: string
  teamMembers: TeamMember[]
  status: 'draft' | 'planned' | 'confirmed'
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  return new Date(dateString).toLocaleDateString(undefined, options)
}

const ServicePlansTable = () => {
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<ServicePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const fetchServicePlans = async () => {
      try {
        setLoading(true)

        const response = await axios.get('/api/planning-center/service-plans', {
          headers: {
            Authorization: `Bearer YOUR_ACCESS_TOKEN`
          }
        })

        const data = response.data

        console.log('API Response:', data)

        setServicePlans(data)
        setFilteredPlans(data)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError('Failed to fetch service plans from Planning Center')
        router.push('/api/planning-center/auth')
      } finally {
        setLoading(false)
      }
    }

    fetchServicePlans()
  }, [router])

  useEffect(() => {
    if (selectedServiceType === 'all') {
      setFilteredPlans(servicePlans)
    } else {
      setFilteredPlans(servicePlans.filter(plan => plan.serviceName === selectedServiceType))
    }
  }, [selectedServiceType, servicePlans])

  const serviceTypes = ['all', ...new Set(servicePlans.map(plan => plan.serviceName))]

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Please allow popups for this website')

      return
    }

    // Generate the HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Upcoming Service Plans</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
              }
              body {
                font-family: Arial, sans-serif;
                color: #333;
                line-height: 1.5;
                position: relative;
                min-height: 100vh;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                display: flex;
                align-items: center;
              }
              .logo {
                margin-right: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th {
                text-align: left;
                padding: 8px;
                border-bottom: 2px solid #ddd;
                font-weight: bold;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #eee;
              }
              .page-break {
                page-break-after: always;
              }
              .status {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 12px;
              }
              .status.draft {
                background-color: #f3f3f3;
                color: #666;
              }
              .status.planned {
                background-color: #e1f5fe;
                color: #0288d1;
              }
              .status.confirmed {
                background-color: #e8f5e9;
                color: #2e7d32;
              }
              .team-members {
                margin-top: 5px;
                font-size: 12px;
                color: #666;
              }
              .footer {
                font-style: italic;
                color: #777;
                opacity: 0.6;
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #eee;
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">
              <span>EasyChurch</span>
            </div>
            <div>Upcoming Service Plans</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Service</th>
                <th>Leader</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPlans
                .map(
                  plan => `
                <tr>
                  <td>${formatDate(plan.date)}<br><small>${plan.time}</small></td>
                  <td>${plan.title}</td>
                  <td>${plan.serviceName}</td>
                  <td>${plan.leaderName}
                    ${
                      plan.teamMembers.length > 0
                        ? `<div class="team-members">Team: ${plan.teamMembers.map(member => `${member.name} (${member.role})`).join(', ')}</div>`
                        : ''
                    }
                  </td>
                  <td><div class="status ${plan.status}">${plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}</div></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            Printed on ${new Date().toLocaleDateString()} - EasyChurch Planning Center
          </div>
        </body>
      </html>
    `

    // Write the content to the new window
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = function () {
      // Small delay to ensure everything is rendered properly
      setTimeout(() => {
        printWindow.print()

        // printWindow.close() // Optional: close after printing
      }, 300)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return { bgcolor: 'grey.100', color: 'text.secondary' }
      case 'planned':
        return { bgcolor: 'info.lighter', color: 'info.dark' }
      case 'confirmed':
        return { bgcolor: 'success.lighter', color: 'success.dark' }
      default:
        return { bgcolor: 'grey.100', color: 'text.secondary' }
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <form onSubmit={e => e.preventDefault()}>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={9}>
                  <FormControl fullWidth>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      label='Service Type'
                      value={selectedServiceType}
                      onChange={e => {
                        setSelectedServiceType(e.target.value)
                      }}
                    >
                      {serviceTypes.map((type, index) => (
                        <MenuItem key={index} value={type}>
                          {type === 'all' ? 'All Services' : type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handlePrint}
                    startIcon={<PrintIcon />}
                    disabled={loading || filteredPlans.length === 0}
                    fullWidth
                  >
                    Print
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Leader</th>
                  <th>Team</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <Typography align='center' className='animate-pulse italic'>
                        Loading service plans...
                      </Typography>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6}>
                      <Typography color='error' align='center'>
                        {error}
                      </Typography>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Typography color='error' align='center'>
                        No service plans found.
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr
                      key={plan.id}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td className='!plb-1'>
                        <div className='flex flex-col'>
                          <Typography color='text.primary' className='font-medium'>
                            {formatDate(plan.date)}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {plan.time}
                          </Typography>
                        </div>
                      </td>
                      <td className='!plb-1'>
                        <div className='flex flex-col'>
                          <Typography color='text.primary' className='font-medium'>
                            <a
                              href={`https://services.planningcenteronline.com/plans/${plan.id}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                textDecoration: 'none',
                                color: 'inherit'
                              }}
                            >
                              {plan.title}
                            </a>
                          </Typography>
                        </div>
                      </td>
                      <td className='!plb-1'>
                        <Typography variant='body2'>{plan.serviceName}</Typography>
                      </td>
                      <td className='!plb-1'>
                        <div className='flex items-center gap-3'>
                          <CustomAvatar src={plan.leaderAvatar} size={34} />
                          <div className='flex flex-col'>
                            <Typography color='text.primary' className='font-medium'>
                              <a
                                href={`https://people.planningcenteronline.com/people/${plan.leaderId}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                style={{
                                  textDecoration: 'none',
                                  color: 'inherit'
                                }}
                              >
                                {plan.leaderName}
                              </a>
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className='!plb-1'>
                        {plan.teamMembers.map((member, index) => (
                          <div key={index} className='mb-1'>
                            <Typography variant='caption' sx={{ fontWeight: 600 }}>
                              {member.role}:
                            </Typography>
                            <Typography variant='caption'> {member.name}</Typography>
                          </div>
                        ))}
                      </td>
                      <td className='!plb-1'>
                        <Chip
                          label={plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                          size='small'
                          sx={getStatusColor(plan.status)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <Typography variant='body2' color='text.secondary' align='center' sx={{ fontStyle: 'italic', opacity: 0.6 }}>
            Showing {filteredPlans.length} upcoming service plans.
          </Typography>
        </div>
      </Grid>
    </Grid>
  )
}

export default ServicePlansTable
