#!/usr/bin/env node

/**
 * Store Test Notifications Script
 * Stores test notifications in the database for specified user IDs
 * (Does not send push notifications via Firebase)
 *
 * Usage:
 *   node scripts/send-test-notifications.js
 *   node scripts/send-test-notifications.js --user-ids "id1,id2,id3"
 */

const mongoose = require('mongoose');
const path = require('path');

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, continue without it
  console.log('ℹ️  dotenv not found, using environment variables directly');
}

// MongoDB connection URL (from database.config.ts)
const MONGODB_URL =
  process.env.MONGODB_URL ||
  'mongodb://prodmongo:prodpassword%40123@13.201.184.91:27017/laundry_backend?authSource=admin';

// Test user IDs provided
const DEFAULT_USER_IDS = [
  '68ff34fd29cf1fc27ad63953',
  '6908369ccd26926625f1385a',
  '690840c3720d953f87f77e82',
  '69097d9643acc5c5585d2bb0',
  '690a0bcf43acc5c5585d3954',
  '690b26f0d6f1a6a6959a319e',
  '690b2900d6f1a6a6959a3233',
];

// User Schema
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: { type: String, required: true, unique: true },
    gender: String,
    dob: Date,
    addresses: [mongoose.Schema.Types.Mixed],
    wallet: mongoose.Schema.Types.Mixed,
    loyalty_points: { type: Number, default: 0 },
    preferences: mongoose.Schema.Types.Mixed,
    referral_code: String,
    referred_by: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    fcm_token: String,
    session_token: String,
  },
  { timestamps: true },
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

const User = mongoose.model('User', UserSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

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
 * Fetch users by their IDs
 */
async function fetchUsers(userIds) {
  try {
    const users = await User.find({
      _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select('_id name phone email fcm_token status')
      .lean();

    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    throw error;
  }
}

/**
 * Save notification to database
 */
async function saveNotification(userId, payload) {
  try {
    const notification = await Notification.create({
      recipient_id: new mongoose.Types.ObjectId(userId),
      recipient_role: 'user',
      title: payload.title,
      message: payload.body,
      type: payload.data?.type || 'system',
      metadata: payload.data || {},
      is_read: false,
    });
    return notification;
  } catch (error) {
    console.error(
      `❌ Error saving notification for user ${userId}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Store test notifications in database for users (2 notifications per user)
 */
async function storeTestNotifications(userIds) {
  console.log('\n📱 Fetching users...');
  const users = await fetchUsers(userIds);

  if (users.length === 0) {
    console.log('❌ No users found with the provided IDs');
    return;
  }

  console.log(`✅ Found ${users.length} user(s)`);
  console.log('\n📋 User Details:');
  users.forEach((user) => {
    console.log(`   - ${user.name || 'N/A'} (${user.phone || user._id})`);
  });

  console.log(
    `\n💾 Storing 2 notifications for each of ${users.length} user(s)...`,
  );
  console.log('='.repeat(60));

  const results = [];

  // Define 2 different notification payloads
  const notificationPayloads = [
    {
      title: '🧪 Test Notification #1',
      body: 'This is the first test notification stored in the database. This notification was created by the test script.',
      data: {
        type: 'system',
        timestamp: new Date().toISOString(),
        source: 'test-script',
        notificationNumber: '1',
      },
    },
    {
      title: '🧪 Test Notification #2',
      body: 'This is the second test notification stored in the database. This notification was created by the test script.',
      data: {
        type: 'system',
        timestamp: new Date().toISOString(),
        source: 'test-script',
        notificationNumber: '2',
      },
    },
  ];

  for (const user of users) {
    try {
      console.log(
        `\n📨 Storing notifications for: ${user.name || 'N/A'} (${user.phone || user._id})`,
      );

      let savedCount = 0;
      let failedCount = 0;

      // Create 2 notifications for each user
      for (let i = 0; i < 2; i++) {
        const payload = notificationPayloads[i];

        // Save notification to database
        const savedNotification = await saveNotification(
          user._id.toString(),
          payload,
        );

        if (savedNotification) {
          console.log(`   ✅ Notification #${i + 1} saved to database`);
          savedCount++;
        } else {
          console.log(`   ❌ Failed to save notification #${i + 1}`);
          failedCount++;
        }

        // Small delay between notifications
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      results.push({
        userId: user._id.toString(),
        name: user.name || 'N/A',
        phone: user.phone || 'N/A',
        savedCount,
        failedCount,
        totalNotifications: 2,
      });
    } catch (error) {
      console.error(`   ❌ Error processing user ${user._id}:`, error.message);
      results.push({
        userId: user._id.toString(),
        name: user.name || 'N/A',
        phone: user.phone || 'N/A',
        savedCount: 0,
        failedCount: 2,
        totalNotifications: 2,
        error: error.message,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));

  const totalSaved = results.reduce((sum, r) => sum + r.savedCount, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);
  const totalNotifications = users.length * 2;

  console.log(
    `💾 Total notifications saved: ${totalSaved}/${totalNotifications}`,
  );
  console.log(`❌ Total failed: ${totalFailed}/${totalNotifications}`);

  // Show per-user summary
  console.log('\n📋 Per-User Summary:');
  results.forEach((r) => {
    if (r.savedCount === 2) {
      console.log(`   ✅ ${r.name} (${r.phone}): 2/2 saved`);
    } else {
      console.log(
        `   ⚠️  ${r.name} (${r.phone}): ${r.savedCount}/2 saved${r.error ? ` - ${r.error}` : ''}`,
      );
    }
  });

  if (totalFailed > 0) {
    console.log('\n❌ Users with Failed Notifications:');
    results
      .filter((r) => r.failedCount > 0)
      .forEach((r) => {
        console.log(
          `   - ${r.name} (${r.phone}): ${r.failedCount} failed${r.error ? ` - ${r.error}` : ''}`,
        );
      });
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Store Test Notifications Script');
  console.log('='.repeat(60));
  console.log('ℹ️  This script stores notifications in the database only.');
  console.log('ℹ️  Push notifications via Firebase are NOT sent.');
  console.log('='.repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  let userIds = DEFAULT_USER_IDS;

  if (args.includes('--user-ids')) {
    const index = args.indexOf('--user-ids');
    if (args[index + 1]) {
      userIds = args[index + 1].split(',').map((id) => id.trim());
    }
  }

  console.log(`📝 Target User IDs: ${userIds.length}`);
  userIds.forEach((id, index) => {
    console.log(`   ${index + 1}. ${id}`);
  });

  try {
    // Connect to database
    await connectToDatabase();

    // Store notifications (2 per user)
    await storeTestNotifications(userIds);

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
