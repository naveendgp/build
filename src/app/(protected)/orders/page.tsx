import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import OrdersTable from './OrdersTable'

export default async function OrdersPage() {
  const admin = await getAdminContext()

  if (!admin || !admin.permissions.includes('ORDER_READ')) {
    redirect('/forbidden')
  }

  return <OrdersTable />
}
