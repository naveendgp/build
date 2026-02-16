const mongoose = require('mongoose');

async function main() {
    const url = 'mongodb://admin:admin123@13.200.242.70:27017/laundry_backend?authSource=admin';

    try {
        await mongoose.connect(url);
        console.log('Connected to MongoDB via Mongoose');

        const db = mongoose.connection.db;

        console.log('Updating Vendors...');
        const vendorResult = await db.collection('vendors').updateMany(
            {},
            {
                $set: {
                    amount_due: 0,
                    orders_to_be_settled: [],
                    'rating.average': 0,
                    'rating.total_reviews': 0,
                    'rating.reviews': [],
                },
            }
        );
        console.log(`Matched ${vendorResult.matchedCount}, Modified ${vendorResult.modifiedCount} vendors`);

        console.log('Updating Orders...');
        const orderResult = await db.collection('orders').updateMany(
            {},
            {
                $unset: {
                    amount_du: "",
                    review: ""
                },
            }
        );
        console.log(`Matched ${orderResult.matchedCount}, Modified ${orderResult.modifiedCount} orders (unset amount_du and review)`);

    } catch (error) {
        console.error('Error in script:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

main();
