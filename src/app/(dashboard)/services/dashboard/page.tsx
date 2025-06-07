'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress, 
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material'

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import GroupIcon from '@mui/icons-material/Group'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventIcon from '@mui/icons-material/Event'

interface TeamMember {
  id: string
  name: string
  position: string
  teamName: string
  status: string
  personId: string | null
  personName: string
}

interface ServiceItem {
  id: string
  title: string
  type: string
  description?: string
  length?: number
  author?: string
  key?: string
  ccli?: string
}

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
  status?: string
  formattedTimes: string | null
  planTimes: {
    id: string
    startsAt: string
    endsAt: string
    timeFormatted: string
  }[]
  songs: ServiceItem[]
  teams: {
    id: string
    name: string
    members: TeamMember[]
  }[]
  keyPeople: TeamMember[]
  planningCenterUrl: string
}

export default function ServiceDashboard() {
  const [servicePlan, setServicePlan] = useState<ServicePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | false>('panel1')
  const router = useRouter()

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/planning-center/services')

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/api/planning-center/auth')

            return
          }

          throw new Error('Failed to fetch service data')
        }

        const data = await response.json()

        if (data.plans && data.plans.length > 0) {
          // Find the next upcoming service
          const now = new Date()

          const upcomingServices = data.plans
            .filter((plan: any) => {
              // Try multiple possible date fields
              const possibleDates = [
                plan.attributes.dates?.service_dates?.[0],
                plan.attributes.sort_date,
                plan.attributes.dates?.sort_date,
                plan.attributes.dates?.starts_at,
                plan.attributes.starts_at
              ].filter(Boolean)

              for (const dateStr of possibleDates) {
                try {
                  const serviceDate = new Date(dateStr)

                  if (!isNaN(serviceDate.getTime())) {
                    // Add 1 day buffer to include today's services
                    return serviceDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000
                  }
                } catch (e) {
                  console.error(`Invalid date: ${dateStr}`, e)
                }
              }

              return false
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(a.attributes.dates?.service_dates?.[0] || a.attributes.sort_date || 0)
              const dateB = new Date(b.attributes.dates?.service_dates?.[0] || b.attributes.sort_date || 0)

              return dateA.getTime() - dateB.getTime()
            })

          if (upcomingServices.length > 0) {
            const nextPlan = upcomingServices[0]

            // Transform the data to match our ServicePlan interface
            const servicePlan: ServicePlan = {
              id: nextPlan.id,
              title: nextPlan.attributes.title || 'Untitled Service',
              serviceTypeName: nextPlan.attributes.service_type_name || 'Service',
              serviceTypeId: nextPlan.attributes.service_type_id || '',
              dates: {
                sort: nextPlan.attributes.dates?.sort || '',
                planningCenter: nextPlan.attributes.dates?.planning_center || '',
                formatted: nextPlan.attributes.dates?.formatted || ''
              },
              formattedTimes: nextPlan.attributes.formatted_times || null,
              planTimes: nextPlan.attributes.plan_times || [],
              songs: nextPlan.attributes.songs || [],
              teams: nextPlan.attributes.teams || [],
              keyPeople: nextPlan.attributes.key_people || [],
              planningCenterUrl:
                nextPlan.attributes.planning_center_url ||
                `https://services.planningcenteronline.com/plans/${nextPlan.id}`
            }

            setServicePlan(servicePlan)
          }
        }
      } catch (err) {
        console.error('Error fetching service data:', err)
        setError('Failed to load service data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchServiceData()
  }, [router])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    )
  }

  if (!servicePlan) {
    return (
      <Card>
        <CardContent>
          <Typography>No upcoming services found.</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" component="h1" gutterBottom>
                  {servicePlan.title}
                </Typography>
                <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                  <Box display="flex" alignItems="center">
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">{servicePlan.dates.formatted}</Typography>
                  </Box>
                  {servicePlan.formattedTimes ? (
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1rem' }} />
                      <Typography variant="body1" color="text.secondary">
                        {servicePlan.formattedTimes}
                      </Typography>
                    </Box>
                  ) : servicePlan.planTimes.length > 0 ? (
                    <Box display='flex' alignItems='center'>
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1rem' }} />
                      <Typography variant='body1' color='text.secondary'>
                        {servicePlan.planTimes.map(time => time.timeFormatted).join(' & ')}
                      </Typography>
                    </Box>
                  ) : null}
                  <Chip label={servicePlan.serviceTypeName} size='small' color='primary' variant='outlined' />
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  component='a'
                  href={servicePlan.planningCenterUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  size='small'
                  sx={{ ml: 'auto' }}
                >
                  <OpenInNewIcon />
                </IconButton>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display='flex' alignItems='center'>
              <MusicNoteIcon sx={{ mr: 1 }} />
              <Typography>Songs</Typography>
              {servicePlan.songs.length > 0 && <Chip label={servicePlan.songs.length} size='small' sx={{ ml: 1 }} />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {servicePlan.songs.length > 0 ? (
              <Box component='ul' sx={{ pl: 0, listStyle: 'none' }}>
                {servicePlan.songs.map((song, index) => (
                  <Box
                    key={song.id}
                    component='li'
                    sx={{
                      mb: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Typography variant='subtitle1'>
                      {index + 1}. {song.title}
                      {song.author && ` by ${song.author}`}
                    </Typography>
                    {(song.ccli || song.key) && (
                      <Box display='flex' gap={2} mt={1}>
                        {song.ccli && (
                          <Typography variant='caption' color='text.secondary'>
                            CCLI: {song.ccli}
                          </Typography>
                        )}
                        {song.key && (
                          <Typography variant='caption' color='text.secondary'>
                            Key: {song.key}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color='text.secondary'>No songs added yet</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display='flex' alignItems='center'>
              <GroupIcon sx={{ mr: 1 }} />
              <Typography>Team Members</Typography>
              {servicePlan.keyPeople.length > 0 && (
                <Chip label={servicePlan.keyPeople.length} size='small' sx={{ ml: 1 }} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {servicePlan.keyPeople.length > 0 ? (
              <Grid container spacing={2}>
                {servicePlan.keyPeople.map(person => (
                  <Grid item xs={12} sm={6} md={4} key={person.id}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Box display='flex' alignItems='center' mb={1}>
                          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant='subtitle2'>{person.personName || person.name}</Typography>
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                          {person.position}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {person.teamName}
                        </Typography>
                        <Box mt={1}>
                          <Chip
                            label={person.status || 'unknown'}
                            size='small'
                            color={person.status === 'confirmed' ? 'success' : 'default'}
                            variant='outlined'
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color='text.secondary'>No team members assigned yet</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {servicePlan.teams.length > 0 && (
          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display='flex' alignItems='center'>
                <GroupIcon sx={{ mr: 1 }} />
                <Typography>Teams</Typography>
                <Chip label={servicePlan.teams.length} size='small' sx={{ ml: 1 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {servicePlan.teams.map(team => (
                  <Grid item xs={12} md={6} key={team.id}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='subtitle1' gutterBottom>
                          {team.name}
                        </Typography>
                        {team.members.length > 0 ? (
                          <Box component='ul' sx={{ pl: 2, listStyle: 'none' }}>
                            {team.members.map(member => (
                              <Box
                                key={member.id}
                                component='li'
                                sx={{
                                  mb: 1,
                                  p: 1,
                                  borderRadius: 1,
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                              >
                                <Box display='flex' alignItems='center'>
                                  <AccountCircleIcon
                                    sx={{
                                      mr: 1,
                                      color: member.status === 'confirmed' ? 'success.main' : 'text.secondary'
                                    }}
                                  />
                                  <Box flexGrow={1}>
                                    <Typography variant='body2'>{member.personName || member.name}</Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {member.position}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={member.status || 'unknown'}
                                    size='small'
                                    color={member.status === 'confirmed' ? 'success' : 'default'}
                                    variant='outlined'
                                  />
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            No members assigned
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Grid>
    </Grid>
  )
}
