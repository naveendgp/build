# Data Loss Analysis & Recovery Strategy

## What Data is Cached?

The in-memory store caches **ephemeral notification data** for delivery persons:

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

**Important:** This is NOT the source of truth for orders. The actual order data is already persisted in MongoDB:
- `order.status = 'accepted'` ✅ Saved to DB
- `order.driver_id_1` ✅ Saved to DB
- `deliveryPerson.assigned_orders` ✅ Saved to DB

---

## Impact of Cache Loss

### Scenario: Server Restart

**What Happens:**
1. ✅ **Order data is SAFE** - Already saved in MongoDB
2. ❌ **Cache is EMPTY** - Delivery persons won't see pending orders in their app
3. ✅ **Automatic Recovery** - Cron job rebuilds cache within 1 minute

### Data Loss Impact Assessment:

| Data Type | Stored In | Lost on Restart? | Recovery Time | Critical? |
|-----------|-----------|------------------|---------------|-----------|
| **Order Status** | MongoDB | ❌ No | N/A | ✅ Critical |
| **Driver Assignment** | MongoDB | ❌ No | N/A | ✅ Critical |
| **Cache Notifications** | In-Memory | ⚠️ Yes | 1 minute | ⚠️ Temporary UX issue |

---

## Current Recovery Mechanism

### ✅ Cron Job Already Handles Recovery

**File:** `src/cron/cron.service.ts`
**Frequency:** Every 1 minute

```typescript
// Finds all accepted orders without driver
const acceptedOrders = await this.orderModel.find({
  status: 'accepted',
  driver_id_1: null,
  updatedAt: { $lte: twoMinutesAgo }
});

// Rebuilds cache for all relevant delivery persons
for (const order of acceptedOrders) {
  // Fetches delivery persons and rebuilds cache
}
```

**Recovery Time:** Maximum 1 minute delay
**Impact:** Delivery persons see orders again within 1 minute

---

## Solutions (Ranked by Recommendation)

### 🥇 Option 1: Hybrid Approach - Keep In-Memory + Add Recovery on Startup (RECOMMENDED)

**Best of both worlds:**
- ✅ Keep fast in-memory performance
- ✅ Auto-recover cache on server restart
- ✅ No external dependencies

**Implementation:**
```typescript
// In InMemoryStoreService or startup hook
async rebuildCacheOnStartup() {
  const acceptedOrders = await this.orderModel.find({
    status: 'accepted',
    driver_id_1: null,
    updatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 min
  });
  
  // Rebuild cache for all orders
  for (const order of acceptedOrders) {
    // Same logic as vendor/cron service
  }
}
```

**Pros:**
- ✅ Zero performance impact
- ✅ Fast recovery (< 5 seconds)
- ✅ No infrastructure changes

**Cons:**
- ⚠️ Slight delay on startup (can be async)

---

### 🥈 Option 2: Redis (If Multi-Instance Needed)

**Use Redis instead of MongoDB:**
- ✅ In-memory speed (like current)
- ✅ Persistent across restarts
- ✅ Distributed (multi-instance support)
- ✅ Built-in TTL support

**Implementation:**
```typescript
// Replace InMemoryStoreService with Redis
import { Redis } from 'ioredis';

@Injectable()
export class RedisStoreService {
  constructor(private redis: Redis) {}
  
  async set(key: string, value: any, ttlMs?: number) {
    await this.redis.setex(key, Math.floor(ttlMs / 1000), JSON.stringify(value));
  }
  
  async get(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async entries() {
    // Scan all keys matching pattern
    const keys = await this.redis.keys('delivery:*');
    // Fetch all values
  }
}
```

**Pros:**
- ✅ Persistent
- ✅ Fast (in-memory)
- ✅ Distributed
- ✅ Built-in TTL

**Cons:**
- ⚠️ Additional infrastructure (Redis server)
- ⚠️ Network latency (~1-2ms vs < 0.1ms)
- ⚠️ Operational complexity

---

### 🥉 Option 3: MongoDB (NOT RECOMMENDED)

**Store cache in MongoDB:**

**Pros:**
- ✅ Persistent
- ✅ Already have MongoDB

**Cons:**
- ❌ **10-100x slower** than in-memory
- ❌ **High database load** (cron every minute)
- ❌ **Poor real-time performance**
- ❌ **Complex queries** for `entries()` operation

**Performance Impact:**
- Single get: 1ms → 10-50ms
- Full scan (`entries()`): 5ms → 100-500ms
- Cron job: Could take seconds instead of milliseconds

---

## Recommended Solution: Startup Recovery

### Implementation Plan

**Step 1:** Create a recovery service
```typescript
@Injectable()
export class CacheRecoveryService {
  constructor(
    private orderModel: Model<OrderDocument>,
    private deliveryService: DeliveryService,
    private inMemoryStore: InMemoryStoreService,
    private appconfigModel: Model<AppConfigDocument>,
  ) {}

  async rebuildCache() {
    const appConfig = await this.appconfigModel.findOne({ is_active: true }).lean();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const acceptedOrders = await this.orderModel.find({
      status: 'accepted',
      driver_id_1: null,
      updatedAt: { $gte: thirtyMinutesAgo }
    });

    for (const order of acceptedOrders) {
      // Rebuild cache using same logic as vendor/cron service
      const deliveryPersons = await this.deliveryService.getDeliveryPersonByDistance(
        order.user_address,
        order.vendor_address,
        appConfig?.delivery_config?.initial_distance_km || 2,
        new Date(order.created_at.getTime() + appConfig?.delivery_config?.delivery_order_accept_time * 60 * 1000)
      );
      
      // Cache each delivery person
      // ... same logic as vendor.service.ts
    }
  }
}
```

**Step 2:** Call on application startup
```typescript
// In main.ts or app.module.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Rebuild cache on startup
  const cacheRecovery = app.get(CacheRecoveryService);
  await cacheRecovery.rebuildCache().catch(err => {
    console.error('Cache recovery failed:', err);
    // Don't block startup if recovery fails
  });
  
  await app.listen(3000);
}
```

---

## Decision Matrix

| Solution | Performance | Persistence | Recovery Time | Complexity | Cost |
|----------|-------------|------------|---------------|------------|------|
| **Current + Startup Recovery** | ⭐⭐⭐⭐⭐ | ⚠️ Temporary loss | < 5 seconds | ⭐ Low | Free |
| **Redis** | ⭐⭐⭐⭐ | ✅ Persistent | Instant | ⭐⭐ Medium | $ |
| **MongoDB** | ⭐⭐ | ✅ Persistent | Instant | ⭐⭐⭐ High | Free |

---

## Final Recommendation

### ✅ **Keep In-Memory + Add Startup Recovery**

**Why:**
1. ✅ **Performance:** Maintains sub-millisecond latency
2. ✅ **Recovery:** Cache rebuilds in < 5 seconds on startup
3. ✅ **Simple:** No new infrastructure needed
4. ✅ **Cost-effective:** No additional costs
5. ✅ **Existing Safety Net:** Cron job already handles recovery

**Data Loss Reality:**
- **Critical data (orders)** is already in MongoDB ✅
- **Cache data** is temporary notifications (not critical)
- **Recovery happens automatically** (cron every minute)
- **Startup recovery** eliminates even the 1-minute delay

**Conclusion:** The cache is a **performance optimization layer**, not critical data. Adding startup recovery gives you the best of both worlds - fast performance with minimal data loss impact.

---

## Alternative: If You Still Want Persistence

If you absolutely need persistent cache (e.g., multi-instance deployment), use **Redis** instead of MongoDB. It's designed for this exact use case and maintains in-memory speed.

