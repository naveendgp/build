import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import { PermissionProvider } from '@/core/permissions/PermissionContext'
import AppLayout from '@/components/AppLayout'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminContext()

  if (!admin) {
    redirect('/login')
  }

  return (
    <PermissionProvider permissions={admin.permissions}>
      <AppLayout>{children}</AppLayout>
    </PermissionProvider>
  )
}
