const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
    try {
        // Group orders by vendorId to see which vendors have orders
        const orderGroups = await prisma.order.groupBy({
            by: ['vendorId'],
            _count: {
                vendorId: true
            }
        });

        console.log('Vendors with orders in DB:');
        for (const group of orderGroups) {
            const vendor = await prisma.vendor.findUnique({
                where: { id: group.vendorId },
                select: { shopName: true, ownerName: true }
            });
            console.log(`- Vendor ID ${group.vendorId} (${vendor ? (vendor.shopName || vendor.ownerName) : 'NOT FOUND'}): ${group._count.vendorId} orders`);
        }

        console.log(`\nTotal Order records in DB: ${await prisma.order.count()}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrders();
