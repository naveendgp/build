#!/usr/bin/env node

/**
 * Sync Master Services Items to All Vendors Script
 * 
 * This script syncs new items from the master Services collection to all vendors.
 * It adds missing items to vendors' services_offered without overwriting existing prices.
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

const MONGODB_URL =
    process.env.DATABASE_URL ||
    'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

async function syncServicesToVendors() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to database\n');

        const vendorCollection = mongoose.connection.collection('vendors');
        const servicesCollection = mongoose.connection.collection('services');

        // Get all master services
        const masterServices = await servicesCollection.find({}).toArray();
        console.log(`📋 Found ${masterServices.length} master services\n`);

        // Get all vendors
        const vendors = await vendorCollection.find({}).toArray();
        console.log(`🏪 Found ${vendors.length} vendors\n`);

        let totalVendorsUpdated = 0;
        let totalItemsAdded = 0;

        for (const vendor of vendors) {
            if (!vendor.services_offered || vendor.services_offered.length === 0) {
                console.log(`⚠️  ${vendor.shop_name || vendor.phone} has no services, skipping...`);
                continue;
            }

            let vendorUpdated = false;
            let itemsAddedToVendor = 0;

            // For each master service
            for (const masterService of masterServices) {
                // Find the corresponding service in vendor's services_offered
                const vendorService = vendor.services_offered.find(
                    (vs) => vs.service_id.toString() === masterService._id.toString()
                );

                if (!vendorService) {
                    console.log(`  ⚠️  Service ${masterService.service_name} not found for ${vendor.shop_name || vendor.phone}`);
                    continue;
                }

                // Check for missing items
                const existingItemIds = new Set(
                    (vendorService.items || []).map((item) => item.item_id.toString())
                );

                const missingItems = (masterService.items || []).filter(
                    (masterItem) => !existingItemIds.has(masterItem._id.toString())
                );

                if (missingItems.length > 0) {
                    // Add missing items with default values
                    for (const masterItem of missingItems) {
                        const newItem = {
                            item_id: masterItem._id,
                            item_name: masterItem.item_name,
                            image_url: masterItem.image_url || '',
                            item_price: masterItem.item_price || 0,
                            min_weight: masterItem.min_weight || masterItem.weight?.[0] || 0,
                            max_weight: masterItem.max_weight || masterItem.weight?.[1] || 0,
                            express_price: masterItem.express_price || 0,
                            item_description: masterItem.item_description || '',
                            category: masterItem.category || '',
                            is_active: masterService.pricing_type === 'per_kg', // Auto-active for per_kg services
                        };

                        vendorService.items.push(newItem);
                        itemsAddedToVendor++;
                        vendorUpdated = true;
                    }

                    console.log(`  ✅ Added ${missingItems.length} items to ${masterService.service_name} for ${vendor.shop_name || vendor.phone}`);
                }
            }

            if (vendorUpdated) {
                // Update vendor in database
                await vendorCollection.updateOne(
                    { _id: vendor._id },
                    { $set: { services_offered: vendor.services_offered } }
                );
                totalVendorsUpdated++;
                totalItemsAdded += itemsAddedToVendor;
            }
        }

        console.log('\n' + '='.concat('='.repeat(59)));
        console.log(`✨ Sync complete!`);
        console.log(`   Updated ${totalVendorsUpdated} vendors`);
        console.log(`   Added ${totalItemsAdded} items total`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

syncServicesToVendors();
