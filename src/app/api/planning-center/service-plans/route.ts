import { NextResponse } from 'next/server'

// Remove the imports causing linter errors since we're using mock data for now
// import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'
// import axios from 'axios'

export async function GET() {
  try {
    // For now, we'll skip the authentication check since we're using mock data
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Mock data for development - replace with actual API call in production
    const mockServicePlans = [
      {
        id: 'plan1',
        title: 'Sunday Morning Worship',
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
          },
          {
            id: 'tm3',
            name: 'Emily Wilson',
            role: 'Vocals',
            avatar: ''
          }
        ],
        status: 'confirmed'
      },
      {
        id: 'plan2',
        title: 'Sunday Evening Worship',
        date: '2025-03-10',
        time: '6:00 PM',
        serviceName: 'Evening Service',
        leaderName: 'Jane Wilson',
        leaderId: 'leader2',
        leaderAvatar: '',
        teamMembers: [
          {
            id: 'tm4',
            name: 'Robert Taylor',
            role: 'Worship Leader',
            avatar: ''
          },
          {
            id: 'tm5',
            name: 'Lisa Brown',
            role: 'Drums',
            avatar: ''
          }
        ],
        status: 'planned'
      },
      {
        id: 'plan3',
        title: 'Wednesday Bible Study',
        date: '2025-03-13',
        time: '7:00 PM',
        serviceName: 'Midweek Service',
        leaderName: 'Pastor David Anderson',
        leaderId: 'leader3',
        leaderAvatar: '',
        teamMembers: [],
        status: 'confirmed'
      },
      {
        id: 'plan4',
        title: 'Youth Worship Night',
        date: '2025-03-14',
        time: '6:30 PM',
        serviceName: 'Youth Service',
        leaderName: 'Chris Martinez',
        leaderId: 'leader4',
        leaderAvatar: '',
        teamMembers: [
          {
            id: 'tm6',
            name: 'Tyler Johnson',
            role: 'Guitar',
            avatar: ''
          },
          {
            id: 'tm7',
            name: 'Megan White',
            role: 'Vocals',
            avatar: ''
          }
        ],
        status: 'draft'
      },
      {
        id: 'plan5',
        title: 'Sunday Morning Worship',
        date: '2025-03-17',
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
        status: 'planned'
      },
      {
        id: 'plan6',
        title: 'Community Outreach Event',
        date: '2025-03-21',
        time: '10:00 AM',
        serviceName: 'Outreach',
        leaderName: 'Pastor David Anderson',
        leaderId: 'leader3',
        leaderAvatar: '',
        teamMembers: [
          {
            id: 'tm8',
            name: 'Karen Thomas',
            role: 'Coordinator',
            avatar: ''
          }
        ],
        status: 'confirmed'
      }
    ]

    // In production, you would connect to the Planning Center API
    /*
    // You'll need to import axios and configure auth properly when implementing this
    const accessToken = session.accessToken
    const response = await axios.get('https://api.planningcenteronline.com/services/v2/service_types/plans', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    // Format the response data here
    const servicePlans = response.data.data.map(plan => {
      // Transform the data structure to match your ServicePlan interface
      return {
        id: plan.id,
        title: plan.attributes.title,
        date: plan.attributes.sort_date,
        time: plan.attributes.time,
        // ... map other fields
      }
    })
    */

    return NextResponse.json(mockServicePlans)
  } catch (error) {
    console.error('Error fetching service plans:', error)

    return NextResponse.json({ error: 'Failed to fetch service plans' }, { status: 500 })
  }
}
