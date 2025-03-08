'use client'
import React, { useState, useEffect } from 'react'

// MUI Imports
import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventIcon from '@mui/icons-material/Event'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import GroupIcon from '@mui/icons-material/Group'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

// Third-party Imports
import axios from 'axios'

interface ServicePlan {
  id: string
  title: string
  serviceTypeName: string
  dates: {
    sort: string
    planningCenter: string
    formatted: string
  }
  status: string
  planTimes: {
    id: string
    startsAt: string
    endsAt: string
    timeFormatted: string
  }[]
  songs: {
    id: string
    title: string
    author: string
  }[]
  teams: {
    id: string
    name: string
    members: {
      id: string
      name: string
      position: string
      status: string
    }[]
  }[]
  createdAt: string
  updatedAt: string
  totalItems: number
  planningCenterUrl: string
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'success'
    case 'unconfirmed':
      return 'warning'
    case 'draft':
      return 'info'
    default:
      return 'default'
  }
}

const ServicePlansTable = () => {
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchServicePlans = async () => {
      try {
        setLoading(true)

        const response = await axios.get('/api/planning-center/services', {
          headers: {
            Authorization: `Bearer YOUR_ACCESS_TOKEN`
          }
        })

        setServicePlans(response.data)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError('Failed to fetch service plans from Planning Center')

        if (err.response?.status === 401) {
          router.push('/api/planning-center/auth')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchServicePlans()
  }, [router])

  const handleAccordionChange = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant='h5' component='h2' gutterBottom>
              Upcoming Service Plans
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        {loading ? (
          <Card>
            <CardContent>
              <Typography align='center' className='animate-pulse italic'>
                Loading service plans...
              </Typography>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent>
              <Typography color='error' align='center'>
                {error}
              </Typography>
            </CardContent>
          </Card>
        ) : servicePlans.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align='center'>No upcoming service plans found.</Typography>
            </CardContent>
          </Card>
        ) : (
          servicePlans.map(plan => (
            <Accordion
              key={plan.id}
              expanded={expandedPlanId === plan.id}
              onChange={() => handleAccordionChange(plan.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems='center' spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant='h6' component='div'>
                      {plan.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {plan.serviceTypeName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display='flex' alignItems='center'>
                      <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant='body2'>{plan.dates.formatted}</Typography>
                    </Box>
                    {plan.planTimes.length > 0 && (
                      <Typography variant='body2' color='text.secondary'>
                        {plan.planTimes.map(time => time.timeFormatted).join(' & ')}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Chip label={plan.status} color={getStatusColor(plan.status) as any} size='small' sx={{ mr: 2 }} />
                    <IconButton
                      component='a'
                      href={plan.planningCenterUrl}
                      target='_blank'
                      size='small'
                      sx={{ color: 'primary.main' }}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Songs Section */}
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <MusicNoteIcon sx={{ mr: 1 }} /> Songs
                    </Typography>
                    {plan.songs.length > 0 ? (
                      <Box component='ul' sx={{ pl: 2 }}>
                        {plan.songs.map(song => (
                          <Box component='li' key={song.id} sx={{ mb: 1 }}>
                            <Typography variant='body2'>
                              <strong>{song.title}</strong>
                              {song.author && <span> by {song.author}</span>}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No songs added yet
                      </Typography>
                    )}
                  </Grid>

                  {/* Teams Section */}
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupIcon sx={{ mr: 1 }} /> Teams
                    </Typography>
                    {plan.teams.length > 0 ? (
                      plan.teams.map(team => (
                        <Box key={team.id} sx={{ mb: 2 }}>
                          <Typography variant='body2' fontWeight='bold' gutterBottom>
                            {team.name}
                          </Typography>
                          {team.members.length > 0 ? (
                            <Box component='ul' sx={{ pl: 2 }}>
                              {team.members.map(member => (
                                <Box component='li' key={member.id}>
                                  <Typography variant='body2'>
                                    {member.name} - <span style={{ fontStyle: 'italic' }}>{member.position}</span>
                                    <Chip
                                      label={member.status}
                                      size='small'
                                      color={member.status === 'confirmed' ? 'success' : 'warning'}
                                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant='body2' color='text.secondary'>
                              No team members assigned
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No teams scheduled
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Grid>
    </Grid>
  )
}

export default ServicePlansTable
