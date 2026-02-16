# Firebase Push Notification Utility

A comprehensive Firebase Cloud Messaging (FCM) utility for sending push notifications to single or multiple devices with automatic chunking and error handling.

## Features

- ✅ Send notifications to single FCM token
- ✅ Send notifications to multiple FCM tokens with automatic chunking
- ✅ Batch processing with concurrency control
- ✅ Automatic retry mechanism for failed tokens
- ✅ Topic-based notifications
- ✅ Comprehensive error handling and logging
- ✅ TypeScript support with full type definitions
- ✅ Standalone utility (no NestJS dependency injection required)

## Installation

The Firebase Admin SDK is already installed. Make sure you have the required dependencies:

```bash
npm install firebase-admin
```

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
# OR use individual fields:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Legacy FCM Configuration (optional)
FCM_SERVER_KEY=your-legacy-server-key
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file and use it as `FIREBASE_SERVICE_ACCOUNT_KEY`

## Usage

### Basic Usage

```typescript
import {
  pushNotificationUtil,
  PushNotificationPayload,
} from './helper/push-notification.helper';

export class YourService {
  async sendNotification() {
    const payload: PushNotificationPayload = {
      title: 'Hello World',
      body: 'This is a test notification',
      data: {
        type: 'test',
        userId: '123',
      },
    };

    // Send to single token
    const result = await pushNotificationUtil.sendToSingleToken(
      'fcm-token-here',
      payload,
    );

    // Send to multiple tokens
    const tokens = ['token1', 'token2', 'token3'];
    const batchResult = await pushNotificationUtil.sendToMultipleTokens(
      tokens,
      payload,
    );
  }
}
```

### Practical Examples

```typescript
import { pushNotificationUtil } from './helper/push-notification.helper';

export class OrderService {
  async updateOrderStatus(
    orderId: string,
    status: string,
    userFcmToken: string,
  ) {
    // Update order in database...

    // Send notification to user
    await pushNotificationUtil.sendToSingleToken(userFcmToken, {
      title: 'Order Status Update',
      body: `Your order #${orderId} status has been updated to: ${status}`,
      data: { orderId, status, type: 'order_update' },
    });
  }

  async sendPromotionalMessage(allUserTokens: string[]) {
    await pushNotificationUtil.sendToMultipleTokens(allUserTokens, {
      title: 'Special Offer!',
      body: 'Get 20% off on your next order',
      data: { promoCode: 'SAVE20', type: 'promotional' },
    });
  }
}
```

### Topic-based Notifications

```typescript
// Subscribe users to topics
await pushNotificationUtil.subscribeToTopic(
  ['token1', 'token2'],
  'city-mumbai',
);

// Send to topic
await pushNotificationUtil.sendToTopic('city-mumbai', {
  title: 'Weather Alert',
  body: 'Heavy rain expected in Mumbai today',
  data: { type: 'weather', severity: 'high' },
});
```

## API Reference

### pushNotificationUtil

#### `sendToSingleToken(token: string, payload: PushNotificationPayload): Promise<PushNotificationResult>`

Send notification to a single FCM token.

**Parameters:**

- `token`: FCM token string
- `payload`: Notification payload object

**Returns:** Promise resolving to `PushNotificationResult`

#### `sendToMultipleTokens(tokens: string[], payload: PushNotificationPayload): Promise<BatchPushNotificationResult>`

Send notification to multiple FCM tokens with automatic chunking.

**Parameters:**

- `tokens`: Array of FCM tokens
- `payload`: Notification payload object

**Returns:** Promise resolving to `BatchPushNotificationResult`

#### `sendToTopic(topic: string, payload: PushNotificationPayload): Promise<string>`

Send notification to a topic.

**Parameters:**

- `topic`: Topic name
- `payload`: Notification payload object

**Returns:** Promise resolving to message ID

#### `subscribeToTopic(tokens: string[], topic: string): Promise<TopicManagementResponse>`

Subscribe tokens to a topic.

#### `unsubscribeFromTopic(tokens: string[], topic: string): Promise<TopicManagementResponse>`

Unsubscribe tokens from a topic.

### Types

#### `PushNotificationPayload`

```typescript
interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}
```

#### `PushNotificationResult`

```typescript
interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  token?: string;
}
```

#### `BatchPushNotificationResult`

```typescript
interface BatchPushNotificationResult {
  successCount: number;
  failureCount: number;
  results: PushNotificationResult[];
  errors: string[];
}
```

## Configuration Options

The service includes several configurable options:

- `maxTokensPerBatch`: Maximum tokens per batch (default: 500)
- `maxConcurrentBatches`: Maximum concurrent batch requests (default: 3)
- `delayBetweenBatches`: Delay between batches in milliseconds (default: 100ms)

## Error Handling

The service includes comprehensive error handling:

- Automatic retry for failed batch requests
- Individual token processing as fallback
- Detailed error logging
- Graceful handling of invalid tokens

## Best Practices

1. **Token Management**: Always validate and deduplicate FCM tokens before sending
2. **Batch Size**: Use appropriate batch sizes to balance performance and reliability
3. **Error Handling**: Always handle errors and log failed notifications
4. **Rate Limiting**: The service includes built-in rate limiting to prevent API quota issues
5. **Topics**: Use topics for broadcasting to large groups of users

## Examples

### Order Status Updates

```typescript
// In your order service
async updateOrderStatus(orderId: string, status: string) {
  const order = await this.orderRepository.findById(orderId);

  if (order.userFcmToken) {
    await this.notificationService.sendOrderStatusUpdate(
      order.userFcmToken,
      orderId,
      status
    );
  }
}
```

### Delivery Notifications

```typescript
// In your delivery service
async assignDeliveryPerson(orderId: string, deliveryPersonId: string) {
  const deliveryPerson = await this.deliveryPersonRepository.findById(deliveryPersonId);
  const order = await this.orderRepository.findById(orderId);

  if (order.userFcmToken) {
    await this.notificationService.sendDeliveryNotification(
      order.userFcmToken,
      orderId,
      deliveryPerson.name
    );
  }
}
```

### Promotional Campaigns

```typescript
// Send promotional notification to all users
async sendPromotionalCampaign() {
  const allUsers = await this.userRepository.findAll();
  const fcmTokens = allUsers
    .filter(user => user.fcmToken)
    .map(user => user.fcmToken);

  await this.notificationService.sendPromotionalNotification(
    fcmTokens,
    'New Year Special!',
    'Get 30% off on all services',
    'NEWYEAR30'
  );
}
```

## Troubleshooting

### Common Issues

1. **Firebase initialization error**: Check your service account key configuration
2. **Invalid tokens**: Ensure FCM tokens are valid and not expired
3. **Rate limiting**: Reduce batch size or increase delays between requests
4. **Permission errors**: Ensure your service account has FCM permissions

### Debugging

Enable debug logging by setting the log level in your NestJS configuration:

```typescript
// In main.ts
app.useLogger(['log', 'error', 'warn', 'debug']);
```

## License

This service is part of the laundry backend application.
