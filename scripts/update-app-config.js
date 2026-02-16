#!/usr/bin/env node

/**
 * Update App Config Script
 * Adds delivery_config with initial_distance_km to app-config documents
 */

const { MongoClient } = require('mongodb');

// MongoDB connection URL
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://prodmongo:prodpassword%40123@13.201.184.91:27017/laundry_backend?authSource=admin';
const DB_NAME = 'laundry_backend';

async function updateAppConfig() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = await MongoClient.connect(DATABASE_URL);
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to database');
    
    // Find all app-config documents
    const appConfigCollection = db.collection('appconfigs');
    const appConfigs = await appConfigCollection.find({}).toArray();
    
    console.log(`📄 Found ${appConfigs.length} app-config document(s)`);
    
    if (appConfigs.length === 0) {
      console.log('⚠️  No app-config documents found. Creating a new one...');
      
      // Create a new app-config document
      const newConfig = {
        config_key: 'payment_config_v1',
        config_name: 'Payment Configuration v1.0',
        description: 'Initial payment configuration for OTTER Laundry App',
        payment_config: {
          gst: 18,
          platform_fee: 5,
          delivery_fee: 30,
          currency: 'INR',
          min_order_amount: 100,
          max_order_amount: 5000,
          wallet_enabled: true,
          offer_enabled: true,
          express_delivery_fee: 50,
          standard_delivery_fee: 30
        },
        delivery_config: {
          initial_distance_km: 10
        },
        general_config: {
          app_version: '1.0.0',
          maintenance_mode: false,
          support_contact: '+91-9876543210',
          terms_url: 'https://otterlaundry.com/terms',
          privacy_url: 'https://otterlaundry.com/privacy'
        },
        is_active: true,
        effective_from: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await appConfigCollection.insertOne(newConfig);
      console.log(`✅ Created new app-config document with ID: ${result.insertedId}`);
      
    } else {
      // Update existing documents
      for (const config of appConfigs) {
        console.log(`\n📝 Updating config: ${config.config_key || config._id}`);
        
        const updateResult = await appConfigCollection.updateOne(
          { _id: config._id },
          { 
            $set: { 
              delivery_config: {
                initial_distance_km: 10
              },
              updatedAt: new Date()
            } 
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log('✅ Updated successfully');
        } else {
          console.log('ℹ️  No changes needed (field already exists)');
        }
      }
    }
    
    // Display the updated documents
    console.log('\n📋 Updated App Config Documents:');
    const updatedConfigs = await appConfigCollection.find({}).toArray();
    
    updatedConfigs.forEach(config => {
      console.log(`\n  Config Key: ${config.config_key}`);
      console.log(`  Active: ${config.is_active}`);
      
      if (config.delivery_config) {
        console.log(`  Delivery Config:`);
        console.log(`    initial_distance_km: ${config.delivery_config.initial_distance_km || 'Not set'}`);
      } else {
        console.log(`  Delivery Config: Not set`);
      }
      
      if (config.payment_config) {
        console.log(`  Payment Config:`);
        console.log(`    GST: ${config.payment_config.gst}%`);
        console.log(`    Delivery Fee: ₹${config.payment_config.delivery_fee}`);
      }
    });
    
    console.log('\n✅ App Config update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating app-config:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Run the script
console.log('🚀 App Config Update Script');
console.log('='.repeat(60));
updateAppConfig()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

