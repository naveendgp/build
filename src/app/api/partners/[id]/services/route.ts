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

    // DEV ONLY: return mock services
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('PTR-', ''), 10) - 1
        const services = [
            {
                id: `SVC-${idx}-001`,
                name: 'Standard Wash',
                type: 'WEIGHT',
                enabled: true,
                config: { minWeight: 0, maxWeight: 5 },
            },
            {
                id: `SVC-${idx}-002`,
                name: 'Premium Wash',
                type: 'WEIGHT',
                enabled: idx % 3 !== 0,
                config: { minWeight: 0, maxWeight: 10 },
            },
            {
                id: `SVC-${idx}-003`,
                name: 'Ironing',
                type: 'ITEM',
                enabled: true,
            },
            {
                id: `SVC-${idx}-004`,
                name: 'Dry Cleaning',
                type: 'ITEM',
                enabled: idx % 2 === 0,
            },
            {
                id: `SVC-${idx}-005`,
                name: 'Stain Removal',
                type: 'ITEM',
                enabled: false,
            },
        ]

        return NextResponse.json({ data: services })
    }

    const services = await httpClient(`/partners/${id}/services`)
    return NextResponse.json(services)
}
