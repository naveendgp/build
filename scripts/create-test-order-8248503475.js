const mongoose = require('mongoose');

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
            shop_name: String,
            address: Object,
            owner_name: String,
        }), 'vendors');

        const User = mongoose.model('User', new mongoose.Schema({
            phone: String,
            name: String,
            saved_addresses: Array,
        }), 'users');

        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

        // 1. Find the vendor by phone number 8248503475
        const vendor = await Vendor.findOne({ phone: '8248503475' }).lean();

        if (!vendor) {
            throw new Error('Vendor with phone 8248503475 not found');
        }
        console.log(`✅ Found Vendor: ${vendor.shop_name} (Owner: ${vendor.owner_name}, Phone: ${vendor.phone})`);
        console.log(`   Vendor ID: ${vendor._id}`);

        // 2. Find a user to place the order
        const user = await User.findOne({}).lean();
        if (!user) {
            throw new Error('No users found in database');
        }
        console.log(`✅ Found User: ${user.name || user.phone} (ID: ${user._id})`);

        // 3. Get Wash & Fold service and Standard (3-6kg) item
        const washAndFoldService = vendor.services_offered.find(
            (s) => s.service_name && s.service_name.includes('Wash & Fold')
        );
        if (!washAndFoldService) {
            console.log('Available Services:', vendor.services_offered.map((s) => s.service_name));
            throw new Error('Wash & Fold service not found for this vendor');
        }
        console.log(`✅ Found Service: ${washAndFoldService.service_name}`);

        const standardItem = washAndFoldService.items.find(
            (i) => i.item_name && i.item_name.includes('Standard')
        );
        if (!standardItem) {
            console.log('Available Items:', washAndFoldService.items.map((i) => i.item_name));
            throw new Error('Standard (3-6kg) item not found in Wash & Fold service');
        }
        console.log(`✅ Found Item: ${standardItem.item_name} - ₹${standardItem.item_price}`);

        // 4. Build order item
        const orderItem = {
            service_id: washAndFoldService.service_id,
            service_name: washAndFoldService.service_name,
            item_id: standardItem.item_id,
            item_name: standardItem.item_name,
            quantity: 1,
            price_per_item: standardItem.item_price,
            total_price: standardItem.item_price,
            item_category: standardItem.category,
            weight: 5, // 5kg falls in Standard (3-6kg) range
            pricing_tier: 'standard',
        };

        // 5. Addresses
        const vendorAddress = vendor.address || {
            address_line1: 'Tamil Nadu 638060, India',
            pincode: '632153',
            latitude: 11.270303333333334,
            longitude: 77.60303166666667,
            landmark: 'India',
        };

        const userAddress = (user.saved_addresses && user.saved_addresses[0]) || {
            address_line1: '123 Test Street, T. Nagar',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600017',
            latitude: 13.0827,
            longitude: 80.2707,
            is_default: true,
        };

        // 6. Payment details
        const itemTotal = standardItem.item_price;
        const deliveryFee = 0;
        const gst = 0;
        const grandTotal = itemTotal + deliveryFee + gst;
        const commissionRate = 0.2; // 20% platform commission

        const paymentDetails = {
            is_payment_eligible: false,
            amount_to_vendor: itemTotal,
            amount_to_vendor_after_commission: itemTotal * (1 - commissionRate),
            amount_to_platform: itemTotal * commissionRate,
            delivery_fee: deliveryFee,
            gst: gst,
            isOfferApplied: false,
            offerDiscountAmount: 0,
            totalPayableAmount: grandTotal,
            item_total: itemTotal,
            grand_total: grandTotal,
            vendor_commission: itemTotal * commissionRate,
        };

        // 7. Create the order
        const newOrder = new Order({
            order_number: Math.floor(100000 + Math.random() * 900000),
            status: 'pending',
            status_type: 1,
            user_id: user._id,
            vendor_id: vendor._id,
            vendor_address: vendorAddress,
            user_address: userAddress,
            items: [orderItem],
            total_amount: grandTotal,
            currency: 'INR',
            payment_status: 'pending',
            payment_details: paymentDetails,
            is_express: false,
            is_verified: false,
            rating_given: false,
            user_otp: Math.floor(1000 + Math.random() * 9000),
            vendor_otp: Math.floor(1000 + Math.random() * 9000),
            cash_paid_amount: 0,
            payment: 0,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await newOrder.save();

        console.log('\n🎉 Test Order Created Successfully!');
        console.log('═══════════════════════════════════════');
        console.log(`   Order ID     : ${newOrder._id}`);
        console.log(`   Order Number  : ${newOrder.order_number}`);
        console.log(`   Status        : ${newOrder.status}`);
        console.log(`   Vendor        : ${vendor.shop_name} (${vendor.phone})`);
        console.log(`   User          : ${user.name || user.phone}`);
        console.log(`   Service       : ${orderItem.service_name}`);
        console.log(`   Item          : ${orderItem.item_name} (${orderItem.weight}kg)`);
        console.log(`   Total Amount  : ₹${grandTotal}`);
        console.log(`   User OTP      : ${newOrder.user_otp}`);
        console.log(`   Vendor OTP    : ${newOrder.vendor_otp}`);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error:', error.message || error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

createTestOrder();
