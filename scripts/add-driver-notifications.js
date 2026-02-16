#!/usr/bin/env node

/**
 * Add Notifications for All Drivers Script
 * Creates 5-10 notifications per driver in the app
 * 
 * Usage:
 *   node scripts/add-driver-notifications.js
 *   MONGODB_URL=mongodb://... node scripts/add-driver-notifications.js
 */

const mongoose = require('mongoose');
const { Types } = require('mongoose');

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, continue without it
  console.log('ℹ️  dotenv not found, using environment variables directly');
}

// MongoDB connection URL
const MONGODB_URL =
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL ||
  'mongodb://prodmongo:prodpassword%40123@13.201.184.91:27017/laundry_backend?authSource=admin';

// DeliveryPerson Schema
const DeliveryPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    role: String,
    assigned_zones: [String],
    vehicle: mongoose.Schema.Types.Mixed,
    license: mongoose.Schema.Types.Mixed,
    aadhaar: mongoose.Schema.Types.Mixed,
    address: mongoose.Schema.Types.Mixed,
    current_location: mongoose.Schema.Types.Mixed,
    availability_status: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    assigned_orders: [mongoose.Schema.Types.Mixed],
    wallet: mongoose.Schema.Types.Mixed,
    earnings_summary: mongoose.Schema.Types.Mixed,
    ratings: [mongoose.Schema.Types.Mixed],
    documents: mongoose.Schema.Types.Mixed,
    fcm_token: String,
  },
  { timestamps: true, collection: 'deliverypeople' },
);

// Notification Schema
const NotificationSchema = new mongoose.Schema(
  {
    recipient_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipient_role: {
      type: String,
      enum: ['user', 'vendor', 'delivery'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'payment', 'system', 'promotion'],
      default: 'system',
    },
    order_id: mongoose.Schema.Types.ObjectId,
    is_read: { type: Boolean, default: false },
    read_at: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

const DeliveryPerson = mongoose.model('DeliveryPerson', DeliveryPersonSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

/**
 * Get random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random item from array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate realistic notifications for drivers
 */
function generateNotificationsForDriver(driverName, count) {
  const notifications = [];
  const notificationTemplates = [
    // Order-related notifications
    {
      type: 'order',
      templates: [
        {
          title: 'New Order Assigned',
          message: `You have been assigned a new pickup order. Please check your app for details.`,
        },
        {
          title: 'Order Pickup Reminder',
          message: `Reminder: You have an order pickup scheduled. Please proceed to the pickup location.`,
        },
        {
          title: 'Order Status Updated',
          message: `The order status has been updated. Please check the order details in your app.`,
        },
        {
          title: 'Delivery Assignment',
          message: `A new delivery order has been assigned to you. Please collect the items from the vendor.`,
        },
        {
          title: 'Order Completed',
          message: `Great job! Your order has been successfully completed. Keep up the good work!`,
        },
        {
          title: 'Order Cancelled',
          message: `An order assigned to you has been cancelled. Please check your app for updated assignments.`,
        },
      ],
    },
    // Payment-related notifications
    {
      type: 'payment',
      templates: [
        {
          title: 'Payment Received',
          message: `Your payment of ₹${getRandomInt(150, 500)} has been credited to your wallet.`,
        },
        {
          title: 'Weekly Earnings Summary',
          message: `Your weekly earnings summary is ready. You earned ₹${getRandomInt(2000, 8000)} this week.`,
        },
        {
          title: 'Payment Processed',
          message: `Your payment request has been processed successfully. Amount will be credited within 24 hours.`,
        },
      ],
    },
    // System notifications
    {
      type: 'system',
      templates: [
        {
          title: 'Welcome to Laundry App',
          message: `Welcome ${driverName}! Thank you for joining our delivery team. We're excited to have you on board.`,
        },
        {
          title: 'App Update Available',
          message: `A new version of the app is available. Please update to enjoy the latest features and improvements.`,
        },
        {
          title: 'Profile Verification',
          message: `Your profile verification is complete. You can now start accepting orders.`,
        },
        {
          title: 'Zone Assignment',
          message: `You have been assigned to new delivery zones. Check your app to see the updated zones.`,
        },
        {
          title: 'Performance Update',
          message: `Your performance rating is excellent! You have completed ${getRandomInt(50, 200)} orders with a ${getRandomInt(4, 5)} star rating.`,
        },
        {
          title: 'Maintenance Reminder',
          message: `Reminder: Please ensure your vehicle documents are up to date. Upload them in the app if needed.`,
        },
        {
          title: 'Holiday Schedule',
          message: `Upcoming holiday schedule: The app will operate normally. Extra incentives available for drivers working on holidays.`,
        },
      ],
    },
    // Promotion notifications
    {
      type: 'promotion',
      templates: [
        {
          title: 'Bonus Opportunity',
          message: `Complete 10 orders today and earn an extra ₹500 bonus! Limited time offer.`,
        },
        {
          title: 'Referral Program',
          message: `Refer a friend to join as a driver and earn ₹1000 when they complete their first 20 orders.`,
        },
        {
          title: 'Peak Hours Bonus',
          message: `Earn 1.5x on all orders during peak hours (6 PM - 10 PM). Start accepting orders now!`,
        },
      ],
    },
  ];

  // Randomly select notifications from different categories
  for (let i = 0; i < count; i++) {
    const category = getRandomItem(notificationTemplates);
    const template = getRandomItem(category.templates);
    
    // Randomly decide if notification should be read (30% chance)
    const isRead = Math.random() < 0.3;
    const readAt = isRead ? new Date(Date.now() - getRandomInt(1, 7) * 24 * 60 * 60 * 1000) : null;
    
    // Random created_at date within last 30 days
    const daysAgo = getRandomInt(0, 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    notifications.push({
      title: template.title,
      message: template.message,
      type: category.type,
      is_read: isRead,
      read_at: readAt,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  return notifications;
}

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Fetch all drivers
 */
async function fetchAllDrivers() {
  try {
    const drivers = await DeliveryPerson.find({})
      .select('_id name phone status')
      .lean();

    return drivers;
  } catch (error) {
    console.error('❌ Error fetching drivers:', error.message);
    throw error;
  }
}

/**
 * Create notifications for a driver
 */
async function createNotificationsForDriver(driverId, notifications) {
  try {
    const notificationDocuments = notifications.map((notif) => ({
      recipient_id: new Types.ObjectId(driverId),
      recipient_role: 'delivery',
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.is_read,
      read_at: notif.read_at,
      created_at: notif.created_at,
      updated_at: notif.updated_at,
    }));

    const created = await Notification.insertMany(notificationDocuments, {
      ordered: false, // Continue inserting even if some fail
    });

    return created;
  } catch (error) {
    console.error(
      `❌ Error creating notifications for driver ${driverId}:`,
      error.message,
    );
    return [];
  }
}

/**
 * Main function to add notifications for all drivers
 */
async function addNotificationsForAllDrivers() {
  console.log('\n📱 Fetching all drivers...');
  const drivers = await fetchAllDrivers();

  if (drivers.length === 0) {
    console.log('❌ No drivers found in the database');
    return;
  }

  console.log(`✅ Found ${drivers.length} driver(s)`);
  console.log('\n📋 Driver Details:');
  drivers.forEach((driver, index) => {
    console.log(
      `   ${index + 1}. ${driver.name || 'N/A'} (${driver.phone || driver._id}) - Status: ${driver.status || 'N/A'}`,
    );
  });

  console.log(
    `\n💾 Creating 5-10 notifications for each of ${drivers.length} driver(s)...`,
  );
  console.log('='.repeat(60));

  const results = [];
  let totalCreated = 0;
  let totalFailed = 0;

  for (const driver of drivers) {
    try {
      // Random number between 5 and 10
      const notificationCount = getRandomInt(5, 10);
      
      console.log(
        `\n📨 Creating ${notificationCount} notifications for: ${driver.name || 'N/A'} (${driver.phone || driver._id})`,
      );

      const notifications = generateNotificationsForDriver(
        driver.name || 'Driver',
        notificationCount,
      );

      const created = await createNotificationsForDriver(
        driver._id.toString(),
        notifications,
      );

      if (created.length === notificationCount) {
        console.log(`   ✅ Successfully created ${created.length} notifications`);
        totalCreated += created.length;
      } else {
        console.log(
          `   ⚠️  Created ${created.length}/${notificationCount} notifications`,
        );
        totalCreated += created.length;
        totalFailed += notificationCount - created.length;
      }

      results.push({
        driverId: driver._id.toString(),
        name: driver.name || 'N/A',
        phone: driver.phone || 'N/A',
        requested: notificationCount,
        created: created.length,
        failed: notificationCount - created.length,
      });

      // Small delay between drivers to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(
        `   ❌ Error processing driver ${driver._id}:`,
        error.message,
      );
      results.push({
        driverId: driver._id.toString(),
        name: driver.name || 'N/A',
        phone: driver.phone || 'N/A',
        requested: 0,
        created: 0,
        failed: 0,
        error: error.message,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));

  const totalRequested = results.reduce((sum, r) => sum + r.requested, 0);

  console.log(`💾 Total notifications created: ${totalCreated}/${totalRequested}`);
  console.log(`❌ Total failed: ${totalFailed}/${totalRequested}`);

  // Show per-driver summary
  console.log('\n📋 Per-Driver Summary:');
  results.forEach((r) => {
    if (r.created === r.requested && r.requested > 0) {
      console.log(
        `   ✅ ${r.name} (${r.phone}): ${r.created}/${r.requested} created`,
      );
    } else if (r.created > 0) {
      console.log(
        `   ⚠️  ${r.name} (${r.phone}): ${r.created}/${r.requested} created${r.error ? ` - ${r.error}` : ''}`,
      );
    } else {
      console.log(
        `   ❌ ${r.name} (${r.phone}): 0/${r.requested} created${r.error ? ` - ${r.error}` : ''}`,
      );
    }
  });

  if (totalFailed > 0) {
    console.log('\n❌ Drivers with Failed Notifications:');
    results
      .filter((r) => r.failed > 0 || (r.requested > 0 && r.created === 0))
      .forEach((r) => {
        console.log(
          `   - ${r.name} (${r.phone}): ${r.failed} failed${r.error ? ` - ${r.error}` : ''}`,
        );
      });
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Add Notifications for All Drivers Script');
  console.log('='.repeat(60));
  console.log('ℹ️  This script creates 5-10 notifications per driver.');
  console.log('ℹ️  Notifications include order, payment, system, and promotion types.');
  console.log('='.repeat(60));

  try {
    // Connect to database
    await connectToDatabase();

    // Add notifications for all drivers
    await addNotificationsForAllDrivers();

    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

