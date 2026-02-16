# AWS SES Email Integration

A comprehensive AWS Simple Email Service (SES) integration for sending transactional emails in the laundry service backend.

## Features

- ✅ Send custom emails with HTML and text content
- ✅ Send OTP verification emails
- ✅ Send order confirmation emails
- ✅ Send order status update emails
- ✅ Support for multiple recipients (To, CC, BCC)
- ✅ Reply-to address configuration
- ✅ Comprehensive error handling
- ✅ TypeScript support with full type definitions
- ✅ Standalone utility (no NestJS dependency injection required)

## Installation

The AWS SES SDK is already installed. The package `@aws-sdk/client-ses` is included in the project dependencies.

## AWS SES Setup

### 1. AWS Console Setup

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Simple Email Service (SES)**
3. Verify your email address or domain:
   - For testing: Verify individual email addresses
   - For production: Verify your domain (recommended)
4. Move out of SES Sandbox (if needed):
   - By default, SES is in sandbox mode
   - You can only send to verified email addresses in sandbox
   - Request production access to send to any email address

### 2. Create IAM User for SES

1. Go to **IAM** in AWS Console
2. Create a new user with programmatic access
3. Attach the policy `AmazonSESFullAccess` (or create a custom policy with minimum required permissions)
4. Save the **Access Key ID** and **Secret Access Key**

### 3. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# AWS SES Configuration
SES_REGION=ap-south-1
SES_ACCESS_KEY_ID=your-access-key-id
SES_SECRET_ACCESS_KEY=your-secret-access-key
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Laundry Service
```

**Environment Variables:**

- `SES_REGION`: AWS region where your SES is configured (default: `ap-south-1`)
- `SES_ACCESS_KEY_ID`: AWS IAM user access key ID
- `SES_SECRET_ACCESS_KEY`: AWS IAM user secret access key
- `SES_FROM_EMAIL`: Verified sender email address (required)
- `SES_FROM_NAME`: Display name for sender (optional, default: "Laundry Service")

## Usage

### Basic Usage

```typescript
import { emailHelper } from './helper';

// Send a custom email
const result = await emailHelper.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Laundry Service',
  htmlBody: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  textBody: 'Welcome! Thank you for joining us.',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

### Send OTP Email

```typescript
import { emailHelper } from './helper';

const result = await emailHelper.sendOTPEmail(
  'user@example.com',
  '123456'
);

if (result.success) {
  console.log('OTP email sent successfully');
}
```

### Send Order Confirmation Email

```typescript
import { emailHelper } from './helper';

const result = await emailHelper.sendOrderConfirmationEmail(
  'user@example.com',
  {
    orderNumber: 1001,
    orderId: '507f1f77bcf86cd799439011',
    totalAmount: 250.50,
    currency: 'INR',
    items: [
      { name: 'Shirts', quantity: 5, price: 150.00 },
      { name: 'Pants', quantity: 3, price: 100.50 },
    ],
    pickupAddress: '123 Main St, City, State 12345',
    deliveryAddress: '456 Oak Ave, City, State 12345',
  }
);
```

### Send Order Status Update Email

```typescript
import { emailHelper } from './helper';

const result = await emailHelper.sendOrderStatusUpdateEmail(
  'user@example.com',
  {
    orderNumber: 1001,
    status: 'out_for_delivery',
    message: 'Your order is on the way!', // Optional custom message
  }
);
```

### Advanced Usage - Multiple Recipients

```typescript
import { emailHelper } from './helper';

const result = await emailHelper.sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  subject: 'Team Update',
  htmlBody: '<p>This is a team update.</p>',
  textBody: 'This is a team update.',
  replyTo: 'support@example.com',
});
```

## Integration Examples

### In User Service (OTP)

```typescript
import { emailHelper } from '../helper';

// In your OTP generation/sending logic
async sendOTP(phoneNumber: string, email?: string) {
  const otp = this.generateOTP();
  
  // Send OTP via SMS (existing logic)
  // ...
  
  // Send OTP via Email if email is provided
  if (email) {
    await emailHelper.sendOTPEmail(email, otp);
  }
  
  return otp;
}
```

### In Order Service (Order Confirmation)

```typescript
import { emailHelper } from '../helper';

async createOrder(orderData: any, userEmail?: string) {
  const order = await this.orderModel.create(orderData);
  
  // Send order confirmation email
  if (userEmail) {
    await emailHelper.sendOrderConfirmationEmail(userEmail, {
      orderNumber: order.order_number,
      orderId: order._id.toString(),
      totalAmount: order.total_amount,
      currency: order.currency,
      items: order.items.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        price: item.item_price,
      })),
      pickupAddress: order.user_address?.formatted_address,
      deliveryAddress: order.vendor_address?.formatted_address,
    });
  }
  
  return order;
}
```

### In Order Service (Status Updates)

```typescript
import { emailHelper } from '../helper';

async updateOrderStatus(orderId: string, status: string) {
  const order = await this.orderModel.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  ).populate('user_id');
  
  // Send status update email
  if (order.user_id?.email) {
    await emailHelper.sendOrderStatusUpdateEmail(
      order.user_id.email,
      {
        orderNumber: order.order_number,
        status: order.status,
      }
    );
  }
  
  return order;
}
```

## Error Handling

The email helper returns a result object with success status:

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string;  // AWS SES message ID if successful
  error?: string;      // Error message if failed
}
```

Always check the `success` field before assuming the email was sent:

```typescript
const result = await emailHelper.sendEmail({...});

if (!result.success) {
  // Handle error - log it, retry, or notify admin
  console.error('Email failed:', result.error);
  // Don't throw - email failures shouldn't break the main flow
}
```

## Best Practices

1. **Don't block main operations**: Email sending should not block critical operations. Handle errors gracefully.

2. **Log email results**: Always log email sending results for debugging and auditing.

3. **Use verified sender**: Always use a verified email address as the sender.

4. **Handle bounces**: Set up SNS notifications for bounces and complaints in AWS SES.

5. **Rate limiting**: AWS SES has rate limits. For high-volume sending, consider:
   - Using SES sending quotas
   - Implementing retry logic with exponential backoff
   - Using SES configuration sets for better tracking

6. **Template management**: For production, consider using AWS SES templates or a template engine for email content.

## Testing

### Test Email Sending

```typescript
// Test basic email
const result = await emailHelper.sendEmail({
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  htmlBody: '<h1>Test</h1><p>This is a test email.</p>',
  textBody: 'Test: This is a test email.',
});

console.log('Test result:', result);
```

### Verify Configuration

The email helper will throw an error if credentials are not configured:

```typescript
// This will throw if SES_ACCESS_KEY_ID or SES_SECRET_ACCESS_KEY is missing
await emailHelper.sendEmail({...});
```

## Troubleshooting

### Common Issues

1. **"SES credentials not configured"**
   - Check that `SES_ACCESS_KEY_ID` and `SES_SECRET_ACCESS_KEY` are set in environment variables

2. **"SES_FROM_EMAIL not configured"**
   - Set the `SES_FROM_EMAIL` environment variable to a verified email address

3. **"Email address is not verified"**
   - Verify the sender email address in AWS SES console
   - If in sandbox mode, verify recipient email addresses too

4. **"Message rejected"**
   - Check AWS SES sending limits
   - Verify domain/email in AWS SES
   - Check spam filters

5. **"Access Denied"**
   - Verify IAM user has SES permissions
   - Check IAM policy includes `ses:SendEmail` permission

## AWS SES Limits

- **Sandbox Mode**: 
  - 200 emails per day
  - 1 email per second
  - Can only send to verified email addresses

- **Production Mode**:
  - Higher limits (request increase if needed)
  - Can send to any email address
  - Still subject to rate limits

## Related Files

- Configuration: `src/config/ses.config.ts`
- Helper: `src/helper/email.helper.ts`
- Exports: `src/helper/index.ts`

## Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)
- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)

