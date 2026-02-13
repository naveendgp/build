import { NextResponse } from 'next/server'
import { requirePermission } from '@/core/auth/requirePermission'
import { httpClient } from '@/core/api/httpClient'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requirePermission('PARTNER_READ')
    if (!result.ok) return result.response

    const { id } = await params

    // DEV ONLY: return mock partner detail
    if (process.env.DEV_BYPASS_AUTH === 'true') {
        const idx = parseInt(id.replace('PTR-', ''), 10) - 1
        const statuses = ['APPROVED', 'APPROVED', 'PENDING', 'REJECTED']
        const names = ['Sparkle Laundry', 'Fresh & Clean', 'QuickWash Hub', 'LaundroMax', 'CleanWave',
            'WashPro', 'BrightWash', 'EcoClean', 'SpeedWash', 'PurePress']

        return NextResponse.json({
            id,
            name: names[idx % 10],
            contact: `+91 98761${String(10000 + idx).slice(-5)}`,
            email: names[idx % 10].toLowerCase().replace(/[& ]+/g, '') + '@partner.com',
            status: statuses[idx % 4],
            enabled: statuses[idx % 4] === 'APPROVED' ? idx % 5 !== 0 : false,
            servicesCount: 3 + (idx % 3),
            totalRevenue: 15000 + (idx * 2731) % 50000,
            joinedAt: new Date(Date.now() - idx * 86400000 * 15).toISOString(),
            kyc: {
                panNumber: `ABCDE${String(1234 + idx).slice(-4)}F`,
                panVerified: idx % 3 !== 2,
                gstNumber: `29ABCDE${String(1234 + idx).slice(-4)}F1Z5`,
                gstVerified: idx % 4 !== 3,
                bankAccount: `${String(50100000000 + idx * 1111)}`,
                bankIFSC: ['SBIN0001234', 'HDFC0002345', 'ICIC0003456'][idx % 3],
                bankVerified: idx % 5 !== 4,
                submittedAt: new Date(Date.now() - idx * 86400000 * 10).toISOString(),
            },
        })
    }

    const partner = await httpClient(`/partners/${id}`)
    return NextResponse.json(partner)
}
