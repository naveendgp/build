# Cache Set Comparison: Cron Service vs Vendor Service

## Overview
Comparison between how `cron.service.ts` and `vendor.service.ts` set data to the delivery cache collection.

---

## Key Differences

### 1. **TTL (Time To Live) Parameter** ⚠️ CRITICAL DIFFERENCE

**Cron Service** (`handleCronOrders`):
```typescript
await this.mongoCache.set(deliveryPersonId, updatedCacheArray);
// ❌ NO TTL parameter - uses default TTL calculation
```

**Vendor Service** (`markOrderComplete`):
```typescript
await this.mongoCache.set(deliveryPersonId, updatedCacheArray, ttlMs);
// ✅ WITH TTL parameter - explicitly calculated TTL
```

**Impact**: 
- Cron service relies on `mongoCache.set()` to calculate TTL from `order_duration` fields
- Vendor service calculates TTL upfront based on `maxOrderDuration` before calling `set()`
- **This could cause inconsistent cache expiration behavior**

---

### 2. **Socket Publishing Logic** ⚠️ SIGNIFICANT DIFFERENCE

**Cron Service**:
```typescript
// Check if order data has changed before triggering socket
const existingOrder = normalizedExistingArray.find(
  (cachedOrder: any) =>
    cachedOrder.order_id?.toString() === order._id.toString(),
);

const hasOrderChanged = this.hasCacheChanged(
  existingCache,
  updatedCacheArray,
);

// Only publish if order data has changed or it's a new order
if (!existingOrder || hasOrderChanged) {
  await this.trackingGateway.publishEventToGroup(
    deliveryPersonId,
    updatedCacheArray,
    'order-list',
  );
}
```

**Vendor Service**:
```typescript
// Publish all cached objects for this delivery person
await this.trackingGateway.publishEventToGroup(
  deliveryPersonId,
  updatedCacheArray,
  'order-list',
);
// ❌ Always publishes - no change detection
```

**Impact**:
- Cron service only publishes when order data actually changes (optimized)
- Vendor service always publishes (could cause unnecessary socket events)
- **Potential performance difference and inconsistent behavior**

---

### 3. **Variable Declaration Scope**

**Cron Service**:
```typescript
let updatedCacheArray: any[];
let normalizedExistingArray: any[] = []; // Declared outside if/else

if (!existingCache || ...) {
  updatedCacheArray = [newCacheObject];
} else {
  // normalizedExistingArray used here
  normalizedExistingArray = existingArray.map(...);
  // ...
}
// normalizedExistingArray accessible here for socket check
```

**Vendor Service**:
```typescript
let updatedCacheArray: any[];

if (!existingCache || ...) {
  updatedCacheArray = [newCacheObject];
} else {
  // normalizedExistingArray declared inside else block
  const normalizedExistingArray = existingArray.map(...);
  // ...
}
// normalizedExistingArray NOT accessible outside else block
```

**Impact**: 
- Cron service can use `normalizedExistingArray` after the if/else block for socket change detection
- Vendor service cannot access `normalizedExistingArray` outside the else block (but doesn't need to)
- **Not a bug, just different scoping approach**

---

### 4. **TTL Calculation**

**Cron Service**:
```typescript
// No TTL calculation - relies on mongoCache.set() internal logic
// mongoCache.set() calculates TTL from order_duration fields in the array
```

**Vendor Service**:
```typescript
// Calculates TTL BEFORE setting cache
const maxOrderDuration = firstNotify.reduce(
  (max: Date, deliveryPerson: any) => {
    const orderDuration = deliveryPerson.order_duration
      ? new Date(deliveryPerson.order_duration)
      : new Date();
    return orderDuration > max ? orderDuration : max;
  },
  firstNotify[0]?.order_duration
    ? new Date(firstNotify[0].order_duration)
    : new Date(),
);

const currentTime = new Date();
const ttlMs = Math.max(
  0,
  maxOrderDuration.getTime() - currentTime.getTime(),
);
```

**Impact**:
- Vendor service calculates TTL based on ALL delivery persons in `firstNotify` array
- Cron service calculates TTL based on ALL orders in the cache array (including existing ones)
- **Different TTL calculation strategies could lead to different expiration times**

---

## Similarities

✅ Both create `newCacheObject` with identical structure  
✅ Both normalize existing cache entries the same way  
✅ Both check for duplicate orders identically  
✅ Both handle empty cache the same way  
✅ Both use the same normalization logic for old format orders  

---

## Potential Issues

### Issue 1: Inconsistent TTL Behavior
- Cron service: TTL calculated from cache array (includes existing orders)
- Vendor service: TTL calculated from current batch only
- **Result**: Same order might have different TTL depending on which service cached it

### Issue 2: Missing Change Detection in Vendor Service
- Vendor service always publishes socket events, even if nothing changed
- **Result**: Unnecessary network traffic and potential performance impact

### Issue 3: Normalization Logic Missing Validation
Both services have the same issue:
```typescript
normalizedExistingArray = existingArray.map((cachedOrder: any) => {
  // ❌ No validation if cachedOrder.details exists
  if (cachedOrder.details?.order) {
    // ...
  }
  return {
    // ❌ No validation if cachedOrder.details is null/undefined
    details: {
      _id: cachedOrder.details._id, // Could be undefined!
      // ...
    }
  };
});
```

**If `cachedOrder.details` is `null` or `undefined`, this will create an object with all `undefined` values!**

---

## Recommendations

### 1. Standardize TTL Calculation
Both services should use the same TTL calculation strategy. Recommended approach:
```typescript
// Calculate TTL from the updatedCacheArray (includes existing + new orders)
const allOrderDurations = updatedCacheArray
  .map((order: any) => {
    const orderDuration = order.details?.order_duration
      ? new Date(order.details.order_duration)
      : null;
    return orderDuration;
  })
  .filter((duration: Date | null) => duration !== null) as Date[];

if (allOrderDurations.length > 0) {
  const maxOrderDuration = allOrderDurations.reduce(
    (max: Date, duration: Date) => (duration > max ? duration : max),
    allOrderDurations[0],
  );
  const ttlMs = Math.max(0, maxOrderDuration.getTime() - Date.now());
  await this.mongoCache.set(deliveryPersonId, updatedCacheArray, ttlMs);
} else {
  await this.mongoCache.set(deliveryPersonId, updatedCacheArray);
}
```

### 2. Add Change Detection to Vendor Service
```typescript
// After normalization, check if order changed
const existingOrder = normalizedExistingArray.find(
  (cachedOrder: any) =>
    cachedOrder.order_id?.toString() === order._id.toString(),
);

const hasOrderChanged = this.hasCacheChanged(
  existingCache,
  updatedCacheArray,
);

if (!existingOrder || hasOrderChanged) {
  await this.trackingGateway.publishEventToGroup(
    deliveryPersonId,
    updatedCacheArray,
    'order-list',
  );
}
```

### 3. Add Validation in Normalization
```typescript
normalizedExistingArray = existingArray
  .map((cachedOrder: any) => {
    // ✅ Validate details exists
    if (!cachedOrder.details || typeof cachedOrder.details !== 'object') {
      console.warn('Skipping order with invalid details:', cachedOrder.order_id);
      return null;
    }
    
    if (cachedOrder.details?.order) {
      // ... existing normalization
    }
    
    // ✅ Validate required fields exist
    if (!cachedOrder.details._id || !cachedOrder.details.driver_name) {
      console.warn('Skipping order with missing required fields:', cachedOrder.order_id);
      return null;
    }
    
    return {
      order_id: cachedOrder.order_id,
      type: cachedOrder.type || 'order-list',
      details: {
        _id: cachedOrder.details._id,
        driver_name: cachedOrder.details.driver_name,
        // ... rest of fields
      },
    };
  })
  .filter((order) => order !== null); // Remove invalid orders
```

---

## Summary

| Aspect | Cron Service | Vendor Service | Impact |
|--------|-------------|----------------|--------|
| TTL Parameter | ❌ Not passed | ✅ Passed | HIGH - Different expiration behavior |
| Socket Publishing | ✅ Conditional (change detection) | ❌ Always publishes | MEDIUM - Performance difference |
| TTL Calculation | From cache array | From current batch | HIGH - Inconsistent TTL |
| Normalization Validation | ❌ Missing | ❌ Missing | HIGH - Can create empty details |
| Variable Scope | Outside if/else | Inside else block | LOW - Different but acceptable |

**Main Difference**: TTL handling and socket publishing logic are the most significant differences that could cause inconsistent behavior.

