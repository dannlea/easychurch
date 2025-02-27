'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// User Context
import { useUser } from '@core/contexts/UserContext'

// Import CustomAvatar component
import CustomAvatar from '@core/components/mui/Avatar'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  const router = useRouter()
  const { user, setUser } = useUser()

  // State to track if we should show the full name
  const [showFullName, setShowFullName] = useState(true)
  const nameRef = useRef<HTMLDivElement>(null)

  // Added for profile picture handling
  const [imgSrc, setImgSrc] = useState<string>('')
  const [imgError, setImgError] = useState<boolean>(false)

  // Handle profile picture path
  useEffect(() => {
    if (user?.profilePicture) {
      // Handle both relative and absolute paths
      let src = user.profilePicture

      // If it's an absolute URL, use it as is
      if (src.startsWith('http')) {
        // No changes needed for absolute URLs
      }

      // If it starts with /, it's a relative path to the backend
      else {
        // Make sure it starts with /
        if (!src.startsWith('/')) {
          src = `/${src}`
        }

        // Add the backend server URL
        const backendUrl = process.env.NEXT_PUBLIC_LOCAL_SERVER

        src = `${backendUrl}${src}`
      }

      console.log('Setting profile picture path:', src)

      // Temporarily create an image to test loading
      const img = new Image()

      img.onload = () => {
        setImgSrc(src)
        setImgError(false)
        console.log('Profile image successfully loaded:', src)
      }

      img.onerror = () => {
        console.error('Failed to preload profile picture:', src)
        setImgError(true)
      }

      img.src = src
    } else {
      setImgSrc('')
    }
  }, [user?.profilePicture])

  const handleImageError = () => {
    console.error('Failed to load profile picture:', imgSrc)
    setImgError(true)
  }

  // Check available width on mount and window resize
  useEffect(() => {
    const checkNameWidth = () => {
      if (nameRef.current && user?.lastName) {
        // If available width is less than 180px, show only first name
        const parentWidth = nameRef.current.parentElement?.clientWidth || 0

        setShowFullName(parentWidth >= 180)
      }
    }

    checkNameWidth()
    window.addEventListener('resize', checkNameWidth)

    return () => window.removeEventListener('resize', checkNameWidth)
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login') // Redirect to login if not authenticated
    }
  }, [router])

  useEffect(() => {
    console.log('UserDropdown rendered with user:', user)
  }, [user])

  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token') // Remove the token from local storage
    setUser(null) // Update the user context to null
    router.push('/login') // Redirect to the login page
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <CustomAvatar
          ref={anchorRef}
          alt={user?.name || 'User'}
          src={!imgError ? imgSrc : ''}
          onClick={handleDropdownOpen}
          className='cursor-pointer'
          size={38}
          onError={handleImageError}
        >
          {user?.name ? user.name.charAt(0) : 'U'}
        </CustomAvatar>
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className='shadow-lg'>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <CustomAvatar
                      alt={user?.name || 'User'}
                      src={!imgError ? imgSrc : ''}
                      size={38}
                      onError={handleImageError}
                    >
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </CustomAvatar>
                    <div className='flex items-start flex-col' ref={nameRef}>
                      <Typography className='font-medium' color='text.primary' noWrap>
                        {user ? (showFullName && user.lastName ? `${user.name} ${user.lastName}` : user.name) : 'User'}
                      </Typography>
                      {user?.organization ? (
                        <>
                          <Typography variant='caption' noWrap className='max-is-[150px]'>
                            {user.organization}
                          </Typography>
                          {user.organizationRole && (
                            <Typography variant='caption' className='text-xs italic'>
                              {user.organizationRole}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography variant='caption' className='italic'>
                          {user?.role || 'No Organization'}
                        </Typography>
                      )}
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3' onClick={e => handleDropdownClose(e)}>
                    <i className='ri-user-3-line' />
                    <Link href='/account-settings'>
                      <Typography color='text.primary'>Account Settings</Typography>
                    </Link>
                  </MenuItem>
                  {/*
									<MenuItem className='gap-3' onClick={e => handleDropdownClose(e)}>
										<i className='ri-settings-4-line' />
										<Typography color='text.primary'>Settings</Typography>
									</MenuItem>
									<MenuItem className='gap-3' onClick={e => handleDropdownClose(e)}>
										<i className='ri-money-dollar-circle-line' />
										<Typography color='text.primary'>Pricing</Typography>
									</MenuItem>
									<MenuItem className='gap-3' onClick={e => handleDropdownClose(e)}>
										<i className='ri-question-line' />
										<Typography color='text.primary'>FAQ</Typography>
									</MenuItem>
	 */}
                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
