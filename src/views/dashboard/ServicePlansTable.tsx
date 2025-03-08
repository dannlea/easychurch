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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventIcon from '@mui/icons-material/Event'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import GroupIcon from '@mui/icons-material/Group'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FolderIcon from '@mui/icons-material/Folder'

// Third-party Imports
import axios from 'axios'

interface ServicePlan {
  id: string
  title: string
  serviceTypeName: string
  serviceTypeId: string
  dates: {
    sort: string
    planningCenter: string
    formatted: string
  }
  status: string
  formattedTimes: string | null
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
    ccli?: string
    arrangementId?: string
    key?: string
    bpm?: number
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

interface ServiceType {
  id: string
  name: string
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
  const [filteredPlans, setFilteredPlans] = useState<ServicePlan[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all')
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

        const plans: ServicePlan[] = response.data

        setServicePlans(plans)
        setFilteredPlans(plans)

        const typesMap = new Map<string, ServiceType>()

        plans.forEach(plan => {
          if (plan.serviceTypeName && !typesMap.has(plan.serviceTypeId)) {
            typesMap.set(plan.serviceTypeId, {
              id: plan.serviceTypeId,
              name: plan.serviceTypeName
            })
          }
        })

        const uniqueTypes = Array.from(typesMap.values())

        setServiceTypes(uniqueTypes)
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

  useEffect(() => {
    if (selectedServiceType === 'all') {
      setFilteredPlans(servicePlans)
    } else {
      const filtered = servicePlans.filter(plan => plan.serviceTypeId === selectedServiceType)

      setFilteredPlans(filtered)
    }
  }, [selectedServiceType, servicePlans])

  const handleAccordionChange = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId)
  }

  const handleServiceTypeChange = (event: SelectChangeEvent) => {
    setSelectedServiceType(event.target.value)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h5' component='h2' gutterBottom>
                  Upcoming Service Plans
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id='service-type-select-label'>Service Folder</InputLabel>
                  <Select
                    labelId='service-type-select-label'
                    id='service-type-select'
                    value={selectedServiceType}
                    label='Service Folder'
                    onChange={handleServiceTypeChange}
                    startAdornment={<FolderIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value='all'>All Service Folders</MenuItem>
                    {serviceTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align='center'>
                {selectedServiceType === 'all'
                  ? 'No upcoming service plans found.'
                  : 'No upcoming service plans found for the selected service folder.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredPlans.map(plan => (
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
                    {plan.formattedTimes ? (
                      <Typography variant='body2' color='text.secondary'>
                        {plan.formattedTimes}
                      </Typography>
                    ) : plan.planTimes.length > 0 ? (
                      <Typography variant='body2' color='text.secondary'>
                        {plan.planTimes.map(time => time.timeFormatted).join(' & ')}
                      </Typography>
                    ) : (
                      <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                        No times scheduled
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
                    {plan.songs && plan.songs.length > 0 ? (
                      <Box component='ul' sx={{ pl: 2 }}>
                        {plan.songs.map(song => (
                          <Box component='li' key={song.id} sx={{ mb: 1 }}>
                            <Typography variant='body2'>
                              <strong>{song.title}</strong>
                              {song.author && <span> by {song.author}</span>}
                              {song.key && <span> (Key: {song.key})</span>}
                              {song.ccli && <span> • CCLI: {song.ccli}</span>}
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
