const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ordersCount = await prisma.order.count();
    const paymentsCount = await prisma.payment.count();

    const ordersWithPayments = await prisma.order.findMany({
        where: { NOT: { paymentId: null } },
        take: 5,
        include: { paymentRecord: true }
    });

    const ordersCountByPaymentStatus = await prisma.$queryRaw`SELECT "payment_status", COUNT(*) FROM orders GROUP BY "payment_status"`;

    console.log('Orders Count:', ordersCount);
    console.log('Payments Count:', paymentsCount);
    console.log('Orders by Payment Status:', ordersCountByPaymentStatus);
    console.log('Sample Orders with Payment Record Link:', JSON.stringify(ordersWithPayments, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
