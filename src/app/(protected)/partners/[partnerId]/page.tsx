import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import PartnerDetailsPage from './PartnerDetailsPage'

export default async function PartnerPage({
    params,
}: {
    params: Promise<{ partnerId: string }>
}) {
    const { partnerId } = await params
    const admin = await getAdminContext()

    if (!admin || !admin.permissions.includes('PARTNER_READ')) {
        redirect('/forbidden')
    }

    return <PartnerDetailsPage partnerId={partnerId} />
}
