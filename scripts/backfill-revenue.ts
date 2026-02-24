import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
    console.log('Starting backfill for pdPlatformRevenue...');

    // Fetch all orders
    const orders = await prisma.order.findMany();

    let updatedCount = 0;

    for (const order of orders) {
        // Only backfill if we have basic financial amounts
        const platformFee = order.amountToPlatform || 0;
        const deliveryCharge = order.pdDeliveryFee || 0;
        const offerDiscount = order.pdOfferDiscountAmount || 0;
        const vendorCommission = order.pdVendorCommission || 0;
        const additionalFee = order.pdAdditionalFee || 0;

        const calculatedRevenue = Math.round(
            ((platformFee + deliveryCharge) - offerDiscount + vendorCommission + additionalFee) * 100
        ) / 100;

        // If the calculated revenue is non-zero, let's update it.
        // Even if old revenue is 0 due to default(0), we will update it to the proper amount.
        if (calculatedRevenue !== 0) {
            await prisma.order.update({
                where: { id: order.id },
                data: { pdPlatformRevenue: calculatedRevenue }
            });
            updatedCount++;
        }
    }

    console.log(`Backfill complete. Updated ${updatedCount} orders.`);
}

backfill()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
