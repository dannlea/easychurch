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

// Third-party Imports
import axios from 'axios'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import tableStyles from '@core/styles/table.module.css'

interface Person {
  id: string
  firstName: string
  lastName: string
  birthdate: string
  ageNext: number
  address: string
  email: string
  gender: string
  profilePicture: string
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  return new Date(dateString).toLocaleDateString(undefined, options)
}

const BirthdayTable = () => {
  const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString())
  const [peopleByMonth, setPeopleByMonth] = useState<Record<string, Person[]>>({})
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [peopleWithoutBirthdays, setPeopleWithoutBirthdays] = useState<number>(0)
  const [totalPeople, setTotalPeople] = useState<number>(0)
  const [peopleReceived, setPeopleReceived] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        setLoading(true)

        const response = await axios.get('/api/planning-center/people', {
          headers: {
            Authorization: `Bearer YOUR_ACCESS_TOKEN`
          }
        })

        const data = response.data

        console.log('API Response:', data)

        setTotalPeople(data.length)

        const peopleWithBirthdays = data.filter((person: Person) => person.birthdate !== 'Unknown')

        console.log('People with Birthdays:', peopleWithBirthdays.length)

        setPeopleWithoutBirthdays(data.length - peopleWithBirthdays.length)
        console.log('People without Birthdays:', data.length - peopleWithBirthdays.length)

        const groupedByMonth = groupPeopleByMonth(peopleWithBirthdays)

        setPeopleByMonth(groupedByMonth)
        setFilteredPeople(groupedByMonth[currentMonth.toString()] || [])
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError('Failed to fetch people from Planning Center')
        router.push('/api/planning-center/auth')
      } finally {
        setLoading(false)
      }
    }

    fetchAllPeople()
  }, [router, currentMonth])

  useEffect(() => {
    setFilteredPeople(peopleByMonth[selectedMonth] || [])
  }, [selectedMonth, peopleByMonth])

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await axios.get('/api/planning-center/people?progress')

        setPeopleReceived(response.data.progress)

        // Stop polling if all data is received
        if (response.data.progress >= totalPeople) {
          clearInterval(intervalId)
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      }
    }

    const intervalId = setInterval(fetchProgress, 1000) // Poll every second

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [totalPeople])

  const groupPeopleByMonth = (people: Person[]) => {
    const grouped: Record<string, Person[]> = {}

    people.forEach(person => {
      const birthMonth = new Date(person.birthdate).getMonth() + 1

      if (!grouped[birthMonth]) {
        grouped[birthMonth] = []
      }

      grouped[birthMonth].push(person)
    })

    // Sort each month's array by day
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        const dayA = new Date(a.birthdate).getDate()
        const dayB = new Date(b.birthdate).getDate()

        return dayA - dayB
      })
    })

    return grouped
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

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Please allow popups for this website')

      return
    }

    // Get the month name
    const monthName = months[parseInt(selectedMonth) - 1]

    // Generate the HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${monthName} Birthdays</title>
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
              .no-print {
                display: none;
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
            <div>${monthName} Birthdays</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Birthday</th>
                <th>Age</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPeople
                .map(
                  person => `
                <tr>
                  <td>${person.firstName} ${person.lastName}</td>
                  <td>${formatDate(person.birthdate)}</td>
                  <td>${person.ageNext}</td>
                  <td>${person.address}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            There are ${peopleWithoutBirthdays} users in your People database without birthdays.
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

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <form onSubmit={e => e.preventDefault()}>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={9}>
                  <FormControl fullWidth>
                    <InputLabel>Select Birthday Month</InputLabel>
                    <Select
                      label='Select Birthday Month'
                      value={selectedMonth}
                      onChange={e => {
                        setSelectedMonth(e.target.value)
                        setFilteredPeople(peopleByMonth[e.target.value] || [])
                      }}
                    >
                      {months.map((month, index) => (
                        <MenuItem key={index + 1} value={index + 1}>
                          {month}
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
                    disabled={loading || filteredPeople.length === 0}
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
                  <th>Name</th>
                  <th>Birthday</th>
                  <th>Age</th>
                  <th>Mailing Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>
                      <Typography align='center' className='animate-pulse italic'>
                        Loading... {peopleReceived} people received
                      </Typography>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4}>
                      <Typography color='error' align='center'>
                        {error}
                      </Typography>
                    </td>
                  </tr>
                ) : filteredPeople.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <Typography color='error' align='center'>
                        No birthdays found for this month.
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map(person => (
                    <tr
                      key={person.id}
                      style={{
                        backgroundColor: (() => {
                          let opacity

                          if (person.ageNext <= 10) {
                            opacity = 0.08
                          } else if (person.ageNext <= 18) {
                            opacity = 0.15
                          } else {
                            opacity = 0.25
                          }

                          return person.gender.toLowerCase() === 'female'
                            ? `rgba(255, 182, 193, ${opacity})`
                            : `rgba(173, 216, 230, ${opacity})`
                        })(),
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = (() => {
                          let opacity

                          if (person.ageNext <= 10) {
                            opacity = 0.15
                          } else if (person.ageNext <= 18) {
                            opacity = 0.25
                          } else {
                            opacity = 0.35
                          }

                          return person.gender.toLowerCase() === 'female'
                            ? `rgba(255, 182, 193, ${opacity})`
                            : `rgba(173, 216, 230, ${opacity})`
                        })()
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = (() => {
                          let opacity

                          if (person.ageNext <= 10) {
                            opacity = 0.08
                          } else if (person.ageNext <= 18) {
                            opacity = 0.15
                          } else {
                            opacity = 0.25
                          }

                          return person.gender.toLowerCase() === 'female'
                            ? `rgba(255, 182, 193, ${opacity})`
                            : `rgba(173, 216, 230, ${opacity})`
                        })()
                      }}
                    >
                      <td className='!plb-1'>
                        <div className='flex items-center gap-3'>
                          <CustomAvatar src={person.profilePicture} size={34} />
                          <div className='flex flex-col'>
                            <Typography color='text.primary' className='font-medium'>
                              <a
                                href={`https://people.planningcenteronline.com/people/${person.id}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                style={{
                                  textDecoration: 'none',
                                  color: 'inherit'
                                }}
                              >
                                {person.firstName} {person.lastName}
                              </a>
                            </Typography>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{
                                fontStyle: 'italic'
                              }}
                            >
                              {person.email !== 'No email' && (
                                <a
                                  href={`mailto:${person.email}`}
                                  style={{
                                    textDecoration: 'none',
                                    color: 'inherit'
                                  }}
                                >
                                  {person.email}
                                </a>
                              )}
                            </Typography>
                          </div>
                        </div>
                      </td>

                      <td className='!plb-1'>
                        <Typography variant='body2'>{formatDate(person.birthdate)}</Typography>
                      </td>
                      <td className='!pb-1'>
                        <Typography variant='body2'>{person.ageNext}</Typography>
                      </td>
                      <td className='!pb-1'>
                        <Typography variant='body2'>{person.address}</Typography>
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
            There are {peopleWithoutBirthdays} users in your People database without birthdays.
          </Typography>
        </div>
      </Grid>
    </Grid>
  )
}

export default BirthdayTable
