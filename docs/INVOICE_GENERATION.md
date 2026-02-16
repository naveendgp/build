# Invoice Generation System

## Overview

This document describes the invoice generation system that automatically creates PDF invoices for delivered orders and stores them in AWS S3.

## Implementation Details

### 1. Invoice Helper (`src/helper/invoice.helper.ts`)

The invoice helper is a standalone utility class that:

- Generates professional PDF invoices using PDFKit
- Fetches order, user, and vendor data
- Creates formatted invoices with all order details
- Uploads invoices to S3 with organized folder structure
- Returns the S3 URL for the generated invoice

#### Key Features:

- **Professional Layout**: Clean, well-formatted invoice with proper sections
- **Complete Information**: Includes all order details, items, pricing breakdown, and payment status
- **S3 Storage**: Organized by year/month for easy management
- **Error Handling**: Comprehensive error handling with detailed logging

#### Invoice Sections:

1. **Header**: Invoice title and vendor name
2. **Invoice Info**: Invoice number, order number, dates
3. **Party Details**: Customer and vendor information with addresses
4. **Items Table**: Detailed list of all order items with quantities and prices
5. **Payment Summary**: Subtotal, discounts, fees, GST, and total amount
6. **Footer**: Terms and conditions

### 2. Order Schema Update

Added `invoice_url` field to the Order schema:

```typescript
@Prop({ trim: true })
invoice_url?: string;
```

This field stores the S3 URL of the generated invoice.

### 3. Integration with Delivery Service

The invoice generation is automatically triggered when an order status changes to `'delivered'`:

```typescript
// In DeliveryService.updateOrderStatus() - case 7 (Delivered)
order.status = 'delivered';
order.status_timestamps.set('delivered_at', new Date());
await order.save();

// Generate invoice asynchronously (don't block the response)
this.generateInvoiceForOrder(order._id.toString()).catch((error) => {
  console.error('Error generating invoice for order:', order._id, error);
});
```

**Key Points:**

- Invoice generation runs asynchronously to avoid blocking the API response
- Errors are logged but don't affect the order delivery status
- Invoice URL is updated in the order document after successful generation

### 4. S3 Storage Structure

Invoices are stored in S3 with the following structure:

```
invoices/
  └── YYYY/
      └── MM/
          └── invoice-{orderNumber}-{orderId}.pdf
```

Example: `invoices/2024/12/invoice-123-507f1f77bcf86cd799439011.pdf`

### 5. Invoice Content

#### Invoice Number Format

- Format: `INV-{order_number}`
- Example: `INV-123`

#### Included Information:

- **Order Details**: Order number, invoice number, order date, invoice date
- **Customer Info**: Name, email, phone, delivery address
- **Vendor Info**: Shop name, email, phone, address
- **Items**: Service name, item name, quantity, unit price, total price
- **Payment Breakdown**:
  - Subtotal
  - Offer discount (if applicable)
  - Delivery fee
  - GST
  - Platform fee
  - Total amount
- **Payment Status**: Paid/Pending/Refunded
- **Express Badge**: Visual indicator for express deliveries

## Usage

### Automatic Generation

Invoices are automatically generated when an order is marked as delivered. No manual intervention required.

### Manual Generation (if needed)

```typescript
import { invoiceHelper } from '../helper/invoice.helper';

const result = await invoiceHelper.generateInvoice(
  orderId,
  orderModel,
  userModel,
  vendorModel,
);

if (result.success) {
  console.log('Invoice URL:', result.invoiceUrl);
} else {
  console.error('Error:', result.error);
}
```

### Accessing Invoice URL

The invoice URL is stored in the order document:

```typescript
const order = await orderModel.findById(orderId);
console.log('Invoice URL:', order.invoice_url);
```

## API Response

When fetching an order, the invoice URL is included:

```json
{
  "order": {
    "_id": "...",
    "order_number": 123,
    "status": "delivered",
    "invoice_url": "https://production-fsp.s3.ap-south-1.amazonaws.com/invoices/2024/12/invoice-123-507f1f77bcf86cd799439011.pdf",
    ...
  }
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Order Not Found**: Returns error if order doesn't exist
2. **Order Not Delivered**: Only generates invoices for delivered orders
3. **User/Vendor Not Found**: Validates that related entities exist
4. **PDF Generation Errors**: Catches and logs PDF creation errors
5. **S3 Upload Errors**: Handles S3 upload failures gracefully

All errors are logged to the console for debugging.

## Dependencies

- **pdfkit**: PDF generation library
- **@aws-sdk/client-s3**: AWS S3 SDK (already installed)
- **@types/pdfkit**: TypeScript types for PDFKit

## Configuration

S3 configuration is managed in `src/config/database.config.ts`:

```typescript
S3: {
  REGION: 'ap-south-1',
  BUCKET: 'production-fsp',
  ACCESS_KEY_ID: '...',
  SECRET_ACCESS_KEY: '...'
}
```

## Testing

To test invoice generation:

1. **Create a test order** and mark it as delivered
2. **Check the order document** for `invoice_url`` field
3. **Verify the PDF** is accessible via the S3 URL
4. **Check logs** for any errors during generation

## Future Enhancements

Potential improvements:

1. **Email Integration**: Automatically email invoices to customers
2. **Invoice Templates**: Support for multiple invoice templates
3. **Invoice History**: Track invoice generation history
4. **Retry Mechanism**: Retry failed invoice generations
5. **Invoice Regeneration**: Allow manual regeneration of invoices
6. **Multi-language Support**: Support for multiple languages
7. **Tax Invoice Format**: GST-compliant invoice format for India

## Troubleshooting

### Invoice Not Generated

1. Check if order status is `'delivered'`
2. Verify S3 credentials are correct
3. Check console logs for errors
4. Ensure order, user, and vendor data exists

### Invoice URL Not Updated

1. Check if invoice generation completed successfully
2. Verify database connection
3. Check for any validation errors

### PDF Format Issues

1. Verify PDFKit is installed correctly
2. Check for font-related errors
3. Ensure all order data is valid

## Security Considerations

- Invoices contain sensitive customer and vendor information
- S3 bucket should have appropriate access controls
- Consider implementing signed URLs for invoice access
- Ensure invoices are only accessible to authorized users

## Performance

- Invoice generation runs asynchronously to avoid blocking API responses
- PDF generation is optimized for A4 format
- S3 uploads use efficient buffer streaming
- Typical generation time: 1-3 seconds
