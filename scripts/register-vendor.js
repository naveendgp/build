#!/usr/bin/env node

/**
 * Vendor Registration Script
 * This script creates and registers vendors using the API endpoints
 */

const API_BASE_URL = 'http://localhost:3000';
const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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
    console.error(`Error calling ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Step 1: Register vendor (phone number only)
async function registerVendor(phone) {
  console.log('\n📱 Step 1: Registering vendor...');
  const response = await apiCall('POST', '/vendor/register', { phone });
  console.log('✅ Vendor registered:', response.message);
  return response;
}

// Step 2: Verify OTP
async function verifyOtp(phone, otp = '1234', fcmToken = 'script_fcm_token') {
  console.log('\n🔐 Step 2: Verifying OTP...');
  const response = await apiCall('POST', '/vendor/verify-otp', {
    phone,
    otp,
    fcm_token: fcmToken
  });
  console.log('✅ OTP verified');
  return response.data.token;
}

// Step 3: Complete vendor registration
async function completeRegistration(token, vendorData) {
  console.log('\n📝 Step 3: Completing registration...');
  const response = await apiCall('POST', '/vendor/register-complete', vendorData, {
    'Authorization': `Bearer ${token}`
  });
  console.log('✅ Registration completed:', response.message);
  return response;
}

// Step 4: Set operating hours
async function setOperatingHours(token, operatingHours) {
  console.log('\n⏰ Step 4: Setting operating hours...');
  const response = await apiCall('POST', '/vendor/operating-hours', operatingHours, {
    'Authorization': `Bearer ${token}`
  });
  console.log('✅ Operating hours set:', response.message);
  return response;
}

// Step 5: Configure services
async function configureServices(token, services) {
  console.log('\n⚙️ Step 5: Configuring services...');
  
  for (const service of services) {
    console.log(`  Configuring ${service.service_name}...`);
    const response = await apiCall('POST', '/vendor/services-offered', { service }, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`  ✅ ${service.service_name} configured`);
  }
}

// Main registration flow
async function registerVendorFlow() {
  try {
    console.log('🏪 Vendor Registration Script');
    console.log('='.repeat(50));
    
    // Get vendor details
    const phone = await question('\nEnter vendor phone number (+91XXXXXXXXXX): ');
    
    // Step 1: Register
    await registerVendor(phone);
    
    // Step 2: Verify OTP
    const token = await verifyOtp(phone);
    
    // Step 3: Complete registration
    const vendorData = {
      shop_name: await question('Shop name: '),
      owner_name: await question('Owner name: '),
      email: await question('Email: '),
      gst_number: await question('GST number: '),
      pan_number: await question('PAN number: '),
      shop_license_number: await question('License number: '),
      aadhaar_number: await question('Aadhaar number: '),
      address_line1: await question('Address line 1: '),
      address_line2: await question('Address line 2 (optional): ') || '',
      city: await question('City: '),
      state: await question('State: '),
      pincode: await question('Pincode: '),
      landmark: await question('Landmark: '),
      latitude: parseFloat(await question('Latitude: ')),
      longitude: parseFloat(await question('Longitude: ')),
      account_holder_name: await question('Account holder name: '),
      account_number: await question('Account number: '),
      ifsc_code: await question('IFSC code: '),
      bank_name: await question('Bank name: '),
      branch: await question('Branch: ')
    };
    
    await completeRegistration(token, vendorData);
    
    // Step 4: Set operating hours
    const operatingHours = {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '09:00', close: '18:00' }
    };
    
    await setOperatingHours(token, operatingHours);
    
    // Step 5: Configure services (optional)
    const configureServicesNow = await question('\nDo you want to configure services now? (y/n): ');
    if (configureServicesNow.toLowerCase() === 'y') {
      const services = [
        {
          service_name: "Wash and Fold",
          max_count_per_day: 50,
          items: [
            {
              item_name: "Small 1Kg - 3Kg",
              item_category: "weight",
              item_price: 60,
              express_price: 80,
              discount_percentage: 0,
              is_active: true
            },
            {
              item_name: "Medium 3Kg - 5Kg",
              item_category: "weight",
              item_price: 80,
              express_price: 100,
              discount_percentage: 0,
              is_active: true
            },
            {
              item_name: "Large 5Kg+",
              item_category: "weight",
              item_price: 100,
              express_price: 120,
              discount_percentage: 0,
              is_active: true
            }
          ]
        }
      ];
      
      await configureServices(token, services);
    }
    
    console.log('\n✅ Vendor registration completed successfully!');
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 Token: ${token}`);
    
  } catch (error) {
    console.error('\n❌ Registration failed:', error.message);
  } finally {
    rl.close();
  }
}

// Quick registration with predefined data
async function quickRegister(phone, vendorName) {
  try {
    console.log(`\n🚀 Quick Registration: ${vendorName}`);
    console.log('='.repeat(50));
    
    // Register
    await registerVendor(phone);
    
    // Verify OTP
    const token = await verifyOtp(phone);
    
    // Complete registration
    const vendorData = {
      shop_name: `${vendorName} Laundry`,
      owner_name: `${vendorName}`,
      email: `${vendorName.toLowerCase()}@laundry.com`,
      gst_number: `29${vendorName.toUpperCase()}1234F1Z5`,
      pan_number: `${vendorName.toUpperCase()}1234F`,
      shop_license_number: `LSC/BLR/2024/${Math.floor(Math.random() * 10000)}`,
      aadhaar_number: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
      address_line1: `No. ${Math.floor(Math.random() * 100)}, Main Street`,
      address_line2: `${vendorName} Area`,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      landmark: 'Near Main Road',
      latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
      account_holder_name: `${vendorName}`,
      account_number: `${Math.floor(Math.random() * 9000000000000000) + 1000000000000000}`,
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      branch: 'Koramangala'
    };
    
    await completeRegistration(token, vendorData);
    
    // Set operating hours
    const operatingHours = {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '23:00' },
      sunday: { open: '08:00', close: '21:00' }
    };
    
    await setOperatingHours(token, operatingHours);
    
    console.log('\n✅ Quick registration completed!');
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 Token: ${token}`);
    
  } catch (error) {
    console.error(`\n❌ Quick registration failed:`, error.message);
  }
}

// Run the script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Quick registration mode
    const [phone, name] = args;
    await quickRegister(phone, name);
    process.exit(0);
  } else {
    // Interactive mode
    await registerVendorFlow();
  }
}

main();

