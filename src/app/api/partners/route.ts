import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(req: NextRequest) {
    const result = await requirePermission('PARTNER_READ')
    if (!result.ok) return result.response

    const { searchParams } = new URL(req.url)

    // DEV ONLY: return mock partners
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const mockPartners = Array.from({ length: 25 }, (_, i) => ({
            id: `PTR-${String(i + 1).padStart(4, '0')}`,
            name: ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub', 'LaundroMax', 'CleanWave',
                'WashPro', 'BrightWash', 'EcoClean', 'SpeedWash', 'PurePress'][i % 10],
            contact: `+91 98761${String(10000 + i).slice(-5)}`,
            status: ['APPROVED', 'APPROVED', 'PENDING', 'REJECTED'][i % 4],
            servicesCount: 3 + (i % 3),
            joinedAt: new Date(Date.now() - i * 86400000 * 15).toISOString(),
        }))

        const page = Number(searchParams.get('page') ?? '1')
        const pageSize = Number(searchParams.get('pageSize') ?? '20')
        const start = (page - 1) * pageSize

        return NextResponse.json({
            data: mockPartners.slice(start, start + pageSize),
            total: mockPartners.length,
        })
    }

    const query = new URLSearchParams({
        page: searchParams.get('page') ?? '1',
        pageSize: searchParams.get('pageSize') ?? '20',
        ...(searchParams.get('name') && { name: searchParams.get('name')! }),
        ...(searchParams.get('contact') && { contact: searchParams.get('contact')! }),
        ...(searchParams.get('status') && { status: searchParams.get('status')! }),
    }).toString()

    const data = await httpClient(`/partners?${query}`)
    return NextResponse.json(data)
}
