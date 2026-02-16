# List Vendors API - End-to-End Analysis

## API Endpoint Overview

**Endpoint:** `POST /user/vendors`  
**Controller:** `UserController.listVendors()` (lines 137-163)  
**Service:** `UserService.listVendors()` (lines 383-615)  
**Authentication:** Required (JWT Bearer Token via `UserAuthGuard`)

---

## 1. Request Flow

### 1.1 Authentication Layer
**Guard:** `UserAuthGuard` (`src/auth/guards/user.guard.ts`)

**Process:**
1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Verifies token using `JwtHelper.verify(token, 'user')`
3. Validates user session:
   - Checks if `user.session_token` matches the provided token
   - Verifies user status is `'active'`
4. Attaches authenticated user to `request.user`

**Failure Cases:**
- Missing/invalid token → `UnauthorizedException`
- Session expired (token mismatch) → `UnauthorizedException`
- User inactive/not found → `UnauthorizedException`

### 1.2 Request Parameters

#### Query Parameters
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page

#### Request Body (`FilterVendorsDto`)
```typescript
{
  sort?: SortOption[];           // Array of sort options
  isExpress?: boolean;            // Filter by express service availability
  isOffer?: boolean;              // Filter by vendors with offers
  serviceFilters?: string[];     // Array of service IDs to filter
}
```

**Sort Options (`SortOption` enum):**
- `distance-low-to-high` / `distance-high-to-low`
- `rating-low-to-high` / `rating-high-to-low`
- `cost-low-to-high` / `cost-high-to-low`
- `offer-low-to-high` / `offer-high-to-low`
- `delivery-low-to-high` / `delivery-high-to-low`

---

## 2. Service Layer Processing

### 2.1 User Validation & Address Check
```typescript
// Lines 389-396
const user = await this.userModel.findOne({ phone: phoneNumber }).lean();
if (!user) return ResponseHelper.error('User not found');

const userAddress = user.addresses.find((addr) => addr.is_default);
if (!userAddress)
  return ResponseHelper.error('Please set a home address to see nearby vendors.');
```

**Requirements:**
- User must exist in database
- User must have at least one address marked as `is_default: true`

**Failure:** Returns error if no default address is set

### 2.2 Geographic Boundary Calculation
```typescript
// Lines 398-403
const { latitude: userLat, longitude: userLong } = userAddress;
const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
  10,  // 10km radius
  userLat,
  userLong,
);
```

**Helper Function:** `calculateLatLong()` (`src/helper/lat-long.helper.ts`)
- Calculates bounding box for 10km radius around user's default address
- Uses Haversine formula approximation
- Returns: `{ minLat, maxLat, minLong, maxLong }`

**Purpose:** Pre-filters vendors within 10km radius at database level

---

## 3. Database Query (MongoDB Aggregation Pipeline)

### 3.1 Initial Match Stage
```typescript
// Lines 408-421
{
  $match: {
    status: 'active',                                    // Only active vendors
    'address.latitude': { $gte: minLat, $lte: maxLat }, // Within lat bounds
    'address.longitude': { $gte: minLong, $lte: maxLong }, // Within long bounds
    $or: [
      { 'shop_status.status': 'open' },                  // Shop is open
      { 'shop_status.close_time': null },                // Or no close time set
      { 'shop_status.close_time': { $gte: new Date() } }, // Or close time hasn't passed
    ],
  },
}
```

**Filters:**
- ✅ Vendor status must be `'active'`
- ✅ Vendor must be within 10km bounding box
- ✅ Shop must be open (or no close time set, or close time in future)

### 3.2 Service Filtering Stage
```typescript
// Lines 428-481
// Filter services_offered to only include:
// 1. Services where is_approved = true
// 2. Items within each service where is_active = true
// 3. Exclude services with no active items
```

**Process:**
1. **First `$addFields`:** Filters `services_offered` array to only approved services (`is_approved: true`)
2. **Within each service:** Filters `items` array to only active items (`is_active: true`)
3. **Second `$addFields`:** Removes services that have zero active items after filtering
4. **Final `$match`:** Excludes vendors that have no valid services after filtering

**Result:** Only vendors with at least one approved service containing at least one active item

### 3.3 Service Type Filtering
```typescript
// Lines 485-498
if (payload.serviceFilters && Array.isArray(payload.serviceFilters) && payload.serviceFilters.length > 0) {
  const serviceFilters = payload.serviceFilters.map((e) => new Types.ObjectId(e));
  pipeline.push({
    $match: {
      'services_offered.service_id': { $in: serviceFilters },
    },
  });
}
```

**Purpose:** Filters vendors by specific service IDs if provided in request

### 3.4 Express Service Filtering
```typescript
// Lines 501-510
if (payload.isExpress !== undefined && payload.isExpress) {
  pipeline.push({
    $match: {
      'services_offered.items.is_active': true,
      'services_offered.items.express_price': { $gt: 0 },
    },
  });
}
```

**Purpose:** Filters vendors that have at least one active item with `express_price > 0`

### 3.5 Offer Filtering
```typescript
// Lines 512-522
if (payload.isOffer !== undefined && payload.isOffer) {
  pipeline.push({
    $match: {
      $or: [
        { 'services_offered.is_offer': true },
        { 'services_offered.offer_percentage': { $gt: 0 } },
      ],
    },
  });
}
```

**Purpose:** Filters vendors that have offers (either `is_offer: true` or `offer_percentage > 0`)

### 3.6 Projection Stage
```typescript
// Lines 526-532
{
  $project: {
    password_hash: 0,  // Exclude sensitive fields
    documents: 0,
    bank_details: 0,
  },
}
```

**Purpose:** Removes sensitive vendor information from response

---

## 4. Post-Query Processing

### 4.1 Distance Calculation
```typescript
// Lines 537-556
vendors = vendors
  .filter((vendor) => 
    vendor.address?.latitude != null && vendor.address?.longitude != null
  )
  .map((vendor) => {
    return {
      ...vendor,
      distance: Number(
        calculateDistance(
          userLat,
          userLong,
          vendor.address.latitude,
          vendor.address.longitude,
        ).toFixed(2),
      ),
    };
  });
```

**Helper Function:** `calculateDistance()` (`src/helper/lat-long.helper.ts`)
- Uses Haversine formula to calculate great-circle distance
- Returns distance in kilometers
- Rounded to 2 decimal places

**Process:**
1. Filters out vendors without valid coordinates
2. Calculates distance from user's default address to each vendor
3. Adds `distance` field to each vendor object

### 4.2 Sorting
```typescript
// Lines 558-561
if (payload.sort && payload.sort.length > 0) {
  vendors = this.applySorting(vendors, payload.sort);
}
```

**Method:** `applySorting()` (lines 617-663)

**Supported Sort Options:**
- **Distance:** `a.distance - b.distance` (ascending/descending)
- **Rating:** `(a.rating?.average || 0) - (b.rating?.average || 0)`
- **Cost:** Uses `getMinPrice()` helper to find minimum item price
- **Offer:** Uses `getMaxDiscount()` helper to find maximum discount percentage
- **Delivery Time:** Estimated as `distance * 2` minutes (1km ≈ 2 minutes)

**Multi-level Sorting:** If multiple sort options provided, applies them in order (first option is primary, subsequent are tie-breakers)

### 4.3 Pagination
```typescript
// Lines 563-566
const totalVendors = vendors.length;
const startIndex = (page - 1) * limit;
const endIndex = startIndex + limit;
const paginatedVendors = vendors.slice(startIndex, endIndex);
```

**Note:** ⚠️ **Pagination happens in-memory after sorting**, not at database level. This could be inefficient for large datasets.

### 4.4 Response Data Enrichment
```typescript
// Lines 567-605
paginatedVendors = paginatedVendors.map((e) => {
  e.distance = `${e.distance} km`;  // Format distance as string
  
  // Calculate express availability
  e.is_express = e.services_offered.some(
    (service: any) => service.is_express,
  );
  
  // Calculate minimum express time (from service with shortest express_time)
  let allItems = e.services_offered.sort(
    (a: any, b: any) => a?.express_time - b?.express_time,
  )[0];
  e.min_express_time = `${allItems.express_time} hrs`;
  e.min_standard_time = e.services_offered.sort(
    (a: any, b: any) => a.express_time - b.express_time,
  )[0].standard_time + ' hrs';
  
  // Calculate minimum price (startsAt)
  e.startsAt = e.services_offered.reduce((total, value) => {
    for (const item of value.items) {
      if (!total) total = item.item_price;
      total = Math.min(total, item.item_price);
    }
    return total;
  }, null);
  
  // Calculate maximum offer percentage
  e.max_offer_percentage = e.services_offered.reduce((total, value) => {
    if (!total) total = 0;
    total = Math.max(total, value?.offer_percentage);
    return { total_percentage: total, max_cap: value?.offer_max_cap };
  }, null);
  e.is_offer = e.max_offer_percentage?.total_percentage > 0;
  
  // Simplify services_offered to just service names
  e.services_offered = e.services_offered.map(
    (service: any) => service.service_name,
  );
  
  return e;
});
```

**Enriched Fields:**
- `distance`: Formatted as "X.XX km"
- `is_express`: Boolean indicating if vendor offers express service
- `min_express_time`: Shortest express delivery time (e.g., "8 hrs")
- `min_standard_time`: Shortest standard delivery time (e.g., "48 hrs")
- `startsAt`: Minimum price across all active items
- `max_offer_percentage`: Maximum offer percentage with cap
- `is_offer`: Boolean indicating if vendor has active offers
- `services_offered`: Simplified to array of service names (strings)

---

## 5. Response Format

### 5.1 Success Response
```typescript
{
  success: true,
  message: 'Vendors retrieved',
  data: {
    vendors: [
      {
        _id: ObjectId,
        shop_name: string,
        shop_image_url?: string,
        profile_pic?: string,
        owner_name?: string,
        email: string,
        phone: string,
        status: 'active',
        address: {
          address_line1: string,
          address_line2?: string,
          city: string,
          state: string,
          pincode: string,
          latitude: number,
          longitude: number,
        },
        shop_status: {
          status: 'open' | 'close',
          close_time?: Date,
        },
        rating: {
          average: number,
          total_reviews: number,
          reviews: Array,
        },
        services_offered: string[],  // Array of service names
        distance: string,             // "X.XX km"
        is_express: boolean,
        min_express_time: string,     // "X hrs"
        min_standard_time: string,    // "X hrs"
        startsAt: number,             // Minimum price
        max_offer_percentage: {
          total_percentage: number,
          max_cap: number,
        },
        is_offer: boolean,
        // ... other vendor fields (excluding password_hash, documents, bank_details)
      },
      // ... more vendors
    ],
    total: number,        // Total vendors matching filters (before pagination)
    page: number,         // Current page number
    limit: number,        // Items per page
    totalPages: number,   // Total number of pages
  },
}
```

### 5.2 Error Responses

**User Not Found:**
```typescript
{
  success: false,
  message: 'User not found',
}
```

**No Default Address:**
```typescript
{
  success: false,
  message: 'Please set a home address to see nearby vendors.',
}
```

---

## 6. Performance Considerations

### 6.1 Potential Issues

1. **In-Memory Pagination & Sorting:**
   - All vendors are loaded into memory before pagination
   - Sorting happens in JavaScript, not at database level
   - **Impact:** High memory usage and slower response times for large datasets

2. **Distance Calculation:**
   - Calculated for ALL vendors after query, not just paginated results
   - **Impact:** Unnecessary computation for vendors not in current page

3. **No Database Indexing Mentioned:**
   - Geographic queries on `address.latitude` and `address.longitude` would benefit from geospatial indexes
   - Service filtering on `services_offered.service_id` could benefit from indexes

### 6.2 Optimization Opportunities

1. **Move Pagination to Database:**
   ```typescript
   // Add $skip and $limit to aggregation pipeline
   pipeline.push({ $skip: (page - 1) * limit });
   pipeline.push({ $limit: limit });
   ```

2. **Move Sorting to Database:**
   ```typescript
   // Add $sort stage to aggregation pipeline
   pipeline.push({ $sort: { 'rating.average': -1 } });
   ```

3. **Calculate Distance Only for Paginated Results:**
   - Calculate distance after pagination, not before

4. **Add Geospatial Index:**
   ```typescript
   // In vendor schema
   vendorSchema.index({ 'address.latitude': 1, 'address.longitude': 1 });
   ```

---

## 7. Data Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /user/vendors
       │ Headers: Authorization: Bearer <token>
       │ Body: { sort, isExpress, isOffer, serviceFilters }
       │ Query: ?page=1&limit=10
       ▼
┌─────────────────────┐
│  UserAuthGuard      │
│  - Verify JWT       │
│  - Check session    │
│  - Validate user    │
└──────┬──────────────┘
       │ request.user
       ▼
┌─────────────────────┐
│ UserController      │
│ listVendors()       │
└──────┬──────────────┘
       │ Extract: phone, page, limit, body
       ▼
┌─────────────────────┐
│ UserService          │
│ listVendors()        │
└──────┬──────────────┘
       │
       ├─► Validate user exists
       ├─► Get default address
       ├─► Calculate 10km bounding box
       │
       ▼
┌─────────────────────┐
│ MongoDB Aggregation │
│ Pipeline:           │
│ 1. Match (status,   │
│    location, shop)  │
│ 2. Filter services  │
│    (approved,       │
│     active items)   │
│ 3. Service filters  │
│ 4. Express filter   │
│ 5. Offer filter     │
│ 6. Project          │
└──────┬──────────────┘
       │ vendors[]
       ▼
┌─────────────────────┐
│ Post-Processing:    │
│ - Calculate distance│
│ - Apply sorting     │
│ - Paginate          │
│ - Enrich data       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ResponseHelper      │
│ success()           │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## 8. Key Dependencies

### 8.1 Models
- `User` - User schema with addresses
- `Vendor` - Vendor schema with services_offered, address, rating

### 8.2 Helpers
- `calculateLatLong()` - Geographic bounding box calculation
- `calculateDistance()` - Haversine distance calculation
- `ResponseHelper` - Standardized response formatting

### 8.3 Guards
- `UserAuthGuard` - JWT authentication and session validation

---

## 9. Business Logic Summary

1. **Geographic Filtering:** Only shows vendors within 10km of user's default address
2. **Availability:** Only shows active vendors with open shops
3. **Service Validation:** Only shows vendors with approved services containing active items
4. **Flexible Filtering:** Supports filtering by service type, express availability, and offers
5. **Multi-level Sorting:** Supports multiple sort criteria with priority order
6. **Data Enrichment:** Adds computed fields like distance, pricing, and offer information
7. **Security:** Excludes sensitive vendor data (passwords, documents, bank details)

---

## 10. Testing Recommendations

### 10.1 Unit Tests
- Test `applySorting()` with various sort combinations
- Test `getMinPrice()` and `getMaxDiscount()` helpers
- Test distance calculation accuracy
- Test pagination logic

### 10.2 Integration Tests
- Test with user having no default address
- Test with no vendors in 10km radius
- Test with various filter combinations
- Test pagination edge cases (page beyond total, limit variations)
- Test sorting with identical values (tie-breaking)

### 10.3 Performance Tests
- Test with large vendor dataset (1000+ vendors)
- Measure query execution time
- Monitor memory usage during aggregation
- Test concurrent requests

---

## 11. Known Issues & Limitations

1. **Pagination happens after loading all results** - Could be slow for large datasets
2. **Distance calculated for all vendors** - Even those not in current page
3. **No caching mechanism** - Every request hits database
4. **Fixed 10km radius** - Not configurable per request
5. **Sorting in JavaScript** - Not leveraging MongoDB's native sorting
6. **No rate limiting** - Could be abused for DoS

---

## 12. Suggested Improvements

1. ✅ Move pagination and sorting to MongoDB aggregation pipeline
2. ✅ Add geospatial index on vendor addresses
3. ✅ Calculate distance only for paginated results
4. ✅ Add caching layer (Redis) for frequently accessed vendor lists
5. ✅ Make radius configurable (query parameter or user preference)
6. ✅ Add rate limiting to prevent abuse
7. ✅ Add request validation for page/limit bounds
8. ✅ Consider using MongoDB's `$geoNear` for better geographic queries

