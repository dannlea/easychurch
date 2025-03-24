'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import BirthdayTable from './BirthdayTable'
import AnniversaryTable from './AnniversaryTable'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

const BirthdayAnniversaryTabs = () => {
  const [value, setValue] = useState(0)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label='birthday and anniversary tabs'
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#7C4DFF',
              height: 3
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 500,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#7C4DFF'
              }
            }
          }}
        >
          <Tab label='Birthdays' {...a11yProps(0)} />
          <Tab label='Anniversaries' {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <BirthdayTable />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <AnniversaryTable />
      </TabPanel>
    </Box>
  )
}

export default BirthdayAnniversaryTabs
