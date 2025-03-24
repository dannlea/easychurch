// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import SermonPlanner from '@views/dashboard/SermonPlanner'

const SITE_NAME = process.env.BASE_SITE_NAME

export const metadata = {
  title: `Sermon Planner | ${SITE_NAME}`,
  description: 'Plan your sermon series and speaking schedule for the year.'
}

const SermonPlannerPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <SermonPlanner />
      </Grid>
    </Grid>
  )
}

export default SermonPlannerPage
