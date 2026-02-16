#!/usr/bin/env node

/**
 * Update Order Status Script
 * Updates the order status to 'delivered' so that payment can be tested.
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

const MONGODB_URL =
    process.env.DATABASE_URL ||
    'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

// Order ID to update
const ORDER_ID = process.argv[2] || '6988040b6606b7e448761124';

async function updateOrderStatus() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ Connected to database');

    console.log(`\n📋 Looking for order: ${ORDER_ID}`);

    // Find the order
    const order = await mongoose.connection.db.collection('orders').findOne({
        _id: new Types.ObjectId(ORDER_ID)
    });

    if (!order) {
        console.log('❌ Order not found!');
        await mongoose.disconnect();
        return;
    }

    console.log('\n📦 Current Order Status:');
    console.log(`  Order Number: ${order.order_number}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Status Type: ${order.status_type}`);
    console.log(`  Payment Status: ${order.payment_status}`);
    console.log(`  Is Payment Eligible: ${order.payment_details?.is_payment_eligible}`);
    console.log(`  Total Amount: ₹${order.total_amount}`);

    // Update to processed status with payment eligible
    console.log('\n🔧 Updating order to processed status...');

    await mongoose.connection.db.collection('orders').updateOne(
        { _id: new Types.ObjectId(ORDER_ID) },
        {
            $set: {
                status: 'processed',
                status_type: 2,
                trip_type: 2,
                payment_status: 'pending',
                'payment_details.is_payment_eligible': true,
                is_verified: true,
            },
            $currentDate: {
                updated_at: true
            }
        }
    );

    // Verify update
    const updatedOrder = await mongoose.connection.db.collection('orders').findOne({
        _id: new Types.ObjectId(ORDER_ID)
    });

    console.log('\n✅ Order Updated Successfully:');
    console.log(`  Status: ${updatedOrder.status}`);
    console.log(`  Status Type: ${updatedOrder.status_type}`);
    console.log(`  Payment Status: ${updatedOrder.payment_status}`);
    console.log(`  Is Payment Eligible: ${updatedOrder.payment_details?.is_payment_eligible}`);

    console.log('\n✨ Done! Order is now ready for payment testing.');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
}

updateOrderStatus().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
