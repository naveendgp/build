#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const mongoose = require('mongoose');

const DEFAULT_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.DB_URI ||
  'mongodb://localhost:27017/laundry_backend';

const DEFAULT_DUMP_DIR = path.resolve(__dirname, '../dump');
const MODES = {
  REPLACE: 'replace',
  MERGE: 'merge',
};

const COLLECTION_FILE_MAP = [
  {
    collection: 'appconfigs',
    file: 'app-configs.json',
    label: 'App Configs',
    aliases: ['app-configs', 'appconfigs', 'config', 'app_config'],
  },
  {
    collection: 'appversions',
    file: 'app-versions.json',
    label: 'App Versions',
    aliases: ['app-versions', 'appversions', 'versions', 'app_version'],
  },
  {
    collection: 'deliverypeople',
    file: 'drivers.json',
    label: 'Delivery Personnel',
    aliases: ['drivers', 'driver', 'deliverypeople', 'delivery_persons'],
  },
  {
    collection: 'orders',
    file: 'orders.json',
    label: 'Orders',
    aliases: ['orders', 'order'],
  },
  {
    collection: 'payments',
    file: 'payments.json',
    label: 'Payments',
    aliases: ['payments', 'payment'],
  },
  {
    collection: 'services',
    file: 'services.json',
    label: 'Services',
    aliases: ['services', 'service'],
  },
  {
    collection: 'transactions',
    file: 'transactions.json',
    label: 'Transactions',
    aliases: ['transactions', 'transaction'],
  },
  {
    collection: 'users',
    file: 'users.json',
    label: 'Users',
    aliases: ['users', 'user'],
  },
  {
    collection: 'vendors',
    file: 'vendors.json',
    label: 'Vendors',
    aliases: ['vendors', 'vendor'],
  },
];

function printUsage() {
  console.log(`
🧺  Laundry Backend Seeder
--------------------------------------
Usage:
  node scripts/populate-all-collections.js [options]

Options:
  --uri <mongodb-uri>        MongoDB connection string
  --dir <dump-dir>           Directory containing dump JSON files
  --collections <list>       Comma separated list (e.g. vendors,users). Defaults to all.
  --mode <replace|merge>     replace = wipe collection then insert (default)
                             merge = keep existing docs, insert new ones (duplicates skipped)
  --force, -y                Skip confirmation prompts
  --help, -h                 Show this help message

Examples:
  node scripts/populate-all-collections.js --uri mongodb://localhost:27017/laundry_backend
  node scripts/populate-all-collections.js --mode merge --collections users,vendors
  node scripts/populate-all-collections.js --dir ./dump --force
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    uri: DEFAULT_URI,
    dir: DEFAULT_DUMP_DIR,
    force: false,
    mode: MODES.REPLACE,
    collections: [],
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case '--uri':
        options.uri = args[++i];
        break;
      case '--dir':
        options.dir = path.resolve(args[++i]);
        break;
      case '--collections':
        options.collections = args[++i]
          .split(',')
          .map((token) => token.trim().toLowerCase())
          .filter(Boolean);
        break;
      case '--mode':
        options.mode = (args[++i] || '').toLowerCase();
        break;
      case '--force':
      case '-y':
        options.force = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  if (!Object.values(MODES).includes(options.mode)) {
    throw new Error(
      `Invalid mode "${options.mode}". Allowed values: ${Object.values(MODES).join(', ')}`,
    );
  }

  if (!options.uri) {
    throw new Error(
      'MongoDB URI is required. Pass via --uri or set MONGODB_URI.',
    );
  }

  return options;
}

function resolveCollections(selectedAliases) {
  if (!selectedAliases.length) {
    return COLLECTION_FILE_MAP;
  }

  const resolved = [];
  for (const alias of selectedAliases) {
    const entry = COLLECTION_FILE_MAP.find(
      (item) =>
        item.collection === alias ||
        item.file.replace('.json', '') === alias ||
        item.aliases.includes(alias),
    );

    if (!entry) {
      throw new Error(
        `Unknown collection alias "${alias}". Available: ${COLLECTION_FILE_MAP.map(
          (c) => c.collection,
        ).join(', ')}`,
      );
    }

    if (!resolved.includes(entry)) {
      resolved.push(entry);
    }
  }

  return resolved;
}

function askForConfirmation(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${promptText} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function convertExtendedJson(value) {
  if (Array.isArray(value)) {
    return value.map((item) => convertExtendedJson(item));
  }

  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    if ('$oid' in value) {
      return new mongoose.Types.ObjectId(value.$oid);
    }

    if ('$date' in value) {
      return new Date(value.$date);
    }

    if ('$numberInt' in value) {
      return parseInt(value.$numberInt, 10);
    }

    if ('$numberLong' in value) {
      return parseInt(value.$numberLong, 10);
    }

    if ('$numberDouble' in value) {
      return parseFloat(value.$numberDouble);
    }

    if ('$numberDecimal' in value) {
      return Number(value.$numberDecimal);
    }

    if ('$binary' in value && value.$binary?.base64) {
      return Buffer.from(value.$binary.base64, 'base64');
    }

    const transformed = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      transformed[key] = convertExtendedJson(nestedValue);
    }
    return transformed;
  }

  return value;
}

function loadDumpDocuments(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(fileContents);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${filePath}`);
  }

  return convertExtendedJson(parsed);
}

async function seedCollection(entry, docs, mode) {
  const collection = mongoose.connection.collection(entry.collection);
  let deletedCount = 0;

  if (mode === MODES.REPLACE) {
    const deleteResult = await collection.deleteMany({});
    deletedCount = deleteResult.deletedCount || 0;
  }

  try {
    const insertResult = await collection.insertMany(docs, {
      ordered: mode !== MODES.MERGE,
    });
    return {
      inserted: insertResult.insertedCount ?? docs.length,
      deleted: deletedCount,
      skipped: 0,
    };
  } catch (error) {
    if (mode === MODES.MERGE && error?.writeErrors) {
      const skipped = error.writeErrors.length;
      const inserted = docs.length - skipped;
      console.warn(
        `⚠️  ${entry.collection}: ${skipped} documents skipped due to duplicate keys.`,
      );
      return { inserted, deleted: deletedCount, skipped };
    }

    throw error;
  }
}

async function main() {
  try {
    const options = parseArgs();

    if (options.help) {
      printUsage();
      process.exit(0);
    }

    const dumpDir = options.dir || DEFAULT_DUMP_DIR;
    const stats = fs.statSync(dumpDir, { throwIfNoEntry: false });
    if (!stats || !stats.isDirectory()) {
      throw new Error(`Dump directory does not exist: ${dumpDir}`);
    }

    const targetCollections = resolveCollections(options.collections);

    console.log('🧺  Laundry Backend Seeder');
    console.log('--------------------------------------');
    console.log(`MongoDB URI      : ${options.uri}`);
    console.log(`Dump directory   : ${dumpDir}`);
    console.log(`Mode             : ${options.mode}`);
    console.log(
      `Collections      : ${targetCollections
        .map((entry) => `${entry.collection} (${entry.file})`)
        .join(', ')}`,
    );
    console.log('');

    if (!options.force) {
      const confirmed = await askForConfirmation(
        `This will ${options.mode === MODES.REPLACE ? 'erase and repopulate' : 'merge data into'} the collections above. Continue?`,
      );
      if (!confirmed) {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(options.uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected.');

    const summary = [];

    for (const entry of targetCollections) {
      const filePath = path.resolve(dumpDir, entry.file);
      process.stdout.write(`📂 ${entry.label} -> ${entry.collection} ... `);
      try {
        const docs = loadDumpDocuments(filePath);
        if (!docs.length) {
          summary.push({ entry, inserted: 0, deleted: 0, skipped: 0 });
          console.log('skipped (no documents)');
          continue;
        }

        const result = await seedCollection(entry, docs, options.mode);
        summary.push({ entry, ...result });
        console.log(
          `done (${result.inserted} inserted, ${result.deleted} deleted${result.skipped ? `, ${result.skipped} skipped` : ''})`,
        );
      } catch (error) {
        summary.push({ entry, error });
        console.log('failed');
        console.error(`   ↳ ${error.message}`);
      }
    }

    console.log('\n📊 Summary');
    console.log('--------------------------------------');
    summary.forEach((item) => {
      if (item.error) {
        console.log(
          `❌ ${item.entry.collection}: FAILED - ${item.error.message}`,
        );
      } else {
        console.log(
          `✅ ${item.entry.collection}: inserted=${item.inserted}, deleted=${item.deleted}, skipped=${item.skipped}`,
        );
      }
    });
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  }
}

main();
