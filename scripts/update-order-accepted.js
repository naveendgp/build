#!/usr/bin/env node

/**
 * Update Order Status to Accepted
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

const MONGODB_URL = 'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

const ORDER_ID = '698808036606b7e4487612f5';

async function updateOrderStatus() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ Connected to database');

    console.log(`\n📋 Looking for order: ${ORDER_ID}`);

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

    console.log('\n🔧 Updating order to accepted status...');

    await mongoose.connection.db.collection('orders').updateOne(
        { _id: new Types.ObjectId(ORDER_ID) },
        {
            $set: {
                status: 'accepted',
                status_type: 1,
            },
            $currentDate: {
                updated_at: true,
                'status_timestamps.accepted_at': true
            }
        }
    );

    const updatedOrder = await mongoose.connection.db.collection('orders').findOne({
        _id: new Types.ObjectId(ORDER_ID)
    });

    console.log('\n✅ Order Updated Successfully:');
    console.log(`  Status: ${updatedOrder.status}`);
    console.log(`  Status Type: ${updatedOrder.status_type}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
}

updateOrderStatus().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
