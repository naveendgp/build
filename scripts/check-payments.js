const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const paymentCount = await prisma.payment.count();
        console.log(`Total Payment records: ${paymentCount}`);

        const orderCount = await prisma.order.count();
        console.log(`Total Order records: ${orderCount}`);

        const paidOrders = await prisma.order.count({
            where: {
                paymentStatus: 'paid'
            }
        });
        console.log(`Total Paid Orders: ${paidOrders}`);

        const payments = await prisma.payment.findMany({ take: 5 });
        console.log('Sample Payments:', JSON.stringify(payments, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
