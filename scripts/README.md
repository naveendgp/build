# Scripts Documentation

This directory contains utility scripts for the laundry backend system.

## Available Scripts

- **backup-database.js** - Production-level MongoDB database backup script
- **restore-database.js** - Production-level MongoDB database restore script
- **register-vendor.js** - Register vendors using API endpoints
- **create-vendor-mock.js** - Create vendors with mock data
- **update-app-config.js** - Update app configuration
- **update-vendor-services.js** - Update vendor services
- **send-test-notifications.js** - Send test push notifications to users
- **populate-all-collections.js** - Seed MongoDB collections from the `/dump` JSON files

---

# Database Backup Script

`backup-database.js` is a production-ready MongoDB backup script that creates compressed, timestamped backups with automatic cleanup and verification.

## Prerequisites

- Node.js installed
- MongoDB Database Tools installed (`mongodump` command)
  - Download: https://www.mongodb.com/try/download/database-tools
  - Or install via package manager: `apt-get install mongodb-database-tools` (Ubuntu/Debian)

## Features

- ✅ **Automatic Compression** - Compresses backups to save disk space
- ✅ **Timestamped Backups** - Each backup has a unique timestamp
- ✅ **Backup Verification** - Verifies backup integrity after creation
- ✅ **Automatic Cleanup** - Removes old backups based on retention policy
- ✅ **Comprehensive Logging** - Detailed logs with timestamps
- ✅ **Error Handling** - Robust error handling with clear messages
- ✅ **Cron-Ready** - Can be run manually or scheduled via cron

## Usage

### Using NPM Commands (Recommended)

```bash
# Basic backup
npm run backup

# Quiet mode (for cron jobs)
npm run backup:quiet

# Show help
npm run backup:help
```

### Direct Node Execution

```bash
# Basic backup
node scripts/backup-database.js
```

Both methods will:
- Use the default MongoDB URI from environment or config
- Create a compressed backup in `./backups/` directory
- Keep backups for 30 days (default)
- Verify backup integrity

### Custom Options

You can pass additional options to npm scripts using `--`:

```bash
# Custom backup directory
npm run backup -- --backup-dir /var/backups/mongodb

# Keep backups for 90 days
npm run backup -- --retention-days 90

# Custom MongoDB URI
npm run backup -- --uri "mongodb://user:pass@host:27017/dbname"

# Disable compression
npm run backup -- --no-compress

# Skip verification (faster, but less safe)
npm run backup -- --no-verify

# Verbose mode (detailed output)
npm run backup -- --verbose
```

Or use direct node execution:

```bash
# Custom backup directory
node scripts/backup-database.js --backup-dir /var/backups/mongodb

# Keep backups for 90 days
node scripts/backup-database.js --retention-days 90

# Custom MongoDB URI
node scripts/backup-database.js --uri "mongodb://user:pass@host:27017/dbname"

# Disable compression
node scripts/backup-database.js --no-compress

# Skip verification (faster, but less safe)
node scripts/backup-database.js --no-verify

# Quiet mode (for cron jobs)
node scripts/backup-database.js --quiet

# Verbose mode (detailed output)
node scripts/backup-database.js --verbose
```

## Options

- `--uri <string>` - MongoDB connection URI (defaults to env vars or config)
- `--db <string>` - Database name (default: `laundry_backend`)
- `--backup-dir <path>` - Backup directory path (default: `./backups`)
- `--retention-days <number>` - Days to keep backups (default: `30`)
- `--compress` - Enable compression (default: enabled)
- `--no-compress` - Disable compression
- `--verify` - Verify backup integrity (default: enabled)
- `--no-verify` - Skip verification
- `--quiet` - Minimal output (useful for cron)
- `--verbose` - Detailed output
- `--help, -h` - Show help message

## Environment Variables

The script uses these environment variables (in order of precedence):

- `MONGODB_URI` - Primary MongoDB connection string
- `MONGODB_URL` - Alternative env var for URI
- `DATABASE_URL` - Alternative env var for URI

If none are set, it falls back to the default production URI from config.

## Automated Backups (Cron)

### Daily Backup at 2 AM

Add to crontab (`crontab -e`):

```bash
# Using npm (recommended)
0 2 * * * cd /path/to/backend-laundry && npm run backup:quiet >> /var/log/mongodb-backup.log 2>&1

# Or using node directly
0 2 * * * cd /path/to/backend-laundry && node scripts/backup-database.js --quiet >> /var/log/mongodb-backup.log 2>&1
```

### Multiple Daily Backups

```bash
# Backup every 6 hours (using npm)
0 */6 * * * cd /path/to/backend-laundry && npm run backup:quiet -- --retention-days 7 >> /var/log/mongodb-backup.log 2>&1

# Or using node directly
0 */6 * * * cd /path/to/backend-laundry && node scripts/backup-database.js --quiet --retention-days 7 >> /var/log/mongodb-backup.log 2>&1
```

### Weekly Backup with Extended Retention

```bash
# Every Sunday at 3 AM, keep for 90 days (using npm)
0 3 * * 0 cd /path/to/backend-laundry && npm run backup:quiet -- --retention-days 90 >> /var/log/mongodb-backup-weekly.log 2>&1

# Or using node directly
0 3 * * 0 cd /path/to/backend-laundry && node scripts/backup-database.js --quiet --retention-days 90 >> /var/log/mongodb-backup-weekly.log 2>&1
```

## Backup Structure

Backups are stored in the backup directory with the following structure:

```
backups/
├── backup_2024-01-15_14-30-00.tar.gz    # Compressed backup
├── backup_2024-01-16_14-30-00.tar.gz
└── backup_2024-01-17_14-30-00.tar.gz
```

Each backup contains:
- All collections from the database
- Metadata files (`.metadata.json`)
- Compressed BSON files (`.bson.gz`)

## Restoring from Backup

See the [Database Restore Script](#database-restore-script) section below for detailed restore instructions.

The restore script automatically handles:
- Compressed backups (`.tar.gz`)
- Uncompressed backup directories
- Automatic extraction
- Backup verification
- Restore to any MongoDB URI

## Example Output

```
ℹ️ [2024-01-15T14:30:00.000Z] Starting MongoDB backup...
ℹ️ [2024-01-15T14:30:00.100Z] Backup destination: /path/to/backups/backup_2024-01-15_14-30-00
✅ [2024-01-15T14:30:05.500Z] MongoDB backup completed successfully
ℹ️ [2024-01-15T14:30:05.600Z] Verifying backup integrity...
✅ [2024-01-15T14:30:05.700Z] Backup verified: 10 collection(s) backed up
ℹ️ [2024-01-15T14:30:05.800Z] Compressing backup...
✅ [2024-01-15T14:30:10.200Z] Backup compressed: /path/to/backups/backup_2024-01-15_14-30-00.tar.gz
✅ [2024-01-15T14:30:10.300Z] Backup size: 45.23 MB
ℹ️ [2024-01-15T14:30:10.400Z] Cleaning up backups older than 30 days...
✅ [2024-01-15T14:30:10.500Z] Cleaned up 3 old backup(s), freed 120.50 MB
✅ [2024-01-15T14:30:10.600Z] Backup completed successfully in 10.60s
ℹ️ [2024-01-15T14:30:10.700Z] Backup location: /path/to/backups/backup_2024-01-15_14-30-00.tar.gz
```

## Error Handling

The script handles various error scenarios:

- **mongodump not found** - Exits with clear error message and installation instructions
- **Connection failures** - Logs error and exits with non-zero code
- **Backup verification failures** - Logs warning but continues (backup may still be usable)
- **Compression failures** - Falls back to uncompressed backup
- **Cleanup failures** - Logs warning but doesn't fail the backup

## Best Practices

1. **Regular Backups** - Schedule daily backups at low-traffic times
2. **Offsite Storage** - Copy backups to S3, remote server, or cloud storage
3. **Test Restores** - Periodically test restoring from backups
4. **Monitor Disk Space** - Ensure backup directory has sufficient space
5. **Retention Policy** - Adjust retention days based on storage capacity
6. **Notification** - Set up alerts for backup failures (check exit codes)

## Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lh backups/ | tail -10

# Check backup sizes
du -sh backups/*

# View backup log
tail -f /var/log/mongodb-backup.log
```

### Alert on Backup Failure

Add to cron job with email notification:

```bash
0 2 * * * cd /path/to/backend-laundry && node scripts/backup-database.js --quiet || echo "Backup failed!" | mail -s "MongoDB Backup Failed" admin@example.com
```

## Notes

- Backups are created using `mongodump` which is the official MongoDB backup tool
- Compression reduces backup size by 60-80% typically
- Backup verification checks for file existence and data files
- Old backups are deleted based on file modification time
- The script is safe to run multiple times (creates new timestamped backups)

---

# Database Restore Script

`restore-database.js` is a production-ready MongoDB restore script that restores backups created by `backup-database.js` to any MongoDB instance.

## Prerequisites

- Node.js installed
- MongoDB Database Tools installed (`mongorestore` command)
  - Download: https://www.mongodb.com/try/download/database-tools
  - Or install via package manager: `apt-get install mongodb-database-tools` (Ubuntu/Debian)

## Features

- ✅ **Automatic Extraction** - Automatically extracts compressed backups (`.tar.gz`)
- ✅ **Backup Detection** - Detects compressed and uncompressed backups
- ✅ **Backup Verification** - Verifies backup structure before restore
- ✅ **Flexible Target** - Restore to any MongoDB URI and database name
- ✅ **Safety Options** - Option to drop existing collections or merge data
- ✅ **Comprehensive Logging** - Detailed logs with timestamps
- ✅ **Error Handling** - Robust error handling with clear messages

## Usage

### Using NPM Commands (Recommended)

```bash
# Restore from backup (requires --backup and --target-uri)
npm run restore -- --backup backups/backup_2024-01-15_14-30-00.tar.gz --target-uri "mongodb://user:pass@host:27017/dbname"

# Show help
npm run restore:help
```

### Direct Node Execution

```bash
# Restore from compressed backup
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://user:pass@host:27017/dbname"

# Restore from uncompressed backup directory
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00/laundry_backend \
  --target-uri "mongodb://user:pass@host:27017/dbname"

# Using positional argument (backup path as first argument)
node scripts/restore-database.js \
  backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://user:pass@host:27017/dbname"
```

### Common Use Cases

#### Restore to Production Database

```bash
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://produser:prodpass@prod-host:27017/laundry_backend"
```

#### Restore to Development Database

```bash
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://localhost:27017/laundry_backend_dev" \
  --target-db "laundry_backend_dev"
```

#### Restore with Drop (Replace Existing Data)

```bash
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://user:pass@host:27017/dbname" \
  --drop
```

⚠️ **Warning**: The `--drop` flag will delete existing collections before restoring. Use with caution!

#### Restore to Different Database Name

```bash
node scripts/restore-database.js \
  --backup backups/backup_2024-01-15_14-30-00.tar.gz \
  --target-uri "mongodb://user:pass@host:27017" \
  --target-db "new_database_name"
```

## Options

- `--backup <path>` - Path to backup file or directory (required, can be positional)
- `--target-uri <string>` - Target MongoDB connection URI (required)
- `--target-db <string>` - Target database name (default: from backup or `laundry_backend`)
- `--backup-dir <path>` - Backup directory to search (default: `./backups`)
- `--drop` - Drop existing collections before restore
- `--no-drop` - Keep existing collections (default)
- `--quiet` - Minimal output
- `--verbose` - Detailed output
- `--help, -h` - Show help message

## Environment Variables

The script uses these environment variables for target URI (if `--target-uri` not provided):

- `MONGODB_URI` - Target MongoDB connection string
- `MONGODB_URL` - Alternative env var for target URI
- `DATABASE_URL` - Alternative env var for target URI

## Backup Formats Supported

The restore script automatically handles:

1. **Compressed backups** (`.tar.gz`)
   - Automatically extracts to temporary directory
   - Cleans up after restore

2. **Uncompressed backup directories**
   - Direct restore from backup directory
   - Supports both full backup directories and database subdirectories

3. **Gzip-compressed BSON files**
   - Automatically detects and handles `.bson.gz` files
   - Uses `--gzip` flag for mongorestore

## Example Output

```
ℹ️ [2024-01-15T15:00:00.000Z] Backup source: backups/backup_2024-01-15_14-30-00.tar.gz
ℹ️ [2024-01-15T15:00:00.100Z] Detected compressed backup, extracting...
ℹ️ [2024-01-15T15:00:05.200Z] Backup extracted successfully
ℹ️ [2024-01-15T15:00:05.300Z] Using database name from backup: laundry_backend
ℹ️ [2024-01-15T15:00:05.400Z] Verifying backup structure...
✅ [2024-01-15T15:00:05.500Z] Backup verified: 10 file(s) found
ℹ️ [2024-01-15T15:00:05.600Z] Starting MongoDB restore...
✅ [2024-01-15T15:00:15.800Z] MongoDB restore completed successfully
✅ [2024-01-15T15:00:15.900Z] Restore completed successfully in 10.30s
ℹ️ [2024-01-15T15:00:15.950Z] Target database: laundry_backend
ℹ️ [2024-01-15T15:00:16.000Z] Target URI: mongodb://user:****@host:27017/dbname
```

## Error Handling

The script handles various error scenarios:

- **mongorestore not found** - Exits with clear error message and installation instructions
- **Backup not found** - Validates backup path and provides helpful error messages
- **Connection failures** - Logs error and exits with non-zero code
- **Backup structure issues** - Verifies backup before restore and warns if issues found
- **Extraction failures** - Handles tar extraction errors gracefully
- **Temporary directory cleanup** - Automatically cleans up extracted files

## Safety Features

1. **No Drop by Default** - Existing collections are preserved unless `--drop` is specified
2. **Backup Verification** - Verifies backup structure before attempting restore
3. **Password Masking** - Passwords in URIs are masked in logs
4. **Automatic Cleanup** - Temporary extraction directories are cleaned up automatically

## Best Practices

1. **Test Restores** - Always test restores on a development database first
2. **Backup Before Restore** - Create a backup of the target database before restoring
3. **Verify Backups** - Ensure backup files are valid before attempting restore
4. **Use Drop Carefully** - Only use `--drop` when you're certain you want to replace data
5. **Check Disk Space** - Ensure sufficient disk space for extraction and restore

## Notes

- The script uses `mongorestore` which is the official MongoDB restore tool
- Compressed backups are automatically extracted to a temporary directory
- Database name is automatically detected from backup structure if not specified
- The script supports both compressed (gzip) and uncompressed BSON files
- Temporary extraction directories are automatically cleaned up after restore

---

# Database Seeder

`populate-all-collections.js` loads the curated fixtures under `/dump` and inserts them into the corresponding MongoDB collections. By default it wipes the target collections before inserting the new documents, so confirm the prompt or pass `--force` if you know what you are doing.

## Usage

```bash
node scripts/populate-all-collections.js \
  --uri mongodb://localhost:27017/laundry_backend \
  --dir ./dump \
  --mode replace \
  --force
```

### Options

- `--uri` – MongoDB connection string. Defaults to `MONGODB_URI`, `MONGODB_URL`, or `mongodb://localhost:27017/laundry_backend`.
- `--dir` – Directory with the dump JSON files. Defaults to `./dump`.
- `--collections` – Comma separated subset to seed (e.g. `vendors,users`). Defaults to all supported collections.
- `--mode` – `replace` (default) deletes existing documents before insert, `merge` keeps existing docs and skips duplicates.
- `--force/-y` – Skip the confirmation prompt (useful for automation).

### Examples

- Seed everything locally with confirmation:

  ```bash
  node scripts/populate-all-collections.js --uri mongodb://localhost:27017/laundry_backend
  ```

- Merge only vendors and users without deleting existing data:

  ```bash
  node scripts/populate-all-collections.js --mode merge --collections vendors,users --force
  ```

---

---

# Vendor Registration Script

This script helps you create and register vendors using the API endpoints.

## Prerequisites

- Node.js installed
- Server running on `http://localhost:3000`
- Install dependencies: `npm install axios`

## Usage

### Interactive Mode

Run the script without any arguments for an interactive registration:

```bash
node scripts/register-vendor.js
```

You will be prompted to enter:
- Phone number
- Shop details
- Address information
- Bank details
- Operating hours
- Services configuration

### Quick Mode

Register a vendor quickly with predefined data:

```bash
node scripts/register-vendor.js <phone_number> <vendor_name>
```

Example:
```bash
node scripts/register-vendor.js +919876543213 "CleanStyle"
```

This will create a vendor with:
- Phone: +919876543213
- Shop Name: CleanStyle Laundry
- Owner: CleanStyle
- Email: cleanstyle@laundry.com
- Random location in Bengaluru
- Pre-configured operating hours

## Registration Flow

The script performs the following steps:

1. **Register** - Creates vendor with phone number
2. **Verify OTP** - Verifies OTP (default: 1234)
3. **Complete Registration** - Fills business details
4. **Set Operating Hours** - Configures business hours
5. **Configure Services** - Sets up service pricing (optional)

## API Endpoints Used

- `POST /vendor/register` - Register vendor
- `POST /vendor/verify-otp` - Verify OTP
- `POST /vendor/register-complete` - Complete registration
- `POST /vendor/operating-hours` - Set operating hours
- `POST /vendor/services-offered` - Configure services

## Example Output

```
🏪 Vendor Registration Script
==================================================

📱 Step 1: Registering vendor...
✅ Vendor registered: OTP sent

🔐 Step 2: Verifying OTP...
✅ OTP verified

📝 Step 3: Completing registration...
✅ Registration completed: Registration updated successfully

⏰ Step 4: Setting operating hours...
✅ Operating hours set: Operating hours updated

✅ Vendor registration completed successfully!
📱 Phone: +919876543213
🔑 Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Notes

- OTP defaults to '1234' for testing
- FCM token defaults to 'script_fcm_token'
- All timestamps and IDs are randomly generated
- Vendor will need to upload documents and be approved by admin to be "active"

---

# Send Test Notifications Script

This script sends test push notifications to specified user IDs and saves them to the database.

## Prerequisites

- Node.js installed
- MongoDB connection configured
- Firebase Admin SDK configured (FIREBASE_SERVICE_ACCOUNT_KEY in environment)
- Dependencies: `mongoose`, `firebase-admin`

## Environment Variables

The script uses the following environment variables:

- `MONGODB_URL` - MongoDB connection string (defaults to production URL)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase service account JSON (required)

## Usage

### Default Mode (Uses Predefined User IDs)

Run the script without arguments to send notifications to the predefined test users:

```bash
node scripts/send-test-notifications.js
```

### Custom User IDs

Specify custom user IDs:

```bash
node scripts/send-test-notifications.js --user-ids "id1,id2,id3"
```

Example:
```bash
node scripts/send-test-notifications.js --user-ids "68ff34fd29cf1fc27ad63953,6908369ccd26926625f1385a"
```

## Default Test User IDs

The script includes these predefined user IDs:
- `68ff34fd29cf1fc27ad63953`
- `6908369ccd26926625f1385a`
- `690840c3720d953f87f77e82`
- `69097d9643acc5c5585d2bb0`
- `690a0bcf43acc5c5585d3954`
- `690b26f0d6f1a6a6959a319e`
- `690b2900d6f1a6a6959a3233`

## What the Script Does

1. **Connects to MongoDB** - Establishes connection to the database
2. **Fetches Users** - Retrieves user information by their IDs
3. **Validates FCM Tokens** - Checks which users have valid FCM tokens
4. **Sends Push Notifications** - Sends test notifications via Firebase Cloud Messaging
5. **Saves to Database** - Creates notification records in the database
6. **Provides Summary** - Shows success/failure statistics

## Example Output

```
🚀 Test Notification Script
============================================================
📝 Target User IDs: 7
   1. 68ff34fd29cf1fc27ad63953
   2. 6908369ccd26926625f1385a
   ...

✅ Firebase Admin SDK initialized successfully
✅ Connected to MongoDB

📱 Fetching users...
✅ Found 7 user(s)

📋 User Details:
   - John Doe (+919876543210) - FCM Token: ✅
   - Jane Smith (+919876543211) - FCM Token: ✅
   ...

📤 Sending notifications to 7 user(s)...
============================================================

📨 Sending to: John Doe (+919876543210)
   ✅ Push notification sent: projects/xxx/messages/yyy
   ✅ Notification saved to database

...

============================================================
📊 Summary:
============================================================
✅ Push notifications sent: 7/7
❌ Push notifications failed: 0/7
💾 Database notifications saved: 7/7

✅ Script completed successfully!
```

## Notification Payload

The script sends a test notification with:
- **Title**: "🧪 Test Notification"
- **Body**: "This is a test notification from the laundry backend system..."
- **Type**: "test"
- **Metadata**: Includes timestamp and source information

## Error Handling

- Users without FCM tokens are skipped with a warning
- Failed push notifications are logged with error details
- Database save failures are logged but don't stop the script
- Connection errors cause the script to exit with an error code

## Notes

- The script requires valid Firebase credentials to send push notifications
- Users must have valid FCM tokens stored in the database
- Notifications are saved to the database even if push notification fails
- A small delay (500ms) is added between notifications to avoid rate limiting

