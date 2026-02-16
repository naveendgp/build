#!/usr/bin/env node

/**
 * Update Vendor Services Script
 * Updates prices, offers, and max limits for all vendor services
 */

const API_BASE_URL = 'http://localhost:3000';
const axios = require('axios');

// Vendor phone numbers to update
const VENDOR_PHONES = [
  '9940212263', // MegaWash Laundry Services
];

// Comprehensive service configurations with offers
const SERVICE_CONFIGS = [
  {
    service_name: "Wash and Fold",
    max_count_per_day: 75,
    items: [
      { item_name: "Small 1Kg - 3Kg", item_category: "weight", item_price: 55, express_price: 75, discount_percentage: 10, is_active: true },
      { item_name: "Medium 3Kg - 5Kg", item_category: "weight", item_price: 75, express_price: 95, discount_percentage: 15, is_active: true },
      { item_name: "Large 5Kg+", item_category: "weight", item_price: 95, express_price: 115, discount_percentage: 10, is_active: true }
    ]
  },
  {
    service_name: "Wash and Iron",
    max_count_per_day: 50,
    items: [
      { item_name: "Small 1Kg - 3Kg", item_category: "weight", item_price: 75, express_price: 95, discount_percentage: 12, is_active: true },
      { item_name: "Medium 3Kg - 5Kg", item_category: "weight", item_price: 95, express_price: 115, discount_percentage: 10, is_active: true },
      { item_name: "Large 5Kg+", item_category: "weight", item_price: 115, express_price: 145, discount_percentage: 15, is_active: true }
    ]
  },
  {
    service_name: "Iron",
    max_count_per_day: 60,
    items: [
      // Men's items
      { item_name: "Shirt", item_category: "Men", item_price: 12, express_price: 18, discount_percentage: 0, is_active: true },
      { item_name: "T-shirt", item_category: "Men", item_price: 8, express_price: 12, discount_percentage: 0, is_active: true },
      { item_name: "Sweatshirt", item_category: "Men", item_price: 15, express_price: 22, discount_percentage: 5, is_active: true },
      { item_name: "Pant/Trousers", item_category: "Men", item_price: 18, express_price: 22, discount_percentage: 10, is_active: true },
      { item_name: "Jeans", item_category: "Men", item_price: 22, express_price: 28, discount_percentage: 0, is_active: true },
      { item_name: "Suit (3 piece)", item_category: "Men", item_price: 45, express_price: 55, discount_percentage: 20, is_active: true },
      { item_name: "Blazer", item_category: "Men", item_price: 25, express_price: 30, discount_percentage: 8, is_active: true },
      { item_name: "Hoodie", item_category: "Men", item_price: 20, express_price: 25, discount_percentage: 5, is_active: true },
      // Women's items
      { item_name: "Shirt", item_category: "Women", item_price: 12, express_price: 18, discount_percentage: 0, is_active: true },
      { item_name: "T-shirt", item_category: "Women", item_price: 8, express_price: 12, discount_percentage: 5, is_active: true },
      { item_name: "Dresses", item_category: "Women", item_price: 22, express_price: 28, discount_percentage: 10, is_active: true },
      { item_name: "Jeans", item_category: "Women", item_price: 22, express_price: 28, discount_percentage: 0, is_active: true }
    ]
  },
  {
    service_name: "Dry Clean",
    max_count_per_day: 35,
    items: [
      // Men's items
      { item_name: "Shirt", item_category: "Men", item_price: 45, express_price: 55, discount_percentage: 15, is_active: true },
      { item_name: "T-shirt", item_category: "Men", item_price: 40, express_price: 50, discount_percentage: 10, is_active: true },
      { item_name: "Sweatshirt", item_category: "Men", item_price: 50, express_price: 60, discount_percentage: 8, is_active: true },
      { item_name: "Suit (3 piece)", item_category: "Men", item_price: 140, express_price: 170, discount_percentage: 20, is_active: true },
      { item_name: "Blazer", item_category: "Men", item_price: 75, express_price: 95, discount_percentage: 12, is_active: true },
      { item_name: "Hoodie", item_category: "Men", item_price: 55, express_price: 65, discount_percentage: 10, is_active: true },
      { item_name: "Pant/Trousers", item_category: "Men", item_price: 55, express_price: 70, discount_percentage: 15, is_active: true },
      { item_name: "Jeans", item_category: "Men", item_price: 65, express_price: 80, discount_percentage: 10, is_active: true },
      // Women's items
      { item_name: "Shirt", item_category: "Women", item_price: 45, express_price: 55, discount_percentage: 15, is_active: true },
      { item_name: "T-shirt", item_category: "Women", item_price: 40, express_price: 50, discount_percentage: 10, is_active: true },
      { item_name: "Dresses", item_category: "Women", item_price: 95, express_price: 115, discount_percentage: 18, is_active: true },
      { item_name: "Jeans", item_category: "Women", item_price: 65, express_price: 80, discount_percentage: 12, is_active: true }
    ]
  }
];

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

// Login and get token
async function loginAndGetToken(phone) {
  console.log(`   Logging in ${phone}...`);
  
  // Login
  await apiCall('POST', '/vendor/login', { phone });
  
  // Verify OTP
  const response = await apiCall('POST', '/vendor/verify-otp', {
    phone,
    otp: '1234',
    fcm_token: 'update_script_token'
  });
  
  return response.data.token;
}

// Update services for a vendor
async function updateVendorServices(phone, token) {
  console.log(`\n   Updating services for ${phone}...`);
  
  for (const service of SERVICE_CONFIGS) {
    console.log(`     - ${service.service_name}: max ${service.max_count_per_day}, ${service.items.length} items`);
    
    try {
      await apiCall('POST', '/vendor/services-offered', { service }, {
        'Authorization': `Bearer ${token}`
      });
      console.log(`     ✓ ${service.service_name} updated successfully`);
    } catch (error) {
      console.log(`     ✗ Failed to update ${service.service_name}`);
    }
  }
}

// Main function
async function main() {
  console.log('🔄 Vendor Services Update Script');
  console.log('='.repeat(70));
  console.log('This script will update:');
  console.log('  - Item prices (regular & express)');
  console.log('  - Discount percentages (offers)');
  console.log('  - Max count per day limits');
  console.log('  - Item activation status');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const phone of VENDOR_PHONES) {
    try {
      console.log(`\n📱 Updating vendor: ${phone}`);
      console.log('-'.repeat(70));
      
      // Login and get token
      const token = await loginAndGetToken(phone);
      console.log('   ✓ Login successful');
      
      // Update services
      await updateVendorServices(phone, token);
      
      console.log(`\n   ✅ Vendor ${phone} updated successfully`);
      results.push({ phone, success: true });
      
      // Add delay between vendors
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`\n   ❌ Failed to update vendor ${phone}:`, error.message);
      results.push({ phone, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully updated: ${successful} vendor(s)`);
  console.log(`❌ Failed: ${failed} vendor(s)`);
  
  if (successful > 0) {
    console.log('\nUpdated Vendors:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${r.phone}`);
    });
  }
  
  if (failed > 0) {
    console.log('\nFailed Vendors:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.phone}: ${r.error}`);
    });
  }
  
  console.log('\n📋 Service Details Updated:');
  SERVICE_CONFIGS.forEach(service => {
    console.log(`   ${service.service_name}:`);
    console.log(`     - Max count: ${service.max_count_per_day}`);
    console.log(`     - Items: ${service.items.length}`);
    console.log(`     - Offers: ${service.items.filter(i => i.discount_percentage > 0).length} items with discounts`);
  });
}

// Run the script
main().catch(console.error);

