import { NextResponse } from 'next/server'

import axios from 'axios'

// Utilities
import { validateToken } from '../utils/tokenUtils'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/people/v2'

export async function GET(request: Request) {
  try {
    console.log('Planning Center Anniversaries API request received')

    // Validate and potentially refresh the token
    const { token, needsAuth } = await validateToken()

    if (needsAuth) {
      console.log('Token validation failed, redirecting to auth')
      const baseUrl = process.env.BASE_URL || request.url

      return NextResponse.redirect(new URL('/api/planning-center/auth', baseUrl))
    }

    console.log('Token validation successful')

    let allPeopleData: any[] = []
    let allIncludedData: any[] = []
    let nextPage: string | null = `${BASE_URL}/people?per_page=100&include=emails,addresses&where[status]=active`
    let hasData = false
    let pagesAttempted = 0

    console.log('Starting to fetch people data for anniversaries...')

    // Fetch all pages until there are no more
    while (nextPage) {
      pagesAttempted++
      console.log(`Fetching page ${pagesAttempted} from Planning Center: ${nextPage}`)

      try {
        const response: any = await axios.get(nextPage, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 30000
        })

        console.log(`Received page ${pagesAttempted} with ${response.data.data.length} records`)

        const peopleData = response.data.data
        const includedData = response.data.included || []

        if (peopleData.length > 0) {
          hasData = true
          allPeopleData = [...allPeopleData, ...peopleData]
          allIncludedData = [...allIncludedData, ...includedData]
        }

        nextPage = response.data.links?.next || null
      } catch (pageError: any) {
        console.error(`Error fetching page ${pagesAttempted}:`, pageError.message)
        nextPage = null
      }
    }

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

    try {
      const formattedData = allPeopleData
        .map((person: any) => {
          try {
            const attributes = person.attributes
            const anniversaryDate = attributes.anniversary || null

            // Skip if no anniversary date
            if (!anniversaryDate) {
              return null
            }

            // Create date in local timezone to avoid UTC conversion issues
            const anniversary = new Date(anniversaryDate + 'T12:00:00')

            // Skip if invalid date
            if (isNaN(anniversary.getTime())) {
              console.error('Invalid anniversary date:', anniversaryDate)

              return null
            }

            // Calculate years married
            const today = new Date()
            const marriageYear = anniversary.getFullYear()
            let yearsMarried = today.getFullYear() - marriageYear

            // Adjust years married if anniversary hasn't occurred this year
            if (
              today.getMonth() < anniversary.getMonth() ||
              (today.getMonth() === anniversary.getMonth() && today.getDate() < anniversary.getDate())
            ) {
              yearsMarried--
            }

            // Find the address related to the person
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

            // Find the email related to the person
            const email = allIncludedData.find(
              (item: any) => item.type === 'Email' && item.relationships.person?.data?.id === person.id
            )

            return {
              id: person.id,
              firstName: attributes.first_name || '',
              lastName: attributes.last_name || '',
              anniversaryDate: anniversary.toISOString().split('T')[0],
              yearsMarried,
              email: email ? email.attributes.address : 'No email',
              address: streetAddress,
              profilePicture: attributes.avatar || 'No avatar'
            }
          } catch (personError: any) {
            console.error('Error processing person record:', personError)

            return null
          }
        })
        .filter(Boolean) // Remove null entries (people without anniversaries)

      console.log('Successfully formatted anniversary data, returning response')

      return NextResponse.json(formattedData)
    } catch (formatError) {
      console.error('Error formatting anniversary data:', formatError)

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
