#!/usr/bin/env node

/**
 * Create Vendor with Mock Data Script
 * Automatically creates a vendor with predefined mock data
 */

const API_BASE_URL = 'http://localhost:3000';
const axios = require('axios');

// Mock vendor data
const MOCK_VENDORS = [
  {
    phone: '+919876543215',
    shop_name: 'MegaWash Laundry Services',
    owner_name: 'Rajesh Kumar',
    email: 'megalwash@laundry.com',
    gst_number: '29MEGAWASH123F1Z5',
    pan_number: 'MEGAWASH123F',
    shop_license_number: 'LSC/BLR/2024/7890',
    aadhaar_number: '987654321012',
    address_line1: 'No. 123, Commercial Complex',
    address_line2: 'Jayanagar 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560041',
    landmark: 'Near Metro Station',
    latitude: 12.9344,
    longitude: 77.6192,
    account_holder_name: 'Rajesh Kumar',
    account_number: '1234567890123456',
    ifsc_code: 'HDFC0001234',
    bank_name: 'HDFC Bank',
    branch: 'Jayanagar'
  },
  {
    phone: '+919876543216',
    shop_name: 'QuickClean Hub',
    owner_name: 'Priya Sharma',
    email: 'quickclean@laundry.com',
    gst_number: '29QUICKCLN456G2H6',
    pan_number: 'QUICKCLN456G',
    shop_license_number: 'LSC/BLR/2024/7891',
    aadhaar_number: '987654321013',
    address_line1: 'Shop No. 45, Market Street',
    address_line2: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    landmark: 'Near 100 Feet Road',
    latitude: 12.9716,
    longitude: 77.6412,
    account_holder_name: 'Priya Sharma',
    account_number: '2345678901234567',
    ifsc_code: 'ICIC0009876',
    bank_name: 'ICICI Bank',
    branch: 'Indiranagar'
  },
  {
    phone: '+919876543217',
    shop_name: 'FreshN Press',
    owner_name: 'Amit Patel',
    email: 'freshnpress@laundry.com',
    gst_number: '29FRESHPRS789H3I7',
    pan_number: 'FRESHPRS789H',
    shop_license_number: 'LSC/BLR/2024/7892',
    aadhaar_number: '987654321014',
    address_line1: 'No. 67, Trade Center',
    address_line2: 'Koramangala 5th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560095',
    landmark: 'Near Forum Mall',
    latitude: 12.9352,
    longitude: 77.6245,
    account_holder_name: 'Amit Patel',
    account_number: '3456789012345678',
    ifsc_code: 'SBIN0001234',
    bank_name: 'State Bank of India',
    branch: 'Koramangala'
  }
];

const SERVICES_CONFIG = [
  {
    service_name: "Wash and Fold",
    max_count_per_day: 50,
    items: [
      { item_name: "Small 1Kg - 3Kg", item_category: "weight", item_price: 60, express_price: 80, discount_percentage: 0, is_active: true },
      { item_name: "Medium 3Kg - 5Kg", item_category: "weight", item_price: 80, express_price: 100, discount_percentage: 0, is_active: true },
      { item_name: "Large 5Kg+", item_category: "weight", item_price: 100, express_price: 120, discount_percentage: 0, is_active: true }
    ]
  },
  {
    service_name: "Wash and Iron",
    max_count_per_day: 30,
    items: [
      { item_name: "Small 1Kg - 3Kg", item_category: "weight", item_price: 80, express_price: 100, discount_percentage: 0, is_active: true },
      { item_name: "Medium 3Kg - 5Kg", item_category: "weight", item_price: 100, express_price: 120, discount_percentage: 0, is_active: true },
      { item_name: "Large 5Kg+", item_category: "weight", item_price: 120, express_price: 150, discount_percentage: 0, is_active: true }
    ]
  },
  {
    service_name: "Iron",
    max_count_per_day: 40,
    items: [
      { item_name: "Shirt", item_category: "Men", item_price: 15, express_price: 20, discount_percentage: 0, is_active: true },
      { item_name: "T-shirt", item_category: "Men", item_price: 10, express_price: 15, discount_percentage: 0, is_active: true },
      { item_name: "Pant/Trousers", item_category: "Men", item_price: 20, express_price: 25, discount_percentage: 0, is_active: true }
    ]
  },
  {
    service_name: "Dry Clean",
    max_count_per_day: 20,
    items: [
      { item_name: "Shirt", item_category: "Men", item_price: 50, express_price: 60, discount_percentage: 0, is_active: true },
      { item_name: "Suit (3 piece)", item_category: "Men", item_price: 150, express_price: 180, discount_percentage: 0, is_active: true },
      { item_name: "Pant/Trousers", item_category: "Men", item_price: 60, express_price: 75, discount_percentage: 0, is_active: true }
    ]
  }
];

const OPERATING_HOURS = {
  monday: { open: '07:00', close: '22:00' },
  tuesday: { open: '07:00', close: '22:00' },
  wednesday: { open: '07:00', close: '22:00' },
  thursday: { open: '07:00', close: '22:00' },
  friday: { open: '07:00', close: '22:00' },
  saturday: { open: '08:00', close: '23:00' },
  sunday: { open: '08:00', close: '21:00' }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error: ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
}

// Register vendor
async function registerVendor(phone) {
  console.log('📱 Registering vendor...');
  return await apiCall('POST', '/vendor/register', { phone });
}

// Verify OTP
async function verifyOtp(phone, otp = '1234') {
  console.log('🔐 Verifying OTP...');
  const response = await apiCall('POST', '/vendor/verify-otp', {
    phone,
    otp,
    fcm_token: 'script_fcm_token_' + Date.now()
  });
  return response.data.token;
}

// Complete registration
async function completeRegistration(token, vendorData) {
  console.log('📝 Completing registration...');
  return await apiCall('POST', '/vendor/register-complete', vendorData, {
    'Authorization': `Bearer ${token}`
  });
}

// Set operating hours
async function setOperatingHours(token) {
  console.log('⏰ Setting operating hours...');
  return await apiCall('POST', '/vendor/operating-hours', OPERATING_HOURS, {
    'Authorization': `Bearer ${token}`
  });
}

// Configure services
async function configureServices(token) {
  console.log('⚙️ Configuring services...');
  
  for (const service of SERVICES_CONFIG) {
    console.log(`   Setting up ${service.service_name}...`);
    await apiCall('POST', '/vendor/services-offered', { service }, {
      'Authorization': `Bearer ${token}`
    });
  }
  
  console.log('✅ All services configured');
}

// Create a single vendor
async function createVendor(vendorData) {
  try {
    console.log(`\n🏪 Creating Vendor: ${vendorData.shop_name}`);
    console.log('=' .repeat(60));
    
    // Step 1: Register
    await registerVendor(vendorData.phone);
    
    // Step 2: Verify OTP
    const token = await verifyOtp(vendorData.phone);
    
    // Step 3: Complete registration
    await completeRegistration(token, vendorData);
    
    // Step 4: Set operating hours
    await setOperatingHours(token);
    
    // Step 5: Configure services
    await configureServices(token);
    
    console.log('\n✅ Vendor created successfully!');
    console.log(`   Shop: ${vendorData.shop_name}`);
    console.log(`   Phone: ${vendorData.phone}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);
    
    return { success: true, token, phone: vendorData.phone };
    
  } catch (error) {
    console.error(`\n❌ Failed to create vendor: ${vendorData.shop_name}`);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Vendor Creation Script with Mock Data');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Create all vendors
  for (const vendorData of MOCK_VENDORS) {
    const result = await createVendor(vendorData);
    results.push(result);
    
    // Add delay between registrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully created: ${successful} vendor(s)`);
  console.log(`❌ Failed: ${failed} vendor(s)`);
  
  if (successful > 0) {
    console.log('\nCreated Vendors:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${r.phone}`);
    });
  }
}

// Run the script
main().catch(console.error);

