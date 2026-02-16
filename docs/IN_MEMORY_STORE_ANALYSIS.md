# In-Memory Store Usage Analysis & Database Replacement Impact

## Current Usage Summary

### Files Using InMemoryStoreService:
1. **vendor.service.ts** - `acceptOrder()` method
2. **cron.service.ts** - `handleCronOrders()` method (runs every 1 minute)
3. **delivery.service.ts** - `acceptOrder()` method

---

## Detailed Usage Patterns

### 1. Vendor Service (`vendor.service.ts`)
**Location:** `acceptOrder()` method (lines 454-512)

**Purpose:** Cache order assignments for delivery persons when vendor accepts an order

**Operations:**
- `get(deliveryPersonId)` - Check if delivery person already has cached orders
- `set(deliveryPersonId, array, ttl)` - Store/update order list with TTL

**Frequency:** 
- Triggered on-demand when vendor accepts order
- Could be high volume during peak hours

**Data Structure:**
```typescript
{
  deliveryPersonId: [
    {
      order_id: ObjectId,
      type: 'order-list',
      details: { ...deliveryPersonData }
    }
  ]
}
```

**TTL:** Based on max `order_duration` from all delivery persons

---

### 2. Cron Service (`cron.service.ts`)
**Location:** `handleCronOrders()` method (lines 23-109)

**Purpose:** Periodically refresh order assignments for delivery persons for unassigned orders

**Operations:**
- `get(deliveryPersonId)` - Check existing cache
- `set(deliveryPersonId, array, ttl)` - Update cache

**Frequency:** 
- Runs **every 1 minute** (cron: `*/1 * * * *`)
- Processes all accepted orders without `driver_id_1`
- Could process multiple orders per run

**Data Structure:** Same as vendor service

**TTL:** Same calculation as vendor service

---

### 3. Delivery Service (`delivery.service.ts`)
**Location:** `acceptOrder()` method (lines 430-517)

**Purpose:** When delivery person accepts order, remove it from ALL other delivery persons' caches

**Operations:**
- `entries()` - **Get ALL cached entries** (full scan)
- `get(deliveryPersonId)` - Read individual entries
- `set(deliveryPersonId, array, ttl)` - Update after filtering
- `delete(deliveryPersonId)` - Remove if no orders left

**Frequency:**
- Triggered on-demand when delivery person accepts order
- Moderate frequency

**Critical Operation:**
```typescript
const allCacheEntries = this.inMemoryStore.entries(); // GETS ALL ENTRIES
for (const [deliveryPersonId, cachedOrders] of allCacheEntries) {
  // Filter and update each entry
}
```

---

## Performance Characteristics: Current (In-Memory)

### Operation Complexities:
- `get(key)`: **O(1)** - Map lookup
- `set(key, value)`: **O(1)** - Map insert/update
- `delete(key)`: **O(1)** - Map delete
- `entries()`: **O(n)** - Iterate all entries (n = number of delivery persons with cache)

### Latency:
- **Read operations:** < 1ms (in-memory)
- **Write operations:** < 1ms (in-memory)
- **Full scan (`entries()`):** ~1-5ms for 100-1000 entries

### Memory Usage:
- Estimated: ~1-5KB per delivery person entry
- For 1000 active delivery persons: ~1-5MB
- With TTL auto-expiration, memory self-manages

### Advantages:
✅ **Extremely fast** - No network/Database I/O
✅ **Automatic TTL expiration** - Built-in cleanup
✅ **Low latency** - Critical for real-time WebSocket updates
✅ **No database load** - Reduces MongoDB queries
✅ **Simple implementation** - No schema design needed

---

## Performance Impact: If Replaced with Database

### Proposed Database Schema:
```typescript
// DeliveryPersonCache Collection
{
  delivery_person_id: ObjectId (indexed, unique),
  cached_orders: Array<{
    order_id: ObjectId,
    type: string,
    details: object
  }>,
  expires_at: Date (indexed),
  updated_at: Date
}
```

### Operation Complexities (with MongoDB):

#### 1. Vendor Service - `acceptOrder()`
**Current:**
```typescript
const existingCache = this.inMemoryStore.get(deliveryPersonId); // O(1)
this.inMemoryStore.set(deliveryPersonId, updatedArray, ttlMs); // O(1)
```
**With DB:**
```typescript
const existingCache = await cacheModel.findOne({ 
  delivery_person_id: deliveryPersonId 
}); // O(log n) with index + network latency
await cacheModel.findOneAndUpdate(
  { delivery_person_id: deliveryPersonId },
  { cached_orders: updatedArray, expires_at: new Date(Date.now() + ttlMs) },
  { upsert: true }
); // O(log n) + network latency + write
```

**Impact:**
- **Latency:** 1ms → **10-50ms** (5-50x slower)
- **Database Load:** 2 queries per delivery person per order acceptance
- **Throughput:** Significantly reduced during peak hours

---

#### 2. Cron Service - `handleCronOrders()` (Every 1 minute)
**Current:**
```typescript
const existingCache = this.inMemoryStore.get(deliveryPersonId); // O(1)
this.inMemoryStore.set(deliveryPersonId, updatedArray, ttlMs); // O(1)
```
**With DB:**
- Same as vendor service

**Impact:**
- **Cron runs every minute** - High frequency
- **Multiple orders processed** - Could be 10-50 orders per run
- **Database Load:** 20-100 queries per minute just for cache operations
- **Cron Performance:** Could become bottleneck if many orders

---

#### 3. Delivery Service - `acceptOrder()` ⚠️ **CRITICAL IMPACT**
**Current:**
```typescript
const allCacheEntries = this.inMemoryStore.entries(); // O(n) but fast
for (const [deliveryPersonId, cachedOrders] of allCacheEntries) {
  // Process in memory
}
```
**With DB:**
```typescript
// Option 1: Fetch all entries
const allCacheEntries = await cacheModel.find({
  expires_at: { $gt: new Date() }
}); // O(n) + network latency + scan

// Option 2: Query by order_id (requires array search)
const entriesWithOrder = await cacheModel.find({
  'cached_orders.order_id': orderId,
  expires_at: { $gt: new Date() }
}); // O(n) + network latency

// Then update each
for (const entry of entriesWithOrder) {
  await cacheModel.findByIdAndUpdate(entry._id, {
    $pull: { cached_orders: { order_id: orderId } }
  }); // Multiple queries
}
```

**Impact:**
- **Latency:** ~5ms → **100-500ms** (20-100x slower)
- **Database Load:** 
  - 1 query to find all entries with order
  - N queries to update each entry (N = number of delivery persons with that order)
- **User Experience:** Delay in WebSocket notifications
- **Scalability:** Doesn't scale well with many delivery persons

---

## Performance Comparison Table

| Operation | In-Memory | Database | Impact |
|-----------|-----------|----------|--------|
| **Single get()** | < 1ms | 10-50ms | 10-50x slower |
| **Single set()** | < 1ms | 10-50ms | 10-50x slower |
| **entries() (100 entries)** | ~1-5ms | 50-200ms | 10-40x slower |
| **entries() (1000 entries)** | ~5-10ms | 200-1000ms | 20-100x slower |
| **TTL Expiration** | Automatic (in-memory) | Manual cleanup job needed | Operational overhead |

---

## Database Replacement Challenges

### 1. **TTL Management**
- **Current:** Automatic with setTimeout
- **DB:** Need scheduled job to delete expired entries
- **Additional:** Cron job overhead, potential memory leaks if job fails

### 2. **Real-time Updates**
- **Current:** Instant cache updates → instant WebSocket notifications
- **DB:** Network latency delays notifications
- **Impact:** Delivery persons see stale data longer

### 3. **Scalability**
- **Current:** Scales with server RAM (can handle thousands of entries)
- **DB:** Database becomes bottleneck
- **Concurrency:** Multiple queries competing for same resources

### 4. **Cost**
- **Current:** Free (uses server RAM)
- **DB:** Database I/O costs, connection pool usage
- **Infrastructure:** May need database scaling

### 5. **Data Consistency**
- **Current:** Single server memory (could be lost on restart)
- **DB:** Persistent but needs connection pooling
- **Multi-instance:** If multiple app instances, need Redis or shared DB

---

## Recommendations

### ❌ **DO NOT Replace with Database** because:

1. **Performance Critical:** 
   - Real-time WebSocket updates need < 10ms latency
   - Database queries add 10-50ms latency per operation

2. **High Frequency Operations:**
   - Cron runs every minute
   - Multiple operations per vendor order acceptance
   - Delivery person accept triggers full scan

3. **Scalability:**
   - Database becomes bottleneck
   - In-memory handles thousands of entries efficiently

4. **Cost Efficiency:**
   - Database queries cost more than memory
   - Adds unnecessary database load

### ✅ **Current Implementation is Optimal** because:

1. **Ephemeral Data:** Cache data is temporary (TTL-based), doesn't need persistence
2. **Real-time Requirements:** WebSocket updates need instant cache access
3. **High Throughput:** Vendor accepts order → multiple delivery persons cached
4. **Memory Efficiency:** TTL auto-expires, self-managing

### 🔄 **If Multiple Instances Needed:**

Instead of database, use **Redis**:
- ✅ Fast (in-memory)
- ✅ Distributed (shared across instances)
- ✅ Built-in TTL support
- ✅ Pub/Sub for real-time updates
- ⚠️ Adds infrastructure complexity

### 📊 **Hybrid Approach (If Needed):**

Keep in-memory for:
- Active delivery person caches
- Real-time operations

Use database for:
- Historical tracking
- Analytics
- Audit logs

---

## Conclusion

**Current in-memory store implementation is well-suited for this use case.**

Replacing with database would:
- ❌ Slow down operations by 10-100x
- ❌ Increase database load significantly
- ❌ Add operational complexity (TTL management)
- ❌ Reduce real-time responsiveness
- ❌ Not provide significant benefits (data is ephemeral)

**Recommendation:** Keep current implementation unless you need multi-instance support (then consider Redis).

