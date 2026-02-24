const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const transactionCount = await prisma.transaction.count();
        console.log(`Total Transaction records: ${transactionCount}`);

        const transactions = await prisma.transaction.findMany({ take: 5 });
        console.log('Sample Transactions:', JSON.stringify(transactions, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
