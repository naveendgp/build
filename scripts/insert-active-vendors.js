#!/usr/bin/env node

/**
 * Insert Active Vendors Script
 * Directly inserts 10-20 active vendors into MongoDB with complete data
 * 
 * Usage:
 *   node scripts/insert-active-vendors.js
 *   DATABASE_URL=mongodb://... node scripts/insert-active-vendors.js
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

// MongoDB connection URL
const MONGODB_URL =
  process.env.DATABASE_URL ||
  'mongodb://prodmongo:prodpassword%40123@13.201.184.91:27017/laundry_backend?authSource=admin';

// Vendor data - 15 vendors with realistic Indian data
const VENDOR_DATA = [
  {
    phone: '+919876543201',
    shop_name: 'Sparkle Clean Laundry',
    owner_name: 'Rajesh Kumar',
    email: 'sparkleclean@laundry.com',
    gst_number: '29SPARKLE123F1Z5',
    pan_number: 'SPARKLE123F',
    shop_license_number: 'LSC/BLR/2024/1001',
    aadhaar_number: '987654321001',
    address: {
      address_line1: 'No. 123, Commercial Street',
      address_line2: 'Jayanagar 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560041',
      landmark: 'Near Metro Station',
      latitude: 12.9344,
      longitude: 77.6192,
    },
    bank_details: {
      account_holder_name: 'Rajesh Kumar',
      account_number: '1234567890123456',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      branch: 'Jayanagar',
    },
  },
  {
    phone: '+919876543202',
    shop_name: 'QuickWash Express',
    owner_name: 'Priya Sharma',
    email: 'quickwash@laundry.com',
    gst_number: '29QUICKWSH456G2H6',
    pan_number: 'QUICKWSH456G',
    shop_license_number: 'LSC/BLR/2024/1002',
    aadhaar_number: '987654321002',
    address: {
      address_line1: 'Shop No. 45, Market Street',
      address_line2: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Near 100 Feet Road',
      latitude: 12.9716,
      longitude: 77.6412,
    },
    bank_details: {
      account_holder_name: 'Priya Sharma',
      account_number: '2345678901234567',
      ifsc_code: 'ICIC0009876',
      bank_name: 'ICICI Bank',
      branch: 'Indiranagar',
    },
  },
  {
    phone: '+919876543203',
    shop_name: 'Fresh & Press Laundry',
    owner_name: 'Amit Patel',
    email: 'freshpress@laundry.com',
    gst_number: '29FRESHPRS789H3I7',
    pan_number: 'FRESHPRS789H',
    shop_license_number: 'LSC/BLR/2024/1003',
    aadhaar_number: '987654321003',
    address: {
      address_line1: 'No. 67, Trade Center',
      address_line2: 'Koramangala 5th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560095',
      landmark: 'Near Forum Mall',
      latitude: 12.9352,
      longitude: 77.6245,
    },
    bank_details: {
      account_holder_name: 'Amit Patel',
      account_number: '3456789012345678',
      ifsc_code: 'SBIN0001234',
      bank_name: 'State Bank of India',
      branch: 'Koramangala',
    },
  },
  {
    phone: '+919876543204',
    shop_name: 'Elite Dry Cleaners',
    owner_name: 'Suresh Reddy',
    email: 'elitedry@laundry.com',
    gst_number: '29ELITEDRY012I4J8',
    pan_number: 'ELITEDRY012I',
    shop_license_number: 'LSC/BLR/2024/1004',
    aadhaar_number: '987654321004',
    address: {
      address_line1: 'No. 89, MG Road',
      address_line2: 'Brigade Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      landmark: 'Near UB City',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    bank_details: {
      account_holder_name: 'Suresh Reddy',
      account_number: '4567890123456789',
      ifsc_code: 'AXIS0001234',
      bank_name: 'Axis Bank',
      branch: 'MG Road',
    },
  },
  {
    phone: '+919876543205',
    shop_name: 'Super Clean Hub',
    owner_name: 'Meera Nair',
    email: 'superclean@laundry.com',
    gst_number: '29SUPERCLN345J5K9',
    pan_number: 'SUPERCLN345J',
    shop_license_number: 'LSC/BLR/2024/1005',
    aadhaar_number: '987654321005',
    address: {
      address_line1: 'Shop No. 12, Malleshwaram',
      address_line2: '8th Cross',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560003',
      landmark: 'Near Metro Station',
      latitude: 13.0067,
      longitude: 77.5611,
    },
    bank_details: {
      account_holder_name: 'Meera Nair',
      account_number: '5678901234567890',
      ifsc_code: 'KOTAK0001234',
      bank_name: 'Kotak Mahindra Bank',
      branch: 'Malleshwaram',
    },
  },
  {
    phone: '+919876543206',
    shop_name: 'Royal Laundry Services',
    owner_name: 'Vikram Singh',
    email: 'royallaundry@laundry.com',
    gst_number: '29ROYALLAU678K6L0',
    pan_number: 'ROYALLAU678K',
    shop_license_number: 'LSC/BLR/2024/1006',
    aadhaar_number: '987654321006',
    address: {
      address_line1: 'No. 234, Whitefield',
      address_line2: 'ITPL Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      landmark: 'Near ITPL',
      latitude: 12.9698,
      longitude: 77.7499,
    },
    bank_details: {
      account_holder_name: 'Vikram Singh',
      account_number: '6789012345678901',
      ifsc_code: 'PNB0001234',
      bank_name: 'Punjab National Bank',
      branch: 'Whitefield',
    },
  },
  {
    phone: '+919876543207',
    shop_name: 'Spotless Laundry',
    owner_name: 'Anjali Desai',
    email: 'spotless@laundry.com',
    gst_number: '29SPOTLESS901L7M1',
    pan_number: 'SPOTLESS901L',
    shop_license_number: 'LSC/BLR/2024/1007',
    aadhaar_number: '987654321007',
    address: {
      address_line1: 'No. 56, HSR Layout',
      address_line2: 'Sector 7',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      landmark: 'Near BDA Complex',
      latitude: 12.9113,
      longitude: 77.6446,
    },
    bank_details: {
      account_holder_name: 'Anjali Desai',
      account_number: '7890123456789012',
      ifsc_code: 'YESB0001234',
      bank_name: 'Yes Bank',
      branch: 'HSR Layout',
    },
  },
  {
    phone: '+919876543208',
    shop_name: 'Premium Wash Center',
    owner_name: 'Kiran Rao',
    email: 'premiumwash@laundry.com',
    gst_number: '29PREMIUM234M8N2',
    pan_number: 'PREMIUM234M',
    shop_license_number: 'LSC/BLR/2024/1008',
    aadhaar_number: '987654321008',
    address: {
      address_line1: 'Shop No. 78, BTM Layout',
      address_line2: '2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
      landmark: 'Near Silk Board',
      latitude: 12.9166,
      longitude: 77.6101,
    },
    bank_details: {
      account_holder_name: 'Kiran Rao',
      account_number: '8901234567890123',
      ifsc_code: 'IDIB0001234',
      bank_name: 'Indian Bank',
      branch: 'BTM Layout',
    },
  },
  {
    phone: '+919876543209',
    shop_name: 'Clean & Shine Laundry',
    owner_name: 'Ravi Menon',
    email: 'cleanshine@laundry.com',
    gst_number: '29CLEANSH567N9O3',
    pan_number: 'CLEANSH567N',
    shop_license_number: 'LSC/BLR/2024/1009',
    aadhaar_number: '987654321009',
    address: {
      address_line1: 'No. 90, Electronic City',
      address_line2: 'Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      landmark: 'Near Infosys',
      latitude: 12.8456,
      longitude: 77.6633,
    },
    bank_details: {
      account_holder_name: 'Ravi Menon',
      account_number: '9012345678901234',
      ifsc_code: 'UNION0001234',
      bank_name: 'Union Bank of India',
      branch: 'Electronic City',
    },
  },
  {
    phone: '+919876543210',
    shop_name: 'Express Laundry Pro',
    owner_name: 'Deepa Iyer',
    email: 'expresspro@laundry.com',
    gst_number: '29EXPRESS890O0P4',
    pan_number: 'EXPRESS890O',
    shop_license_number: 'LSC/BLR/2024/1010',
    aadhaar_number: '987654321010',
    address: {
      address_line1: 'No. 123, Marathahalli',
      address_line2: 'Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560037',
      landmark: 'Near Kalamandir',
      latitude: 12.9592,
      longitude: 77.6974,
    },
    bank_details: {
      account_holder_name: 'Deepa Iyer',
      account_number: '0123456789012345',
      ifsc_code: 'CANB0001234',
      bank_name: 'Canara Bank',
      branch: 'Marathahalli',
    },
  },
  {
    phone: '+919876543211',
    shop_name: 'Mega Clean Laundry',
    owner_name: 'Sandeep Gupta',
    email: 'megaclean@laundry.com',
    gst_number: '29MEGACLN123P1Q5',
    pan_number: 'MEGACLN123P',
    shop_license_number: 'LSC/BLR/2024/1011',
    aadhaar_number: '987654321011',
    address: {
      address_line1: 'Shop No. 45, Banashankari',
      address_line2: '3rd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560085',
      landmark: 'Near Bus Stand',
      latitude: 12.9424,
      longitude: 77.5506,
    },
    bank_details: {
      account_holder_name: 'Sandeep Gupta',
      account_number: '1234567890123456',
      ifsc_code: 'BANK0001234',
      bank_name: 'Bank of Baroda',
      branch: 'Banashankari',
    },
  },
  {
    phone: '+919876543212',
    shop_name: 'Ultra Clean Services',
    owner_name: 'Nisha Verma',
    email: 'ultraclean@laundry.com',
    gst_number: '29ULTRACL456Q2R6',
    pan_number: 'ULTRACL456Q',
    shop_license_number: 'LSC/BLR/2024/1012',
    aadhaar_number: '987654321012',
    address: {
      address_line1: 'No. 67, Yelahanka',
      address_line2: 'New Town',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560064',
      landmark: 'Near Air Force Station',
      latitude: 13.1007,
      longitude: 77.5963,
    },
    bank_details: {
      account_holder_name: 'Nisha Verma',
      account_number: '2345678901234567',
      ifsc_code: 'IOBA0001234',
      bank_name: 'Indian Overseas Bank',
      branch: 'Yelahanka',
    },
  },
  {
    phone: '+919876543213',
    shop_name: 'Pro Wash Laundry',
    owner_name: 'Arjun Nair',
    email: 'prowash@laundry.com',
    gst_number: '29PROWASH789R3S7',
    pan_number: 'PROWASH789R',
    shop_license_number: 'LSC/BLR/2024/1013',
    aadhaar_number: '987654321013',
    address: {
      address_line1: 'Shop No. 23, Hebbal',
      address_line2: 'Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560024',
      landmark: 'Near Hebbal Lake',
      latitude: 13.0358,
      longitude: 77.5970,
    },
    bank_details: {
      account_holder_name: 'Arjun Nair',
      account_number: '3456789012345678',
      ifsc_code: 'CENT0001234',
      bank_name: 'Central Bank of India',
      branch: 'Hebbal',
    },
  },
  {
    phone: '+919876543214',
    shop_name: 'Star Laundry Hub',
    owner_name: 'Lakshmi Prasad',
    email: 'starhub@laundry.com',
    gst_number: '29STARHUB012S4T8',
    pan_number: 'STARHUB012S',
    shop_license_number: 'LSC/BLR/2024/1014',
    aadhaar_number: '987654321014',
    address: {
      address_line1: 'No. 89, Rajajinagar',
      address_line2: '4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560010',
      landmark: 'Near Metro Station',
      latitude: 12.9784,
      longitude: 77.5510,
    },
    bank_details: {
      account_holder_name: 'Lakshmi Prasad',
      account_number: '4567890123456789',
      ifsc_code: 'VIJB0001234',
      bank_name: 'Vijaya Bank',
      branch: 'Rajajinagar',
    },
  },
  {
    phone: '+919876543215',
    shop_name: 'Top Clean Laundry',
    owner_name: 'Sunita Reddy',
    email: 'topclean@laundry.com',
    gst_number: '29TOPCLEAN345T5U9',
    pan_number: 'TOPCLEAN345T',
    shop_license_number: 'LSC/BLR/2024/1015',
    aadhaar_number: '987654321015',
    address: {
      address_line1: 'Shop No. 34, Basavanagudi',
      address_line2: 'Gandhi Bazaar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560004',
      landmark: 'Near Bull Temple',
      latitude: 12.9424,
      longitude: 77.5676,
    },
    bank_details: {
      account_holder_name: 'Sunita Reddy',
      account_number: '5678901234567890',
      ifsc_code: 'ORBC0001234',
      bank_name: 'Oriental Bank of Commerce',
      branch: 'Basavanagudi',
    },
  },
];

// Operating hours template
const OPERATING_HOURS = {
  monday: { open: '07:00', close: '22:00' },
  tuesday: { open: '07:00', close: '22:00' },
  wednesday: { open: '07:00', close: '22:00' },
  thursday: { open: '07:00', close: '22:00' },
  friday: { open: '07:00', close: '22:00' },
  saturday: { open: '08:00', close: '23:00' },
  sunday: { open: '08:00', close: '21:00' },
};

// Service configuration template
const SERVICE_CONFIG = {
  max_count_per_day: 50,
  is_express_available: true,
  express_delivery_time_minutes: 360, // 6 hours
  normal_delivery_time_minutes: 1440, // 24 hours
  is_offer: false,
  offer_percentage: 0,
  is_active: true,
};

// Helper function to create services_offered from master services
function createServicesOffered(masterServices) {
  return masterServices.map((service) => {
    const items = (service.items || []).map((item) => {
      // Handle item_id - convert string to ObjectId if needed, or create new one
      let itemId;
      if (item._id) {
        itemId = Types.ObjectId.isValid(item._id) 
          ? (typeof item._id === 'string' ? new Types.ObjectId(item._id) : item._id)
          : new Types.ObjectId();
      } else {
        itemId = new Types.ObjectId();
      }

      return {
        item_id: itemId,
        item_name: item.item_name,
        image_url: item.image_url || 'https://via.placeholder.com/150',
        item_price: getItemPrice(item.item_name, service.pricing_type),
        express_price: getItemPrice(item.item_name, service.pricing_type, true),
        min_weight: item.weight?.[0] || 0,
        max_weight: item.weight?.[1] || 0,
        item_description: item.item_description || `${item.item_name} service`,
        category: item.category || 'General',
        is_active: true,
      };
    });

    // Handle service_id - convert string to ObjectId if needed
    let serviceId;
    if (service._id) {
      serviceId = Types.ObjectId.isValid(service._id)
        ? (typeof service._id === 'string' ? new Types.ObjectId(service._id) : service._id)
        : new Types.ObjectId();
    } else {
      serviceId = new Types.ObjectId();
    }

    return {
      service_id: serviceId,
      service_name: service.service_name,
      image_url: service.image_url || 'https://via.placeholder.com/150',
      pricing_type: service.pricing_type,
      max_count_per_day: SERVICE_CONFIG.max_count_per_day,
      service_description: service.service_description || `${service.service_name} service`,
      items: items,
      is_express_available: SERVICE_CONFIG.is_express_available,
      express_delivery_time_minutes: SERVICE_CONFIG.express_delivery_time_minutes,
      normal_delivery_time_minutes: SERVICE_CONFIG.normal_delivery_time_minutes,
      is_offer: SERVICE_CONFIG.is_offer,
      offer_percentage: SERVICE_CONFIG.offer_percentage,
      is_active: SERVICE_CONFIG.is_active,
    };
  });
}

// Helper function to get item price based on item name and pricing type
function getItemPrice(itemName, pricingType, isExpress = false) {
  const name = itemName.toLowerCase();
  
  if (pricingType === 'per_kg') {
    // Weight-based pricing
    if (name.includes('small') || name.includes('1kg')) {
      return isExpress ? 80 : 60;
    } else if (name.includes('medium') || name.includes('3kg')) {
      return isExpress ? 100 : 80;
    } else if (name.includes('large') || name.includes('5kg')) {
      return isExpress ? 120 : 100;
    }
    return isExpress ? 100 : 70; // Default
  } else {
    // Per piece pricing
    if (name.includes('shirt')) {
      return isExpress ? 20 : 15;
    } else if (name.includes('t-shirt') || name.includes('tshirt')) {
      return isExpress ? 15 : 10;
    } else if (name.includes('pant') || name.includes('trouser')) {
      return isExpress ? 25 : 20;
    } else if (name.includes('suit')) {
      return isExpress ? 180 : 150;
    } else if (name.includes('dress')) {
      return isExpress ? 60 : 50;
    } else if (name.includes('kurta')) {
      return isExpress ? 40 : 30;
    }
    return isExpress ? 30 : 20; // Default
  }
}

// Vendor Schema (simplified for insertion)
const VendorSchema = new mongoose.Schema(
  {
    shop_name: String,
    shop_image_url: String,
    owner_name: String,
    email: { type: String, lowercase: true },
    phone: { type: String, unique: true },
    password_hash: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'pending', 'upload', 'docs', 'retry'],
      default: 'active',
    },
    gst_number: String,
    pan_number: String,
    aadhaar_number: String,
    shop_license_number: String,
    total_orders: { type: Number, default: 0 },
    address: mongoose.Schema.Types.Mixed,
    operating_hours: mongoose.Schema.Types.Mixed,
    services_offered: [mongoose.Schema.Types.Mixed],
    last_service_updated_at: Date,
    rating: {
      average: { type: Number, default: 0 },
      total_reviews: { type: Number, default: 0 },
      reviews: { type: Array, default: [] },
    },
    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      last_updated: Date,
    },
    bank_details: mongoose.Schema.Types.Mixed,
    pickup_zones: { type: Array, default: [] },
    subscription_plan: mongoose.Schema.Types.Mixed,
    documents: mongoose.Schema.Types.Mixed,
    fcm_token: String,
    session_token: String,
  },
  { timestamps: true },
);

const Vendor = mongoose.model('Vendor', VendorSchema);

// Services Schema
const ServicesSchema = new mongoose.Schema(
  {
    service_name: String,
    image_url: String,
    pricing_type: String,
    service_description: String,
    items: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true },
);

const Services = mongoose.model('Services', ServicesSchema);

// Main function
async function insertVendors() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to database');

    // Fetch master services
    console.log('\n📋 Fetching master services...');
    const masterServices = await Services.find({}).lean();
    
    if (masterServices.length === 0) {
      console.error('❌ No services found in database. Please seed services first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${masterServices.length} service(s)`);
    masterServices.forEach((s) => {
      console.log(`   - ${s.service_name} (${s.pricing_type})`);
    });

    // Create services_offered for all vendors
    const servicesOffered = createServicesOffered(masterServices);
    console.log(`\n✅ Created services_offered structure with ${servicesOffered.length} service(s)`);

    // Insert vendors
    console.log('\n🏪 Inserting vendors...');
    console.log('='.repeat(70));

    const results = [];
    
    for (const vendorData of VENDOR_DATA) {
      try {
        // Check if vendor already exists
        const existing = await Vendor.findOne({ phone: vendorData.phone });
        if (existing) {
          console.log(`⚠️  Vendor ${vendorData.phone} already exists, skipping...`);
          results.push({ phone: vendorData.phone, success: false, reason: 'Already exists' });
          continue;
        }

        // Create vendor document
        const vendor = new Vendor({
          shop_name: vendorData.shop_name,
          owner_name: vendorData.owner_name,
          email: vendorData.email,
          phone: vendorData.phone,
          status: 'active', // Set directly to active
          gst_number: vendorData.gst_number,
          pan_number: vendorData.pan_number,
          aadhaar_number: vendorData.aadhaar_number,
          shop_license_number: vendorData.shop_license_number,
          total_orders: 0,
          address: vendorData.address,
          operating_hours: OPERATING_HOURS,
          services_offered: servicesOffered,
          last_service_updated_at: new Date(),
          rating: {
            average: 0,
            total_reviews: 0,
            reviews: [],
          },
          wallet: {
            balance: 0,
            currency: 'INR',
            last_updated: new Date(),
          },
          bank_details: vendorData.bank_details,
          pickup_zones: [],
          shop_status: {
            status: 'open',
            close_time: null,
          },
        });

        await vendor.save();
        console.log(`✅ Created: ${vendorData.shop_name} (${vendorData.phone})`);
        results.push({ phone: vendorData.phone, success: true, shop_name: vendorData.shop_name });
        
      } catch (error) {
        console.error(`❌ Failed to create ${vendorData.shop_name}:`, error.message);
        results.push({ phone: vendorData.phone, success: false, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Summary');
    console.log('='.repeat(70));
    
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    
    console.log(`✅ Successfully created: ${successful} vendor(s)`);
    console.log(`❌ Failed/Skipped: ${failed} vendor(s)`);
    
    if (successful > 0) {
      console.log('\n✅ Created Vendors:');
      results
        .filter((r) => r.success)
        .forEach((r) => {
          console.log(`   - ${r.shop_name} (${r.phone})`);
        });
    }
    
    if (failed > 0) {
      console.log('\n❌ Failed/Skipped Vendors:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - ${r.phone}: ${r.reason || r.error}`);
        });
    }

    console.log('\n✨ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Run the script
if (require.main === module) {
  insertVendors().catch(console.error);
}

module.exports = { insertVendors };

