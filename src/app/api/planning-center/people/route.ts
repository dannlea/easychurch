import { NextResponse } from 'next/server'

import axios from 'axios'

// Utilities
import { validateToken } from '../utils/tokenUtils'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/people/v2'

let progress = 0 // Track progress

export async function GET(request: Request) {
  try {
    console.log('Planning Center People API request received')

    // Validate and potentially refresh the token
    const { token, needsAuth } = await validateToken()

    if (needsAuth) {
      console.log('Token validation failed, redirecting to auth')

      const baseUrl = process.env.BASE_URL || request.url

      return NextResponse.redirect(new URL('/api/planning-center/auth', baseUrl))
    }

    console.log('Token validation successful')

    if (request.url.includes('progress')) {
      return NextResponse.json({ progress })
    }

    let allPeopleData: any[] = []
    let allIncludedData: any[] = [] // Initialize an array to collect all included data
    let nextPage: string | null = `${BASE_URL}/people?per_page=100&include=emails,addresses&where[status]=active`
    let hasData = false
    let pagesAttempted = 0

    console.log('Starting to fetch people data from Planning Center...')

    // Fetch all pages until there are no more
    while (nextPage) {
      pagesAttempted++
      console.log(`Fetching page ${pagesAttempted} from Planning Center: ${nextPage}`)

      try {
        const response: any = await axios.get(nextPage, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 30000 // Increased timeout
        })

        console.log(`Received page ${pagesAttempted} with ${response.data.data.length} records`)

        const peopleData = response.data.data
        const includedData = response.data.included || [] // Collect included data

        if (peopleData.length > 0) {
          hasData = true
          allPeopleData = [...allPeopleData, ...peopleData]
          allIncludedData = [...allIncludedData, ...includedData] // Collect included data
          progress = allPeopleData.length // Update progress
        }

        // Check if there's a next page
        nextPage = response.data.links?.next || null

        // If we've processed 1000+ records, log progress
        if (allPeopleData.length >= 1000 && allPeopleData.length % 1000 === 0) {
          console.log(`Processed ${allPeopleData.length} records so far...`)
        }
      } catch (pageError: any) {
        console.error(`Error fetching page ${pagesAttempted}:`, pageError.message)

        // If we hit a rate limit, wait and retry
        if (pageError.response?.status === 429) {
          console.log('Rate limit hit, waiting 60 seconds before retrying...')
          await new Promise(resolve => setTimeout(resolve, 60000))
          continue // Retry the same page
        }

        // For other errors, stop pagination
        nextPage = null
      }
    }

    // If we didn't get any data after attempting pages, return a clear error
    if (!hasData && pagesAttempted > 0) {
      console.error(`Failed to get data after attempting ${pagesAttempted} pages`)

      return NextResponse.json(
        {
          error: 'Failed to fetch people data from Planning Center',
          message: 'No data returned after multiple attempts'
        },
        { status: 502 }
      )
    }

    console.log(`Total people data records: ${allPeopleData.length}`)
    console.log(`Total included data records: ${allIncludedData.length}`)

    try {
      const formattedData = allPeopleData.map((person: any) => {
        try {
          const attributes = person.attributes

          // Process birthdate
          const birthdateString = attributes.birthdate ?? null
          const birthdate = birthdateString ? new Date(birthdateString + 'T12:00:00') : null

          // Process anniversary
          const anniversaryString = attributes.anniversary ?? null
          const anniversary = anniversaryString ? new Date(anniversaryString + 'T12:00:00') : null

          // Format birthdate
          const formattedBirthdate =
            birthdate instanceof Date && !isNaN(birthdate.getTime())
              ? `${birthdate.getFullYear()}-${String(birthdate.getMonth() + 1).padStart(2, '0')}-${String(
                  birthdate.getDate()
                ).padStart(2, '0')}`
              : 'Unknown'

          // Format anniversary
          const formattedAnniversary =
            anniversary instanceof Date && !isNaN(anniversary.getTime())
              ? `${anniversary.getFullYear()}-${String(anniversary.getMonth() + 1).padStart(2, '0')}-${String(
                  anniversary.getDate()
                ).padStart(2, '0')}`
              : 'Unknown'

          // Calculate next birthday age
          let birthYear: number | null = null
          let birthMonthDay: string | null = null

          if (birthdate !== null) {
            birthYear = birthdate.getFullYear()
            birthMonthDay = birthdate.toISOString().slice(5, 10)
          }

          const currentYear = new Date().getFullYear()
          const currentMonthDay = new Date().toISOString().slice(5, 10)
          const currentAge = birthYear !== null ? currentYear - birthYear : null

          const ageNext =
            birthYear !== null && birthMonthDay !== null && birthMonthDay > currentMonthDay
              ? currentAge
              : currentAge !== null
                ? currentAge + 1
                : null

          // Calculate years married
          let yearsMarried: number | null = null

          if (anniversary instanceof Date && !isNaN(anniversary.getTime())) {
            const marriageYear = anniversary.getFullYear()

            yearsMarried = currentYear - marriageYear

            if (
              new Date().getMonth() < anniversary.getMonth() ||
              (new Date().getMonth() === anniversary.getMonth() && new Date().getDate() < anniversary.getDate())
            ) {
              yearsMarried--
            }
          }

          // Get contact information
          const addressData = person.relationships.addresses?.data?.[0]

          const address = addressData
            ? allIncludedData.find((item: any) => item.id === addressData.id && item.type === 'Address')
            : null

          const streetAddress = address
            ? [
                address.attributes.street_line_1,
                address.attributes.street_line_2,
                address.attributes.city,
                address.attributes.state,
                address.attributes.zip
              ]
                .filter(Boolean)
                .join(', ')
            : 'No address'

          const email = allIncludedData.find(
            (item: any) => item.type === 'Email' && item.relationships.person?.data?.id === person.id
          )

          // Log for debugging
          console.log('Processing person:', {
            id: person.id,
            name: `${attributes.first_name} ${attributes.last_name}`,
            birthdate: birthdateString,
            anniversary: anniversaryString,
            status: attributes.status,
            child: attributes.child
          })

          return {
            id: person.id,
            firstName: attributes.first_name || '',
            lastName: attributes.last_name || '',
            birthdate: formattedBirthdate,
            anniversaryDate: formattedAnniversary,
            ageNext,
            yearsMarried,
            address: streetAddress,
            email: email ? email.attributes.address : 'No email',
            gender: attributes.gender || 'Not specified',
            profilePicture: attributes.avatar || 'No avatar'
          }
        } catch (personError) {
          console.error('Error processing person record:', personError)

          return {
            id: person.id || 'unknown',
            firstName: person.attributes?.first_name || 'Unknown',
            lastName: person.attributes?.last_name || 'User',
            birthdate: 'Unknown',
            anniversaryDate: 'Unknown',
            ageNext: null,
            yearsMarried: null,
            address: 'No address',
            email: 'No email',
            gender: 'Not specified',
            profilePicture: 'No avatar'
          }
        }
      })

      console.log('Successfully formatted data from Planning Center, returning response')

      return NextResponse.json(formattedData)
    } catch (formatError) {
      console.error('Error formatting people data:', formatError)

      return NextResponse.json({ error: 'Failed to format Planning Center data' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Planning Center API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })

    if (error.response?.status === 401) {
      console.log('Unauthorized, redirecting to auth')

      const baseUrl = process.env.BASE_URL || request.url

      return NextResponse.redirect(new URL('/api/planning-center/auth', baseUrl))
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch data from Planning Center',
        message: error.message || 'Unknown error'
      },
      { status: error.response?.status || 500 }
    )
  }
}
