'use client'

// React Imports

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

const Terms = ({ mode }: { mode: Mode }) => {
  // Vars
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  // Hooks

  const authBackground = useImageVariant(mode, lightImg, darkImg)

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:w-3/4 lg:w-2/3'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/' className='flex justify-center items-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography className='mbs-1'>
                <Typography variant='h3' align='center'>
                  TERMS, CONDITIONS & PRIVACY POLICY
                </Typography>
                <Typography variant='h6' align='center' gutterBottom>
                  &copy; {new Date().getFullYear()}
                </Typography>
                <Typography variant='body1' paragraph>
                  Welcome to EasyChurch (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using our
                  website and services, you agree to be bound by the following terms and conditions. If you do not agree
                  to these terms, please refrain from using our Services.
                </Typography>
                <Typography variant='body1' paragraph>
                  <strong>1. USE OF SERVICES</strong>
                </Typography>
                <ul>
                  <li>You must be at least 18 years old or have parental consent to use our Services.</li>
                  <li>
                    You agree to use our Services only for lawful purposes and in compliance with all applicable laws
                    and regulations.
                  </li>
                  <li>You shall not attempt to compromise the security, integrity, or availability of our Services.</li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>2. DATA STORAGE AND PRIVACY</strong>
                </Typography>
                <ul>
                  <li>
                    We collect and store personal information, such as names, emails, and other user-provided details,
                    in accordance with our Privacy Policy.
                  </li>
                  <li>
                    Data may be stored on secure servers, and we implement industry-standard security measures to
                    protect user data.
                  </li>
                  <li>
                    We do not sell, rent, or share personal information with third parties except as necessary to
                    provide the Services or comply with legal obligations.
                  </li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>3. COOKIES AND TRACKING TECHNOLOGIES</strong>
                </Typography>
                <ul>
                  <li>Our website uses cookies and similar tracking technologies to enhance user experience.</li>
                  <li>By using our website, you consent to the use of cookies as described in our Privacy Policy.</li>
                  <li>Users can manage their cookie preferences through their browser settings.</li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>4. THIRD-PARTY INTEGRATIONS AND DISCLAIMERS</strong>
                </Typography>
                <ul>
                  <li>
                    Our Services may integrate with or utilize third-party APIs, including but not limited to Planning
                    Center, ProPresenter, and other external platforms.
                  </li>
                  <li>
                    We are not affiliated with, endorsed by, or responsible for the actions, policies, or terms of these
                    third-party services.
                  </li>
                  <li>
                    Users assume full responsibility for their use of these third-party platforms and any impact it may
                    have on their data or operations.
                  </li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>5. LIMITATION OF LIABILITY</strong>
                </Typography>
                <ul>
                  <li>
                    We are not responsible for any data loss, security breaches, or damages resulting from the misuse of
                    our Services or third-party integrations.
                  </li>
                  <li>
                    We do not guarantee uninterrupted, error-free service, and we are not liable for any downtime,
                    service disruptions, or third-party failures.
                  </li>
                  <li>
                    To the fullest extent permitted by law, we disclaim all warranties, including but not limited to
                    implied warranties of merchantability and fitness for a particular purpose.
                  </li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>6. TERMINATION</strong>
                </Typography>
                <ul>
                  <li>
                    We reserve the right to suspend or terminate user accounts at our sole discretion if a user violates
                    these terms.
                  </li>
                  <li>Users may discontinue using the Services at any time by deleting their account.</li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>7. CHANGES TO THESE TERMS</strong>
                </Typography>
                <ul>
                  <li>
                    We reserve the right to modify these Terms and Conditions at any time. Users will be notified of
                    significant changes.
                  </li>
                  <li>
                    Continued use of the Services after modifications constitutes acceptance of the updated Terms.
                  </li>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>PRIVACY POLICY</strong>
                </Typography>
                <ul>
                  <li>
                    <strong>1. INFORMATION WE COLLECT</strong>
                  </li>
                  <ul>
                    <li>
                      We collect personal information such as names, email addresses, and account details when users
                      register or interact with our Services.
                    </li>
                    <li>
                      We automatically collect usage data, including IP addresses, device information, and browser type.
                    </li>
                    <li>
                      We may collect payment information for transactions, but sensitive payment details are securely
                      processed by third-party payment providers.
                    </li>
                  </ul>
                  <li>
                    <strong>2. HOW WE USE INFORMATION</strong>
                  </li>
                  <ul>
                    <li>To provide and improve our Services.</li>
                    <li>To personalize user experiences and enhance security measures.</li>
                    <li>To send updates, notifications, or promotional materials (users may opt-out at any time).</li>
                    <li>To comply with legal obligations or enforce our terms.</li>
                  </ul>
                  <li>
                    <strong>3. DATA SHARING AND DISCLOSURE</strong>
                  </li>
                  <ul>
                    <li>
                      We do not sell or share personal data with third parties except where necessary to provide
                      Services.
                    </li>
                    <li>
                      We may share data with trusted third-party service providers for hosting, analytics, or support
                      functions.
                    </li>
                    <li>We will disclose information if required by law or to protect our legal rights.</li>
                  </ul>
                  <li>
                    <strong>4. SECURITY MEASURES</strong>
                  </li>
                  <ul>
                    <li>We implement encryption, access controls, and other security measures to protect user data.</li>
                    <li>
                      While we take strong security precautions, no online service can guarantee absolute security.
                    </li>
                  </ul>
                  <li>
                    <strong>5. USER RIGHTS AND CHOICES</strong>
                  </li>
                  <ul>
                    <li>Users may access, correct, or delete their personal information by contacting us.</li>
                    <li>Users can manage cookie preferences via browser settings.</li>
                    <li>Users may opt-out of marketing communications at any time.</li>
                  </ul>
                  <li>
                    <strong>6. THIRD-PARTY LINKS AND INTEGRATIONS</strong>
                  </li>
                  <ul>
                    <li>Our Services may contain links to third-party websites or integrate with external services.</li>
                    <li>We are not responsible for the privacy practices or policies of third-party services.</li>
                  </ul>
                  <li>
                    <strong>7. CHANGES TO THIS POLICY</strong>
                  </li>
                  <ul>
                    <li>
                      We may update this Privacy Policy from time to time. Users will be notified of major changes.
                    </li>
                  </ul>
                </ul>
                <Typography variant='body1' paragraph>
                  <strong>CONTACT INFORMATION</strong>
                </Typography>
                <ul>
                  <li>
                    If you have any questions regarding these Terms and Conditions or our Privacy Policy, please contact
                    us at:{' '}
                    <Link className='text-blue-500' href='mailto:support@easychurch.com'>
                      support@easychurch.com
                    </Link>
                  </li>
                </ul>
                <Typography variant='body1' paragraph>
                  By using our Services, you agree to these Terms and our Privacy Policy.
                </Typography>
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Terms
