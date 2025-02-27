// Component Imports

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'
import NewOrg from '@/views/NewOrg'

const NewOrgPage = () => {
  // Vars
  const mode = getServerMode()

  return <NewOrg mode={mode} />
}

export default NewOrgPage
