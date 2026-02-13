import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import PartnersTable from './PartnersTable'

export default async function PartnersPage() {
  const admin = await getAdminContext()

  if (!admin || !admin.permissions.includes('PARTNER_READ')) {
    redirect('/forbidden')
  }

  return <PartnersTable />
}
