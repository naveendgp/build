const mongoose = require('mongoose');
const { Types } = require('mongoose');

const MONGODB_URL =
    process.env.DATABASE_URL ||
    'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';

async function createTestOrder() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URL);
        console.log('✅ Connected to database');

        const Vendor = mongoose.model('Vendor', new mongoose.Schema({
            phone: String,
            services_offered: Array,
            location: Object,
            shop_name: String
        }), 'vendors');

        const User = mongoose.model('User', new mongoose.Schema({
            phone: String,
            name: String,
            saved_addresses: Array
        }), 'users');

        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

        // 1. Find the Specific Vendor
        const vendorId = '697c4e009745a47b9e5b8546';
        const vendor = await Vendor.findById(vendorId).lean();

        if (!vendor) {
            throw new Error(`Vendor ${vendorId} not found`);
        }
        console.log(`✅ Found Vendor: ${vendor.shop_name} (Phone: ${vendor.phone})`);

        // 2. Find a User (or use a specific test user)
        const user = await User.findOne({}).lean();
        if (!user) {
            throw new Error('No users found in database');
        }
        console.log(`✅ Found User: ${user.name || user.phone}`);

        // 3. Construct the Order Item (Standard 3-6kg)
        // Service: Wash & Fold
        // Item: Standard (3-6kg)

        const washAndFoldService = vendor.services_offered.find(s => s.service_name.includes('Wash & Fold'));
        if (!washAndFoldService) {
            console.log('Available Services:', vendor.services_offered.map(s => s.service_name));
            throw new Error('Wash & Fold service not found for vendor');
        }

        const standardItem = washAndFoldService.items.find(i => i.item_name.includes('Standard'));
        if (!standardItem) {
            console.log('Available Items in Wash & Fold:', washAndFoldService.items.map(i => i.item_name));
            throw new Error('Standard item (3-6kg) not found in service. Please Ensure this vendor has the updated items.');
        }

        const orderItem = {
            service_id: washAndFoldService.service_id,
            service_name: washAndFoldService.service_name,
            item_id: standardItem.item_id,
            item_name: standardItem.item_name,
            quantity: 1,
            price_per_item: standardItem.item_price,
            total_price: standardItem.item_price,
            item_category: standardItem.category,
            weight: 5, // Testing 5kg which falls in 3-6kg range
        };

        // 4. Create the Order
        const dummyAddress = {
            address_line1: "123 Test Street, T. Nagar",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600017",
            latitude: 13.0827,
            longitude: 80.2707,
            is_default: true
        };

        const newOrder = new Order({
            order_number: Math.floor(100000 + Math.random() * 900000),
            status: 'pending',
            status_type: 1,
            user_id: user._id,
            vendor_id: vendor._id,
            vendor_address: vendor.location || dummyAddress,
            user_address: user.saved_addresses?.[0] || dummyAddress,
            items: [orderItem],
            total_amount: standardItem.item_price,
            currency: 'INR',
            payment_status: 'pending',
            payment_details: {
                is_payment_eligible: false,
                amount_to_vendor: standardItem.item_price * 0.9,
                amount_to_vendor_after_commission: standardItem.item_price * 0.8,
                amount_to_platform: standardItem.item_price * 0.2,
                delivery_fee: 0,
                gst: 0,
                grand_total: standardItem.item_price,
                item_total: standardItem.item_price,
                totalPayableAmount: standardItem.item_price
            },
            created_at: new Date(),
            updated_at: new Date(),
            user_otp: 1234,
            vendor_otp: 1234
        });

        await newOrder.save();
        console.log(`🎉 Order Created Successfully!`);
        console.log(`Order ID: ${newOrder._id}`);
        console.log(`Order Number: ${newOrder.order_number}`);
        console.log(`Item: ${orderItem.item_name} (Weight: ${orderItem.weight}kg)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    }
}

createTestOrder();
