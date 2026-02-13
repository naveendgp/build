import { redirect } from 'next/navigation'
import { getAdminContext } from '@/core/auth/getAdminContext'
import OrderDetailsPage from './OrderDetailsPage'

export default async function OrderPage({
    params,
}: {
    params: Promise<{ orderId: string }>
}) {
    const { orderId } = await params
    const admin = await getAdminContext()

    if (!admin || !admin.permissions.includes('ORDER_READ')) {
        redirect('/forbidden')
    }

    return <OrderDetailsPage orderId={orderId} />
}
