import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getServerSession } from 'next-auth'

import { executeQuery } from '../db'

interface OrganizationSettings {
  organizationId: string
  serviceDays: number[]
  servicesPerDay: number
  planningCenterFolderId?: string
  storageIntegration?: 'onedrive' | 'dropbox'
  storageFolderId?: string
}

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await executeQuery(async conn => {
      const sql = 'SELECT * FROM organization_settings WHERE organization_id = ?'

      return await conn.query(sql, [session.user.organizationId])
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching organization settings:', error)

    return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    await executeQuery(async conn => {
      const sql = 'UPDATE organization_settings SET ? WHERE organization_id = ?'

      await conn.query(sql, [body, session.user.organizationId])
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating organization settings:', error)

    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: OrganizationSettings = await req.json()

    const { organizationId, serviceDays, servicesPerDay, planningCenterFolderId, storageIntegration, storageFolderId } =
      body

    if (!organizationId || !serviceDays || !servicesPerDay) {
      return NextResponse.json(
        { error: 'Organization ID, service days, and services per day are required' },
        { status: 400 }
      )
    }

    // Convert serviceDays array to JSON string for storage
    const serviceDaysJson = JSON.stringify(serviceDays)

    await executeQuery(async conn => {
      const query = `
        INSERT INTO organization_settings (
          organizationId, serviceDays, servicesPerDay,
          planningCenterFolderId, storageIntegration, storageFolderId
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          serviceDays = VALUES(serviceDays),
          servicesPerDay = VALUES(servicesPerDay),
          planningCenterFolderId = VALUES(planningCenterFolderId),
          storageIntegration = VALUES(storageIntegration),
          storageFolderId = VALUES(storageFolderId),
          updatedAt = NOW()
      `

      await conn.query(query, [
        organizationId,
        serviceDaysJson,
        servicesPerDay,
        planningCenterFolderId,
        storageIntegration,
        storageFolderId
      ])
    })

    // Generate sermon plans for future dates based on settings
    await generateSermonPlans(organizationId, serviceDays, servicesPerDay)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving organization settings:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function generateSermonPlans(organizationId: string, serviceDays: number[], servicesPerDay: number) {
  const startDate = new Date()
  const endDate = new Date()

  endDate.setFullYear(endDate.getFullYear() + 1) // Generate plans for the next year

  await executeQuery(async conn => {
    // Get all existing dates to avoid duplicates
    const existingDates = await conn.query(
      'SELECT DATE(date) as date FROM sermon_plans WHERE organizationId = ? AND date >= ? AND date <= ?',
      [organizationId, startDate, endDate]
    )

    const existingDatesSet = new Set(existingDates.map((row: any) => row.date.toISOString().split('T')[0]))

    // Generate plans for each service day
    const plans = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      if (serviceDays.includes(currentDate.getDay())) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Only add if date doesn't exist
        if (!existingDatesSet.has(dateStr)) {
          // Add a plan for each service on this day
          for (let i = 0; i < servicesPerDay; i++) {
            plans.push([dateStr, organizationId])
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (plans.length > 0) {
      const query = 'INSERT INTO sermon_plans (date, organizationId) VALUES ?'

      await conn.query(query, [plans])
    }
  })
}
