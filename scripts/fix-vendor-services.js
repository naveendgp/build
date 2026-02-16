#!/usr/bin/env node

/**
 * Fix Vendors Script
 * Updates all vendors to have is_approved=true on their services
 */

const mongoose = require('mongoose');

const MONGODB_URL =
    process.env.DATABASE_URL ||
    'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

async function fixVendors() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ Connected to database');

    // Update all vendors in Vellore and Bengaluru to have is_approved=true on services
    console.log('\n🔧 Fixing vendor services (setting is_approved=true)...');

    const result = await mongoose.connection.db.collection('vendors').updateMany(
        { status: 'active' },
        {
            $set: {
                'services_offered.$[].is_approved': true,
                'services_offered.$[].is_active': true,
            }
        }
    );

    console.log(`✅ Updated ${result.modifiedCount} vendors`);

    // Verify Vellore vendors
    console.log('\n📍 Vellore vendors:');
    const velloreVendors = await mongoose.connection.db.collection('vendors')
        .find({ 'address.city': 'Vellore' })
        .project({ shop_name: 1, phone: 1, status: 1, 'address.city': 1, 'services_offered.is_approved': 1 })
        .toArray();

    velloreVendors.forEach(v => {
        const approved = v.services_offered?.every(s => s.is_approved === true) ? '✅' : '❌';
        console.log(`  ${approved} ${v.shop_name} (${v.address?.city}) - ${v.status}`);
    });

    // Verify Bengaluru vendors
    console.log('\n📍 Bengaluru vendors:');
    const blrVendors = await mongoose.connection.db.collection('vendors')
        .find({ 'address.city': 'Bengaluru' })
        .project({ shop_name: 1, phone: 1, status: 1, 'address.city': 1 })
        .limit(5)
        .toArray();

    blrVendors.forEach(v => {
        console.log(`  ✅ ${v.shop_name} (${v.address?.city}) - ${v.status}`);
    });

    console.log('\n✨ Done!');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
}

fixVendors().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
