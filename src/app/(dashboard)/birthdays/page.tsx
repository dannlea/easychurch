// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports

import BirthdayTable from '@views/dashboard/BirthdayTable'

const SITE_NAME = process.env.BASE_SITE_NAME

export const metadata = {
  title: `Birthdays | ${SITE_NAME}`,
  description:
    'Develop next-level web apps with Materio Dashboard Free - NextJS. Now, updated with lightning-fast routing powered by MUI and App router.'
}

const Birthdays = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <BirthdayTable />
      </Grid>
    </Grid>
  )
}

export default Birthdays
