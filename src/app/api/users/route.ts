import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(req: NextRequest) {
    const result = await requirePermission('USER_READ')
    if (!result.ok) return result.response

    const { searchParams } = new URL(req.url)

    // DEV ONLY: return mock users
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const mockUsers = Array.from({ length: 30 }, (_, i) => ({
            id: `USR-${String(i + 1).padStart(4, '0')}`,
            name: ['Ravi Kumar', 'Priya Sharma', 'Ankit Patel', 'Sneha Reddy', 'Vijay Singh',
                'Meera Nair', 'Arjun Desai', 'Kavya Iyer', 'Rahul Gupta', 'Divya Menon'][i % 10],
            email: ['ravi', 'priya', 'ankit', 'sneha', 'vijay',
                'meera', 'arjun', 'kavya', 'rahul', 'divya'][i % 10] + `${i + 1}@example.com`,
            contact: `+91 98765${String(43210 + i).slice(-5)}`,
            ordersCount: 3 + (i * 7) % 20,
            joinedAt: new Date(Date.now() - i * 86400000 * 12).toISOString(),
        }))

        const page = Number(searchParams.get('page') ?? '1')
        const pageSize = Number(searchParams.get('pageSize') ?? '20')
        const start = (page - 1) * pageSize

        return NextResponse.json({
            data: mockUsers.slice(start, start + pageSize),
            total: mockUsers.length,
        })
    }

    const query = new URLSearchParams({
        page: searchParams.get('page') ?? '1',
        pageSize: searchParams.get('pageSize') ?? '20',
        ...(searchParams.get('name') && { name: searchParams.get('name')! }),
        ...(searchParams.get('email') && { email: searchParams.get('email')! }),
        ...(searchParams.get('contact') && { contact: searchParams.get('contact')! }),
    }).toString()

    const data = await httpClient(`/users?${query}`)
    return NextResponse.json(data)
}
