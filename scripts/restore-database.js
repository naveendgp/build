#!/usr/bin/env node
'use strict';

/**
 * Production Database Restore Script
 *
 * Restores MongoDB backups created by backup-database.js with:
 * - Support for compressed and uncompressed backups
 * - Automatic extraction of compressed backups
 * - Restore verification
 * - Comprehensive logging
 * - Error handling and safety checks
 *
 * Usage:
 *   node scripts/restore-database.js [options]
 *
 * Options:
 *   --backup <path>              Path to backup file or directory (required)
 *   --target-uri <connection>     Target MongoDB connection URI (required)
 *   --target-db <database_name>   Target database name (default: from backup or laundry_backend)
 *   --backup-dir <path>           Backup directory to search (default: ./backups)
 *   --drop                        Drop existing collections before restore
 *   --no-drop                     Keep existing collections (default)
 *   --quiet                       Minimal output
 *   --verbose                     Detailed output
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const access = promisify(fs.access);
const constants = fs.constants;

// Configuration defaults
const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '../backups');
const DEFAULT_DB_NAME = 'laundry_backend';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  backup: null,
  targetUri: null,
  targetDb: null,
  backupDir: DEFAULT_BACKUP_DIR,
  drop: false,
  quiet: false,
  verbose: false,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--backup':
      options.backup = args[++i];
      break;
    case '--target-uri':
    case '--uri':
      options.targetUri = args[++i];
      break;
    case '--target-db':
    case '--db':
      options.targetDb = args[++i];
      break;
    case '--backup-dir':
      options.backupDir = path.resolve(args[++i]);
      break;
    case '--drop':
      options.drop = true;
      break;
    case '--no-drop':
      options.drop = false;
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
        // If no --backup flag, treat as backup path
        if (!options.backup) {
          options.backup = arg;
        } else {
          console.error(`❌ Unknown option: ${arg}`);
          printUsage();
          process.exit(1);
        }
      } else {
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
📥 Database Restore Script
==================================================

Usage:
  node scripts/restore-database.js [options]

Required Options:
  --backup <path>              Path to backup file or directory
                               (can also be provided as first positional argument)
  
  --target-uri <string>        Target MongoDB connection URI
                               (required for restore)

Optional Options:
  --target-db <string>         Target database name
                               (default: from backup or ${DEFAULT_DB_NAME})
  
  --backup-dir <path>          Backup directory to search
                               (default: ${DEFAULT_BACKUP_DIR})
  
  --drop                       Drop existing collections before restore
  --no-drop                    Keep existing collections (default)
  
  --quiet                      Minimal output
  --verbose                    Detailed output
  
  --help, -h                   Show this help message

Environment Variables:
  MONGODB_URI                  Target MongoDB connection string (if --target-uri not provided)
  MONGODB_URL                  Alternative env var for target URI
  DATABASE_URL                 Alternative env var for target URI

Examples:
  # Restore from specific backup file
  node scripts/restore-database.js \\
    --backup backups/backup_2024-01-15_14-30-00.tar.gz \\
    --target-uri "mongodb://user:pass@host:27017/dbname"
  
  # Restore from uncompressed backup directory
  node scripts/restore-database.js \\
    --backup backups/backup_2024-01-15_14-30-00/laundry_backend \\
    --target-uri "mongodb://user:pass@host:27017/dbname"
  
  # Restore with drop (replaces existing data)
  node scripts/restore-database.js \\
    --backup backups/backup_2024-01-15_14-30-00.tar.gz \\
    --target-uri "mongodb://user:pass@host:27017/dbname" \\
    --drop
  
  # Restore to different database name
  node scripts/restore-database.js \\
    --backup backups/backup_2024-01-15_14-30-00.tar.gz \\
    --target-uri "mongodb://user:pass@host:27017" \\
    --target-db "new_database_name"
  
  # Using positional argument
  node scripts/restore-database.js \\
    backups/backup_2024-01-15_14-30-00.tar.gz \\
    --target-uri "mongodb://user:pass@host:27017/dbname"
`);
}

// Check if mongorestore is available
function checkMongoRestore() {
  try {
    execSync('mongorestore --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if file/directory exists and is accessible
async function checkPathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// Find backup file if only name provided
async function findBackup(backupName) {
  // If it's already a full path, return it
  if (path.isAbsolute(backupName) || backupName.startsWith('.')) {
    return backupName;
  }

  // Search in backup directory
  try {
    const files = await readdir(options.backupDir);
    const matching = files.filter((file) => file.includes(backupName));

    if (matching.length === 0) {
      return null;
    }

    if (matching.length === 1) {
      return path.join(options.backupDir, matching[0]);
    }

    // Multiple matches - return the most recent
    const filesWithStats = await Promise.all(
      matching.map(async (file) => {
        const filePath = path.join(options.backupDir, file);
        const stats = await stat(filePath);
        return { file, path: filePath, mtime: stats.mtime };
      }),
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    log(
      `Multiple backups found matching "${backupName}", using most recent: ${filesWithStats[0].file}`,
      'warning',
    );
    return filesWithStats[0].path;
  } catch (error) {
    return null;
  }
}

// Extract compressed backup
async function extractBackup(backupPath, extractDir) {
  log('Extracting compressed backup...');

  return new Promise((resolve, reject) => {
    const tarProcess = spawn('tar', ['-xzf', backupPath, '-C', extractDir], {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    let stderr = '';

    if (!options.verbose) {
      tarProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    tarProcess.on('close', (code) => {
      if (code === 0) {
        log('Backup extracted successfully', 'success');
        resolve();
      } else {
        log(`Extraction failed with exit code ${code}`, 'error');
        if (stderr) {
          logVerbose(`Error details: ${stderr}`);
        }
        reject(new Error(`tar exited with code ${code}`));
      }
    });

    tarProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        log('tar command not found. Please install tar.', 'error');
      } else {
        log(`Extraction error: ${error.message}`, 'error');
      }
      reject(error);
    });
  });
}

// Get database name from backup directory
function getDbNameFromBackup(backupPath) {
  try {
    // Check if it's a directory
    const stats = fs.statSync(backupPath);
    if (stats.isDirectory()) {
      // Look for subdirectories (mongodump creates dbname/collections structure)
      const entries = fs.readdirSync(backupPath);
      // Find the first directory that looks like a database name
      for (const entry of entries) {
        const entryPath = path.join(backupPath, entry);
        const entryStats = fs.statSync(entryPath);
        if (entryStats.isDirectory()) {
          return entry;
        }
      }
    }
  } catch (error) {
    logVerbose(`Could not determine database name from backup: ${error.message}`);
  }
  return null;
}

// Prepare backup path for restore
async function prepareBackupPath(backupPath) {
  const stats = await stat(backupPath);
  let restorePath = backupPath;
  let tempExtractDir = null;

  // If it's a compressed file, extract it
  if (stats.isFile() && backupPath.endsWith('.tar.gz')) {
    log('Detected compressed backup, extracting...');
    tempExtractDir = path.join(path.dirname(backupPath), '.restore_temp');
    await mkdir(tempExtractDir, { recursive: true });
    await extractBackup(backupPath, tempExtractDir);

    // Find the extracted directory
    const extracted = await readdir(tempExtractDir);
    if (extracted.length > 0) {
      restorePath = path.join(tempExtractDir, extracted[0]);
    } else {
      throw new Error('Extracted backup directory is empty');
    }
  }

  // Find the database directory
  const dbName = getDbNameFromBackup(restorePath);
  if (dbName) {
    restorePath = path.join(restorePath, dbName);
    if (!options.targetDb) {
      options.targetDb = dbName;
      log(`Using database name from backup: ${dbName}`);
    }
  }

  return { restorePath, tempExtractDir };
}

// Verify backup structure
async function verifyBackupStructure(backupPath) {
  log('Verifying backup structure...');

  try {
    const stats = await stat(backupPath);
    if (!stats.isDirectory()) {
      log('Backup path is not a directory', 'error');
      return false;
    }

    const files = await readdir(backupPath);
    if (files.length === 0) {
      log('Backup directory is empty', 'error');
      return false;
    }

    // Check for BSON files (compressed or uncompressed)
    const hasBsonFiles =
      files.some((file) => file.endsWith('.bson')) ||
      files.some((file) => file.endsWith('.bson.gz'));

    if (!hasBsonFiles) {
      log('No BSON files found in backup', 'error');
      return false;
    }

    log(`Backup verified: ${files.length} file(s) found`, 'success');
    logVerbose(`Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    return true;
  } catch (error) {
    log(`Backup verification failed: ${error.message}`, 'error');
    return false;
  }
}

// Execute mongorestore
async function runMongoRestore(restorePath) {
  return new Promise((resolve, reject) => {
    log('Starting MongoDB restore...');

    if (!options.targetUri) {
      // Try environment variables
      options.targetUri =
        process.env.MONGODB_URI ||
        process.env.MONGODB_URL ||
        process.env.DATABASE_URL;

      if (!options.targetUri) {
        log('Target MongoDB URI is required. Use --target-uri or set MONGODB_URI env var.', 'error');
        reject(new Error('Target URI not provided'));
        return;
      }
    }

    // Build mongorestore command
    const restoreArgs = ['--uri', options.targetUri];

    if (options.targetDb) {
      restoreArgs.push('--db', options.targetDb);
    }

    if (options.drop) {
      restoreArgs.push('--drop');
      log('⚠️  Existing collections will be dropped before restore', 'warning');
    }

    // Check if backup is compressed (gzip)
    const files = fs.readdirSync(restorePath);
    const hasGzipFiles = files.some((file) => file.endsWith('.gz'));
    if (hasGzipFiles) {
      restoreArgs.push('--gzip');
    }

    restoreArgs.push(restorePath);

    logVerbose(`Executing: mongorestore ${restoreArgs.join(' ')}`);

    const restoreProcess = spawn('mongorestore', restoreArgs, {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    let stdout = '';
    let stderr = '';

    if (!options.verbose) {
      restoreProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      restoreProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    restoreProcess.on('close', (code) => {
      if (code === 0) {
        log('MongoDB restore completed successfully', 'success');
        if (stdout && !options.verbose) {
          logVerbose(`Restore output: ${stdout}`);
        }
        resolve();
      } else {
        log(`mongorestore failed with exit code ${code}`, 'error');
        if (stderr) {
          log(`Error details: ${stderr}`, 'error');
        }
        reject(new Error(`mongorestore exited with code ${code}`));
      }
    });

    restoreProcess.on('error', (error) => {
      log(`Failed to execute mongorestore: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Cleanup temporary extraction directory
async function cleanupTempDir(tempDir) {
  if (!tempDir) return;

  try {
    await rm(tempDir, { recursive: true, force: true });
    logVerbose(`Cleaned up temporary directory: ${tempDir}`);
  } catch (error) {
    log(`Warning: Could not clean up temporary directory: ${error.message}`, 'warning');
  }
}

// Main restore function
async function performRestore() {
  const startTime = Date.now();

  try {
    // Check prerequisites
    if (!checkMongoRestore()) {
      log('mongorestore is not installed or not in PATH', 'error');
      log(
        'Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools',
        'error',
      );
      process.exit(1);
    }

    // Validate required options
    if (!options.backup) {
      log('Backup path is required. Use --backup or provide as first argument.', 'error');
      printUsage();
      process.exit(1);
    }

    // Find backup if needed
    let backupPath = await findBackup(options.backup);
    if (!backupPath) {
      backupPath = options.backup; // Try as-is
    }

    // Check if backup exists
    const exists = await checkPathExists(backupPath);
    if (!exists) {
      log(`Backup not found: ${backupPath}`, 'error');
      log('Please provide a valid backup file or directory path.', 'error');
      process.exit(1);
    }

    log(`Backup source: ${backupPath}`);

    // Prepare backup path (extract if needed)
    const { restorePath, tempExtractDir } = await prepareBackupPath(backupPath);

    try {
      // Verify backup structure
      const isValid = await verifyBackupStructure(restorePath);
      if (!isValid) {
        log('Backup structure verification failed. Restore may fail.', 'warning');
        // Continue anyway - let mongorestore handle it
      }

      // Run mongorestore
      await runMongoRestore(restorePath);

      // Calculate duration
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`Restore completed successfully in ${duration}s`, 'success');
      log(`Target database: ${options.targetDb || 'default from URI'}`);
      log(`Target URI: ${options.targetUri.replace(/:[^:@]+@/, ':****@')}`); // Hide password

      return {
        success: true,
        duration: parseFloat(duration),
        targetDb: options.targetDb,
      };
    } finally {
      // Cleanup temporary directory
      await cleanupTempDir(tempExtractDir);
    }
  } catch (error) {
    log(`Restore failed: ${error.message}`, 'error');
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run restore
if (require.main === module) {
  performRestore()
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

module.exports = { performRestore };

