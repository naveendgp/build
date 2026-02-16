# Notifications Module Analysis

## Overview

The laundry backend system includes a comprehensive notification system that supports both push notifications (via Firebase Cloud Messaging) and in-app notifications stored in the database.

## Architecture

### Components

1. **Push Notification Helper** (`src/helper/push-notification.helper.ts`)
   - Modern Firebase Admin SDK implementation
   - Supports single token, multiple tokens, and topic-based notifications
   - Automatic chunking and batch processing
   - Comprehensive error handling

2. **Legacy FCM Helper** (`src/helper/fcm.helper.ts`)
   - Legacy implementation using axios and FCM REST API
   - Simpler interface but less feature-rich

3. **Notification Schema** (`src/schemas/notification.schema.ts`)
   - Stores notifications in MongoDB
   - Supports different notification types (order, payment, system, promotion)
   - Tracks read/unread status
   - Indexed for performance

4. **User Schema** (`src/schemas/user.schema.ts`)
   - Stores FCM tokens per user (`fcm_token` field)
   - Updated during login/OTP verification

## Notification Flow

### 1. User Registration/Login
- User provides FCM token during OTP verification
- Token is stored in the User document
- Token is updated on each login

### 2. Sending Notifications

#### Push Notifications (Real-time)
```typescript
import { pushNotificationUtil } from './helper/push-notification.helper';

await pushNotificationUtil.sendToSingleToken(userFcmToken, {
  title: 'Order Update',
  body: 'Your order has been processed',
  data: { orderId: '123', type: 'order_update' }
});
```

#### Database Notifications (In-app)
```typescript
await notificationModel.create({
  recipient_id: userId,
  recipient_role: 'user',
  title: 'Order Update',
  message: 'Your order has been processed',
  type: 'order',
  order_id: orderId,
  is_read: false
});
```

### 3. Retrieving Notifications
- Users fetch notifications via `/user/notifications` endpoint
- Notifications are automatically marked as read when fetched
- Supports pagination

## Notification Types

### Order Notifications
- Order placed
- Order status updates
- Order assigned to delivery person
- Order out for delivery
- Order delivered
- Order cancelled

### Payment Notifications
- Payment successful
- Payment failed
- Refund processed
- Wallet balance updated

### System Notifications
- Account updates
- Service announcements
- Maintenance notifications
- Test notifications

### Promotion Notifications
- Special offers
- Discount codes
- Loyalty points updates
- Referral bonuses

## Implementation Details

### Firebase Configuration

The system uses Firebase Admin SDK for push notifications:

**Environment Variables Required:**
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
# OR
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### Database Schema

**Notification Document:**
```typescript
{
  recipient_id: ObjectId,        // User/Vendor/Delivery person ID
  recipient_role: 'user' | 'vendor' | 'delivery',
  title: string,
  message: string,
  type: 'order' | 'payment' | 'system' | 'promotion',
  order_id?: ObjectId,            // Optional reference to order
  is_read: boolean,
  read_at?: Date,
  metadata?: object,            // Additional data
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
- `{ recipient_id: 1, recipient_role: 1, created_at: -1 }` - For fetching notifications
- `{ recipient_id: 1, recipient_role: 1, is_read: 1 }` - For unread count queries

### Push Notification Features

1. **Single Token Sending**
   - Direct notification to one device
   - Returns success/failure status

2. **Multiple Token Sending**
   - Batch processing with automatic chunking (500 tokens per batch)
   - Concurrent batch processing (max 3 concurrent)
   - Automatic retry for failed tokens
   - Detailed success/failure reporting

3. **Topic-based Notifications**
   - Subscribe users to topics (e.g., 'city-mumbai')
   - Send to all subscribers of a topic
   - Useful for broadcast messages

4. **Error Handling**
   - Invalid tokens are filtered out
   - Failed notifications are logged
   - Individual token failures don't stop batch processing
   - Automatic fallback to individual sending if batch fails

## Current Usage in Codebase

### User Service
- Notifications are created when orders are placed/updated
- Users can retrieve their notifications via `getNotifications()`
- Notifications are marked as read when fetched

### Delivery Service
- Delivery persons receive notifications for order assignments
- Real-time tracking updates via WebSocket

### Vendor Service
- Vendors receive notifications for new orders
- Order status updates

## Testing

### Test Notification Script

A script has been created to send test notifications:
```bash
node scripts/send-test-notifications.js
```

**Features:**
- Sends test notifications to predefined user IDs
- Validates FCM tokens before sending
- Saves notifications to database
- Provides detailed success/failure reports

**Default Test Users:**
- `68ff34fd29cf1fc27ad63953`
- `6908369ccd26926625f1385a`
- `690840c3720d953f87f77e82`
- `69097d9643acc5c5585d2bb0`
- `690a0bcf43acc5c5585d3954`
- `690b26f0d6f1a6a6959a319e`
- `690b2900d6f1a6a6959a3233`

## Best Practices

1. **Always Save to Database**
   - Even if push notification fails, save to database
   - Users can see notifications in-app even if push fails

2. **Handle Missing FCM Tokens**
   - Check if user has FCM token before sending
   - Don't fail the entire operation if some users lack tokens

3. **Use Appropriate Notification Types**
   - Use 'order' for order-related notifications
   - Use 'payment' for payment-related notifications
   - Use 'system' for system announcements
   - Use 'promotion' for marketing messages

4. **Include Metadata**
   - Add relevant data in `metadata` field
   - Include order IDs, payment IDs, etc. for deep linking

5. **Rate Limiting**
   - Add delays between batch sends
   - Respect Firebase rate limits (500 tokens per batch)

## Future Enhancements

1. **Notification Preferences**
   - Allow users to opt-in/opt-out of notification types
   - Respect user preferences when sending

2. **Scheduled Notifications**
   - Support for delayed/scheduled notifications
   - Use cron jobs for time-based notifications

3. **Notification Templates**
   - Create reusable notification templates
   - Support for localization

4. **Analytics**
   - Track notification open rates
   - Monitor delivery success rates
   - Analyze user engagement

5. **Rich Notifications**
   - Support for images in notifications
   - Action buttons in notifications
   - Deep linking to specific app screens

## Troubleshooting

### Common Issues

1. **Firebase Not Initialized**
   - Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
   - Verify Firebase credentials are valid

2. **Invalid FCM Tokens**
   - Tokens expire or become invalid
   - Script validates tokens before sending
   - Failed tokens are logged for review

3. **Database Connection Issues**
   - Check MongoDB connection string
   - Verify network connectivity
   - Check database permissions

4. **Rate Limiting**
   - Firebase has rate limits
   - Script includes delays between batches
   - Consider using topics for broadcast messages

## API Endpoints

### User Notifications
- `GET /user/notifications` - Get user notifications (paginated)
  - Query params: `page`, `limit`
  - Automatically marks notifications as read

## Related Files

- `src/helper/push-notification.helper.ts` - Push notification utility
- `src/helper/fcm.helper.ts` - Legacy FCM helper
- `src/schemas/notification.schema.ts` - Notification database schema
- `src/schemas/user.schema.ts` - User schema (contains FCM token)
- `src/user/user.service.ts` - User service (notification retrieval)
- `scripts/send-test-notifications.js` - Test notification script
- `docs/PUSH_NOTIFICATIONS.md` - Detailed push notification documentation

