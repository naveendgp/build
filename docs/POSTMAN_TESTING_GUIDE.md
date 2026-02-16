# Testing Order Preview API in Postman

## Prerequisites

1. **Server must be running**: `npm run start:dev` (runs on port 3000)
2. **Base URL**: `http://localhost:3000`

---

## Step 1: Get User Authentication Token

### Request 1: Send OTP

**Method**: `POST`  
**URL**: `http://localhost:3000/user/auth`  
**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "phoneNumber": "+919876543210"
}
```

**Response**: You'll receive an OTP (check console/logs - might be "1234" for testing)

---

### Request 2: Verify OTP & Get Token

**Method**: `POST`  
**URL**: `http://localhost:3000/user/verify-otp`  
**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "phoneNumber": "+919876543210",
  "otp": "1234",
  "fcm_token": "test_fcm_token_12345"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_new": true
  }
}
```

**Copy the `token` value** - you'll need it for the next request!

---

## Step 2: Add an Address (Required for Order)

### Request 3: Add Address

**Method**: `POST`  
**URL**: `http://localhost:3000/user/add-address`  
**Headers**:

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body** (raw JSON):

```json
{
  "label": "Home",
  "address_line1": "123 Main Street",
  "address_line2": "Apt 4B",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Response**: You'll get an `addressId` - note this for the order request.

---

## Step 3: Get Vendor ID (Optional - if you don't have one)

### Request 4: List Vendors

**Method**: `POST`  
**URL**: `http://localhost:3000/user/vendors?page=1&limit=10`  
**Headers**:

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body** (raw JSON):

```json
{
  "sort": ["distance-low-to-high"]
}
```

**Response**: Look for a vendor `_id` in the response.

---

## Step 4: Get Service & Item IDs (Required)

### Request 5: Get Services List

**Method**: `GET`  
**URL**: `http://localhost:3000/user/list-services`  
**Headers**:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response**: Contains services and items with their IDs. Note:

- `service_id`
- `item_id` (from items array)

---

## Step 5: Preview Order

### Request 6: Preview Order

**Method**: `POST`  
**URL**: `http://localhost:3000/user/preview-order`  
**Headers**:

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body** (raw JSON):

```json
{
  "pickup_address_id": "YOUR_ADDRESS_ID_HERE",
  "vendor_id": "YOUR_VENDOR_ID_HERE",
  "service_items": [
    {
      "service_id": "YOUR_SERVICE_ID_HERE",
      "service_name": "Wash and Fold",
      "item_id": "YOUR_ITEM_ID_HERE",
      "item_name": "T-Shirt",
      "quantity": 5
    }
  ],
  "is_express": false,
  "order_notes": "Please handle with care"
}
```

### Sample Request Body (Replace with actual IDs):

```json
{
  "pickup_address_id": "67890abcdef1234567890123",
  "vendor_id": "507f1f77bcf86cd799439011",
  "service_items": [
    {
      "service_id": "507f1f77bcf86cd799439012",
      "service_name": "Wash and Fold",
      "item_id": "507f1f77bcf86cd799439013",
      "item_name": "T-Shirt",
      "quantity": 5
    },
    {
      "service_id": "507f1f77bcf86cd799439012",
      "service_name": "Wash and Fold",
      "item_id": "507f1f77bcf86cd799439014",
      "item_name": "Jeans",
      "quantity": 2
    }
  ],
  "is_express": false,
  "order_notes": "Please handle with care, fragile items"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Order preview generated successfully",
  "data": {
    "order_preview": {
      "vendor": {
        "vendor_id": "...",
        "shop_name": "ABC Laundry",
        "address": {
          "address_line1": "...",
          "city": "...",
          "state": "...",
          "pincode": "...",
          "latitude": 12.9716,
          "longitude": 77.5946
        }
      },
      "pickup_address": {
        "label": "Home",
        "address_line1": "123 Main Street",
        "address_line2": "Apt 4B",
        "city": "...",
        "state": "...",
        "pincode": "...",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "is_default": true
      },
      "items": [
        {
          "service_id": "507f1f77bcf86cd799439012",
          "service_name": "Wash and Fold",
          "item_id": "507f1f77bcf86cd799439013",
          "item_name": "T-Shirt",
          "quantity": 5,
          "price_per_item": 50,
          "total_price": 250
        }
      ],
      "is_express": false,
      "order_notes": "Please handle with care",
      "pricing": {
        "subtotal": 500,
        "offer_discount": 50,
        "is_offer_applied": true,
        "after_offer_amount": 450,
        "delivery_fee": 30,
        "platform_fee": 22.5,
        "gst": 81,
        "total_payable_amount": 583.5
      },
      "payment_breakdown": {
        "amount_to_vendor": 450,
        "amount_to_platform": 22.5,
        "delivery_fee": 30,
        "gst": 81,
        "total_payable_amount": 583.5
      },
      "currency": "INR"
    }
  }
}
```

---

## Quick Test Script (All in One)

If you want to test quickly, here's a complete flow:

### 1. Auth & Get Token

```
POST http://localhost:3000/user/verify-otp
Body: {
  "phoneNumber": "+919876543210",
  "otp": "1234",
  "fcm_token": "test_token"
}
```

### 2. Preview Order (Replace placeholders)

```
POST http://localhost:3000/user/preview-order
Headers: Authorization: Bearer {token_from_step_1}
Body: {
  "pickup_address_id": "{address_id}",
  "vendor_id": "{vendor_id}",
  "service_items": [
    {
      "service_id": "{service_id}",
      "service_name": "Wash and Fold",
      "item_id": "{item_id}",
      "item_name": "T-Shirt",
      "quantity": 5
    }
  ],
  "is_express": false,
  "order_notes": "Test order"
}
```

---

## Common Issues & Solutions

### Issue: "Pickup address not found"

- **Solution**: Make sure you've added an address first using `/user/add-address`
- Use the `addressId` from the response (not the MongoDB `_id`)

### Issue: "Vendor not found" or "Vendor is closed currently"

- **Solution**: Check vendor exists and is active
- Verify vendor shop_status allows orders

### Issue: "Service items are required to preview order"

- **Solution**: Ensure `service_items` is an array with at least one item

### Issue: "All items must belong to the same service"

- **Solution**: All items in `service_items` array must have the same `service_id`

### Issue: "Unauthorized" or "Invalid token"

- **Solution**:
  - Make sure token is prefixed with `Bearer ` in Authorization header
  - Token might be expired (get a new one via verify-otp)
  - Format: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Postman Collection Setup Tips

1. **Create Environment Variables**:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: (set after verify-otp)
   - `address_id`: (set after add-address)
   - `vendor_id`: (from vendors list)
   - `service_id`: (from services list)
   - `item_id`: (from services list)

2. **Use Variables in Requests**:

   ```
   URL: {{base_url}}/user/preview-order
   Authorization: Bearer {{auth_token}}
   ```

3. **Use Tests Tab** to automatically save tokens:
   ```javascript
   if (pm.response.code === 200) {
     const jsonData = pm.response.json();
     if (jsonData.data && jsonData.data.token) {
       pm.environment.set('auth_token', jsonData.data.token);
     }
   }
   ```

---

## Testing via Swagger UI

1. Start server: `npm run start:dev`
2. Open browser: `http://localhost:3000/api`
3. Click "Authorize" button at top
4. Enter token: `Bearer YOUR_TOKEN_HERE`
5. Find `/user/preview-order` endpoint
6. Click "Try it out"
7. Fill in request body
8. Click "Execute"

---

## Sample Test Data

If you need sample data in your database:

### Sample Vendor ID Format:

```
507f1f77bcf86cd799439011
```

### Sample Service ID Format:

```
507f1f77bcf86cd799439012
```

### Sample Item ID Format:

```
507f1f77bcf86cd799439013
```

**Note**: These are MongoDB ObjectId formats. Use actual IDs from your database.
