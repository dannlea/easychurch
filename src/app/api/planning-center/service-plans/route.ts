import https from 'https'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import axios from 'axios'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/services/v2'

let progress = 0 // Track progress

// Create a custom axios instance with SSL handling
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // This allows self-signed certificates and bypasses strict SSL checking
  }),
  timeout: 15000 // Increase timeout
})

export async function GET(request: Request) {
  try {
    // Check if this is a progress request
    if (request.url.includes('progress')) {
      return NextResponse.json({ progress })
    }

    // Check if we should use mock data (query parameter or testing)
    const url = new URL(request.url)
    const useMock = url.searchParams.get('mock') === 'true'

    if (useMock) {
      console.log('Using mock data (requested via parameter)')

      return NextResponse.json(getMockServicePlans())
    }

    // Retrieve the access token from the cookie
    const accessToken = cookies().get('access_token')?.value

    if (!accessToken) {
      console.log('No access token found, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    console.log('Using Access Token:', accessToken)

    try {
      // Test the token validity with a simple API call before proceeding
      try {
        await axiosInstance.get(`${BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        })
      } catch (tokenErr: any) {
        if (tokenErr.response?.status === 401) {
          console.log('Token is invalid or expired, redirecting to auth')

          return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
        }

        // If it's not a 401 error, continue with the process
      }

      // Get all service types first
      console.log('Fetching service types from:', `${BASE_URL}/service_types`)

      const serviceTypesResponse = await axiosInstance.get(`${BASE_URL}/service_types`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })

      const serviceTypes = serviceTypesResponse.data.data

      console.log(
        `Found ${serviceTypes.length} service types:`,
        serviceTypes.map((st: any) => st.attributes.name)
      )

      // Now get plans for each service type
      let allPlans: any[] = []
      let allTeamMembers: any[] = []

      for (const serviceType of serviceTypes) {
        const serviceTypeId = serviceType.id
        const serviceTypeName = serviceType.attributes.name

        // Get plans for this service type
        const plansUrl = `${BASE_URL}/service_types/${serviceTypeId}/plans?include=team_members&order=sort_date`

        console.log(`Fetching plans for service type: ${serviceTypeName} from ${plansUrl}`)

        let nextPage = plansUrl

        while (nextPage) {
          const plansResponse = await axiosInstance.get(nextPage, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
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

          nextPage = plansResponse.data.links?.next || null
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
    } catch (apiError: any) {
      console.error('API Call Error:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        code: apiError.code
      })

      // Token expired or invalid
      if (apiError.response?.status === 401) {
        console.log('Unauthorized, redirecting to auth')

        return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
      }

      // Handle specific SSL errors
      if (
        apiError.code === 'EPROTO' ||
        apiError.code === 'ERR_NETWORK' ||
        apiError.message.includes('SSL') ||
        apiError.message.includes('Network Error')
      ) {
        console.error('SSL/Network Error when connecting to Planning Center')

        return NextResponse.json(getMockServicePlans(), {
          status: 200,
          headers: {
            'X-Using-Mock-Data': 'true',
            'X-Error-Message': 'SSL or network error when connecting to Planning Center API'
          }
        })
      }

      throw apiError
    }
  } catch (error: any) {
    console.error('Planning Center API Error:', {
      message: error.message,
      code: error.code,
      name: error.name
    })

    // Fallback to mock data with headers indicating there was an error
    console.log('Falling back to mock data due to error:', error.message)

    return NextResponse.json(getMockServicePlans(), {
      status: 200,
      headers: {
        'X-Using-Mock-Data': 'true',
        'X-Error-Reason': error.message || 'Unknown error'
      }
    })
  }
}

// Helper function to get mock service plans data
function getMockServicePlans() {
  return [
    {
      id: 'plan1',
      title: 'Sunday Morning Worship (Mock Data)',
      date: '2025-03-10',
      time: '9:00 AM',
      serviceName: 'Sunday Service',
      leaderName: 'John Smith',
      leaderId: 'leader1',
      leaderAvatar: '',
      teamMembers: [
        {
          id: 'tm1',
          name: 'Sarah Johnson',
          role: 'Worship Leader',
          avatar: ''
        },
        {
          id: 'tm2',
          name: 'Mike Davis',
          role: 'Piano',
          avatar: ''
        }
      ],
      status: 'confirmed'
    },
    {
      id: 'plan2',
      title: 'Sunday Evening Worship (Mock Data)',
      date: '2025-03-10',
      time: '6:00 PM',
      serviceName: 'Evening Service',
      leaderName: 'Jane Wilson',
      leaderId: 'leader2',
      leaderAvatar: '',
      teamMembers: [],
      status: 'planned'
    }
  ]
}
