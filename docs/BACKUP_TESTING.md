# Backup Functionality Testing Guide

## Overview
This document outlines the testing procedures for the database backup functionality in the laundry backend system.

## Prerequisites

### Required Tools
1. **MongoDB Database Tools** - Must be installed and available in PATH
   - Download: https://www.mongodb.com/try/download/database-tools
   - Windows: Download MSI installer and add to PATH
   - Linux/Mac: Install via package manager or download binaries

2. **Node.js** - Already installed (verified)

3. **MongoDB Connection** - Valid connection string to MongoDB instance

### Verify Prerequisites
```bash
# Check if mongodump is installed
mongodump --version

# Check Node.js
node --version

# Check if MongoDB is accessible (optional)
# You can test connection using the test script
node scripts/test-mongodb-connection.js
```

## Backup Script Features

The `scripts/backup-database.js` script provides:
- ✅ Timestamped backup directories
- ✅ Automatic compression (tar.gz)
- ✅ Backup verification
- ✅ Old backup cleanup (retention policy)
- ✅ Comprehensive logging
- ✅ Error handling

## Testing Steps

### 1. Test Script Help and Options
```bash
# Display help
node scripts/backup-database.js --help
npm run backup:help

# Expected: Should display usage information
```

### 2. Test Prerequisites Check
```bash
# Run backup script (will fail if mongodump not installed)
node scripts/backup-database.js

# Expected: Should detect missing mongodump and show error message
```

### 3. Install MongoDB Database Tools (if not installed)

#### Windows:
1. Download MongoDB Database Tools from: https://www.mongodb.com/try/download/database-tools
2. Run the MSI installer
3. Add installation directory to PATH (usually: `C:\Program Files\MongoDB\Tools\100\bin`)
4. Restart terminal/PowerShell
5. Verify: `mongodump --version`

#### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# Or download and extract
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.9.0.tgz
tar -xzf mongodb-database-tools-*.tgz
export PATH=$PATH:$(pwd)/mongodb-database-tools-ubuntu2004-x86_64-100.9.0/bin
```

#### macOS:
```bash
# Using Homebrew
brew install mongodb-database-tools

# Or download and extract
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-macos-x86_64-100.9.0.tgz
tar -xzf mongodb-database-tools-*.tgz
export PATH=$PATH:$(pwd)/mongodb-database-tools-macos-x86_64-100.9.0/bin
```

### 4. Test Basic Backup
```bash
# Basic backup (uses default settings)
node scripts/backup-database.js
npm run backup

# Expected:
# - Creates backups/ directory
# - Creates timestamped backup directory
# - Runs mongodump
# - Verifies backup
# - Compresses backup
# - Shows backup size and location
```

### 5. Test Backup with Custom Options
```bash
# Custom backup directory
node scripts/backup-database.js --backup-dir ./custom-backups

# Without compression
node scripts/backup-database.js --no-compress

# Without verification
node scripts/backup-database.js --no-verify

# Quiet mode (for cron)
node scripts/backup-database.js --quiet
npm run backup:quiet

# Verbose mode (detailed output)
node scripts/backup-database.js --verbose
```

### 6. Test Backup with Custom URI
```bash
# Use custom MongoDB URI
node scripts/backup-database.js --uri "mongodb://user:pass@host:27017/dbname?authSource=admin"

# Or set environment variable
$env:MONGODB_URI="mongodb://user:pass@host:27017/dbname?authSource=admin"
node scripts/backup-database.js
```

### 7. Verify Backup Creation
```bash
# Check backups directory
ls backups/
# or on Windows
dir backups

# Expected: Should see compressed backup file (backup_YYYY-MM-DD_HH-MM-SS.tar.gz)
```

### 8. Test Backup Verification
```bash
# Run backup with verification (default)
node scripts/backup-database.js --verify

# Expected: Should verify backup integrity and show collection count
```

### 9. Test Backup Cleanup (Retention Policy)
```bash
# Test with short retention (1 day)
node scripts/backup-database.js --retention-days 1

# Create multiple backups to test cleanup
# Wait for retention period or manually adjust file dates
# Run backup again and verify old backups are deleted
```

### 10. Test Error Handling
```bash
# Test with invalid URI
node scripts/backup-database.js --uri "mongodb://invalid:27017/test"

# Test with non-existent database
node scripts/backup-database.js --db nonexistent_db

# Expected: Should show appropriate error messages
```

## Backup File Structure

After successful backup, you should see:
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

## Verification Checklist

- [ ] Script help displays correctly
- [ ] Prerequisites check works (detects missing mongodump)
- [ ] MongoDB Database Tools installed
- [ ] Basic backup completes successfully
- [ ] Backup file is created in backups/ directory
- [ ] Backup is compressed (tar.gz format)
- [ ] Backup verification passes
- [ ] Backup size is displayed
- [ ] Old backups are cleaned up (if retention policy applies)
- [ ] Error handling works for invalid inputs
- [ ] Custom options work (backup-dir, retention-days, etc.)
- [ ] Quiet mode works (minimal output)
- [ ] Verbose mode works (detailed output)

## Restore Testing

After creating backups, test restore functionality:
```bash
# See restore documentation
node scripts/restore-database.js --help
npm run restore:help
```

## Automated Testing

For CI/CD or automated testing, use quiet mode:
```bash
npm run backup:quiet
```

## Troubleshooting

### Issue: mongodump not found
**Solution**: Install MongoDB Database Tools and add to PATH

### Issue: Connection refused
**Solution**: Check MongoDB connection string and network connectivity

### Issue: Permission denied
**Solution**: Check file system permissions for backup directory

### Issue: Backup verification fails
**Solution**: Check MongoDB connection and database accessibility

### Issue: Compression fails (Windows)
**Solution**: Ensure tar command is available (Windows 10+ has built-in tar)

## Notes

- Default backup directory: `./backups`
- Default retention: 30 days
- Compression is enabled by default
- Backup verification is enabled by default
- Backups are timestamped: `backup_YYYY-MM-DD_HH-MM-SS`

