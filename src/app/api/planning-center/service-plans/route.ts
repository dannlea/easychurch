import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/services/v2'

let progress = 0 // Track progress

export async function GET(request: Request) {
  try {
    // Check if this is a progress request
    if (request.url.includes('progress')) {
      return NextResponse.json({ progress })
    }

    // Retrieve the access token from the cookie
    const accessToken = cookies().get('access_token')?.value

    if (!accessToken) {
      console.log('No access token found, redirecting to auth')

      // Get headers to check for forwarded host
      const headersList = headers()
      const xForwardedHost = headersList.get('x-forwarded-host')
      const xForwardedProto = headersList.get('x-forwarded-proto') || 'https'
      const host = headersList.get('host')

      // Determine the actual host
      let actualHost: string

      if (xForwardedHost) {
        actualHost = `${xForwardedProto}://${xForwardedHost}`
        console.log('Using forwarded host for auth redirect:', actualHost)
      } else if (host) {
        actualHost = `https://${host}`
        console.log('Using host header for auth redirect:', actualHost)
      } else {
        const requestUrl = new URL(request.url)

        actualHost = requestUrl.origin
        console.log('Using request URL origin for auth redirect:', actualHost)
      }

      // Create auth URL with the correct host
      const authUrl = new URL('/api/planning-center/auth', actualHost)

      return NextResponse.redirect(authUrl)
    }

    console.log('Using Access Token:', accessToken)

    // Get all service types first
    console.log('Fetching service types from:', `${BASE_URL}/service_types`)

    const serviceTypesResponse = await axios.get(`${BASE_URL}/service_types`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeout: 10000 // Same timeout as People API
    })

    const serviceTypes = serviceTypesResponse.data.data

    console.log(
      `Found ${serviceTypes.length} service types:`,
      serviceTypes.map((st: any) => st.attributes.name)
    )

    // Now get plans for each service type
    let allPlans: any[] = []
    let allTeamMembers: any[] = [] // Initialize array to collect team members data

    for (const serviceType of serviceTypes) {
      const serviceTypeId = serviceType.id
      const serviceTypeName = serviceType.attributes.name

      // Get plans for this service type
      const plansUrl = `${BASE_URL}/service_types/${serviceTypeId}/plans?include=team_members&order=sort_date`

      console.log(`Fetching plans for service type: ${serviceTypeName} from ${plansUrl}`)

      let nextPage = plansUrl

      while (nextPage) {
        const plansResponse = await axios.get(nextPage, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          timeout: 10000 // Set a timeout of 10 seconds
        })

        const plansData = plansResponse.data.data || []
        const includedData = plansResponse.data.included || []

        if (plansData.length > 0) {
          // Add service type name to each plan
          const enrichedPlans = plansData.map((plan: any) => ({
            ...plan,
            serviceTypeName
          }))

          allPlans = [...allPlans, ...enrichedPlans]
          allTeamMembers = [...allTeamMembers, ...includedData]
          progress = allPlans.length // Update progress
        }

        nextPage = plansResponse.data.links?.next || null // Update nextPage with the next link
      }
    }

    console.log(`Total plans fetched: ${allPlans.length}`)

    // Format the plans data to match our interface
    const formattedData = allPlans.map((plan: any) => {
      // Get team members for this plan
      const teamMembersRelationships = plan.relationships?.team_members?.data || []

      const teamMembers = teamMembersRelationships
        .map((rel: any) => {
          const teamMember = allTeamMembers.find((tm: any) => tm.id === rel.id && tm.type === 'PlanPerson')

          if (!teamMember) return null

          return {
            id: teamMember.id,
            name: teamMember.attributes.name || 'Unknown',
            role: teamMember.attributes.team_position_name || 'Team Member',
            avatar: teamMember.attributes.photo_url || ''
          }
        })
        .filter(Boolean)

      // Get plan leader (first team member or use defaults)
      const leader = teamMembers[0] || { id: '', name: 'No Leader Assigned', avatar: '' }

      // Format the date
      const dateStr = plan.attributes.sort_date || new Date().toISOString().slice(0, 10)
      const planDate = new Date(dateStr)

      // Determine status (based on dates and rehearsal status)
      let status: 'draft' | 'planned' | 'confirmed' = 'draft'

      if (plan.attributes.rehearsal_status === 'rehearsed') {
        status = 'confirmed'
      } else if (planDate && planDate.getTime() > Date.now()) {
        // Future dates without rehearsal are considered planned
        status = 'planned'
      }

      return {
        id: plan.id,
        title: plan.attributes.title || plan.attributes.series_title || 'Untitled Service',
        date: dateStr,
        time: plan.attributes.time || '10:00 AM', // Default if not provided
        serviceName: plan.serviceTypeName,
        leaderName: leader.name,
        leaderId: leader.id,
        leaderAvatar: leader.avatar,
        teamMembers: teamMembers.filter((tm: any) => tm.id !== leader.id), // Exclude leader from team members
        status
      }
    })

    // Sort by date (newest first)
    formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log('Successfully fetched service plans from Planning Center')

    return NextResponse.json(formattedData)
  } catch (error: any) {
    console.error('Planning Center API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })

    if (error.response?.status === 401) {
      console.log('Unauthorized, redirecting to auth')

      // Get headers to check for forwarded host
      const headersList = headers()
      const xForwardedHost = headersList.get('x-forwarded-host')
      const xForwardedProto = headersList.get('x-forwarded-proto') || 'https'
      const host = headersList.get('host')

      // Determine the actual host
      let actualHost: string

      if (xForwardedHost) {
        actualHost = `${xForwardedProto}://${xForwardedHost}`
        console.log('Using forwarded host for auth redirect:', actualHost)
      } else if (host) {
        actualHost = `https://${host}`
        console.log('Using host header for auth redirect:', actualHost)
      } else {
        const requestUrl = new URL(request.url)

        actualHost = requestUrl.origin
        console.log('Using request URL origin for auth redirect:', actualHost)
      }

      // Create auth URL with the correct host
      const authUrl = new URL('/api/planning-center/auth', actualHost)

      return NextResponse.redirect(authUrl)
    }

    return NextResponse.json(
      { error: 'Failed to fetch service plans from Planning Center' },
      { status: error.response?.status || 500 }
    )
  }
}
