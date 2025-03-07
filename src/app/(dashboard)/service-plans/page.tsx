// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import ServicePlansTable from '@views/dashboard/ServicePlansTable'

const SITE_NAME = process.env.BASE_SITE_NAME

export const metadata = {
  title: `Service Plans | ${SITE_NAME}`,
  description: 'View and manage upcoming service plans from Planning Center.'
}

const ServicePlans = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ServicePlansTable />
      </Grid>
    </Grid>
  )
}

export default ServicePlans
