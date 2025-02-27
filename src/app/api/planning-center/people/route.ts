import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/people/v2'

let progress = 0 // Track progress

export async function GET(request: Request) {
  try {
    // Retrieve the access token from the cookie
    const accessToken = cookies().get('access_token')?.value

    if (!accessToken) {
      console.log('No access token found, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    console.log('Using Access Token:', accessToken) // Log the access token

    if (request.url.includes('progress')) {
      return NextResponse.json({ progress })
    }

    let allPeopleData: any[] = []
    let allIncludedData: any[] = [] // Initialize an array to collect all included data
    let nextPage = `${BASE_URL}/people?per_page=100&include=emails,addresses&where[status]=active&order=birthdate`

    while (nextPage) {
      const response = await axios.get(nextPage, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeout: 10000 // Set a timeout of 10 seconds
      })

      const peopleData = response.data.data
      const includedData = response.data.included || [] // Collect included data

      if (peopleData.length > 0) {
        allPeopleData = [...allPeopleData, ...peopleData]
        allIncludedData = [...allIncludedData, ...includedData] // Collect included data
        progress = allPeopleData.length // Update progress
      }

      nextPage = response.data.links.next || null // Update nextPage with the next link
    }

    const formattedData = allPeopleData.map((person: any) => {
      const birthdateString = person.attributes.birthdate ?? null
      const birthdate = birthdateString ? new Date(birthdateString) : null

      const formattedBirthdate =
        birthdate instanceof Date && !isNaN(birthdate.getTime()) ? birthdate.toLocaleDateString() : 'Unknown'

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

      // Find the address related to the person
      const addressData = person.relationships.addresses.data[0]

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
        (item: any) => item.type === 'Email' && item.relationships.person.data.id === person.id
      )

      return {
        id: person.id,
        firstName: person.attributes.first_name,
        lastName: person.attributes.last_name,
        birthdate: formattedBirthdate,
        ageNext,
        address: streetAddress,
        email: email ? email.attributes.address : 'No email',
        gender: person.attributes.gender || 'Not specified',
        profilePicture: person.attributes.avatar || 'No avatar'
      }
    })

    console.log('Successfully fetched data from Planning Center')

    return NextResponse.json(formattedData)
  } catch (error: any) {
    console.error('Planning Center API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })

    if (error.response?.status === 401) {
      console.log('Unauthorized, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    return NextResponse.json(
      { error: 'Failed to fetch data from Planning Center' },
      { status: error.response?.status || 500 }
    )
  }
}
