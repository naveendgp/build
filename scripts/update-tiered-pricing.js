#!/usr/bin/env node

/**
 * Update Master Services with Tiered Pricing
 * Adds Regular, Standard, Max items to per_kg services (Wash & Fold, Wash & Iron)
 * Then updates all vendors with these new items
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

const MONGODB_URL =
    process.env.DATABASE_URL ||
    'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

// Tiered pricing configuration for per_kg services
const TIERED_ITEMS = [
    {
        item_name: 'Regular (0.5-3kg)',
        item_slug: 'regular',
        item_description: 'Small load, perfect for 1-2 days of laundry. Weight range: 0.5kg to 3kg.',
        image_url: 'https://via.placeholder.com/150?text=Regular',
        category: 'Weight',
        item_price: 60,
        express_price: 80,
        min_weight: 0.5,
        max_weight: 3,
    },
    {
        item_name: 'Standard (3-6kg)',
        item_slug: 'standard',
        item_description: 'Medium load, ideal for a week of clothes. Weight range: 3kg to 6kg.',
        image_url: 'https://via.placeholder.com/150?text=Standard',
        category: 'Weight',
        item_price: 80,
        express_price: 100,
        min_weight: 3,
        max_weight: 6,
    },
    {
        item_name: 'Max (6-10kg)',
        item_slug: 'max',
        item_description: 'Large load, best for family laundry. Weight range: 6kg to 10kg.',
        image_url: 'https://via.placeholder.com/150?text=Max',
        category: 'Weight',
        item_price: 100,
        express_price: 120,
        min_weight: 6,
        max_weight: 10,
    },
];

async function updateServices() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ Connected to database');

    // Step 1: Check current master services
    console.log('\n📋 Current Master Services:');
    console.log('='.repeat(60));

    const services = await mongoose.connection.db.collection('services').find({}).toArray();

    services.forEach(service => {
        console.log(`\n${service.service_name} (${service.pricing_type}):`);
        if (service.items && service.items.length > 0) {
            service.items.forEach(item => {
                console.log(`  - ${item.item_name} (price: ${item.item_price || 'N/A'}, express: ${item.express_price || 'N/A'})`);
            });
        } else {
            console.log('  (no items)');
        }
    });

    // Step 2: Update per_kg services with tiered items
    console.log('\n\n🔧 Updating per_kg services with tiered pricing items...');
    console.log('='.repeat(60));

    for (const service of services) {
        if (service.pricing_type === 'per_kg') {
            console.log(`\nUpdating ${service.service_name}...`);

            // Create new tiered items with unique IDs
            const newItems = TIERED_ITEMS.map(item => ({
                ...item,
                _id: new Types.ObjectId(),
            }));

            // Update the service with new items
            await mongoose.connection.db.collection('services').updateOne(
                { _id: service._id },
                { $set: { items: newItems } }
            );

            console.log(`  ✅ Added ${newItems.length} tiered items: ${newItems.map(i => i.item_name).join(', ')}`);
        }
    }

    // Step 3: Update all vendors' services_offered with the new items
    console.log('\n\n🏪 Updating vendors with new tiered items...');
    console.log('='.repeat(60));

    // Fetch updated services
    const updatedServices = await mongoose.connection.db.collection('services').find({}).toArray();

    // Get all vendors
    const vendors = await mongoose.connection.db.collection('vendors').find({ status: 'active' }).toArray();
    console.log(`Found ${vendors.length} active vendors to update`);

    let updatedCount = 0;
    for (const vendor of vendors) {
        const updatedServicesOffered = vendor.services_offered.map(vendorService => {
            // Find matching master service
            const masterService = updatedServices.find(s =>
                s._id.toString() === vendorService.service_id?.toString() ||
                s.service_name === vendorService.service_name
            );

            if (masterService && masterService.pricing_type === 'per_kg') {
                // Update items from master service with proper vendor pricing
                const newItems = masterService.items.map(masterItem => ({
                    item_id: new Types.ObjectId(),
                    item_name: masterItem.item_name,
                    image_url: masterItem.image_url || 'https://via.placeholder.com/150',
                    item_price: masterItem.item_price,
                    express_price: masterItem.express_price,
                    min_weight: masterItem.min_weight || 0,
                    max_weight: masterItem.max_weight || 0,
                    item_description: masterItem.item_description || masterItem.item_name,
                    category: masterItem.category || 'Weight',
                    is_active: true,
                }));

                return {
                    ...vendorService,
                    items: newItems,
                };
            }
            return vendorService;
        });

        await mongoose.connection.db.collection('vendors').updateOne(
            { _id: vendor._id },
            { $set: { services_offered: updatedServicesOffered } }
        );
        updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} vendors with tiered pricing items`);

    // Step 4: Verify updates
    console.log('\n\n✅ Final Verification:');
    console.log('='.repeat(60));

    const finalServices = await mongoose.connection.db.collection('services').find({}).toArray();
    finalServices.forEach(service => {
        console.log(`\n${service.service_name} (${service.pricing_type}):`);
        if (service.items && service.items.length > 0) {
            service.items.forEach(item => {
                console.log(`  - ${item.item_name}: ₹${item.item_price} (express: ₹${item.express_price})`);
            });
        }
    });

    // Check a sample vendor
    const sampleVendor = await mongoose.connection.db.collection('vendors').findOne({ 'address.city': 'Vellore' });
    if (sampleVendor) {
        console.log(`\nSample Vendor (${sampleVendor.shop_name}):`);
        sampleVendor.services_offered.forEach(service => {
            if (service.pricing_type === 'per_kg') {
                console.log(`\n  ${service.service_name}:`);
                service.items?.forEach(item => {
                    console.log(`    - ${item.item_name}: ₹${item.item_price} (express: ₹${item.express_price})`);
                });
            }
        });
    }

    console.log('\n✨ Done!');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
}

updateServices().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
