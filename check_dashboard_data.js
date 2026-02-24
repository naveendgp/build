const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const dateFilter = {
        createdAt: {
            gte: new Date('2026-02-11T00:00:00.000Z'),
            lte: new Date('2026-02-24T23:59:59.999Z'),
        }
    };

    const statusCounts = await prisma.order.groupBy({ by: ['status'], where: dateFilter, _count: { status: true } });
    console.log('Order Status Counts:', statusCounts);

    const paymentCounts = await prisma.order.groupBy({ by: ['paymentStatus'], where: dateFilter, _count: { paymentStatus: true } });
    console.log('Payment Status Counts:', paymentCounts);

    const payments = await prisma.order.aggregate({
        where: dateFilter,
        _sum: { totalAmount: true, pdPlatformRevenue: true, pdOfferDiscountAmount: true }
    });
    console.log('Total amounts globally in range:', payments);

    const paidOrDelivered = await prisma.order.aggregate({
        where: {
            ...dateFilter,
            OR: [{ paymentStatus: 'paid' }, { status: 'delivered' }],
        },
        _sum: { totalAmount: true }
    });
    console.log('Paid OR Delivered total amount:', paidOrDelivered);
}

main().catch(console.error).finally(() => prisma.$disconnect());
