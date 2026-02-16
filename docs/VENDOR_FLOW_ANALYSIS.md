# Vendor Complete Flow Analysis

## Overview
This document describes the complete vendor registration and management flow in the laundry backend system.

## Vendor Registration Flow

### 1. Send OTP (Register/Login)
**Endpoint:** `POST /vendor/send-otp`
- **Input:** Phone number
- **Process:**
  - Looks up vendor by phone
  - If vendor does not exist:
    - Creates vendor with status `pending`
    - Initializes default values:
      - `wallet`: { balance: 0, currency: 'INR' }
      - `rating`: { average: 0, total_reviews: 0, reviews: [] }
      - `total_orders`: 0
      - `shop_status`: { status: 'close', close_time: null }
      - `pickup_zones`: []
      - `services_offered`: []
  - If vendor already exists:
    - Ensures record is valid for login
  - Dispatches OTP through the shared helper
- **Response:** Context-specific success message or relevant error

> Legacy endpoints `POST /vendor/register` and `POST /vendor/login` proxy to this shared logic for backward compatibility.

### 2. OTP Verification
**Endpoint:** `POST /vendor/verify-otp`
- **Input:** Phone, OTP, FCM token
- **Process:**
  - Verifies OTP
  - Generates JWT token (expires in 6 hours)
  - Updates vendor with FCM token and session token
  - Joins vendor to tracking gateway group
- **Response:** JWT token and vendor status

### 3. Complete Registration
**Endpoint:** `POST /vendor/register-complete` (Requires Auth)
- **Input:** Complete vendor details:
  - Shop name, owner name, email
  - GST number, PAN number, Aadhaar number, shop license
  - Address (line1, line2, city, state, pincode, landmark, lat/long)
  - Bank details (account holder, account number, IFSC, bank name, branch)
- **Process:**
  - Validates vendor exists and status is `pending` or `retry`
  - Updates vendor with all provided information
  - Fetches master services from database
  - Creates `services_offered` array with all master services:
    - Each service initialized with default values
    - Items from master service copied with prices set to 0
    - All services set to `is_active: false` initially
  - Sets status to `upload`
- **Response:** Success message

### 4. Document Upload (Optional)
**Endpoint:** `POST /vendor/documents` (Requires Auth)
- **Input:** Multipart form data with:
  - `aadhaar_card` (file)
  - `gst_certificate` (file)
  - `pan_card` (file)
- **Process:**
  - Uploads documents to S3
  - Updates vendor documents
  - Sets status to `docs`
- **Response:** Success message

### 5. Shop Image Upload (Optional)
**Endpoint:** `POST /vendor/shop-image` (Requires Auth)
- **Input:** Multipart form data with `shop_image` (file)
- **Process:**
  - Uploads shop image to S3
  - Updates vendor `shop_image_url`
- **Response:** Success message

### 6. Set Operating Hours
**Endpoint:** `POST /vendor/operating-hours` (Requires Auth, Status: `active`)
- **Input:** Operating hours for each day:
  ```json
  {
    "monday": { "open": "08:00", "close": "20:00" },
    "tuesday": { "open": "08:00", "close": "20:00" },
    // ... other days
  }
  ```
- **Process:**
  - Validates vendor is `active`
  - Updates operating hours
- **Response:** Success message

### 7. Configure Services
**Endpoint:** `POST /vendor/services-offered` (Requires Auth, Status: `active`)
- **Input:** Service configuration:
  ```json
  {
    "service": {
      "service_name": "Wash and Fold",
      "max_count_per_day": 50,
      "is_express": true,
      "items": [
        {
          "item_name": "Small 1Kg - 3Kg",
          "item_category": "weight",
          "item_price": 60,
          "express_price": 80,
          "discount_percentage": 0,
          "is_active": true
        }
      ]
    }
  }
  ```
- **Process:**
  - Validates vendor is `active`
  - Updates service configuration:
    - Max count per day
    - Express availability
    - Item prices (regular and express)
    - Item activation status
- **Response:** Success message

## Vendor Status Flow

```
pending → upload → docs → active
   ↓         ↓
  retry    retry
```

- **pending**: Initial registration, waiting for completion
- **upload**: Registration complete, waiting for document upload
- **docs**: Documents uploaded, waiting for admin approval
- **active**: Approved and operational
- **inactive**: Temporarily disabled
- **blocked**: Permanently blocked
- **retry**: Can retry from this status

## Vendor Schema Structure

### Core Fields
- `shop_name`: String (required)
- `owner_name`: String (optional)
- `email`: String (unique, lowercase)
- `phone`: String (unique, required)
- `status`: Enum ['active', 'inactive', 'blocked', 'pending', 'upload', 'docs', 'retry']
- `gst_number`: String (optional)
- `pan_number`: String (optional)
- `aadhaar_number`: String (optional)
- `shop_license_number`: String (optional)

### Address
```typescript
{
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}
```

### Operating Hours
```typescript
{
  monday: { open: string, close: string },
  tuesday: { open: string, close: string },
  // ... other days
}
```

### Services Offered
Array of service objects:
```typescript
{
  service_id: ObjectId;
  service_name: string;
  image_url: string;
  pricing_type: 'per_kg' | 'per_pc';
  max_count_per_day: number;
  service_description: string;
  items: Array<{
    item_id: ObjectId;
    item_name: string;
    image_url: string;
    item_price: number;
    express_price: number;
    min_weight: number;
    max_weight: number;
    item_description: string;
    category: string;
    is_active: boolean;
  }>;
  is_express_available: boolean;
  express_delivery_time_minutes: number;
  normal_delivery_time_minutes: number;
  is_offer: boolean;
  offer_percentage: number;
  is_active: boolean;
}
```

### Wallet
```typescript
{
  balance: number;
  currency: string; // Default: 'INR'
  last_updated?: Date;
}
```

### Rating
```typescript
{
  average: number;
  total_reviews: number;
  reviews: Array<{
    user_id?: ObjectId;
    name?: string;
    rating: number;
    comment?: string;
    date?: Date;
  }>;
}
```

### Bank Details
```typescript
{
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch?: string;
}
```

### Shop Status
```typescript
{
  status: 'open' | 'close';
  close_time?: Date;
}
```

## Active Vendor Requirements

For a vendor to be fully operational and visible to users, they need:

1. ✅ Status set to `active`
2. ✅ Complete address with coordinates
3. ✅ Operating hours configured
4. ✅ At least one service configured and active
5. ✅ Shop status set to `open` (default)

## Direct Database Insertion

The script `scripts/insert-active-vendors.js` allows direct insertion of active vendors into the database, bypassing the API flow. This is useful for:

- Seeding test data
- Bulk vendor creation
- Development/staging environments

### Script Features

1. **Fetches Master Services**: Automatically retrieves all services from the database
2. **Creates Services Offered**: Maps master services to vendor services with default pricing
3. **Sets Status to Active**: Directly sets vendor status to `active`
4. **Complete Data**: Includes all required fields:
   - Address with coordinates
   - Operating hours
   - Bank details
   - Services with items and pricing
   - Wallet and rating initialization

### Usage

```bash
# Using default database URL
node scripts/insert-active-vendors.js

# Using custom database URL
DATABASE_URL=mongodb://... node scripts/insert-active-vendors.js
```

## Notes

- Phone numbers must be unique
- Email addresses must be unique (case-insensitive)
- Services are automatically created from master services during registration
- Vendors must be `active` to update operating hours, services, or accept orders
- The script checks for existing vendors and skips duplicates

