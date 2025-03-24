'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import PrintIcon from '@mui/icons-material/Print'
import axios from 'axios'

// Define the structure of a birthday record
interface BirthdayRecord {
  id: string
  firstName: string
  lastName: string
  birthdate: string
  ageNext: number | null
  email: string
  address: string
  gender: string
  profilePicture: string
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

// Helper function to format the date
const formatBirthdate = (dateStr: string) => {
  if (dateStr === 'Unknown') return dateStr

  try {
    // Create date with noon time to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00')

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr)

      return 'Unknown'
    }

    const month = date.getMonth()
    const day = date.getDate()

    return `${months[month]} ${day}, ${new Date().getFullYear()}`
  } catch (error) {
    console.error('Error formatting date:', error)

    return 'Unknown'
  }
}

// Helper function to get background color based on gender and age
const getRowStyle = (gender: string, age: number | null) => {
  // Base colors with opacity
  const femaleBase = 'rgba(255, 241, 241'
  const maleBase = 'rgba(241, 248, 255'
  const undefinedBase = 'rgba(245, 245, 245'

  // Get base color based on gender
  let baseColor = undefinedBase

  if (gender.toLowerCase() === 'female') {
    baseColor = femaleBase
  } else if (gender.toLowerCase() === 'male') {
    baseColor = maleBase
  }

  // Calculate opacity based on age
  let opacity = 1

  if (age !== null) {
    if (age <= 11) {
      opacity = 0.3 // Light
    } else if (age <= 18) {
      opacity = 0.6 // Medium
    } else {
      opacity = 0.9 // Dark
    }
  }

  return {
    backgroundColor: `${baseColor}, ${opacity})`
  }
}

const BirthdayTable = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BirthdayRecord[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  // Function to fetch birthdays from Planning Center
  const fetchBirthdays = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching birthdays from Planning Center...')

      const response = await axios.get('/api/planning-center/people')

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data format received from API')
      }

      setData(response.data)
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching birthdays:', error)

      if (error.response?.status === 401 && retryCount < 1) {
        console.log('Unauthorized, redirecting to Planning Center auth...')
        window.location.href = '/api/planning-center/auth'

        return
      }

      setError(`Failed to load birthday data: ${error.message}`)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBirthdays()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleReconnect = () => {
    window.location.href = '/api/planning-center/auth'
  }

  const handleMonthChange = (event: SelectChangeEvent) => {
    setSelectedMonth(Number(event.target.value))
  }

  const filteredData = data.filter(person => {
    if (person.birthdate === 'Unknown') return false

    try {
      // Create date with noon time to avoid timezone issues
      const date = new Date(person.birthdate + 'T12:00:00')

      if (isNaN(date.getTime())) {
        console.error('Invalid date during filtering:', person.birthdate)

        return false
      }

      const month = date.getMonth()

      return month === selectedMonth
    } catch (error) {
      console.error('Error filtering date:', error)

      return false
    }
  })

  const sortedData = [...filteredData].sort((a, b) => {
    try {
      // Create dates with noon time to avoid timezone issues
      const dateA = new Date(a.birthdate + 'T12:00:00')
      const dateB = new Date(b.birthdate + 'T12:00:00')

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.error('Invalid date during sorting:', { dateA: a.birthdate, dateB: b.birthdate })

        return 0
      }

      const dayA = dateA.getDate()
      const dayB = dateB.getDate()

      return dayA - dayB
    } catch (error) {
      console.error('Error sorting dates:', error)

      return 0
    }
  })

  return (
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel sx={{ fontSize: '1.1rem' }}>Select Birthday Month</InputLabel>
          <Select
            value={selectedMonth.toString()}
            label='Select Birthday Month'
            onChange={handleMonthChange}
            sx={{
              fontSize: '1.25rem',
              '& .MuiSelect-select': {
                padding: '14px 16px'
              }
            }}
          >
            {months.map((month, index) => (
              <MenuItem key={month} value={index} sx={{ fontSize: '1.1rem' }}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant='contained'
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            bgcolor: '#7C4DFF',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            '&:hover': {
              bgcolor: '#6B42DD'
            }
          }}
        >
          Print
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant='contained' onClick={() => fetchBirthdays()} sx={{ mr: 1 }}>
            Retry
          </Button>
          <Button variant='outlined' onClick={handleReconnect}>
            Reconnect to Planning Center
          </Button>
        </Box>
      ) : sortedData.length > 0 ? (
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table sx={{ minWidth: 650 }} aria-label='birthdays table'>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    width: '30%',
                    '@media print': {
                      fontSize: '12px',
                      padding: '8px',
                      width: '25%'
                    }
                  }}
                >
                  NAME
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    width: '15%',
                    textAlign: 'center',
                    '@media print': {
                      fontSize: '12px',
                      padding: '8px',
                      width: '20%'
                    }
                  }}
                >
                  BIRTHDAY
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    width: '8%',
                    textAlign: 'center',
                    '@media print': {
                      fontSize: '12px',
                      padding: '8px',
                      width: '8%'
                    }
                  }}
                >
                  AGE
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    width: '47%',
                    '@media print': {
                      fontSize: '12px',
                      padding: '8px',
                      width: '47%'
                    }
                  }}
                >
                  MAILING ADDRESS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map(person => (
                <TableRow
                  key={person.id}
                  sx={{
                    ...getRowStyle(person.gender, person.ageNext),
                    '&:hover': { filter: 'brightness(0.95)' },
                    height: '45px',
                    '& > td': {
                      padding: '6px 12px',
                      height: 'inherit',
                      '@media print': {
                        padding: '8px',
                        height: 'auto'
                      }
                    }
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        '@media print': {
                          gap: 1
                        }
                      }}
                    >
                      <Avatar
                        src={person.profilePicture !== 'No avatar' ? person.profilePicture : ''}
                        alt={`${person.firstName} ${person.lastName}`}
                        sx={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          '@media print': {
                            display: 'none'
                          }
                        }}
                      >
                        {person.firstName.charAt(0)}
                      </Avatar>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          '@media print': {
                            gap: 0.1
                          }
                        }}
                      >
                        <Typography
                          component='a'
                          href={`https://people.planningcenteronline.com/people/${person.id}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            },
                            '@media print': {
                              fontSize: '11px',
                              lineHeight: 1.1,
                              fontWeight: 600
                            }
                          }}
                        >
                          {person.firstName} {person.lastName}
                        </Typography>
                        {person.email !== 'No email' && (
                          <Typography
                            component='a'
                            href={`mailto:${person.email}`}
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              fontStyle: 'italic',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              },
                              '@media print': {
                                display: 'none'
                              }
                            }}
                          >
                            {person.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      '@media print': {
                        fontSize: '12px'
                      }
                    }}
                  >
                    {formatBirthdate(person.birthdate)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      '@media print': {
                        fontSize: '12px'
                      }
                    }}
                  >
                    {person.ageNext}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '0.9rem',
                      '@media print': {
                        fontSize: '12px'
                      }
                    }}
                  >
                    {person.address}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant='body1'>No birthdays found for {months[selectedMonth]}.</Typography>
        </Box>
      )}
      {data.length > 0 && (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            mt: 2,
            textAlign: 'center',
            '@media print': {
              display: 'none'
            }
          }}
        >
          There are {data.filter(p => p.birthdate === 'Unknown').length} users in your People database without
          birthdays.
        </Typography>
      )}
    </CardContent>
  )
}

// Add global print styles at the top of the file
const globalPrintStyles = `
  @media print {
    @page {
      margin: 0.5cm;
    }
    body * {
      visibility: hidden;
    }
    .MuiCard-root, .MuiCard-root * {
      visibility: visible;
    }
    .MuiCard-root {
      position: absolute;
      left: 0;
      top: 0;
    }
    .MuiButton-root, .MuiFormControl-root {
      display: none !important;
    }
  }
`

// Add the style tag to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')

  style.innerHTML = globalPrintStyles
  document.head.appendChild(style)
}

export default BirthdayTable
