import { NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('ORDER_READ')
    if (!result.ok) return result.response

    const { id } = await params

    // DEV ONLY: return mock order detail
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('ORD-', ''), 10) - 1
        const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
        const currentStatus = statuses[idx % 4]

        const timeline = [
            { status: 'PENDING', timestamp: new Date(Date.now() - idx * 3600000 * 6).toISOString(), note: 'Order placed by customer' },
        ]
        if (['CONFIRMED', 'COMPLETED'].includes(currentStatus)) {
            timeline.push({ status: 'CONFIRMED', timestamp: new Date(Date.now() - idx * 3600000 * 5).toISOString(), note: 'Order confirmed by shop' })
        }
        if (currentStatus === 'COMPLETED') {
            timeline.push(
                { status: 'PICKED_UP', timestamp: new Date(Date.now() - idx * 3600000 * 4).toISOString(), note: 'Picked up by rider' },
                { status: 'IN_PROGRESS', timestamp: new Date(Date.now() - idx * 3600000 * 3).toISOString(), note: 'Processing at shop' },
                { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - idx * 3600000 * 2).toISOString(), note: 'Out for delivery' },
                { status: 'COMPLETED', timestamp: new Date(Date.now() - idx * 3600000 * 1).toISOString(), note: 'Delivered to customer' },
            )
        }
        if (currentStatus === 'CANCELLED') {
            timeline.push({ status: 'CANCELLED', timestamp: new Date(Date.now() - idx * 3600000 * 4).toISOString(), note: 'Cancelled by customer' })
        }

        return NextResponse.json({
            id,
            userName: ['Ravi Kumar', 'Priya Sharma', 'Ankit Patel', 'Sneha Reddy', 'Vijay Singh'][idx % 5],
            userContact: `+91 98765${String(43210 + idx).slice(-5)}`,
            userEmail: ['ravi@example.com', 'priya@example.com', 'ankit@example.com', 'sneha@example.com', 'vijay@example.com'][idx % 5],
            user: {
                name: ['Ravi Kumar', 'Priya Sharma', 'Ankit Patel', 'Sneha Reddy', 'Vijay Singh'][idx % 5],
                contact: `+91 98765${String(43210 + idx).slice(-5)}`,
                email: ['ravi@example.com', 'priya@example.com', 'ankit@example.com', 'sneha@example.com', 'vijay@example.com'][idx % 5],
            },
            serviceType: ['Wash & Fold', 'Dry Clean', 'Iron Only', 'Wash & Iron'][idx % 4],
            shopName: ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub'][idx % 3],
            shop: {
                name: ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub'][idx % 3],
                contact: `+91 99887${String(76543 + idx).slice(-5)}`,
                address: ['22 Brigade Road, Bangalore', '15 Koramangala, Bangalore', '8 Whitefield, Bangalore'][idx % 3],
            },
            status: currentStatus,
            pickupAddress: '12 MG Road, Bangalore 560001',
            deliveryAddress: '45 Indiranagar, Bangalore 560038',
            items: [
                { name: 'Shirts', quantity: 3 + (idx % 4), price: 30 },
                { name: 'Trousers', quantity: 2 + (idx % 3), price: 40 },
                { name: 'Bedsheets', quantity: 1, price: 60 },
            ],
            subtotal: 150 + (idx * 37) % 500,
            deliveryFee: 40,
            discount: idx % 3 === 0 ? 50 : 0,
            totalAmount: 150 + (idx * 37) % 500 + 40 - (idx % 3 === 0 ? 50 : 0),
            paymentMethod: ['UPI', 'Cash on Delivery', 'Card'][idx % 3],
            paymentStatus: currentStatus === 'COMPLETED' ? 'PAID' : currentStatus === 'CANCELLED' ? 'REFUNDED' : 'PENDING',
            timeline,
            rider: currentStatus === 'PENDING' ? null : {
                name: ['Suresh M', 'Mahesh K', 'Ramesh D'][idx % 3],
                contact: `+91 97654${String(32100 + idx).slice(-5)}`,
            },
            createdAt: new Date(Date.now() - idx * 3600000 * 6).toISOString(),
            updatedAt: new Date(Date.now() - idx * 3600000 * 1).toISOString(),
        })
    }

    const order = await httpClient(`/orders/${id}`)
    return NextResponse.json(order)
}
