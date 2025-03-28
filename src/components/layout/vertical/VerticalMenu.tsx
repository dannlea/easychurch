// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useUser } from '@core/contexts/UserContext'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()
  const { user } = useUser()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuItem href='/' icon={<i className='ri-bar-chart-box-line' />}>
          Dashboard
        </MenuItem>
        <MenuSection label='People Management'>
          <MenuItem href='/birthdays' icon={<i className='ri-cake-line' />}>
            Birthdays Mailing List
          </MenuItem>
          <MenuItem href='/services' icon={<i className='ri-calendar-event-line' />}>
            Service Plans
          </MenuItem>
          <MenuItem href='/sermon-planner' icon={<i className='ri-book-line' />}>
            Sermon Planner
          </MenuItem>
        </MenuSection>
        <MenuSection label='Apps & Pages'>
          <MenuItem
            href={user ? `/account-settings?id=${user.id}` : '/login'}
            icon={<i className='ri-user-settings-line' />}
          >
            Account Settings{user ? ` (${user.name})` : ''}
          </MenuItem>
          <MenuItem href='/login' target='_blank'>
            Login
          </MenuItem>
          <MenuItem href='/register' target='_blank'>
            Register
          </MenuItem>
          <MenuItem href='/forgot-password' target='_blank'>
            Forgot Password
          </MenuItem>
        </MenuSection>
        {/*
        <MenuSection label='Forms & Tables'>
          <MenuItem href='/form-layouts' icon={<i className='ri-layout-4-line' />}>
            Form Layouts
          </MenuItem>
        </MenuSection>

        <MenuSection label='Misc'>
          <MenuItem disabled suffix={<Chip label='Coming Soon!' size='small' color='info' />}>
            Item With Badge
          </MenuItem>
        </MenuSection>*/}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
