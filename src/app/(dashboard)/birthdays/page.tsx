import BirthdayAnniversaryTabs from '@/views/dashboard/BirthdayAnniversaryTabs'

const SITE_NAME = process.env.BASE_SITE_NAME || 'Materio'

export const metadata = {
  title: `Birthdays | ${SITE_NAME}`,
  description: 'Manage birthdays and anniversary emails with automatic notifications and custom templates.'
}

export default function BirthdaysPage() {
  return <BirthdayAnniversaryTabs />
}
