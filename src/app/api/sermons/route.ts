import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getServerSession } from 'next-auth'

import { executeQuery } from '../db'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await executeQuery(async conn => {
      const sql = 'SELECT * FROM sermons WHERE organization_id = ? ORDER BY date DESC'

      return await conn.query(sql, [session.user.organizationId])
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching sermons:', error)

    return NextResponse.json({ error: 'Failed to fetch sermons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const result = await executeQuery(async conn => {
      const sql = 'INSERT INTO sermons SET ?'

      const sermon = {
        ...body,
        organization_id: session.user.organizationId
      }

      return await conn.query(sql, [sermon])
    })

    return NextResponse.json({
      message: 'Sermon created successfully',
      id: result.insertId
    })
  } catch (error) {
    console.error('Error creating sermon:', error)

    return NextResponse.json({ error: 'Failed to create sermon' }, { status: 500 })
  }
}
