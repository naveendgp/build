# Delivery Cache Empty Details Analysis

## Problem
Order details in `delivery_person_cache` collection are being set as empty (`{}` or `null`/`undefined`).

## Root Causes Identified

### 1. **Missing Details Check in `mongo-cache.service.ts` `set()` method** ⚠️ CRITICAL

**Location**: `src/store/mongo-cache.service.ts:16-66`

**Issue**: 
```typescript
if (order.details) {
  // Normalize details...
} 
// If order.details is falsy (null/undefined/empty), it's skipped
return {
  order_id: order.order_id,
  type: order.type || 'order-list',
  details: order.details, // ⚠️ Could be undefined/null/empty!
};
```

**Problem**: When `order.details` is `null`, `undefined`, or `{}`, the normalization is skipped and the empty/null details are saved directly to the database.

**Impact**: HIGH - This is the primary way orders get cached, so empty details will be persisted.

---

### 2. **Missing Details Check in `mongo-cache.service.ts` `get()` method** ⚠️ CRITICAL

**Location**: `src/store/mongo-cache.service.ts:133-198`

**Issue**:
```typescript
if (order.details) {
  // Normalize...
} 
return order; // ⚠️ Returns order with potentially empty/null details
```

**Problem**: When retrieving from cache, if `order.details` is falsy, it returns the order as-is without normalization or validation.

**Impact**: HIGH - Corrupted cache entries will be returned and potentially propagated.

---

### 3. **Schema Pre-Save Hook Doesn't Handle Missing Details** ⚠️ HIGH

**Location**: `src/schemas/delivery-person-cache.schema.ts:108-152`

**Issue**:
```typescript
if (order.details) {
  // Normalize...
}
return {
  order_id: order.order_id,
  type: order.type || 'order-list',
  details: order.details, // ⚠️ Could still be undefined/null
};
```

**Problem**: The pre-save hook doesn't validate that `details` exists before saving. If `details` is missing, it will save an order with `details: undefined/null`.

**Impact**: HIGH - MongoDB schema validation might fail or allow invalid data.

---

### 4. **Incomplete Normalization in Cleanup Function** ⚠️ MEDIUM

**Location**: `src/cron/cron.service.ts:465-511`

**Issue**: When normalizing old format orders, if `deliveryData` properties are missing, the normalization creates an object with `undefined` values:
```typescript
normalizedOrder.details = {
  _id: deliveryData._id, // Could be undefined
  driver_name: deliveryData.driver_name, // Could be undefined
  // ... other fields could be undefined
};
```

**Problem**: Partial data normalization creates incomplete details objects.

**Impact**: MEDIUM - Affects cleanup of old cache entries.

---

### 5. **Race Condition in Cache Updates** ⚠️ MEDIUM

**Location**: Multiple locations (`cron.service.ts`, `vendor.service.ts`, `delivery.service.ts`)

**Issue**: When multiple processes update cache simultaneously:
- Process A reads cache (has valid details)
- Process B reads cache (has valid details)
- Process A normalizes and saves
- Process B normalizes with stale data and overwrites Process A's changes

**Problem**: Concurrent updates can overwrite valid data with incomplete data.

**Impact**: MEDIUM - Can cause data loss during high concurrency.

---

### 6. **Missing Validation in `getDeliveryPersonByDistance()`** ⚠️ LOW

**Location**: `src/delivery/delivery.service.ts:193-362`

**Issue**: The function returns delivery person data that might have incomplete fields (e.g., missing `from_location`, `to_location`). This incomplete data is then used to create cache entries.

**Problem**: If Google API fails or returns incomplete data, cache entries will have empty/null location fields.

**Impact**: LOW - External API dependency, but should be handled gracefully.

---

### 7. **Filtering Logic Doesn't Validate Details** ⚠️ MEDIUM

**Location**: `src/delivery/delivery.service.ts:625-628`

**Issue**:
```typescript
const updatedOrders = cachedOrders.filter(
  (cachedOrder: any) =>
    cachedOrder.order_id?.toString() !== orderId.toString(),
);
```

**Problem**: Orders with empty/null `details` pass through the filter and remain in cache.

**Impact**: MEDIUM - Corrupted entries persist in cache.

---

## Scenarios Where Empty Details Can Occur

### Scenario 1: Direct Database Write
If someone directly writes to MongoDB without going through `mongoCache.set()`, entries might have empty details.

### Scenario 2: Partial Update
If `mongoCache.set()` is called with an array where some orders have `details: null`, those orders will be saved with empty details.

### Scenario 3: Normalization Failure
If normalization logic encounters unexpected data structure and fails silently, empty details might be saved.

### Scenario 4: Schema Validation Bypass
If Mongoose schema validation is bypassed (e.g., using `lean()` queries or direct MongoDB operations), invalid data can be saved.

### Scenario 5: Concurrent Updates
Race conditions during cache updates can result in partial data being saved.

---

## Recommended Fixes

### Fix 1: Add Validation in `mongo-cache.service.ts` `set()` method

```typescript
async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  let normalizedValue = value;
  if (Array.isArray(value) && value.length > 0) {
    normalizedValue = value.map((order: any) => {
      // ⚠️ ADD: Validate order structure
      if (!order.order_id) {
        console.error('Invalid order: missing order_id', order);
        return null; // Filter out invalid orders
      }

      // ⚠️ ADD: Ensure details exists and is valid
      if (!order.details || typeof order.details !== 'object') {
        console.error('Invalid order: missing or invalid details', order);
        return null; // Filter out orders without details
      }

      // Existing normalization logic...
      if (order.details.order) {
        // ... existing code
      } else {
        // ⚠️ ADD: Validate required fields exist
        const requiredFields = ['_id', 'driver_name', 'phone', 'current_location'];
        const missingFields = requiredFields.filter(
          field => !order.details[field]
        );
        
        if (missingFields.length > 0) {
          console.error(`Invalid order details: missing fields ${missingFields.join(', ')}`, order);
          return null; // Filter out incomplete orders
        }
        
        // ... existing normalization
      }
      
      return {
        order_id: order.order_id,
        type: order.type || 'order-list',
        details: order.details,
      };
    }).filter(order => order !== null); // Remove invalid orders
  }
  
  // ... rest of method
}
```

### Fix 2: Add Validation in `get()` method

```typescript
async get<T>(key: string): Promise<T | undefined> {
  // ... existing code
  
  if (Array.isArray(cacheEntry.cached_orders) && cacheEntry.cached_orders.length > 0) {
    const normalizedOrders = cacheEntry.cached_orders
      .map((order: any) => {
        // ⚠️ ADD: Skip orders without details
        if (!order.details || typeof order.details !== 'object') {
          console.warn('Skipping order with invalid details:', order.order_id);
          return null;
        }
        
        // ... existing normalization
      })
      .filter(order => order !== null); // Remove invalid orders
    
    // ⚠️ ADD: If all orders were invalid, return empty array or undefined
    if (normalizedOrders.length === 0) {
      return undefined;
    }
    
    return normalizedOrders as T;
  }
  
  // ... rest of method
}
```

### Fix 3: Add Schema Validation Hook

```typescript
DeliveryPersonCacheSchema.pre('save', function (next) {
  if (this.cached_orders && Array.isArray(this.cached_orders)) {
    this.cached_orders = this.cached_orders
      .map((order: any) => {
        // ⚠️ ADD: Validate order structure
        if (!order.order_id || !order.details) {
          console.error('Invalid order in pre-save hook:', order);
          return null;
        }
        
        // ... existing normalization
      })
      .filter(order => order !== null); // Remove invalid orders
    
    // ⚠️ ADD: If all orders are invalid, prevent save or set empty array
    if (this.cached_orders.length === 0) {
      // Option 1: Prevent save
      return next(new Error('Cannot save cache with no valid orders'));
      
      // Option 2: Set to empty array (if that's acceptable)
      // this.cached_orders = [];
    }
  }
  next();
});
```

### Fix 4: Add Validation in Cache Update Operations

In `cron.service.ts`, `vendor.service.ts`, and `delivery.service.ts`, add validation before calling `mongoCache.set()`:

```typescript
// Before calling mongoCache.set()
const validOrders = updatedCacheArray.filter((order: any) => {
  return (
    order &&
    order.order_id &&
    order.details &&
    order.details._id &&
    order.details.driver_name &&
    order.details.phone &&
    order.details.current_location
  );
});

if (validOrders.length !== updatedCacheArray.length) {
  console.warn(
    `Filtered out ${updatedCacheArray.length - validOrders.length} invalid orders`
  );
}

if (validOrders.length > 0) {
  await this.mongoCache.set(deliveryPersonId, validOrders, ttlMs);
} else {
  // No valid orders, delete cache entry
  await this.mongoCache.delete(deliveryPersonId);
}
```

### Fix 5: Add Database Query to Find Corrupted Entries

```typescript
// Utility function to find and fix corrupted cache entries
async findAndFixCorruptedCacheEntries(): Promise<void> {
  const corruptedEntries = await this.cacheModel.find({
    $or: [
      { 'cached_orders.details': { $exists: false } },
      { 'cached_orders.details': null },
      { 'cached_orders.details': {} },
      { 'cached_orders': { $elemMatch: { details: { $exists: false } } } },
    ],
  });

  for (const entry of corruptedEntries) {
    const validOrders = entry.cached_orders.filter(
      (order: any) => order.details && Object.keys(order.details).length > 0
    );

    if (validOrders.length === 0) {
      await this.cacheModel.deleteOne({ _id: entry._id });
    } else {
      await this.cacheModel.updateOne(
        { _id: entry._id },
        { $set: { cached_orders: validOrders } }
      );
    }
  }
}
```

---

## Prevention Strategy

1. **Add Input Validation**: Validate all orders before caching
2. **Add Schema Validation**: Use Mongoose validators to ensure data integrity
3. **Add Logging**: Log all cases where invalid data is detected
4. **Add Monitoring**: Monitor cache health and alert on corrupted entries
5. **Add Tests**: Unit tests for normalization logic with edge cases
6. **Add Database Constraints**: MongoDB schema validation (if using MongoDB 3.6+)

---

## Testing Checklist

- [ ] Test with `order.details = null`
- [ ] Test with `order.details = undefined`
- [ ] Test with `order.details = {}`
- [ ] Test with `order.details` missing required fields
- [ ] Test concurrent cache updates
- [ ] Test cache retrieval with corrupted entries
- [ ] Test schema pre-save hook with invalid data
- [ ] Test cleanup function with corrupted entries

---

## Files to Review/Modify

1. `src/store/mongo-cache.service.ts` - Add validation in `set()` and `get()`
2. `src/schemas/delivery-person-cache.schema.ts` - Add validation in pre-save hook
3. `src/cron/cron.service.ts` - Add validation before cache updates
4. `src/vendor/vendor.service.ts` - Add validation before cache updates
5. `src/delivery/delivery.service.ts` - Add validation in `acceptOrder()` and filtering logic

