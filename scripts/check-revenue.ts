
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const fromDate = '2026-01-01T00:00:00Z'
    const toDate = '2026-02-28T23:59:59Z'

    console.log('--- DB Audit: Revenue Snapshots ---')

    const stats = await prisma.order.groupBy({
        by: ['paymentStatus', 'status'],
        where: {
            createdAt: { gte: new Date(fromDate), lte: new Date(toDate) }
        },
        _count: { id: true },
        _sum: {
            totalAmount: true,
            pdPlatformRevenue: true
        }
    })

    console.table(stats.map(s => ({
        payment: s.paymentStatus,
        status: s.status,
        count: s._count.id,
        gmv: s._sum.totalAmount || 0,
        profit: s._sum.pdPlatformRevenue || 0,
        ratio: ((s._sum.pdPlatformRevenue || 0) / (s._sum.totalAmount || 1) * 100).toFixed(1) + '%'
    })))

    const zeroProfit = await prisma.order.count({
        where: {
            createdAt: { gte: new Date(fromDate), lte: new Date(toDate) },
            totalAmount: { gt: 0 },
            pdPlatformRevenue: 0,
            paymentStatus: 'paid'
        }
    })

    console.log('Paid orders with zero platform revenue snapshot:', zeroProfit)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
