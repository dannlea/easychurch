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
  const router = useRouter()

  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        setLoading(true)

        // Ensure the API endpoint is correct and accessible
        const response = await axios.get('/api/planning-center/people', {
          // Include headers if authentication is required
          headers: {
            Authorization: `Bearer YOUR_ACCESS_TOKEN` // Update with actual token if needed
          }
        })

        const data = response.data

        const groupedByMonth = groupPeopleByMonth(data)

        setPeopleByMonth(groupedByMonth)
        setFilteredPeople(groupedByMonth[currentMonth.toString()] || [])
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError('Failed to fetch people from Planning Center')
      } finally {
        setLoading(false)
      }
    }

    fetchAllPeople()
  }, [router])
  useEffect(() => {
    setFilteredPeople(peopleByMonth[selectedMonth] || [])
  }, [selectedMonth, peopleByMonth])

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

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <form onSubmit={e => e.preventDefault()}>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
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
                      <Typography align='center' className='animate-pulse'>
                        Loading...
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
      </Grid>
    </Grid>
  )
}

export default BirthdayTable
