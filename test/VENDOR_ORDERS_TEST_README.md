# Vendor Orders API Test Guide

This test file (`vendor-orders.e2e-spec.ts`) tests the vendor orders API, specifically focusing on timestamp logs generation for different order statuses.

## ⚠️ Important: Database Safety

**This test uses the SAME database connection as your application.** However, it's designed to be safe by:

1. **Using unique test data**: Creates test orders with order numbers >= 999900
2. **Using unique vendor phone**: Creates vendor with phone `+9999999999`
3. **Automatic cleanup**: Deletes all test data after tests complete
4. **No production data modification**: Only creates/deletes test data

## Running the Tests

### Option 1: Run All E2E Tests
```bash
npm run test:e2e
```

### Option 2: Run Only Vendor Orders Tests
```bash
npm run test:e2e -- vendor-orders.e2e-spec.ts
```

### Option 3: Run with Test Database (Recommended)

To use a separate test database, set the `MONGODB_URL` environment variable before running:

```bash
# Windows PowerShell
$env:MONGODB_URL="mongodb://user:pass@host:27017/laundry_backend_test?authSource=admin"
npm run test:e2e -- vendor-orders.e2e-spec.ts

# Linux/Mac
export MONGODB_URL="mongodb://user:pass@host:27017/laundry_backend_test?authSource=admin"
npm run test:e2e -- vendor-orders.e2e-spec.ts
```

## What the Tests Cover

### ✅ Test Cases

1. **Status 2 (accepted/processing/picked_up) Orders**
   - Verifies orders with status `accepted`, `processing`, and `picked_up` are returned
   - Checks that `accepted_at` and `processing_at` timestamps are NOT in updateLogs
   - Verifies `picked_up_at` timestamp IS included when present
   - Checks PHONE and OTP logs are added for orders with `picked_up_at`
   - Verifies "Pending rider" is shown for orders without `picked_up_at`

2. **Status 3 (processed) Orders**
   - Verifies processed orders are returned
   - Checks PHONE and OTP logs for orders with `picked_up_at`
   - Verifies "Pending rider" for orders without `picked_up_at`

3. **Specific Order by ID**
   - Tests fetching a single order with order_id parameter
   - Verifies timestamp logs are generated correctly

4. **No Status Filter**
   - Tests default behavior when no status filter is provided
   - Verifies all orders have updateLogs

5. **Pagination**
   - Tests pagination parameters (page, limit)
   - Verifies pagination metadata

6. **Authentication**
   - Verifies API requires authentication
   - Tests with invalid/missing tokens

7. **Active Vendor Only**
   - Verifies only active vendors can view orders
   - Tests with inactive vendor

## Test Data Created

The test creates:
- 1 test vendor (phone: `+9999999999`)
- 6 test orders (order numbers: 999901-999906) with different statuses:
  - Order 999901: `accepted` (has `accepted_at`, no `picked_up_at`)
  - Order 999902: `processing` (has `accepted_at`, `processing_at`, no `picked_up_at`)
  - Order 999903: `picked_up` (has `accepted_at`, `picked_up_at`)
  - Order 999904: `processed` (has `accepted_at`, `picked_up_at`, `processed_at`)
  - Order 999905: `processed` (has `accepted_at`, `processed_at`, no `picked_up_at`)
  - Order 999906: `delivered` (has all timestamps)

## Expected Results

### Status 2 Orders Should Have:
- **Order 999901 (accepted)**: `updateLogs` with "Pending rider" (no timestamps)
- **Order 999902 (processing)**: `updateLogs` with "Pending rider" (no timestamps)
- **Order 999903 (picked_up)**: `updateLogs` with:
  - `picked_up` with timestamp
  - `PHONE` with timestamp
  - `OTP` with timestamp
  - **NO** `accepted_at` or `processing_at` in logs

### Status 3 Orders Should Have:
- **Order 999904 (processed with pickup)**: `updateLogs` with:
  - `PHONE` with timestamp
  - `OTP` with timestamp
  - **NO** "Pending rider"
- **Order 999905 (processed without pickup)**: `updateLogs` with:
  - "Pending rider" (no timestamp)

## Troubleshooting

### Test Fails with Database Connection Error
- Check your MongoDB connection string in `src/config/database.config.ts`
- Verify network connectivity to MongoDB server
- Check if MongoDB server is running

### Test Fails with Authentication Error
- Verify JWT secrets are configured correctly
- Check if vendor token generation is working

### Test Data Not Cleaned Up
- Check if test vendor phone `+9999999999` exists in database
- Check if orders with numbers 999900-999999 exist
- Manually delete if needed:
  ```javascript
  // In MongoDB shell or script
  db.vendors.deleteMany({ phone: '+9999999999' })
  db.orders.deleteMany({ order_number: { $gte: 999900 } })
  ```

## Safety Recommendations

1. **Use Test Database**: Set `MONGODB_URL` to point to a test database
2. **Backup Before Testing**: If using production database, backup first
3. **Review Test Data**: Check what data will be created/deleted
4. **Run in Isolation**: Don't run tests while application is running
5. **Monitor Cleanup**: Verify test data is deleted after tests

## Notes

- Tests use real database operations (not mocks)
- All test data is automatically cleaned up in `afterAll`
- Test orders use high order numbers (999900+) to avoid conflicts
- Test vendor uses unique phone number to avoid conflicts

