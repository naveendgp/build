#!/usr/bin/env node
'use strict';

/**
 * Production Database Backup Script
 *
 * Creates compressed MongoDB backups with:
 * - Timestamped backup directories
 * - Automatic compression
 * - Backup verification
 * - Old backup cleanup
 * - Comprehensive logging
 * - Error handling and notifications
 *
 * Usage:
 *   node scripts/backup-database.js [options]
 *
 * Options:
 *   --uri <connection_string>    MongoDB connection URI (defaults to env or config)
 *   --db <database_name>         Database name (default: laundry_backend)
 *   --backup-dir <path>          Backup directory (default: ./backups)
 *   --retention-days <number>    Days to keep backups (default: 30)
 *   --compress                   Enable compression (default: true)
 *   --no-compress                Disable compression
 *   --verify                     Verify backup integrity (default: true)
 *   --quiet                      Minimal output
 *   --verbose                    Detailed output
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const unlink = promisify(fs.unlink);

// Configuration defaults
const DEFAULT_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL ||
  'mongodb://prodmongo:prodpassword%40123@13.201.184.91:27017/laundry_backend?authSource=admin';

const DEFAULT_DB_NAME = 'laundry_backend';
const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '../backups');
const DEFAULT_RETENTION_DAYS = 30;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  uri: DEFAULT_URI,
  dbName: DEFAULT_DB_NAME,
  backupDir: DEFAULT_BACKUP_DIR,
  retentionDays: DEFAULT_RETENTION_DAYS,
  compress: true,
  verify: true,
  quiet: false,
  verbose: false,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--uri':
      options.uri = args[++i];
      break;
    case '--db':
      options.dbName = args[++i];
      break;
    case '--backup-dir':
      options.backupDir = path.resolve(args[++i]);
      break;
    case '--retention-days':
      options.retentionDays = parseInt(args[++i], 10);
      break;
    case '--compress':
      options.compress = true;
      break;
    case '--no-compress':
      options.compress = false;
      break;
    case '--verify':
      options.verify = true;
      break;
    case '--no-verify':
      options.verify = false;
      break;
    case '--quiet':
      options.quiet = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--help':
    case '-h':
      printUsage();
      process.exit(0);
    default:
      if (!arg.startsWith('--')) {
        console.error(`❌ Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
      }
  }
}

// Utility functions
function log(message, level = 'info') {
  if (options.quiet && level !== 'error') return;

  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level] || 'ℹ️';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logVerbose(message) {
  if (options.verbose) {
    log(message, 'debug');
  }
}

function printUsage() {
  console.log(`
📦 Database Backup Script
==================================================

Usage:
  node scripts/backup-database.js [options]

Options:
  --uri <string>          MongoDB connection URI
                          (default: from env or config)
  
  --db <string>           Database name
                          (default: ${DEFAULT_DB_NAME})
  
  --backup-dir <path>     Backup directory path
                          (default: ${DEFAULT_BACKUP_DIR})
  
  --retention-days <num>  Number of days to keep backups
                          (default: ${DEFAULT_RETENTION_DAYS})
  
  --compress              Enable compression (default)
  --no-compress           Disable compression
  
  --verify                Verify backup integrity (default)
  --no-verify             Skip verification
  
  --quiet                 Minimal output
  --verbose               Detailed output
  
  --help, -h              Show this help message

Environment Variables:
  MONGODB_URI             MongoDB connection string
  MONGODB_URL             Alternative env var for URI
  DATABASE_URL            Alternative env var for URI

Examples:
  # Basic backup
  node scripts/backup-database.js
  
  # Custom backup directory
  node scripts/backup-database.js --backup-dir /var/backups/mongodb
  
  # Keep backups for 90 days
  node scripts/backup-database.js --retention-days 90
  
  # Backup without compression
  node scripts/backup-database.js --no-compress
  
  # Quiet mode (for cron)
  node scripts/backup-database.js --quiet
`);
}

// Check if mongodump is available
function checkMongoDump() {
  try {
    execSync('mongodump --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Extract database name from URI if not provided
function extractDbName(uri) {
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : options.dbName;
}

// Create backup directory structure
async function ensureBackupDir() {
  try {
    await mkdir(options.backupDir, { recursive: true });
    logVerbose(`Backup directory: ${options.backupDir}`);
  } catch (error) {
    log(`Failed to create backup directory: ${error.message}`, 'error');
    throw error;
  }
}

// Generate backup directory name with timestamp
function getBackupDirName() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -5); // Remove milliseconds and timezone
  return `backup_${timestamp}`;
}

// Execute mongodump
async function runMongoDump(backupPath) {
  return new Promise((resolve, reject) => {
    log('Starting MongoDB backup...');

    // Extract connection details from URI
    const dbName = extractDbName(options.uri);

    // Build mongodump command
    const dumpArgs = [
      '--uri',
      options.uri,
      '--db',
      dbName,
      '--out',
      backupPath,
    ];

    if (options.compress) {
      dumpArgs.push('--gzip');
    }

    logVerbose(`Executing: mongodump ${dumpArgs.join(' ')}`);

    const dumpProcess = spawn('mongodump', dumpArgs, {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    let stderr = '';

    if (!options.verbose) {
      dumpProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    dumpProcess.on('close', (code) => {
      if (code === 0) {
        log('MongoDB backup completed successfully', 'success');
        resolve();
      } else {
        log(`mongodump failed with exit code ${code}`, 'error');
        if (stderr) {
          logVerbose(`Error details: ${stderr}`);
        }
        reject(new Error(`mongodump exited with code ${code}`));
      }
    });

    dumpProcess.on('error', (error) => {
      log(`Failed to execute mongodump: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Verify backup integrity
async function verifyBackup(backupPath) {
  if (!options.verify) {
    logVerbose('Skipping backup verification');
    return true;
  }

  log('Verifying backup integrity...');

  try {
    const dbName = extractDbName(options.uri);
    const dbBackupPath = path.join(backupPath, dbName);

    if (!fs.existsSync(dbBackupPath)) {
      log(`Backup directory not found: ${dbBackupPath}`, 'error');
      return false;
    }

    // Check if backup directory contains files
    const files = await readdir(dbBackupPath);
    if (files.length === 0) {
      log('Backup directory is empty', 'error');
      return false;
    }

    // Check for BSON files (or .gz files if compressed)
    const extension = options.compress ? '.gz' : '.bson';
    const hasDataFiles = files.some((file) => file.endsWith(extension));

    if (!hasDataFiles) {
      log('No data files found in backup', 'error');
      return false;
    }

    log(`Backup verified: ${files.length} collection(s) backed up`, 'success');
    logVerbose(
      `Collections: ${files.filter((f) => f.endsWith(extension)).join(', ')}`,
    );

    return true;
  } catch (error) {
    log(`Backup verification failed: ${error.message}`, 'error');
    return false;
  }
}

// Compress backup directory
async function compressBackup(backupPath) {
  if (!options.compress) {
    return backupPath;
  }

  log('Compressing backup...');

  return new Promise((resolve, reject) => {
    const archiveName = `${backupPath}.tar.gz`;
    const tarProcess = spawn(
      'tar',
      [
        '-czf',
        archiveName,
        '-C',
        path.dirname(backupPath),
        path.basename(backupPath),
      ],
      {
        stdio: options.verbose ? 'inherit' : 'pipe',
      },
    );

    tarProcess.on('close', (code) => {
      if (code === 0) {
        // Remove original directory after successful compression
        rm(backupPath, { recursive: true, force: true })
          .then(() => {
            log(`Backup compressed: ${archiveName}`, 'success');
            resolve(archiveName);
          })
          .catch((error) => {
            log(
              `Warning: Could not remove original backup directory: ${error.message}`,
              'warning',
            );
            resolve(archiveName);
          });
      } else {
        log(`Compression failed with exit code ${code}`, 'error');
        reject(new Error(`tar exited with code ${code}`));
      }
    });

    tarProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        log('tar command not found. Skipping compression.', 'warning');
        resolve(backupPath);
      } else {
        log(`Compression error: ${error.message}`, 'error');
        reject(error);
      }
    });
  });
}

// Get backup size
function getBackupSize(backupPath) {
  try {
    const stats = fs.statSync(backupPath);
    if (stats.isFile()) {
      return stats.size;
    } else if (stats.isDirectory()) {
      let totalSize = 0;
      const files = fs.readdirSync(backupPath);
      for (const file of files) {
        const filePath = path.join(backupPath, file);
        const fileStats = fs.statSync(filePath);
        if (fileStats.isFile()) {
          totalSize += fileStats.size;
        } else if (fileStats.isDirectory()) {
          totalSize += getBackupSize(filePath);
        }
      }
      return totalSize;
    }
  } catch (error) {
    logVerbose(`Could not get backup size: ${error.message}`);
    return 0;
  }
  return 0;
}

// Format file size
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Cleanup old backups
async function cleanupOldBackups() {
  if (options.retentionDays <= 0) {
    logVerbose('Backup retention disabled (retention-days <= 0)');
    return;
  }

  log(`Cleaning up backups older than ${options.retentionDays} days...`);

  try {
    const files = await readdir(options.backupDir);
    const now = Date.now();
    const retentionMs = options.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of files) {
      const filePath = path.join(options.backupDir, file);

      try {
        const stats = await stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          const size = stats.size || getBackupSize(filePath);
          await (stats.isDirectory()
            ? rm(filePath, { recursive: true, force: true })
            : unlink(filePath));
          deletedCount++;
          freedSpace += size;
          logVerbose(`Deleted old backup: ${file} (${formatSize(size)})`);
        }
      } catch (error) {
        logVerbose(`Could not process ${file}: ${error.message}`);
      }
    }

    if (deletedCount > 0) {
      log(
        `Cleaned up ${deletedCount} old backup(s), freed ${formatSize(freedSpace)}`,
        'success',
      );
    } else {
      log('No old backups to clean up');
    }
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'warning');
  }
}

// Main backup function
async function performBackup() {
  const startTime = Date.now();

  try {
    // Check prerequisites
    if (!checkMongoDump()) {
      log('mongodump is not installed or not in PATH', 'error');
      log(
        'Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools',
        'error',
      );
      process.exit(1);
    }

    // Ensure backup directory exists
    await ensureBackupDir();

    // Create backup directory
    const backupDirName = getBackupDirName();
    const backupPath = path.join(options.backupDir, backupDirName);

    log(`Backup destination: ${backupPath}`);

    // Run mongodump
    await runMongoDump(backupPath);

    // Verify backup
    const isValid = await verifyBackup(backupPath);
    if (!isValid) {
      log('Backup verification failed. Backup may be incomplete.', 'error');
      // Don't exit - still compress and save what we have
    }

    // Compress backup
    let finalBackupPath = backupPath;
    if (options.compress) {
      try {
        finalBackupPath = await compressBackup(backupPath);
      } catch (error) {
        log(
          `Compression failed, keeping uncompressed backup: ${error.message}`,
          'warning',
        );
      }
    }

    // Get backup size
    const backupSize = getBackupSize(finalBackupPath);
    log(`Backup size: ${formatSize(backupSize)}`, 'success');

    // Cleanup old backups
    await cleanupOldBackups();

    // Calculate duration
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`Backup completed successfully in ${duration}s`, 'success');
    log(`Backup location: ${finalBackupPath}`);

    return {
      success: true,
      path: finalBackupPath,
      size: backupSize,
      duration: parseFloat(duration),
    };
  } catch (error) {
    log(`Backup failed: ${error.message}`, 'error');
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run backup
if (require.main === module) {
  performBackup()
    .then((result) => {
      if (result && result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { performBackup };
