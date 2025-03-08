import { NextResponse } from 'next/server'

import axios from 'axios'

// Utilities
import { validateToken } from '../utils/tokenUtils'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/services/v2'

let progress = 0 // Track progress

export async function GET(request: Request) {
  try {
    // Validate and potentially refresh the token
    const { token, needsAuth } = await validateToken()

    if (needsAuth) {
      console.log('Token validation failed, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    console.log('Using Access Token:', token ? token.substring(0, 10) + '...' : 'none') // Log partial token for security

    if (request.url.includes('progress')) {
      return NextResponse.json({ progress })
    }

    // Get all future service plans
    let allServicePlans: any[] = []
    let allIncludedData: any[] = [] // Initialize an array to collect all included data
    // Keep track of which service type each plan belongs to
    const planServiceTypes: Record<string, { id: string; name: string }> = {}

    try {
      // First, get all service types
      console.log('Fetching service types...')

      const serviceTypesResponse = await axios.get(`${BASE_URL}/service_types`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      })

      const serviceTypes = serviceTypesResponse.data.data || []

      console.log(`Found ${serviceTypes.length} service types`)

      if (serviceTypes.length === 0) {
        return NextResponse.json(
          {
            error: 'No service types found in Planning Center',
            message: 'Please ensure you have service types configured in Planning Center Services',
            step: 'fetching_service_types'
          },
          { status: 404 }
        )
      }

      // Then, get plans for each service type
      for (const serviceType of serviceTypes) {
        const serviceTypeId = serviceType.id
        const serviceTypeName = serviceType.attributes.name

        console.log(`Fetching plans for service type ${serviceTypeId} (${serviceTypeName})`)

        // Get plans from today forward, include teams, team_members, and arrangements
        let nextPage = `${BASE_URL}/service_types/${serviceTypeId}/plans?filter=future&include=plan_times,teams,team_members,songs,arrangements&per_page=50`

        while (nextPage) {
          const response = await axios.get(nextPage, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 15000 // Set a timeout of 15 seconds
          })

          const servicePlansData = response.data.data || []
          const includedData = response.data.included || [] // Collect included data

          if (servicePlansData.length > 0) {
            console.log(`Found ${servicePlansData.length} plans for service type ${serviceTypeId}`)

            // Record the service type ID and name for each plan
            servicePlansData.forEach((plan: any) => {
              planServiceTypes[plan.id] = {
                id: serviceTypeId,
                name: serviceTypeName
              }
            })
            allServicePlans = [...allServicePlans, ...servicePlansData]
            allIncludedData = [...allIncludedData, ...includedData] // Collect included data
            progress = allServicePlans.length // Update progress
          }

          nextPage = response.data.links?.next || null // Update nextPage with the next link
        }
      }

      if (allServicePlans.length === 0) {
        console.log('No future service plans found')

        return NextResponse.json([]) // Return empty array if no plans found
      }
    } catch (apiError: any) {
      console.error('Error fetching service plans:', apiError.message)

      return NextResponse.json(
        {
          error: 'Failed to fetch service plans from Planning Center',
          message: apiError.message,
          step: 'fetching_plans',
          url: apiError.config?.url || 'unknown'
        },
        { status: apiError.response?.status || 500 }
      )
    }

    try {
      // Format the service plans data
      const formattedServicePlans = allServicePlans.map((plan: any) => {
        // Find plan times
        const planTimeIds = plan.relationships.plan_times?.data || []

        const planTimes = planTimeIds
          .map((timeId: any) => {
            const timeItem = allIncludedData.find(item => item.type === 'PlanTime' && item.id === timeId.id)

            return timeItem
              ? {
                  id: timeItem.id,
                  startsAt: timeItem.attributes.starts_at,
                  endsAt: timeItem.attributes.ends_at,
                  timeFormatted: timeItem.attributes.time_formatted
                }
              : null
          })
          .filter(Boolean)

        // Find songs
        const songIds = plan.relationships.songs?.data || []

        const songs = songIds
          .map((songId: any) => {
            const songItem = allIncludedData.find(item => item.type === 'Song' && item.id === songId.id)

            return songItem
              ? {
                  id: songItem.id,
                  title: songItem.attributes.title,
                  author: songItem.attributes.author
                }
              : null
          })
          .filter(Boolean)

        // Find teams involved
        const teamIds = plan.relationships.teams?.data || []

        const teams = teamIds
          .map((teamId: any) => {
            const teamItem = allIncludedData.find(item => item.type === 'Team' && item.id === teamId.id)

            return teamItem
              ? {
                  id: teamItem.id,
                  name: teamItem.attributes.name,
                  members: getTeamMembers(teamItem.id, allIncludedData)
                }
              : null
          })
          .filter(Boolean)

        // Safely access object properties
        try {
          return {
            id: plan.id,
            title: plan.attributes.title || 'Untitled Service',
            serviceTypeName: planServiceTypes[plan.id]?.name || 'Unknown Service Type',
            serviceTypeId: planServiceTypes[plan.id]?.id || 'unknown',
            dates: {
              sort: plan.attributes.sort_date,
              planningCenter: plan.attributes.dates,
              formatted: new Date(plan.attributes.sort_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            },
            status: plan.attributes.status || 'unknown',
            planTimes,
            songs,
            teams,
            createdAt: plan.attributes.created_at,
            updatedAt: plan.attributes.updated_at,
            totalItems: plan.attributes.total_length || 0,
            planningCenterUrl: plan.links?.self
              ? plan.links.self.replace('api.planningcenteronline.com/services/v2', 'services.planningcenteronline.com')
              : '#'
          }
        } catch (formattingError) {
          console.error('Error formatting service plan:', formattingError)

          // Return a minimal object with error info when formatting fails
          return {
            id: plan.id || 'unknown-id',
            title: 'Error Formatting Service',
            error: true
          }
        }
      })

      // Filter out any plans that had formatting errors
      const validPlans = formattedServicePlans.filter(plan => !plan.error)

      // Sort by sort_date ascending (closest date first)
      validPlans.sort((a, b) => {
        const dateA = a.dates?.sort ? new Date(a.dates.sort).getTime() : 0
        const dateB = b.dates?.sort ? new Date(b.dates.sort).getTime() : 0

        return dateA - dateB
      })

      console.log('Successfully fetched service plans from Planning Center')

      return NextResponse.json(validPlans)
    } catch (formattingError: any) {
      console.error('Error formatting service plans:', formattingError.message)

      return NextResponse.json(
        {
          error: 'Failed to format service plans data',
          message: formattingError.message,
          step: 'formatting_plans'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Planning Center Services API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })

    if (error.response?.status === 401) {
      console.log('Unauthorized, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    return NextResponse.json(
      { error: 'Failed to fetch service plans from Planning Center', message: error.message },
      { status: error.response?.status || 500 }
    )
  }
}

// Helper function to get team members
function getTeamMembers(teamId: string, includedData: any[]) {
  try {
    const teamMembers = includedData.filter(
      item => item.type === 'TeamMember' && item.relationships?.team?.data?.id === teamId
    )

    return teamMembers.map(member => ({
      id: member.id,
      name: member.attributes.name,
      position: member.attributes.team_position_name || 'Member',
      status: member.attributes.status
    }))
  } catch (error) {
    console.error('Error getting team members:', error)

    return [] // Return empty array if there's an error
  }
}
