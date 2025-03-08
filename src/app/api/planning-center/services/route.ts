import { NextResponse } from 'next/server'

import axios from 'axios'

// Utilities
import { validateToken } from '../utils/tokenUtils'

// Mark this route as dynamic to fix the deployment error
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://api.planningcenteronline.com/services/v2'

let progress = 0 // Track progress

// Debug API responses
function debugResponse(response: any, label: string) {
  try {
    console.log(`DEBUG ${label} - Status: ${response.status}`)

    if (response.data) {
      // Log the structure of the data
      console.log(`DEBUG ${label} - Data structure:`, {
        hasData: !!response.data.data,
        dataCount: response.data.data?.length || 0,
        hasIncluded: !!response.data.included,
        includedCount: response.data.included?.length || 0,
        includedTypes: response.data.included ? [...new Set(response.data.included.map((item: any) => item.type))] : [],
        hasLinks: !!response.data.links,
        links: response.data.links || {}
      })

      // Log the first item as sample
      if (response.data.data && response.data.data.length > 0) {
        const sample = response.data.data[0]

        console.log(`DEBUG ${label} - Sample item:`, {
          id: sample.id,
          type: sample.type,
          attributeKeys: Object.keys(sample.attributes || {}),
          relationshipKeys: Object.keys(sample.relationships || {})
        })
      }
    }
  } catch (error) {
    console.error(`Error debugging ${label}:`, error)
  }
}

// Extract team positions we want to highlight
function extractImportantPositions(plan: any, includedData: any[]) {
  try {
    const keyPeople: any[] = []
    const teamPositionsToHighlight = ['worship leader', 'speaker', 'worship director', 'host', 'leader', 'teacher']

    // First, find all team members
    const allTeamMembers = includedData.filter(item => item.type === 'TeamMember')

    // Process each team member
    allTeamMembers.forEach(member => {
      // Get the position name
      const positionName = member.attributes.team_position_name?.toLowerCase() || ''

      // Check if this position should be highlighted
      const isHighlighted = teamPositionsToHighlight.some(pos => positionName.includes(pos))

      if (isHighlighted) {
        // Find the person data if available
        const personId = member.relationships?.person?.data?.id
        let personData = null

        if (personId) {
          personData = includedData.find(item => item.type === 'Person' && item.id === personId)
        }

        // Find the team data
        const teamId = member.relationships?.team?.data?.id
        let teamData = null

        if (teamId) {
          teamData = includedData.find(item => item.type === 'Team' && item.id === teamId)
        }

        // Add to key people list
        keyPeople.push({
          id: member.id,
          name: member.attributes.name,
          position: member.attributes.team_position_name,
          teamName: teamData?.attributes?.name || 'Unknown Team',
          personId: personId || null,
          personName: personData
            ? `${personData.attributes.first_name} ${personData.attributes.last_name}`
            : member.attributes.name,
          status: member.attributes.status || 'unknown'
        })
      }
    })

    // Sort by position importance
    return keyPeople.sort((a, b) => {
      // Get index in the priority list
      const aIndex = teamPositionsToHighlight.findIndex(pos => a.position.toLowerCase().includes(pos))
      const bIndex = teamPositionsToHighlight.findIndex(pos => b.position.toLowerCase().includes(pos))

      // If both are found in the list, sort by priority
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      // If only one is in the list, prioritize that one
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      // Otherwise sort by name
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error('Error extracting important positions:', error)

    return []
  }
}

export async function GET(request: Request) {
  try {
    // Validate and potentially refresh the token
    const { token, needsAuth } = await validateToken()

    if (needsAuth) {
      console.log('Token validation failed, redirecting to auth')

      return NextResponse.redirect(new URL('/api/planning-center/auth', request.url))
    }

    console.log('Using Access Token:', token ? token.substring(0, 10) + '...' : 'none')

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
        timeout: 20000
      })

      debugResponse(serviceTypesResponse, 'ServiceTypes')

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

        // Expand our include parameters to get more complete data
        // Note: include=person added to get person details for team members
        let nextPage = `${BASE_URL}/service_types/${serviceTypeId}/plans?filter=future&include=service_type,plan_times,teams,team_members.person,plan_people,people`

        while (nextPage) {
          const response = await axios.get(nextPage, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 30000 // Longer timeout for more complete data
          })

          debugResponse(response, `Plans for ${serviceTypeName}`)

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

            // For each plan, fetch its items separately
            for (const plan of servicePlansData) {
              try {
                console.log(`Fetching items for plan ${plan.id} (${plan.attributes.title || 'Untitled'})`)

                // Get the plan items (including songs)
                const itemsResponse = await axios.get(
                  `${BASE_URL}/service_types/${serviceTypeId}/plans/${plan.id}/items?include=song,arrangement`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    },
                    timeout: 20000
                  }
                )

                debugResponse(itemsResponse, `Items for plan ${plan.id}`)

                // Merge the included data from items into our collection
                if (itemsResponse.data.included) {
                  allIncludedData = [...allIncludedData, ...itemsResponse.data.included]
                }

                // Store the items data in a special property on the plan
                plan._items = itemsResponse.data.data || []

                // Count songs
                const songItems = plan._items.filter(
                  (item: any) => item.attributes.item_type === 'song' && item.relationships?.song?.data?.id
                )

                console.log(`Found ${songItems.length} songs in plan ${plan.id}`)
              } catch (itemsError: any) {
                console.error(`Error fetching items for plan ${plan.id}:`, itemsError.message)

                // Continue with next plan even if this one fails
                plan._items = []
              }
            }

            // For each plan, dump the structure to help debug
            servicePlansData.forEach((plan: any, index: number) => {
              console.log(
                `Plan ${index + 1}/${servicePlansData.length} - ID: ${plan.id}, Title: ${plan.attributes.title || 'Untitled'}`
              )
              console.log(`Relationships:`, Object.keys(plan.relationships || {}))

              // Check for items
              console.log(`Items: ${plan._items?.length || 0}`)

              // Check for teams
              const teamRelationships = plan.relationships?.teams?.data || []

              console.log(`Team relationships: ${teamRelationships.length}`)

              // Check for plan times
              const planTimeRelationships = plan.relationships?.plan_times?.data || []

              console.log(`Plan time relationships: ${planTimeRelationships.length}`)
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

      // Log all of the included data types
      const includedTypes = [...new Set(allIncludedData.map(item => item.type))]

      console.log(`Included data types: ${includedTypes.join(', ')}`)
      console.log(`Total included items: ${allIncludedData.length}`)

      // Count each type
      const typeCounts: Record<string, number> = {}

      allIncludedData.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
      })
      console.log('Type counts:', typeCounts)
    } catch (apiError: any) {
      console.error('Error fetching service plans:', apiError.message)
      console.error('Error details:', apiError.response?.data)

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
        // Add more detailed logging to troubleshoot
        console.log(`Processing plan: ${plan.id} - ${plan.attributes.title || 'Untitled'}`)

        // Find plan times
        const planTimeIds = plan.relationships.plan_times?.data || []

        console.log(`Plan time IDs found: ${planTimeIds.length}`)

        const planTimes = planTimeIds
          .map((timeId: any) => {
            const timeItem = allIncludedData.find(item => item.type === 'PlanTime' && item.id === timeId.id)

            if (!timeItem) {
              console.log(`Could not find plan time with ID: ${timeId.id}`)

              return null
            }

            console.log(`Found plan time: ${timeItem.id} - ${timeItem.attributes.time_formatted}`)

            return {
              id: timeItem.id,
              startsAt: timeItem.attributes.starts_at,
              endsAt: timeItem.attributes.ends_at,
              timeFormatted: timeItem.attributes.time_formatted
            }
          })
          .filter(Boolean)

        // Find songs from plan items
        const songs = []

        if (plan._items) {
          // Loop through items to find songs
          for (const item of plan._items) {
            if (item.attributes.item_type === 'song' && item.relationships?.song?.data?.id) {
              const songId = item.relationships.song.data.id
              const songItem = allIncludedData.find(included => included.type === 'Song' && included.id === songId)

              if (songItem) {
                // Get arrangement data if available
                let arrangementData = {}

                if (item.relationships?.arrangement?.data?.id) {
                  const arrangementId = item.relationships.arrangement.data.id

                  const arrangement = allIncludedData.find(
                    included => included.type === 'Arrangement' && included.id === arrangementId
                  )

                  if (arrangement) {
                    arrangementData = {
                      arrangementId: arrangement.id,
                      key: arrangement.attributes.key_name,
                      bpm: arrangement.attributes.bpm
                    }
                  }
                }

                songs.push({
                  id: songItem.id,
                  title: songItem.attributes.title,
                  author: songItem.attributes.author,
                  ccli: songItem.attributes.ccli_number,
                  sequence: item.attributes.sequence || null,
                  ...arrangementData
                })
              }
            }
          }
        }

        // Sort songs by sequence if available
        songs.sort((a, b) => {
          if (a.sequence === null && b.sequence === null) return 0
          if (a.sequence === null) return 1
          if (b.sequence === null) return -1

          return a.sequence - b.sequence
        })

        // Find teams involved
        const teamIds = plan.relationships.teams?.data || []

        console.log(`Team IDs found: ${teamIds.length}`)

        const teams = teamIds
          .map((teamId: any) => {
            const teamItem = allIncludedData.find(item => item.type === 'Team' && item.id === teamId.id)

            if (!teamItem) {
              console.log(`Could not find team with ID: ${teamId.id}`)

              return null
            }

            console.log(`Found team: ${teamItem.id} - ${teamItem.attributes.name}`)

            return {
              id: teamItem.id,
              name: teamItem.attributes.name,
              members: getTeamMembers(teamItem.id, allIncludedData)
            }
          })
          .filter(Boolean)

        // Extract important positions (worship leader, speaker, etc.)
        const keyPeople = extractImportantPositions(plan, allIncludedData)

        console.log(`Key people found: ${keyPeople.length}`)

        // Format plan times for display
        const formattedTimes =
          planTimes.length > 0
            ? planTimes.map((time: { timeFormatted: string }) => time.timeFormatted).join(' & ')
            : null

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
            keyPeople, // Add key people like worship leaders and speakers
            series: plan.attributes.series_title || null,
            seriesTitle: plan.attributes.series_title || null,
            formattedTimes,
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
          console.error('Plan data:', JSON.stringify(plan, null, 2).substring(0, 500) + '...')

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

    console.log(`Found ${teamMembers.length} members for team ${teamId}`)

    return teamMembers.map(member => {
      // Try to get the person data if available
      const personId = member.relationships?.person?.data?.id
      let personData = null

      if (personId) {
        personData = includedData.find(item => item.type === 'Person' && item.id === personId)
      }

      return {
        id: member.id,
        name: member.attributes.name,
        position: member.attributes.team_position_name || 'Member',
        personId: personId || null,
        personName: personData
          ? `${personData.attributes.first_name} ${personData.attributes.last_name}`
          : member.attributes.name,
        status: member.attributes.status
      }
    })
  } catch (error) {
    console.error('Error getting team members:', error)

    return [] // Return empty array if there's an error
  }
}
