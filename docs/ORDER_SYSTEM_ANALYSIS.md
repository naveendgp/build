# Order System - End-to-End Analysis

## Table of Contents
1. [Order Schema Structure](#order-schema-structure)
2. [Order Lifecycle & Status Flow](#order-lifecycle--status-flow)
3. [Order Creation (User Module)](#order-creation-user-module)
4. [Order Management (Vendor Module)](#order-management-vendor-module)
5. [Order Delivery (Delivery Module)](#order-delivery-delivery-module)
6. [Order Tracking & Cron Jobs](#order-tracking--cron-jobs)
7. [Order Queries & Retrieval](#order-queries--retrieval)
8. [Integration Points](#integration-points)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Order Schema Structure

### Location
- **File**: `src/schemas/order.schema.ts`
- **Type**: Mongoose Schema (NestJS)

### Core Classes

#### 1. OrderItem
```typescript
@Schema({ _id: false })
export class OrderItem {
  service_id: Types.ObjectId      // Reference to service
  service_name: string              // Service name (denormalized)
  item_id: Types.ObjectId           // Reference to item
  item_name: string                // Item name (denormalized)
  quantity: number                  // Quantity ordered
  price_per_item?: number          // Price at time of order
  total_price?: number             // Total for this item
}
```

#### 2. PaymentDetails
```typescript
export class PaymentDetails {
  amount_to_vendor: number          // Amount vendor receives
  amount_to_platform: number      // Platform commission
  delivery_fee: number             // Delivery charges
  gst: number                      // GST amount
  isOfferApplied: boolean          // Whether offer was applied
  offerDiscountAmount: number     // Discount from offer
  totalPayableAmount: number       // Final payable amount
}
```

#### 3. riderDetails
```typescript
export class riderDetails {
  name: string                     // Delivery person name
  phone: string                    // Delivery person phone
}
```

#### 4. Order (Main Schema)
```typescript
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Order {
  // Identifiers
  order_number: number             // Unique per vendor, auto-incremented
  status_type: number              // Numeric status indicator (default: 1)
  
  // Relationships
  user_id: Types.ObjectId          // Reference to User (required)
  vendor_id: Types.ObjectId        // Reference to Vendor (required)
  driver_id_1?: Types.ObjectId     // First driver (pickup from user)
  driver_id_2?: Types.ObjectId     // Second driver (delivery to user)
  
  // Addresses
  vendor_address: VendorAddress   // Vendor location (required)
  user_address: UserAddress        // User pickup/delivery location (required)
  
  // Delivery Person Info
  rider?: riderDetails            // Current rider details
  
  // Status Management
  status: OrderStatus             // Current order status
  status_timestamps?: Map<...>     // Timestamps for each status change
  
  // Timing
  is_express: boolean             // Express delivery flag
  pickup_scheduled_at?: Date      // Scheduled pickup time
  picked_up_at?: Date            // Actual pickup time
  delivered_to_vendor_at?: Date  // When delivered to vendor
  expected_delivery_date?: Date  // Expected delivery date
  delivered_to_user_at?: Date    // When delivered to user
  
  // Payment
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_id?: Types.ObjectId     // Reference to Payment
  payment_details: PaymentDetails  // Payment breakdown
  total_amount: number            // Total order amount
  currency: string                // Currency (default: 'INR')
  
  // Additional
  order_notes?: string           // User notes
  rating_given: boolean          // Whether user has rated
  items: OrderItem[]             // Order items array
  user_otp: number               // OTP for user verification (4 digits)
  vendor_otp: number              // OTP for vendor verification (4 digits)
  
  // Timestamps
  created_at?: Date
  updated_at?: Date
}
```

### Order Status Enum
```typescript
type OrderStatus =
  | 'pending'           // Initial state, waiting for vendor acceptance
  | 'accepted'          // Vendor accepted the order
  | 'rejected'          // Vendor rejected the order
  | 'unaccepted'        // Auto-rejected after timeout (5 minutes)
  | 'verified'          // Driver verified order before pickup
  | 'picked_up'         // Driver picked up from user
  | 'processing'        // Order at vendor, being processed
  | 'processed'         // Vendor completed processing
  | 'out_for_delivery' // Driver picked up from vendor, delivering
  | 'delivered'         // Delivered to user
  | 'cancelled'         // Order cancelled
  | 'driver_assigned'   // Driver assigned (legacy)
```

### Status Timestamps Map
Tracks when each status was reached:
- `processing_at`
- `processed_at`
- `cancelled_at`
- `delivered_at`
- `picked_up_at`
- `accepted_at`
- `rejected_at`
- `unaccepted_at`
- `out_for_delivery_at`
- `verified_at`
- `driver_assigned_at`
- `paid_at`

---

## Order Lifecycle & Status Flow

### Complete Order Flow

```
1. pending
   ↓ (Vendor accepts)
2. accepted
   ↓ (Cron job finds available drivers)
   ↓ (Driver accepts)
3. verified (Driver verifies before pickup)
   ↓ (Driver picks up with OTP)
4. picked_up
   ↓ (Driver delivers to vendor)
5. processing
   ↓ (Vendor marks complete)
6. processed
   ↓ (Cron job finds available drivers)
   ↓ (Driver accepts)
7. out_for_delivery
   ↓ (Payment completed)
   ↓ (Driver delivers to user)
8. delivered
```

### Alternative Flows

**Rejection Flow:**
```
pending → rejected (Vendor rejects)
pending → unaccepted (Auto-reject after 5 min timeout)
```

**Cancellation Flow:**
```
[Any status] → cancelled (User/Vendor cancels)
```

### Status Type Mapping
- `status_type: 1` - Initial/Processing states
- `status_type: 2` - Processed state

---

## Order Creation (User Module)

### Endpoint
- **Path**: `POST /user/make-order`
- **Controller**: `UserController.makeOrder()` (Line 199)
- **Service**: `UserService.makeOrder()` (Line 809)
- **Authentication**: `@UseGuards(UserAuthGuard)`

### DTO Structure
```typescript
// src/user/dto.ts
export class MakeOrderDto {
  pickup_address_id: string      // User's address ID
  vendor_id: string               // Vendor ID
  service_items: ServiceItemDto[] // Array of items
  is_express?: boolean            // Express delivery flag
  order_notes?: string            // Optional notes
}

export class ServiceItemDto {
  service_id: string
  service_name: string
  item_id: string
  item_name: string
  quantity: number (min: 1)
}
```

### Order Creation Process

#### Step 1: Validation
1. **Service Items Validation**
   - Checks if `service_items` array exists and is not empty
   - Validates all items belong to the same service
   - Ensures quantity > 0 for each item

2. **Parallel Data Fetching**
   ```typescript
   const [vendorData, vendorOrders, appConfigData] = await Promise.all([
     this.vendorModel.findById(vendor_id).lean(),
     this.orderModel.find({
       vendor_id: new Types.ObjectId(vendor_id),
       createdAt: { $gte: startOfDay, $lte: endOfDay }
     }).lean(),
     this.appconfigModel.findOne({ is_active: true }).lean()
   ]);
   ```

3. **Vendor Status Check**
   - Verifies vendor shop is open (`shop_status.close_time > new Date()`)
   - Returns error if vendor is closed

4. **Order Validation** (via `VendorHelper.validateOrderData`)
   - Validates service items against vendor's offerings
   - Checks daily order limits
   - Validates item availability and pricing
   - Applies offers if applicable

5. **Address Validation**
   - Verifies pickup address exists in user's addresses
   - Returns error if address not found

6. **Distance Validation**
   - Calculates distance between vendor and user address
   - Uses `calculateDistance()` helper
   - Checks against `appConfig.delivery_config.order_distance`
   - Returns error if vendor out of range

#### Step 2: Price Calculation
```typescript
// 1. Create order items with vendor pricing
orderItems = service_items.map(item => {
  const vendorService = vendorData.services_offered.find(...)
  const vendorItem = vendorService.items.find(...)
  return {
    service_id, service_name, item_id, item_name,
    quantity,
    price_per_item: vendorItem.item_price,
    total_price: quantity * price_per_item
  }
})

// 2. Calculate subtotal
subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)

// 3. Apply offer discount (if any)
afterOfferAmount = subtotal - offerDiscountAmount

// 4. Calculate fees
platformFeeAmount = (afterOfferAmount * platformFeePercentage) / 100
gstAmount = (afterOfferAmount * gstPercentage) / 100
totalPayableAmount = afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount
```

#### Step 3: Order Number Generation
```typescript
const lastOrder = await this.orderModel
  .findOne({ vendor_id: new Types.ObjectId(vendor_id) })
  .sort({ order_number: -1 })
  .lean();
const orderNumber = lastOrder ? lastOrder.order_number + 1 : 1;
```
- Order numbers are unique per vendor
- Auto-incremented from last order for that vendor

#### Step 4: Order Creation
```typescript
const order = await this.orderModel.create({
  order_number: orderNumber,
  user_id: userData._id,
  vendor_id: new Types.ObjectId(vendor_id),
  user_address: addressRes,
  vendor_address: vendorData.address,
  items: orderItems,
  is_express: is_express || false,
  order_notes: order_notes || '',
  payment_details: {
    amount_to_vendor: Math.round(amountToVendor * 100) / 100,
    amount_to_platform: Math.round(amountToPlatform * 100) / 100,
    delivery_fee: deliveryFee,
    gst: Math.round(gstAmount * 100) / 100,
    isOfferApplied: isOfferApplied,
    offerDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
    totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
  },
  total_amount: Math.round(totalPayableAmount * 100) / 100,
  currency: 'INR',
  status: 'pending',
  payment_status: 'pending',
});
```

#### Step 5: Real-time Notifications
```typescript
// Publish to vendor via WebSocket
this.trackingGateway.publishEventToGroup(
  vendor_id.toString(),
  vendorOrders_Curr,  // Current pending orders
  'vendor-order'
);

// Join user to order tracking group
this.trackingGateway.joinUserToGroup(
  userData._id.toString(),
  order._id.toString()
);
```

### Response
```typescript
{
  success: true,
  message: 'Order placed successfully',
  data: {
    order_id: order._id,
    order_number: orderNumber
  }
}
```

---

## Order Management (Vendor Module)

### Module Location
- **File**: `src/vendor/vendor.module.ts`
- **Service**: `src/vendor/vendor.service.ts`
- **Controller**: `src/vendor/vendor.controller.ts`

### Vendor Order Operations

#### 1. Accept/Reject Order
**Endpoint**: `GET /vendor/order/accept/:orderid?is_reject=true`

**Service Method**: `VendorService.acceptOrder()` (Line 450)

**Process**:
```typescript
// 1. Validate vendor
const vendor = await this.vendorModel.findOne({ phone });
if (vendor.status !== 'active') throw error;

// 2. Find order
const order = await this.orderModel.findOne({
  _id: new Types.ObjectId(orderId),
  vendor_id: vendor._id
});

// 3. Reject if requested
if (isRejected === 'true') {
  order.status = 'rejected';
  order.status_timestamps.set('rejected_at', new Date());
  await order.save();
  return { status: true, message: 'Order rejected' };
}

// 4. Accept order
order.status = 'accepted';
order.status_timestamps.set('accepted_at', new Date());
await order.save();

// 5. Notify available delivery persons
const firstNotify = await this.deliveryService.getDeliveryPersonByDistance(
  order.user_address,
  vendor.address,
  appConfig.delivery_config.initial_distance_km || 2,
  orderCreatedAt + acceptTime
);

// 6. Cache orders for delivery persons
for (const deliveryPerson of firstNotify) {
  await this.mongoCache.set(deliveryPersonId, cachedOrders, ttlMs);
  await this.trackingGateway.publishEventToGroup(
    deliveryPersonId,
    cachedOrders,
    'order-list'
  );
}
```

#### 2. Update Order Status
**Endpoint**: `POST /vendor/order`

**Service Method**: `VendorService.updateOrderStatus()` (Line 421)

**Allowed Statuses**: `'processing'` | `'processed'`

**Process**:
```typescript
// Valid transitions:
// - picked_up → processing (when order arrives at vendor)
// - processing → processed (when vendor completes processing)

if (status === 'processed') {
  order.status = 'processed';
} else {
  order.status = 'processing';
  order.delivered_to_vendor_at = new Date();
}
await order.save();
```

#### 3. Update Order Delivery Time
**Endpoint**: `PATCH /vendor/order/time/:orderid`

**Service Method**: `VendorService.updateOrderTime()` (Line 582)

**Process**:
```typescript
// Only allowed when status is 'processing'
if (order.status !== 'processing') throw error;

order.expected_delivery_date = new Date(time);
await order.save();
```

#### 4. Mark Order Complete
**Endpoint**: `PATCH /vendor/order/complete/:orderid`

**Service Method**: `VendorService.markOrderComplete()` (Line 605)

**Process**:
```typescript
// Only allowed when status is 'processing'
if (order.status !== 'processing') throw error;

order.status = 'processed';
order.status_type = 2;
order.status_timestamps.set('processed_at', new Date());
await order.save();

// Notify delivery persons for pickup
const firstNotify = await this.deliveryService.getDeliveryPersonByDistance(
  vendor.address,
  order.user_address,
  appConfig.delivery_config.initial_distance_km || 2,
  orderCreatedAt + acceptTime
);

// Cache and notify delivery persons
// (Similar to acceptOrder process)
```

#### 5. View Orders
**Endpoint**: `GET /vendor/orders?status=pending`

**Service Method**: `VendorService.viewOrders()` (Line 735)

**Process**:
```typescript
const query: any = { vendor_id: vendor._id };
if (status) query.status = status;

const orders = await this.orderModel.find(query).lean();
return { status: true, message: 'Orders fetched successfully', data: orders };
```

---

## Order Delivery (Delivery Module)

### Module Location
- **File**: `src/delivery/delivery.module.ts`
- **Service**: `src/delivery/delivery.service.ts`
- **Controller**: `src/delivery/delivery.controller.ts`

### Delivery Person Order Operations

#### 1. Accept Order
**Endpoint**: `POST /delivery/accept-order/:orderId`

**Service Method**: `DeliveryService.acceptOrder()` (Line 458)

**Process**:
```typescript
// 1. Validate order is available
if (order.status !== 'accepted') throw error;

// 2. Assign order to delivery person
deliveryPerson.assigned_orders = [{
  order_id: order._id,
  pickup_from_user_id: order.user_id,
  deliver_to_vendor_id: order.vendor_id,
  status: 'accepted',
  expected_delivery_time: order.expected_delivery_date
}];

order.driver_id_1 = deliveryPerson._id;  // First driver (pickup)
order.status = 'accepted';
order.rider = {
  name: deliveryPerson.name,
  phone: deliveryPerson.phone
};

await deliveryPerson.save();
await order.save();

// 3. Remove order from cache for all delivery persons
// 4. Notify other delivery persons that order is taken
```

#### 2. Update Order Status
**Endpoint**: `PATCH /delivery/order/:orderId/status?status=4&otp=1234`

**Service Method**: `DeliveryService.updateOrderStatus()` (Line 341)

**Status Codes**:
- `2`: Verify order before pickup (accepted → verified)
- `3`: Reached user location (no status change)
- `4`: Pickup from user (verified → picked_up, requires OTP)
- `5`: Drop off to vendor (picked_up → processing)
- `6`: Payment completed (out_for_delivery, sets payment_status to 'paid')
- `7`: Delivered to user (out_for_delivery + paid → delivered)
- `8`: Vendor pickup after processing (processed → out_for_delivery)

**Process Flow**:
```typescript
switch (status) {
  case 2: // Verify
    if (order.status !== 'accepted') throw error;
    if (deliveryPerson._id !== order.driver_id_1) throw error;
    order.status = 'verified';
    order.status_timestamps.set('verified_at', new Date());
    break;
    
  case 4: // Pickup
    if (order.status !== 'verified') throw error;
    if (otp !== order.user_otp) throw error;
    order.status = 'picked_up';
    order.status_timestamps.set('picked_up_at', new Date());
    break;
    
  case 5: // Drop to vendor
    if (order.status !== 'picked_up') throw error;
    deliveryPerson.assigned_orders = [];
    order.status = 'processing';
    order.status_timestamps.set('processing_at', new Date());
    break;
    
  case 8: // Pickup from vendor
    if (order.status !== 'processed') throw error;
    if (deliveryPerson._id !== order.driver_id_2) throw error;
    order.status = 'out_for_delivery';
    order.status_timestamps.set('processed_at', new Date());
    break;
    
  case 6: // Payment
    if (order.status !== 'out_for_delivery') throw error;
    order.payment_status = 'paid';
    order.status_timestamps.set('paid_at', new Date());
    break;
    
  case 7: // Deliver
    if (order.status !== 'out_for_delivery' || order.payment_status !== 'paid') throw error;
    deliveryPerson.assigned_orders = [];
    order.status = 'delivered';
    order.status_timestamps.set('delivered_at', new Date());
    break;
}
```

#### 3. Get Order Details
**Endpoint**: 
- `GET /delivery/order/:orderId` (specific order)
- `GET /delivery/order?status=completed` (filtered orders)

**Service Method**: `DeliveryService.getOrderDetails()` (Line 552)

**Process**:
```typescript
// Case 1: Specific order
if (orderId) {
  const order = await this.orderModel.findById(orderId);
  if (order.driver_id_1?.toString() !== deliveryPerson._id.toString()) {
    throw new NotFoundException('Order does not belong to this rider');
  }
  return { status: true, data: order };
}

// Case 2: Filter by status
const orders = await this.orderModel.find({
  driver_id_1: deliveryPerson._id,
  status: orderStatus || 'completed'
});
return { status: true, data: orders };
```

---

## Order Tracking & Cron Jobs

### Cron Service
**File**: `src/cron/cron.service.ts`
**Module**: `src/cron/cron.module.ts`

### Cron Jobs

#### 1. Orders Cron Job (Every 1 Minute)
**Method**: `CronService.handleCronOrders()` (Line 22)

**Purpose**: Automatically assign orders to delivery persons if not accepted within time limits

**Process**:

**A. Handle Accepted Orders Without Driver (2-3 minutes old)**
```typescript
const acceptedOrders = await this.orderModel.find({
  status: 'accepted',
  driver_id_1: null,
  updatedAt: {
    $lte: twoMinutesAgo,
    $gte: new Date(Date.now() - 3 * 60 * 1000)
  }
});

// For each order:
// 1. Find available delivery persons within distance
const firstNotify = await this.deliveryService.getDeliveryPersonByDistance(
  order.user_address,
  order.vendor_address,
  appConfig.delivery_config.total_distance_km || 40,
  orderCreatedAt + acceptTime
);

// 2. Cache orders for delivery persons
// 3. Publish via WebSocket
```

**B. Handle Processed Orders Without Driver (2-3 minutes old)**
```typescript
const processedOrders = await this.orderModel.find({
  status: 'processed',
  driver_id_2: null,
  updatedAt: {
    $lte: twoMinutesAgo,
    $gte: new Date(Date.now() - 3 * 60 * 1000)
  }
});

// Similar process as above, but for second driver (delivery to user)
```

**C. Auto-Reject Unaccepted Orders (5+ minutes old)**
```typescript
const unacceptedOrders = await this.orderModel.find({
  status: 'pending',
  createdAt: { $lte: fiveMinutesAgo }
});

unacceptedOrders.forEach(async (order) => {
  order.status = 'unaccepted';
  await order.save();
});
```

#### 4. Cache Cleanup (Every 1 Minute)
**Method**: `CronService.cleanupCacheAndExpiredOrders()` (Line 413)

**Purpose**: Remove expired cache entries for delivery person orders

---

## Order Queries & Retrieval

### User Order Queries

#### 1. Get Order History
**Endpoint**: `GET /user/orders?page=1&limit=10`

**Service Method**: `UserService.getOrderHistory()` (Line 1318)

**Process**:
```typescript
const [orders, total] = await Promise.all([
  this.orderModel
    .find({ user_id: user._id })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  this.orderModel.countDocuments({ user_id: user._id })
]);

return {
  orders,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
};
```

#### 2. Get Order By ID
**Endpoint**: `GET /user/order/:orderId`

**Service Method**: `UserService.getOrderById()` (Line 1352)

**Process**:
```typescript
// Uses aggregation with vendor lookup
const order = await this.orderModel.aggregate([
  {
    $match: {
      _id: new Types.ObjectId(orderId),
      user_id: new Types.ObjectId(user._id)
    }
  },
  {
    $lookup: {
      from: 'vendors',
      localField: 'vendor_id',
      foreignField: '_id',
      as: 'vendor'
    }
  },
  { $unwind: '$vendor' },
  {
    $project: {
      // Exclude sensitive vendor fields
    }
  }
]);

// Build update logs from status_timestamps
order.updateLogs = [];
for (const status in order.status_timestamps) {
  order.updateLogs.push({
    statusStr: statusAbr.str[status],
    status: statusAbr.num[status],
    timestamp: order.status_timestamps[status]
  });
}
```

### Vendor Order Queries

#### View Orders
**Endpoint**: `GET /vendor/orders?status=pending`

**Service Method**: `VendorService.viewOrders()` (Line 735)

**Process**:
```typescript
const query: any = { vendor_id: vendor._id };
if (status) query.status = status;

const orders = await this.orderModel.find(query).lean();
```

### Delivery Person Order Queries

#### Get Order Details
**Endpoint**: 
- `GET /delivery/order/:orderId`
- `GET /delivery/order?status=completed`

**Service Method**: `DeliveryService.getOrderDetails()` (Line 552)

**Process**: See [Delivery Module - Get Order Details](#3-get-order-details)

---

## Integration Points

### 1. WebSocket Integration (Tracking Gateway)
**File**: `src/delivery/tracking.gateway.ts`

**Usage**:
- Real-time order updates to vendors
- Order assignment notifications to delivery persons
- User order tracking updates

**Key Methods**:
- `publishEventToGroup(groupId, data, eventType)` - Broadcast to group
- `joinUserToGroup(userId, orderId)` - Join user to order tracking

### 2. In-Memory Cache (MongoCache)
**File**: `src/store/mongo-cache.service.ts`

**Usage**:
- Caching available orders for delivery persons
- TTL-based expiration
- Prevents duplicate order assignments

### 3. Notification System
**Integration**: Orders trigger notifications at key status changes
- Order placed → Vendor notification
- Order accepted → User notification
- Order picked up → User notification
- Order delivered → User notification

### 4. Review System
**Integration**: Orders can be reviewed after delivery
- `rating_given` flag prevents duplicate reviews
- Reviews linked to orders via `order_id`

### 5. Payment System

#### Payment Gateway Integration
**Gateway**: Cashfree Payment Gateway
- **Location**: `src/utils/cashFree.util.ts`, `src/user/user.service.ts`
- **Configuration**: `src/config/cashfree.config.ts`

#### Payment Flow

**1. Payment Initiation**
- **Endpoint**: `POST /user/make-payment`
- **Process**:
  1. User requests payment for an order
  2. System creates Cashfree order via Payment Gateway API
  3. System creates Cashfree payment link
  4. Payment link URL returned to user
  5. Transaction log created with status `'initiated'`
  6. Order `payment_status` set to `'initiated'`

**2. Payment Completion (Webhook)**
- **Endpoint**: `POST /user/webhook-cf` (public, no auth)
- **Webhook Types Handled**:
  - `PAYMENT_SUCCESS_WEBHOOK`: Payment completed/failed
  - `PAYMENT_LINK_EVENT`: Payment link status changes
- **Process**:
  1. Cashfree sends webhook with payment status
  2. System extracts `order_id` from webhook payload
  3. Updates `TransactionLog` status
  4. Updates `Order.payment_status`:
     - `SUCCESS`/`PAID` → `'paid'`
     - `FAILED` → `'pending'`
     - `EXPIRED` → `'cancelled'` (order status unchanged)
  5. Idempotency checks prevent duplicate processing

**3. Payment Reconciliation (Cron Fallback)**
- **Cron Job**: `cashfree-payment-reconciliation`
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Location**: `src/cron/cron.service.ts`
- **Purpose**: Backup mechanism for webhook failures or delays

**How It Works**:
1. Finds `TransactionLog` entries with:
   - `status = 'initiated'`
   - `payment_gateway = 'Cashfree'`
   - Created 5 minutes to 24 hours ago
   - Limited to 50 transactions per run

2. For each pending transaction:
   - Fetches latest status from Cashfree API:
     - Primary: `GET /pg/orders/{order_id}` (Order Status API)
     - Fallback: `GET /pg/links/{link_id}` (Payment Link API)
   - Maps Cashfree status to internal status:
     - `PAID`/`SUCCESS`/`COMPLETED` → `completed` / `paid`
     - `ACTIVE`/`PENDING` → Skipped (still pending, webhook will arrive)
     - `FAILED`/`DECLINED`/`REJECTED` → `failed` / `pending`
     - `EXPIRED`/`TERMINATED`/`CANCELLED` → `cancelled`
   - Updates `TransactionLog` and `Order` if status changed
   - Includes rate limiting (500ms delay between API calls)

3. **Idempotency**:
   - Skips if transaction log already has target status
   - Skips if order already has target payment status
   - Prevents duplicate updates

4. **Error Handling**:
   - Continues processing other transactions if one fails
   - Logs errors without exposing sensitive data
   - Tracks statistics (processed, success, skipped, errors)

**Security Features**:
- Input validation and sanitization
- URL encoding to prevent injection
- 10-second timeout per API call
- Secure error logging (no sensitive data in production)
- Response validation

**Integration Points**:
- `payment_id` references Payment document (future enhancement)
- `payment_status` tracks payment state (`'pending' | 'paid' | 'initiated'`)
- Payment completion updates order status
- Delivery service requires `payment_status = 'paid'` before marking delivered

---

## Data Flow Diagrams

### Order Creation Flow
```
User Request
    ↓
UserController.makeOrder()
    ↓
UserService.makeOrder()
    ↓
[Validation]
    ├─ Vendor validation
    ├─ Address validation
    ├─ Distance check
    └─ Order validation (VendorHelper)
    ↓
[Price Calculation]
    ├─ Item pricing
    ├─ Offer application
    ├─ Fee calculation
    └─ GST calculation
    ↓
[Order Creation]
    ├─ Generate order number
    ├─ Create order document
    └─ Generate OTPs
    ↓
[Real-time Updates]
    ├─ WebSocket: Notify vendor
    └─ WebSocket: Join user to order group
    ↓
Response: Order ID & Order Number
```

### Order Acceptance Flow
```
Vendor accepts order
    ↓
VendorService.acceptOrder()
    ↓
[Update Order]
    ├─ status: 'accepted'
    └─ status_timestamps: accepted_at
    ↓
[Find Available Drivers]
    └─ DeliveryService.getDeliveryPersonByDistance()
    ↓
[Cache Orders]
    ├─ MongoCache.set() for each driver
    └─ TTL based on order duration
    ↓
[Notify Drivers]
    └─ WebSocket: publishEventToGroup('order-list')
    ↓
Cron Job (if no driver accepts in 2 min)
    └─ Re-broadcast to more drivers
```

### Order Delivery Flow (Pickup)
```
Driver accepts order
    ↓
DeliveryService.acceptOrder()
    ↓
[Update Order]
    ├─ driver_id_1: deliveryPerson._id
    ├─ rider: { name, phone }
    └─ Remove from cache
    ↓
Driver verifies (status: 2)
    ↓
[Update Order]
    └─ status: 'verified'
    ↓
Driver picks up (status: 4, OTP required)
    ↓
[Update Order]
    ├─ status: 'picked_up'
    └─ picked_up_at: Date
    ↓
Driver delivers to vendor (status: 5)
    ↓
[Update Order]
    ├─ status: 'processing'
    ├─ delivered_to_vendor_at: Date
    └─ Clear driver assigned_orders
```

### Order Delivery Flow (Return)
```
Vendor marks complete
    ↓
VendorService.markOrderComplete()
    ↓
[Update Order]
    ├─ status: 'processed'
    └─ status_type: 2
    ↓
[Find Available Drivers]
    └─ DeliveryService.getDeliveryPersonByDistance()
    ↓
[Cache & Notify Drivers]
    └─ Similar to acceptance flow
    ↓
Driver accepts (driver_id_2)
    ↓
Driver picks up from vendor (status: 8)
    ↓
[Update Order]
    └─ status: 'out_for_delivery'
    ↓
Payment completed (status: 6)
    ↓
[Update Order]
    ├─ payment_status: 'paid'
    └─ status_timestamps: paid_at
    ↓
Driver delivers to user (status: 7)
    ↓
[Update Order]
    ├─ status: 'delivered'
    ├─ delivered_to_user_at: Date
    └─ Clear driver assigned_orders
```

---

## Key Design Patterns

### 1. Two-Driver System
- `driver_id_1`: Handles pickup from user → delivery to vendor
- `driver_id_2`: Handles pickup from vendor → delivery to user
- Allows different drivers for different legs of the journey

### 2. Status Timestamps Map
- Tracks exact time of each status transition
- Enables order timeline reconstruction
- Used for analytics and user tracking

### 3. Order Number Per Vendor
- Unique order numbers per vendor (not globally unique)
- Auto-incremented from last order for that vendor
- Simpler for vendor management

### 4. OTP Verification
- `user_otp`: 4-digit OTP for pickup verification
- `vendor_otp`: 4-digit OTP for vendor verification
- Prevents unauthorized pickups

### 5. Denormalized Data
- Service names and item names stored in order
- Prevents issues if vendor changes service/item names
- Historical accuracy

### 6. Payment Details Breakdown
- Detailed breakdown of all charges
- Platform fee, vendor amount, delivery fee, GST separate
- Enables transparent pricing

---

## Error Handling

### Common Error Scenarios

1. **Vendor Closed**: Order creation fails if vendor shop is closed
2. **Out of Range**: Order creation fails if distance exceeds limit
3. **Invalid Status Transition**: Status updates fail if transition is invalid
4. **OTP Mismatch**: Pickup fails if OTP doesn't match
5. **Order Not Found**: Queries fail if order doesn't exist
6. **Unauthorized Access**: Users can only access their own orders
7. **Daily Limit Exceeded**: Order creation fails if vendor daily limit reached

---

## Performance Considerations

### 1. Indexing Recommendations
```typescript
// Recommended indexes for Order collection:
- { user_id: 1, _id: -1 }        // User order history
- { vendor_id: 1, status: 1 }     // Vendor orders by status
- { vendor_id: 1, order_number: -1 } // Order number lookup
- { driver_id_1: 1, status: 1 }   // Driver orders
- { driver_id_2: 1, status: 1 }    // Driver orders (return)
- { status: 1, updatedAt: 1 }     // Cron job queries
- { status: 1, createdAt: 1 }     // Auto-reject queries
```

### 2. Caching Strategy
- Delivery person order lists cached with TTL
- Prevents duplicate database queries
- Reduces WebSocket message overhead

### 3. Aggregation Usage
- User order details use aggregation for vendor lookup
- Efficient single-query approach

---

## Testing Considerations

### Test Scenarios

1. **Order Creation**
   - Valid order creation
   - Invalid vendor ID
   - Closed vendor
   - Out of range vendor
   - Invalid service items
   - Daily limit exceeded

2. **Order Acceptance**
   - Vendor accepts order
   - Vendor rejects order
   - Auto-reject after timeout

3. **Order Status Updates**
   - Valid status transitions
   - Invalid status transitions
   - OTP verification

4. **Order Delivery**
   - Driver assignment
   - Pickup flow
   - Delivery flow
   - Payment completion

5. **Order Queries**
   - User order history
   - Vendor order list
   - Delivery person orders
   - Order by ID

---

## Future Enhancements

### Potential Improvements

1. **Order Cancellation**
   - User cancellation
   - Vendor cancellation
   - Automatic cancellation rules

2. **Order Modifications**
   - Add items before acceptance
   - Modify quantities
   - Change delivery address

3. **Order Scheduling**
   - Scheduled pickup times
   - Recurring orders

4. **Order Analytics**
   - Order completion rates
   - Average delivery times
   - Revenue analytics

5. **Order Refunds**
   - Refund processing
   - Partial refunds
   - Refund status tracking

---

## Summary

The order system is a comprehensive solution that handles:
- **Order lifecycle** from creation to delivery
- **Multi-actor coordination** (User, Vendor, Delivery Person)
- **Real-time tracking** via WebSocket
- **Automated assignment** via cron jobs
- **Status management** with detailed timestamps
- **Payment integration** with detailed breakdowns
- **OTP verification** for security
- **Caching** for performance optimization

The system is well-structured with clear separation of concerns across modules, making it maintainable and extensible.

