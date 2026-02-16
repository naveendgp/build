# Validation & Rollback Plan — MongoDB → PostgreSQL Migration

> **System**: Otter Laundry API  
> **Risk Level**: HIGH (production system, real money, real users)

---

## 1. Pre-Migration Validation

### 1.1 Source Database Integrity

Before starting migration, confirm the MongoDB source is consistent:

```bash
# Connect to MongoDB and run integrity checks
node -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await MongoClient.connect(process.env.MONGO_URI);
  const db = client.db();

  // 1. Count documents per collection
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(\`\${col.name}: \${count} documents\`);
  }

  // 2. Check for orphaned orders (user_id references)
  const orphanedOrders = await db.collection('orders').aggregate([
    { \$lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'u' } },
    { \$match: { u: { \$size: 0 } } },
    { \$count: 'orphaned' }
  ]).toArray();
  console.log('Orphaned orders (no user):', orphanedOrders[0]?.orphaned ?? 0);

  // 3. Financial checksum
  const paymentSum = await db.collection('payments').aggregate([
    { \$group: { _id: null, total: { \$sum: '\$amount' } } }
  ]).toArray();
  console.log('Total payment amount:', paymentSum[0]?.total ?? 0);

  const transactionSum = await db.collection('transactions').aggregate([
    { \$group: { _id: null, debit: { \$sum: '\$debit' }, credit: { \$sum: '\$credit' } } }
  ]).toArray();
  console.log('Transaction debit:', transactionSum[0]?.debit ?? 0);
  console.log('Transaction credit:', transactionSum[0]?.credit ?? 0);

  await client.close();
})();
"
```

**Record these numbers** — they are your ground truth for post-migration validation.

### 1.2 Target Database Readiness

```bash
# Verify PostgreSQL is accessible
npx prisma db push --accept-data-loss   # Creates schema (DESTRUCTIVE on target)
npx prisma generate                      # Generate Prisma client

# Confirm empty state
psql $DATABASE_URL -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';"
psql $DATABASE_URL -c "SELECT count(*) FROM \"User\";"  # Should be 0
```

---

## 2. During-Migration Monitoring

The migration script (`scripts/migrate-to-postgres.js`) includes built-in monitoring. 
Additionally, watch for:

### 2.1 Real-Time Progress
```bash
# Run with verbose logging
node scripts/migrate-to-postgres.js 2>&1 | tee migration.log
```

### 2.2 Checkpoint Recovery
If migration fails mid-way:
```bash
# Resume from last checkpoint
node scripts/migrate-to-postgres.js --resume
```

The script saves checkpoints after each collection completes to `migration-checkpoint.json`.

### 2.3 Warning Signs During Migration
| Warning | Action |
|---------|--------|
| "Failed to insert batch" messages | Script falls back to individual inserts; check for data issues |
| Foreign key violations | Collection ordering may need adjustment; check the phase configuration |
| Unique constraint violations | Duplicate data in MongoDB; needs manual dedup |
| Memory usage > 2GB | Reduce `--batch-size` (default: 100) |

---

## 3. Post-Migration Validation

### 3.1 Row Count Validation (Automated by Migration Script)

The migration script's `validateMigration()` runs these automatically. You can also run standalone:

```bash
node scripts/migrate-to-postgres.js --validate-only
```

**Expected checks:**

| MongoDB Collection | PostgreSQL Table | Notes |
|---|---|---|
| users | User + UserAddress | 1 user → 1 User row + N UserAddress rows |
| vendors | Vendor + VendorService + VendorServiceItem + VendorOperatingHours + VendorPickupZone | 1 vendor → multiple child rows |
| orders | Order + OrderItem | 1 order → 1 Order + N OrderItem rows |
| payments | Payment | 1:1 |
| transactions | Transaction | 1:1 |
| transactionlogs | TransactionLog | 1:1 |
| services | Service + ServiceItem | 1 service → 1 Service + N ServiceItem rows |
| deliverypersons | DeliveryPerson + DeliveryAssignedOrder + DeliveryPersonRating | 1:N |
| deliverylogs | DeliveryLog | 1:1 |
| notifications | Notification | 1:1 |
| offers | Offer + OfferAssignedUser + OfferUsage + OfferApplicableService | 1:N |
| reviews | Review | 1:1 |
| admins | Admin | 1:1 |
| appconfigs | AppConfig | 1:1 (flattened) |
| appversions | AppVersion | 1:1 |
| appbanners | Banner | 1:1 |
| deliverypersoncaches | DeliveryPersonCache | 1:1 |

### 3.2 Financial Integrity Validation (CRITICAL)

```sql
-- Compare against MongoDB checksum recorded in Step 1.1
SELECT SUM(amount) AS total_payment_amount FROM "Payment";
SELECT SUM(debit) AS total_debit, SUM(credit) AS total_credit FROM "Transaction";

-- Wallet balance validation
SELECT SUM(wallet_balance) AS total_wallet_balance FROM "User";

-- Vendor settlement validation
SELECT SUM(settled_amount) AS total_settled,
       SUM(unsettled_amount) AS total_unsettled
FROM "Vendor";
```

**Tolerance**: Financial sums must match within ±0.01 (floating-point rounding).  
**Failure action**: HALT deployment and investigate discrepancy before proceeding.

### 3.3 Referential Integrity Validation

```sql
-- Orders must reference valid users
SELECT COUNT(*) FROM "Order" o
LEFT JOIN "User" u ON o.user_id = u.id
WHERE u.id IS NULL;
-- Expected: 0

-- Orders must reference valid vendors
SELECT COUNT(*) FROM "Order" o
LEFT JOIN "Vendor" v ON o.vendor_id = v.id
WHERE v.id IS NULL;
-- Expected: 0

-- Payments must reference valid orders
SELECT COUNT(*) FROM "Payment" p
LEFT JOIN "Order" o ON p.order_id = o.id
WHERE o.id IS NULL;
-- Expected: 0

-- Reviews must reference valid users and vendors
SELECT COUNT(*) FROM "Review" r
LEFT JOIN "User" u ON r.user_id = u.id
WHERE u.id IS NULL;
-- Expected: 0
```

### 3.4 Data Integrity Spot Checks

Pick 5-10 random records from each major collection and manually verify:

```sql
-- Pick a random user and verify all fields
SELECT u.*, 
  (SELECT COUNT(*) FROM "UserAddress" WHERE user_id = u.id) AS address_count,
  (SELECT COUNT(*) FROM "Order" WHERE user_id = u.id) AS order_count
FROM "User" u
ORDER BY RANDOM() LIMIT 5;

-- Pick a random order and verify nested data
SELECT o.*, 
  (SELECT COUNT(*) FROM "OrderItem" WHERE order_id = o.id) AS item_count,
  p.amount AS payment_amount,
  p.status AS payment_status
FROM "Order" o
LEFT JOIN "Payment" p ON p.order_id = o.id
ORDER BY RANDOM() LIMIT 5;

-- Pick a random vendor and verify services
SELECT v.name, v.owner_name,
  (SELECT COUNT(*) FROM "VendorService" WHERE vendor_id = v.id) AS service_count,
  (SELECT COUNT(*) FROM "VendorOperatingHours" WHERE vendor_id = v.id) AS hours_count
FROM "Vendor" v
ORDER BY RANDOM() LIMIT 5;
```

### 3.5 Application-Level Smoke Tests

After deploying the refactored backend:

| Test | Endpoint | Expected |
|------|----------|----------|
| User login | POST /auth/send-otp | OTP sent, user looked up |
| User profile | GET /user/profile | All fields present, addresses populated |
| List vendors | POST /user/list-vendors | Vendors with services, ratings |
| Place order | POST /user/place-order | Order created, payment initiated |
| Vendor orders | GET /vendor/view-orders | Orders with items, user info |
| Admin dashboard | GET /admin/dashboard-data | Stats computed correctly |
| Delivery tracking | WebSocket connection | Cache entries created/read |

---

## 4. Rollback Plan

### 4.1 Rollback Strategy Matrix

| Failure Point | Action | Downtime |
|---|---|---|
| **Migration script fails** | Fix and re-run (PostgreSQL is empty; MongoDB untouched) | None — app still on MongoDB |
| **Validation fails post-migration** | Fix data issues, re-run migration on clean PostgreSQL | None — app still on MongoDB |
| **App deployed but errors found within 1 hour** | Revert app deployment, switch back to MongoDB | 5-10 min |
| **App running > 1 hour, critical issue** | Dual-write reverse sync if enabled; otherwise point-in-time MongoDB restore | 15-30 min |

### 4.2 Pre-Deployment Safeguards

1. **MongoDB remains READ-ONLY during migration window**
   - Set app to maintenance mode (503 responses)
   - Or: use a MongoDB read-only user for the migration source

2. **Keep MongoDB running for at least 7 days post-migration**
   - Do NOT drop the MongoDB database
   - Do NOT terminate the MongoDB server
   - Keep connection string available

3. **Tag the last MongoDB-compatible commit**
   ```bash
   git tag pre-postgres-migration
   git push origin pre-postgres-migration
   ```

4. **Docker/deployment rollback**
   ```bash
   # If using Docker
   docker tag otter-api:latest otter-api:pre-postgres
   
   # If using PM2
   pm2 save  # Save current MongoDB-based process list
   ```

### 4.3 Instant Rollback Procedure (< 1 hour post-deploy)

```bash
# Step 1: Revert application code
git checkout pre-postgres-migration
npm install

# Step 2: Restart with MongoDB config
# (MongooseModule will reconnect to the original MongoDB URL)
npm run build
pm2 restart otter-api   # or docker restart

# Step 3: Verify MongoDB connectivity
curl http://localhost:3000/health
```

**No data is lost** because MongoDB was untouched during the window. The app simply switches back.

### 4.4 Late Rollback Procedure (> 1 hour, new data in PostgreSQL)

If users have created new data in PostgreSQL that must be preserved:

```bash
# Step 1: Put app in maintenance mode
# Step 2: Export new PostgreSQL data since migration
psql $DATABASE_URL -c "
  COPY (SELECT * FROM \"Order\" WHERE created_at > '<MIGRATION_TIMESTAMP>') 
  TO '/tmp/new_orders.csv' WITH CSV HEADER;
"

# Step 3: Revert to MongoDB (same as instant rollback)
git checkout pre-postgres-migration
npm install && npm run build && pm2 restart otter-api

# Step 4: Import new data back to MongoDB (manual script needed)
# This requires a reverse mapping script — only needed if significant
# new data was created during the PostgreSQL window.
```

### 4.5 Point-of-No-Return

After **7 days** of stable operation on PostgreSQL with no issues:

1. Remove `mongo_id` fields from PostgreSQL (optional cleanup)
2. Retire MongoDB server
3. Remove Mongoose dependencies from `package.json`
4. Delete `.refactored.ts` files and rename them as the primary service files
5. Remove `DatabaseModule` and all schema files under `src/schemas/`

---

## 5. Dual-Write Strategy (Optional, for Zero-Downtime)

For maximum safety, you can run a dual-write phase:

### Phase A: PostgreSQL shadows MongoDB (read from Mongo, write to both)
```
Client → API → Write to MongoDB (primary) + Write to PostgreSQL (shadow)
Client → API → Read from MongoDB
```

### Phase B: PostgreSQL becomes primary (read from PG, write to both)
```
Client → API → Write to PostgreSQL (primary) + Write to MongoDB (shadow)
Client → API → Read from PostgreSQL
```

### Phase C: MongoDB retired
```
Client → API → Write to PostgreSQL only
Client → API → Read from PostgreSQL
```

**Implementation**: Use NestJS interceptors or service-level wrappers:

```typescript
// Dual-write interceptor (Phase A)
@Injectable()
export class DualWriteInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const result = await firstValueFrom(next.handle());
    
    // Shadow-write to PostgreSQL (fire-and-forget, log errors)
    try {
      await this.shadowWrite(context, result);
    } catch (err) {
      this.logger.error('Shadow write failed', err);
    }
    
    return of(result);
  }
}
```

**Recommendation**: Unless you have > 10K daily active users, a **maintenance-window migration** (30-60 min downtime at low-traffic hours) is simpler and lower-risk than dual-write.

---

## 6. Monitoring Post-Migration

### 6.1 Key Metrics to Watch

| Metric | Tool | Threshold |
|--------|------|-----------|
| API response time (p95) | Application monitoring | < 500ms (compare to MongoDB baseline) |
| Database query time (p95) | Prisma logging / `pg_stat_statements` | < 100ms |
| Error rate | Application logs | < 0.1% |
| Connection pool usage | `pg_stat_activity` | < 80% of pool |
| Disk usage growth | PostgreSQL monitoring | No unexpected spikes |
| Payment success rate | Business metrics | Same as pre-migration |

### 6.2 PostgreSQL-Specific Monitoring

```sql
-- Slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 20;

-- Connection pool usage
SELECT count(*) AS active_connections,
  (SELECT setting FROM pg_settings WHERE name = 'max_connections') AS max_connections
FROM pg_stat_activity;

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Missing indexes (sequential scans on large tables)
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND idx_scan < seq_scan
ORDER BY seq_scan DESC;
```

### 6.3 Alert Thresholds

Set alerts for the first 7 days:

- **P1 (page immediately)**: Payment failures, order creation failures, 5xx error rate > 1%
- **P2 (alert within 1h)**: Response time p95 > 1s, connection pool > 90%
- **P3 (next business day)**: Sequential scans on large tables, disk usage > 80%
