import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import UsersTable from './UserTable'

export default async function UsersPage() {
  const admin = await getAdminContext()

  if (!admin || !admin.permissions.includes('USER_READ')) {
    redirect('/forbidden')
  }

  return <UsersTable />
}
