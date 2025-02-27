// Component Imports
import Terms from '@views/Terms'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const TermsPage = () => {
  // Vars
  const mode = getServerMode()

  return <Terms mode={mode} />
}

export default TermsPage
