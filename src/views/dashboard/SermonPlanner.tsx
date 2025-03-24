'use client'
import React, { useState, useEffect } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Alert from '@mui/material/Alert'

// Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import PersonIcon from '@mui/icons-material/Person'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SyncIcon from '@mui/icons-material/Sync'

// Components
import { format, parseISO } from 'date-fns'

import SermonPlannerSetup from './SermonPlannerSetup'

// Third-party Imports

// Interfaces
interface Speaker {
  id: string
  name: string
  email?: string
  phone?: string
  profilePicture?: string
}

interface SermonSeries {
  id: string
  name: string
  description?: string
  artwork?: string
  startDate: string
  endDate: string
}

interface Scripture {
  book: string
  chapter: number
  verses: string
  text?: string
}

interface SermonPlan {
  id: string
  date: string
  title?: string
  seriesId?: string
  speakerId?: string
  notes?: string
  scriptures?: Scripture[]
  planningCenterPlanId?: string
  planningCenterStatus?: string
  keyRolesAssigned?: boolean
  hasMedia?: boolean
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`sermon-planner-tabpanel-${index}`}
      aria-labelledby={`sermon-planner-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const SermonPlanner: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(currentYear)
  const [sermonPlans, setSermonPlans] = useState<SermonPlan[]>([])
  const [speakers] = useState<Speaker[]>([])
  const [sermonSeries] = useState<SermonSeries[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [planningCenterIntegration] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState(0)
  const [hasSettings, setHasSettings] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Fetch sermon plans and check settings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Check if organization settings exist
        const settingsResponse = await fetch('/api/organization-settings?organizationId=1') // TODO: Get real org ID

        if (!settingsResponse.ok) {
          setHasSettings(false)

          return
        }

        setHasSettings(true)

        // Fetch sermon plans
        const plansResponse = await fetch('/api/sermons?organizationId=1') // TODO: Get real org ID

        if (!plansResponse.ok) throw new Error('Failed to fetch sermon plans')

        const plans = await plansResponse.json()

        setSermonPlans(plans)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  // Function to sync with Planning Center
  const handlePlanningCenterSync = async () => {
    setSyncing(true)

    try {
      const response = await fetch('/api/sermons/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId: '1' }) // TODO: Get real org ID
      })

      if (!response.ok) throw new Error('Failed to sync with Planning Center')

      // Refresh sermon plans
      const plansResponse = await fetch('/api/sermons?organizationId=1')

      if (!plansResponse.ok) throw new Error('Failed to fetch updated sermon plans')

      const plans = await plansResponse.json()

      setSermonPlans(plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Planning Center')
    } finally {
      setSyncing(false)
    }
  }

  // Function to handle speaker assignment
  const handleSpeakerChange = (planId: string, speakerId: string): void => {
    setSermonPlans(prev => prev.map(plan => (plan.id === planId ? { ...plan, speakerId } : plan)))
  }

  // Function to handle series assignment
  const handleSeriesChange = (planId: string, seriesId: string): void => {
    setSermonPlans(prev => prev.map(plan => (plan.id === planId ? { ...plan, seriesId } : plan)))
  }

  // Function to handle sermon title change
  const handleTitleChange = (planId: string, title: string): void => {
    setSermonPlans(prev => prev.map(plan => (plan.id === planId ? { ...plan, title } : plan)))
  }

  // Function to toggle edit mode for a row
  const toggleEditMode = (planId: string): void => {
    setEditingRowId(editingRowId === planId ? null : planId)
  }

  // Function to render speaker cell
  const renderSpeakerCell = (plan: SermonPlan) => {
    const selectedSpeaker = speakers.find(speaker => speaker.id === plan.speakerId)

    if (editingRowId === plan.id) {
      return (
        <FormControl fullWidth size='small'>
          <InputLabel id={`speaker-select-${plan.id}`}>Speaker</InputLabel>
          <Select
            labelId={`speaker-select-${plan.id}`}
            value={plan.speakerId || ''}
            label='Speaker'
            onChange={e => handleSpeakerChange(plan.id, e.target.value)}
          >
            <MenuItem value=''>
              <em>None</em>
            </MenuItem>
            {speakers.map(speaker => (
              <MenuItem key={speaker.id} value={speaker.id}>
                {speaker.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {selectedSpeaker ? (
          <>
            <Avatar src={selectedSpeaker.profilePicture} sx={{ width: 24, height: 24, mr: 1 }}>
              <PersonIcon fontSize='small' />
            </Avatar>
            <Typography variant='body2'>{selectedSpeaker.name}</Typography>
          </>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Not assigned
          </Typography>
        )}
      </Box>
    )
  }

  // Function to render series cell
  const renderSeriesCell = (plan: SermonPlan) => {
    const selectedSeries = sermonSeries.find(series => series.id === plan.seriesId)

    if (editingRowId === plan.id) {
      return (
        <FormControl fullWidth size='small'>
          <InputLabel id={`series-select-${plan.id}`}>Series</InputLabel>
          <Select
            labelId={`series-select-${plan.id}`}
            value={plan.seriesId || ''}
            label='Series'
            onChange={e => handleSeriesChange(plan.id, e.target.value)}
          >
            <MenuItem value=''>
              <em>None</em>
            </MenuItem>
            {sermonSeries.map(series => (
              <MenuItem key={series.id} value={series.id}>
                {series.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    }

    return (
      <Box>
        {selectedSeries ? (
          <Chip label={selectedSeries.name} size='small' color='primary' variant='outlined' />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Not assigned
          </Typography>
        )}
      </Box>
    )
  }

  // Function to render sermon title cell
  const renderTitleCell = (plan: SermonPlan) => {
    if (editingRowId === plan.id) {
      return (
        <TextField
          fullWidth
          size='small'
          label='Sermon Title'
          variant='outlined'
          value={plan.title || ''}
          onChange={e => handleTitleChange(plan.id, e.target.value)}
        />
      )
    }

    return (
      <Typography variant='body2'>
        {plan.title || <span style={{ color: 'text.secondary', fontStyle: 'italic' }}>No title</span>}
      </Typography>
    )
  }

  // Function to render Planning Center status
  const renderPlanningCenterStatus = (plan: SermonPlan) => {
    if (!planningCenterIntegration) return null

    if (plan.planningCenterPlanId) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon color='success' fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='body2' color='success.main'>
            Plan Created
            {plan.keyRolesAssigned && ' • Key Roles Assigned'}
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ErrorIcon color='warning' fontSize='small' sx={{ mr: 1 }} />
        <Typography variant='body2' color='warning.main'>
          No Plan
        </Typography>
      </Box>
    )
  }

  // Function to render the action buttons
  const renderActions = (plan: SermonPlan) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => toggleEditMode(plan.id)}>
            <EditIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        {plan.planningCenterPlanId && (
          <Tooltip title='Open in Planning Center'>
            <IconButton
              size='small'
              component='a'
              href={`https://services.planningcenteronline.com/plans/${plan.planningCenterPlanId}`}
              target='_blank'
            >
              <OpenInNewIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}

        {editingRowId === plan.id && (
          <Tooltip title='Save Changes'>
            <Button
              size='small'
              variant='contained'
              color='primary'
              onClick={() => toggleEditMode(plan.id)}
              sx={{ ml: 1 }}
            >
              Save
            </Button>
          </Tooltip>
        )}
      </Box>
    )
  }

  // Function to format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy')
  }

  // Year selector
  const renderYearSelector = () => {
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 1)

    return (
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel id='year-select-label'>Year</InputLabel>
        <Select labelId='year-select-label' value={year} label='Year' onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  if (!hasSettings) {
    return <SermonPlannerSetup />
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label='Series Planner' />
                <Tab label='Past Series' />
                <Tab label='Setup' />
              </Tabs>
            </Box>

            {error && (
              <Alert severity='error' sx={{ mb: 4 }}>
                {error}
              </Alert>
            )}

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant='h5' component='h2'>
                  Sermon Planner {year}
                </Typography>
                <Box>
                  {renderYearSelector()}
                  <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={() => {
                      /* TODO: Open add series dialog */
                    }}
                    sx={{ ml: 2 }}
                  >
                    New Series
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<SyncIcon />}
                    onClick={handlePlanningCenterSync}
                    disabled={syncing}
                    sx={{ ml: 2 }}
                  >
                    Sync with Planning Center
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Series</TableCell>
                      <TableCell>Sermon Title</TableCell>
                      <TableCell>Speaker</TableCell>
                      <TableCell>Planning Center</TableCell>
                      <TableCell align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sermonPlans.map(plan => (
                      <TableRow key={plan.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
                        <TableCell component='th' scope='row'>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarMonthIcon fontSize='small' sx={{ mr: 1, opacity: 0.7 }} />
                            {formatDate(plan.date)}
                          </Box>
                        </TableCell>
                        <TableCell>{renderSeriesCell(plan)}</TableCell>
                        <TableCell>{renderTitleCell(plan)}</TableCell>
                        <TableCell>{renderSpeakerCell(plan)}</TableCell>
                        <TableCell>{renderPlanningCenterStatus(plan)}</TableCell>
                        <TableCell align='right'>{renderActions(plan)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {/* TODO: Implement Past Series View */}
              <Typography>Past Series View Coming Soon</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <SermonPlannerSetup />
            </TabPanel>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SermonPlanner
