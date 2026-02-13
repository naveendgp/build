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

    // DEV ONLY: return mock user detail
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('USR-', ''), 10) - 1
        return NextResponse.json({
            id,
            name: ['Ravi Kumar', 'Priya Sharma', 'Ankit Patel', 'Sneha Reddy', 'Vijay Singh',
                'Meera Nair', 'Arjun Desai', 'Kavya Iyer', 'Rahul Gupta', 'Divya Menon'][idx % 10],
            email: ['ravi', 'priya', 'ankit', 'sneha', 'vijay',
                'meera', 'arjun', 'kavya', 'rahul', 'divya'][idx % 10] + `${idx + 1}@example.com`,
            contact: `+91 98765${String(43210 + idx).slice(-5)}`,
            isActive: idx % 7 !== 0,
            ordersCount: 3 + (idx * 7) % 20,
            totalSpent: 500 + (idx * 137) % 5000,
            joinedAt: new Date(Date.now() - idx * 86400000 * 12).toISOString(),
            addresses: [
                {
                    label: 'Home',
                    line1: `${12 + idx} MG Road`,
                    line2: 'Near Central Park',
                    city: 'Bangalore',
                    pincode: '560001',
                    isDefault: true,
                },
                {
                    label: 'Office',
                    line1: `${45 + idx} Indiranagar`,
                    city: 'Bangalore',
                    pincode: '560038',
                    isDefault: false,
                },
            ],
        })
    }

    const user = await httpClient(`/users/${id}`)
    return NextResponse.json(user)
}
