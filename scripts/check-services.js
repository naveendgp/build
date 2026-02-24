
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching services...');
    const services = await prisma.service.findMany();
    console.log('Existing Services:', services.map(s => s.serviceName));

    const requiredServices = ['Wash & Fold', 'Wash & Iron', 'Dry Clean', 'Iron', 'Steam Press'];

    for (const name of requiredServices) {
        const exists = services.find(s => s.serviceName === name);
        if (!exists) {
            console.log(`Creating missing service: ${name}`);
            await prisma.service.create({
                data: {
                    serviceName: name,
                    imageUrl: 'placeholder',
                    pricingType: name.includes('Wash') ? 'per_kg' : 'per_pc',
                    serviceDescription: `${name} Service`
                }
            });
        }
    }

    console.log('Service check complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
