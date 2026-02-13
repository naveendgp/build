import { NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('PARTNER_WRITE')
    if (!result.ok) return result.response

    const { id } = await params

    // DEV ONLY: return mock shops
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('PTR-', ''), 10) - 1
        const names = ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub', 'LaundroMax', 'CleanWave',
            'WashPro', 'BrightWash', 'EcoClean', 'SpeedWash', 'PurePress']
        const shopCount = 1 + (idx % 5)

        const shops = Array.from({ length: shopCount }, (_, si) => ({
            id: `SHOP-${String(idx * 10 + si + 1).padStart(4, '0')}`,
            name: `${names[idx % 10]} — Branch ${si + 1}`,
            address: [`${12 + si} MG Road, Bangalore`, `${45 + si} Koramangala, Bangalore`, `${8 + si} Whitefield, Bangalore`][si % 3],
            enabled: si % 3 !== 2,
            servicesCount: 2 + (si * 3) % 8,
            ordersCount: 20 + (si * 13) % 100,
        }))

        return NextResponse.json({ data: shops })
    }

    const shops = await httpClient(`/partners/${id}/shops`)
    return NextResponse.json(shops)
}
