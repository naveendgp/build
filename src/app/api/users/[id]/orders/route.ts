import { NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('USER_READ')
    if (!result.ok) return result.response

    const { id } = await params

    // DEV ONLY: return mock user orders
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('USR-', ''), 10) - 1
        const count = 3 + (idx * 7) % 20

        const orders = Array.from({ length: count }, (_, i) => ({
            id: `ORD-${String(idx * 100 + i + 1).padStart(4, '0')}`,
            serviceType: ['Wash & Fold', 'Dry Clean', 'Iron Only', 'Wash & Iron'][i % 4],
            status: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'][i % 4],
            totalAmount: 150 + (i * 37) % 500,
            createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
        }))

        return NextResponse.json({ data: orders })
    }

    const orders = await httpClient(`/users/${id}/orders`)
    return NextResponse.json(orders)
}
