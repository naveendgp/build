import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import UserDetailsPage from './userDetailsPage'

export default async function UserPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId } = await params
    const admin = await getAdminContext()

    if (!admin || !admin.permissions.includes('USER_READ')) {
        redirect('/forbidden')
    }

    return <UserDetailsPage userId={userId} />
}
