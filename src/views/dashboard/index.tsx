'use client'

import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import BirthdayTable from './BirthdayTable'
import AnniversaryTable from './AnniversaryTable'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('birthdays')

  const handleTabChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <TabContext value={activeTab}>
            <TabList onChange={handleTabChange}>
              <Tab label='Birthdays' value='birthdays' icon={<i className='ri-cake-2-line' />} iconPosition='start' />
              <Tab
                label='Anniversaries'
                value='anniversaries'
                icon={<i className='ri-heart-3-line' />}
                iconPosition='start'
              />
            </TabList>
            <TabPanel value='birthdays' sx={{ p: 0 }}>
              <BirthdayTable />
            </TabPanel>
            <TabPanel value='anniversaries' sx={{ p: 0 }}>
              <AnniversaryTable />
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default Dashboard
