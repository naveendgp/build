import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(req: NextRequest) {
    const result = await requirePermission('ORDER_READ')
    if (!result.ok) return result.response

    // DEV ONLY: return mock orders
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const mockOrders = Array.from({ length: 45 }, (_, i) => ({
            id: `ORD-${String(i + 1).padStart(4, '0')}`,
            userName: ['Ravi Kumar', 'Priya Sharma', 'Ankit Patel', 'Sneha Reddy', 'Vijay Singh'][i % 5],
            userContact: `+91 98765${String(43210 + i).slice(-5)}`,
            serviceType: ['Wash & Fold', 'Dry Clean', 'Iron Only', 'Wash & Iron'][i % 4],
            shopName: ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub'][i % 3],
            status: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'][i % 4],
            totalAmount: 150 + (i * 37) % 500,
            createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        }))

        const { searchParams } = new URL(req.url)
        const page = Number(searchParams.get('page') ?? '1')
        const pageSize = Number(searchParams.get('pageSize') ?? '20')
        const start = (page - 1) * pageSize

        return NextResponse.json({
            data: mockOrders.slice(start, start + pageSize),
            total: mockOrders.length,
        })
    }

    const { searchParams } = new URL(req.url)

    const page = searchParams.get('page') ?? '1'
    const pageSize = searchParams.get('pageSize') ?? '20'
    const orderId = searchParams.get('orderId')
    const user = searchParams.get('user')
    const status = searchParams.get('status')

    const query = new URLSearchParams({
        page,
        pageSize,
        ...(orderId && { orderId }),
        ...(user && { user }),
        ...(status && { status }),
    }).toString()

    const data = await httpClient(`/orders?${query}`)

    return NextResponse.json(data)
}
