# Migration Checklist — MongoDB → PostgreSQL

> **System**: Otter Laundry API (NestJS)  
> **From**: MongoDB 7.x + Mongoose 8.x  
> **To**: PostgreSQL 16+ + Prisma 6.x  

---

## Phase 0: Preparation (1-2 days before migration)

### Infrastructure
- [ ] Provision PostgreSQL 16+ server (RDS, Cloud SQL, or self-hosted)
- [ ] Configure PostgreSQL: `max_connections >= 100`, `shared_buffers = 25% RAM`, `work_mem = 64MB`
- [ ] Set `DATABASE_URL` environment variable: `postgresql://user:pass@host:5432/otter_db?schema=public`
- [ ] Verify network connectivity from app server to PostgreSQL
- [ ] Enable `pg_stat_statements` extension for query monitoring
- [ ] Set up automated PostgreSQL backups (daily snapshots)

### Codebase
- [ ] Install Prisma dependencies:
  ```bash
  npm install @prisma/client
  npm install -D prisma
  ```
- [ ] Copy `prisma/schema.prisma` into project root's `prisma/` directory
- [ ] Run `npx prisma generate` to generate the Prisma client
- [ ] Run `npx prisma db push` against the target PostgreSQL to create tables
- [ ] Run post-Prisma SQL constraints:
  ```bash
  psql $DATABASE_URL -f prisma/post-migration-constraints.sql
  ```
- [ ] Verify all 30+ tables created: `npx prisma db pull` and compare
- [ ] Copy `src/prisma/prisma.module.ts`, `prisma.service.ts`, and `index.ts` into project
- [ ] Commit all Prisma files to a feature branch (`feature/postgres-migration`)

### Data Baseline
- [ ] Record MongoDB document counts for every collection (save to a file)
- [ ] Record financial checksums (total payment amounts, transaction debits/credits, wallet balances)
- [ ] Take a MongoDB dump/snapshot as final backup:
  ```bash
  mongodump --uri="$MONGO_URI" --out=./mongo-backup-$(date +%Y%m%d)
  ```
- [ ] Tag the current MongoDB-compatible deployment:
  ```bash
  git tag pre-postgres-migration
  git push origin pre-postgres-migration
  ```

### Testing
- [ ] Run migration script in dry-run mode against a staging/test PostgreSQL:
  ```bash
  node scripts/migrate-to-postgres.js --dry-run
  ```
- [ ] Run full migration against staging PostgreSQL and validate counts
- [ ] Deploy refactored backend to staging and run smoke tests
- [ ] Run the full test suite against staging PostgreSQL
- [ ] Fix any issues found and repeat staging migration

---

## Phase 1: Migration Window (30-60 min planned downtime)

### Enter Maintenance Mode
- [ ] Choose a low-traffic window (e.g., 2 AM - 4 AM local time)
- [ ] Enable maintenance mode / return 503 from API
- [ ] Stop all cron jobs (`@nestjs/schedule` jobs) 
- [ ] Wait for in-flight requests to complete (30 seconds)
- [ ] Disconnect all WebSocket clients

### Execute Migration
- [ ] Verify PostgreSQL target is empty:
  ```sql
  SELECT count(*) FROM "User";  -- Must be 0
  ```
- [ ] Run the migration script:
  ```bash
  node scripts/migrate-to-postgres.js 2>&1 | tee migration-$(date +%Y%m%d-%H%M).log
  ```
- [ ] Monitor for errors in real-time (the script prints progress per collection)
- [ ] If script fails: check `migration-checkpoint.json`, fix issue, run `--resume`

### Validate Migration
- [ ] Run post-migration validation:
  ```bash
  node scripts/migrate-to-postgres.js --validate-only
  ```
- [ ] Verify row counts match expectations (see VALIDATION_ROLLBACK_PLAN.md §3.1)
- [ ] Verify financial checksums match (see VALIDATION_ROLLBACK_PLAN.md §3.2)
- [ ] Run referential integrity queries (see VALIDATION_ROLLBACK_PLAN.md §3.3)
- [ ] Spot-check 5 random users, 5 random orders, 5 random vendors manually

### Decision Gate
- [ ] **ALL validations pass** → Proceed to Phase 2
- [ ] **Any validation fails** → Fix and re-run on clean PostgreSQL, OR → Rollback (see §4)

---

## Phase 2: Application Deployment

### Deploy Refactored Backend
- [ ] Merge `feature/postgres-migration` branch
- [ ] Replace service files:
  - `user.service.ts` ← from `user.service.refactored.ts` patterns
  - `vendor.service.ts` ← from `vendor.service.refactored.ts` patterns
  - `delivery.service.ts` ← from `delivery.service.refactored.ts` patterns
  - `admin.service.ts` ← from `admin.service.refactored.ts` patterns
  - `cron.service.ts` ← from `cron.service.refactored.ts` patterns
  - `offer.service.ts` ← from `offer.service.refactored.ts` patterns
  - `mongo-cache.service.ts` ← replace with `prisma-cache.service.ts`
  - `jwt.helper.ts` ← from `jwt.helper.refactored.ts` patterns
  - `guards/user.guard.ts` ← from `user.guard.refactored.ts` patterns
  - `guards/delivery.guard.ts` ← from `delivery.guard.refactored.ts` patterns
  - `tracking.gateway.ts` ← from `tracking.gateway.refactored.ts` patterns
  - `invoice.helper.ts` ← from `invoice.helper.refactored.ts` patterns
  - `order-status.helper.ts` ← from `order-status.helper.refactored.ts` patterns
  - `notification.helper.ts` ← from `notification.helper.refactored.ts` patterns
  - `vendor.helper.ts` ← from `vendor.helper.refactored.ts` patterns (ObjectId → string comparison)
  - `scripts/seed-admin.ts` ← from `seed-admin.refactored.ts` patterns (enum import from @prisma/client)
- [ ] Update `app.module.ts`:
  - Remove `MongooseModule.forRootAsync(...)` import
  - Remove `DatabaseModule` import
  - Add `PrismaModule` import (see `app.module.refactored.ts`)
- [ ] Update each feature module to remove `@InjectModel()` and inject `PrismaService` instead
- [ ] Remove `src/schemas/` directory (Mongoose schema definitions)
- [ ] Remove `src/database/` directory (DatabaseModule with schema registrations)
- [ ] Build the application: `npm run build`
- [ ] Verify no compilation errors: `npx tsc --noEmit`

### Deploy
- [ ] Deploy to production server
- [ ] Verify application starts without errors (check logs)
- [ ] Verify PrismaService connects to PostgreSQL (health check endpoint)
- [ ] Disable maintenance mode

### Smoke Test Production
- [ ] Test user login flow (send OTP → verify OTP)
- [ ] Test user profile retrieval (GET /user/profile)
- [ ] Test vendor listing (POST /user/list-vendors)
- [ ] Test order placement (POST /user/place-order)
- [ ] Test payment flow (webhook callback)
- [ ] Test vendor order view (GET /vendor/view-orders)
- [ ] Test admin dashboard (GET /admin/dashboard-data)
- [ ] Test WebSocket delivery tracking
- [ ] Test push notifications (FCM)
- [ ] Test cron jobs (trigger manually if possible)

---

## Phase 3: Monitoring (Days 1-7)

### Day 1 (Critical Watch)
- [ ] Monitor error rate continuously for first 4 hours
- [ ] Check API response times vs. MongoDB baseline
- [ ] Verify no payment failures
- [ ] Check PostgreSQL connection pool usage (`pg_stat_activity`)
- [ ] Check for slow queries (`pg_stat_statements`)
- [ ] Verify cron jobs execute correctly at scheduled times
- [ ] Keep MongoDB server running (do NOT shut down)

### Days 2-3
- [ ] Review application logs for any Prisma-related warnings
- [ ] Check disk usage on PostgreSQL server
- [ ] Verify all scheduled reports/settlements are correct
- [ ] Compare daily order counts with typical MongoDB-era numbers
- [ ] Run financial reconciliation (daily totals match expectations)

### Days 4-7
- [ ] Analyze slow query log and add indexes if needed:
  ```sql
  -- Example: if vendor search by city is slow
  CREATE INDEX idx_vendor_city ON "Vendor"(city);
  ```
- [ ] Optimize any queries with high sequential scan counts
- [ ] Run vacuum/analyze on PostgreSQL:
  ```sql
  VACUUM ANALYZE;
  ```
- [ ] Confirm no users/vendors have reported issues

### Decision Gate: Day 7
- [ ] **7 days stable, no rollback needed** → Proceed to Phase 4
- [ ] **Issues found but manageable** → Fix and extend monitoring
- [ ] **Critical issues** → Execute rollback plan (see VALIDATION_ROLLBACK_PLAN.md §4)

---

## Phase 4: Cleanup (After Day 7)

### Remove MongoDB Dependencies
- [ ] Uninstall Mongoose packages:
  ```bash
  npm uninstall mongoose @nestjs/mongoose
  ```
- [ ] Delete all Mongoose schema files: `src/schemas/*.ts`
- [ ] Delete `src/database/` directory
- [ ] Delete `.refactored.ts` files (after merging their logic into the main files)
- [ ] Delete `mongo_id` column from all PostgreSQL tables (optional):
  ```sql
  -- Only after confirming no code references mongo_id
  ALTER TABLE "User" DROP COLUMN mongo_id;
  ALTER TABLE "Vendor" DROP COLUMN mongo_id;
  -- ... etc for all tables
  ```
- [ ] Remove MongoDB connection config from `database.config.ts`
- [ ] Update `.env` / environment to remove `MONGO_URI`

### Finalize
- [ ] Run full test suite one final time
- [ ] Update README.md with PostgreSQL setup instructions
- [ ] Update deployment documentation
- [ ] Archive MongoDB backup (keep for 90 days minimum)
- [ ] Shut down MongoDB server (after 30-day grace period recommended)
- [ ] Remove migration script from active codebase (keep in git history)
- [ ] Delete `migration-checkpoint.json` if present
- [ ] Celebrate 🎉

---

## Quick Reference: File Map

| What | File | Status |
|------|------|--------|
| Prisma schema | `prisma/schema.prisma` | ✅ Created |
| Migration script | `scripts/migrate-to-postgres.js` | ✅ Created |
| PrismaModule | `src/prisma/prisma.module.ts` | ✅ Created |
| PrismaService | `src/prisma/prisma.service.ts` | ✅ Created |
| User service refactor | `src/user/user.service.refactored.ts` | ✅ Created |
| Vendor service refactor | `src/vendor/vendor.service.refactored.ts` | ✅ Created |
| Delivery service refactor | `src/delivery/delivery.service.refactored.ts` | ✅ Created |
| Admin service refactor | `src/admin/admin.service.refactored.ts` | ✅ Created |
| Cron service refactor | `src/cron/cron.service.refactored.ts` | ✅ Created |
| Offer service refactor | `src/offer/offer.service.refactored.ts` | ✅ Created |
| Cache service refactor | `src/store/prisma-cache.service.ts` | ✅ Created |
| App module refactor | `src/app.module.refactored.ts` | ✅ Created |
| Auth JWT helper refactor | `src/auth/jwt.helper.refactored.ts` | ✅ Created |
| User guard refactor | `src/auth/guards/user.guard.refactored.ts` | ✅ Created |
| Delivery guard refactor | `src/auth/guards/delivery.guard.refactored.ts` | ✅ Created |
| Tracking gateway refactor | `src/delivery/tracking.gateway.refactored.ts` | ✅ Created |
| Invoice helper refactor | `src/helper/invoice.helper.refactored.ts` | ✅ Created |
| Order status helper refactor | `src/helper/order-status.helper.refactored.ts` | ✅ Created |
| Notification helper refactor | `src/helper/notification.helper.refactored.ts` | ✅ Created |
| Vendor helper refactor | `src/helper/vendor.helper.refactored.ts` | ✅ Created |
| Seed admin script refactor | `src/scripts/seed-admin.refactored.ts` | ✅ Created |
| Module refactoring guide | `src/modules.refactored.ts` | ✅ Created |
| SQL constraints & triggers | `prisma/post-migration-constraints.sql` | ✅ Created |
| Validation & rollback | `docs/VALIDATION_ROLLBACK_PLAN.md` | ✅ Created |
| This checklist | `docs/MIGRATION_CHECKLIST.md` | ✅ Created |

---

## Dependencies to Install

```bash
# Production
npm install @prisma/client

# Development
npm install -D prisma

# Initialize (first time only)
npx prisma init

# After schema changes
npx prisma generate
npx prisma db push        # Dev/migration: push schema to DB
# OR
npx prisma migrate dev    # Dev: create migration files
npx prisma migrate deploy # Production: apply migration files
```

---

## Environment Variables

```env
# NEW: PostgreSQL connection
DATABASE_URL="postgresql://otter_user:secure_password@pg-host:5432/otter_db?schema=public&connection_limit=20"

# REMOVE after Phase 4:
# MONGO_URI=mongodb://otterprod:...@db-otter.otterlaundry.com:27017/otter-db
```

---

## Emergency Contacts / Escalation

| Situation | Action |
|-----------|--------|
| Migration script errors | Check `migration.log` and `migration-checkpoint.json` |
| App won't start after deploy | Check Prisma connection: `npx prisma db pull` |
| Financial discrepancy found | HALT everything, rollback immediately, investigate |
| Slow queries in production | Check `pg_stat_statements`, add indexes |
| Rollback needed | See `docs/VALIDATION_ROLLBACK_PLAN.md` §4.3 |
