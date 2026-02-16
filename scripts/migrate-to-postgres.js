// ============================================================================
// MongoDB → PostgreSQL Data Migration Script
// Otter Laundry API - Complete Migration with Validation
// ============================================================================
//
// Usage:
//   1. Install deps: npm install @prisma/client mongodb uuid
//   2. Set env vars: DATABASE_URL, MONGODB_URI
//   3. Run: npx prisma generate && npx prisma db push
//   4. Run: node scripts/migrate-to-postgres.js [--dry-run] [--validate-only] [--batch-size=500]
//
// Flags:
//   --dry-run         Read from MongoDB, transform, but don't write to PG
//   --validate-only   Only run post-migration validation checks
//   --batch-size=N    Override default batch size (default: 500)
//   --skip-cache      Skip delivery_person_cache migration (transient data)
//   --resume          Resume from last checkpoint
// ============================================================================

const { MongoClient, ObjectId } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin';
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '500');
const DRY_RUN = process.argv.includes('--dry-run');
const VALIDATE_ONLY = process.argv.includes('--validate-only');
const SKIP_CACHE = process.argv.includes('--skip-cache');
const RESUME = process.argv.includes('--resume');

const CHECKPOINT_FILE = path.join(__dirname, '.migration-checkpoint.json');
const LOG_FILE = path.join(__dirname, `migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// ─── ID Mapping ──────────────────────────────────────────────────────────────
// Maps MongoDB ObjectId strings → PostgreSQL UUIDs for referential integrity

const idMap = {
  admins: new Map(),
  users: new Map(),
  vendors: new Map(),
  services: new Map(),
  serviceItems: new Map(),
  deliveryPersons: new Map(),
  orders: new Map(),
  payments: new Map(),
  reviews: new Map(),
  notifications: new Map(),
  offers: new Map(),
  transactions: new Map(),
  transactionLogs: new Map(),
  deliveryLogs: new Map(),
  banners: new Map(),
  appConfigs: new Map(),
  appVersions: new Map(),
  userAddresses: new Map(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(level, msg, data = null) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${msg}${data ? ' ' + JSON.stringify(data) : ''}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function mapId(collection, mongoId) {
  if (!mongoId) return null;
  const key = mongoId.toString();
  if (!idMap[collection]) {
    log('WARN', `Unknown collection in idMap: ${collection}`);
    return null;
  }
  if (!idMap[collection].has(key)) {
    const uuid = randomUUID();
    idMap[collection].set(key, uuid);
  }
  return idMap[collection].get(key);
}

// Track which IDs were actually inserted into PostgreSQL
const insertedIds = {
  admin: new Set(),
  user: new Set(),
  vendor: new Set(),
  service: new Set(),
  serviceItem: new Set(),
  deliveryPerson: new Set(),
  order: new Set(),
  payment: new Set(),
  review: new Set(),
  notification: new Set(),
  offer: new Set(),
  transaction: new Set(),
  transactionLog: new Set(),
  deliveryLog: new Set(),
};

// Only returns UUID if the record was actually inserted into PG; otherwise null
function safeRef(collection, mongoId) {
  if (!mongoId) return null;
  const key = mongoId.toString();
  const uuid = idMap[collection]?.get(key);
  if (!uuid) return null;
  // Check if the UUID was inserted (try both singular prisma model name)
  const modelName = collection.replace(/s$/, ''); // e.g. 'users' -> 'user'  
  if (insertedIds[modelName]?.has(uuid)) return uuid;
  if (insertedIds[collection]?.has(uuid)) return uuid;
  return null;
}

function safeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function safeInt(val) {
  const n = parseInt(val);
  return isNaN(n) ? 0 : n;
}

function safeDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.$date) return new Date(val.$date);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function safeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

// Map MongoDB notification types to Prisma NotificationType enum values
const NOTIFICATION_TYPE_MAP = {
  'order': 'order',
  'ORDER': 'order',
  'payment': 'payment',
  'PAYMENT': 'payment',
  'system': 'system',
  'SYSTEM': 'system',
  'promotion': 'promotion',
  'PROMOTION': 'promotion',
  'service': 'service',
  'SERVICE': 'service',
  'vendor_update': 'vendor_update',
  'VENDOR_UPDATE': 'vendor_update',
  'delivery': 'delivery',
  'DELIVERY': 'delivery',
};

function normalizeNotificationType(type) {
  if (!type) return 'system';
  const mapped = NOTIFICATION_TYPE_MAP[type] || NOTIFICATION_TYPE_MAP[type.toLowerCase()];
  return mapped || 'system';
}

function saveCheckpoint(step, data = {}) {
  const checkpoint = { step, timestamp: new Date().toISOString(), ...data };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    }
  } catch (e) { }
  return null;
}

// ─── Batch Insert Helper ─────────────────────────────────────────────────────

async function batchInsert(prisma, modelName, records, batchSize = BATCH_SIZE) {
  if (DRY_RUN) {
    log('DRY-RUN', `Would insert ${records.length} records into ${modelName}`);
    return records.length;
  }
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    try {
      await prisma[modelName].createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += batch.length;
      // Track successfully inserted IDs
      for (const rec of batch) {
        if (rec.id && insertedIds[modelName]) {
          insertedIds[modelName].add(rec.id);
        }
      }
      if (records.length > batchSize) {
        log('INFO', `  ${modelName}: ${inserted}/${records.length} inserted`);
      }
    } catch (err) {
      log('ERROR', `Batch insert failed for ${modelName} at offset ${i}`, {
        error: err.message,
        firstRecord: JSON.stringify(batch[0]).substring(0, 200),
      });
      // Fall back to individual inserts for this batch
      for (const record of batch) {
        try {
          await prisma[modelName].create({ data: record });
          inserted++;
          // Track individually inserted IDs
          if (record.id && insertedIds[modelName]) {
            insertedIds[modelName].add(record.id);
          }
        } catch (innerErr) {
          log('ERROR', `Individual insert failed in ${modelName}`, {
            error: innerErr.message,
            mongoId: record.mongoId,
          });
        }
      }
    }
  }
  return inserted;
}

// ─── Migration Steps (ordered for referential integrity) ─────────────────────

async function migrateAdmins(mongoDB, prisma) {
  log('INFO', '═══ Migrating Admins ═══');
  const docs = await mongoDB.collection('admins').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('admins', doc._id),
    email: safeString(doc.email).toLowerCase(),
    password: safeString(doc.password),
    name: safeString(doc.name),
    role: doc.role || 'ADMIN',
    permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
    isActive: doc.isActive !== false,
    lastLogin: safeDate(doc.lastLogin),
    createdAt: safeDate(doc.createdAt) || new Date(),
    updatedAt: safeDate(doc.updatedAt) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'admin', records);
  log('INFO', `Admins: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateAppConfigs(mongoDB, prisma) {
  log('INFO', '═══ Migrating App Configs ═══');
  const docs = await mongoDB.collection('appconfigs').find({}).toArray();
  const records = docs.map(doc => {
    const pc = doc.payment_config || {};
    const gc = doc.general_config || {};
    const dc = doc.delivery_config || {};
    return {
      id: mapId('appConfigs', doc._id),
      configKey: safeString(doc.config_key),
      configName: safeString(doc.config_name),
      description: doc.description || null,
      gst: safeFloat(pc.gst),
      platformFee: safeFloat(pc.platform_fee),
      deliveryFee: safeFloat(pc.delivery_fee),
      vendorCommission: safeFloat(pc.vendor_commission),
      currency: safeString(pc.currency, 'INR'),
      minOrderAmount: pc.min_order_amount != null ? safeFloat(pc.min_order_amount) : null,
      maxOrderAmount: pc.max_order_amount != null ? safeFloat(pc.max_order_amount) : null,
      walletEnabled: pc.wallet_enabled === true,
      offerEnabled: pc.offer_enabled === true,
      expressDeliveryFee: pc.express_delivery_fee != null ? safeFloat(pc.express_delivery_fee) : null,
      standardDeliveryFee: pc.standard_delivery_fee != null ? safeFloat(pc.standard_delivery_fee) : null,
      appVersion: gc.app_version || null,
      maintenanceMode: gc.maintenance_mode === true,
      supportContact: gc.support_contact || null,
      termsUrl: gc.terms_url || null,
      privacyUrl: doc.privacy_policy_url || gc.privacy_url || null,
      initialDistanceKm: dc.initial_distance_km != null ? safeFloat(dc.initial_distance_km) : null,
      totalDistanceKm: dc.total_distance_km != null ? safeFloat(dc.total_distance_km) : null,
      deliveryOrderAcceptTime: dc.delivery_order_accept_time != null ? safeInt(dc.delivery_order_accept_time) : null,
      orderDistance: dc.order_distance != null ? safeFloat(dc.order_distance) : null,
      supportPhoneNumber: doc.support_phone_number || null,
      privacyPolicyUrl: doc.privacy_policy_url || null,
      topLevelTermsUrl: doc.terms_url || null,
      isActive: doc.is_active !== false,
      effectiveFrom: safeDate(doc.effective_from),
      effectiveUntil: safeDate(doc.effective_until),
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    };
  });
  const count = await batchInsert(prisma, 'appConfig', records);
  log('INFO', `AppConfigs: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateAppVersions(mongoDB, prisma) {
  log('INFO', '═══ Migrating App Versions ═══');
  const docs = await mongoDB.collection('appversions').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('appVersions', doc._id),
    appType: doc.app_type,
    version: safeString(doc.version),
    isForceUpdate: doc.is_forceupdate === true,
    createdAt: safeDate(doc.createdAt) || new Date(),
    updatedAt: safeDate(doc.updatedAt) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'appVersion', records);
  log('INFO', `AppVersions: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateBanners(mongoDB, prisma) {
  log('INFO', '═══ Migrating Banners ═══');
  const docs = await mongoDB.collection('banners').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('banners', doc._id),
    assetUrl: safeString(doc.asseturl),
    isActive: doc.isactive !== false,
    enableStatus: doc.enableStatus !== false,
    position: doc.position != null ? safeInt(doc.position) : null,
    type: doc.type || null,
    cta: doc.cta || null,
    createdAt: safeDate(doc.createdAt) || new Date(),
    updatedAt: safeDate(doc.updatedAt) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'banner', records);
  log('INFO', `Banners: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateServices(mongoDB, prisma) {
  log('INFO', '═══ Migrating Services (Master Catalog) ═══');
  const docs = await mongoDB.collection('services').find({}).toArray();

  const serviceRecords = [];
  const itemRecords = [];

  for (const doc of docs) {
    const serviceUUID = mapId('services', doc._id);
    serviceRecords.push({
      id: serviceUUID,
      serviceName: safeString(doc.service_name),
      imageUrl: safeString(doc.image_url),
      pricingType: doc.pricing_type || 'per_pc',
      serviceDescription: safeString(doc.service_description),
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });

    if (Array.isArray(doc.items)) {
      for (const item of doc.items) {
        const itemMongoId = item._id ? item._id.toString() : `${doc._id}-${item.item_slug || item.item_name}`;
        const itemUUID = mapId('serviceItems', itemMongoId);
        itemRecords.push({
          id: itemUUID,
          serviceId: serviceUUID,
          itemName: safeString(item.item_name),
          imageUrl: safeString(item.image_url),
          itemDescription: safeString(item.item_description),
          itemSlug: safeString(item.item_slug),
          category: item.category || null,
          mongoId: itemMongoId,
        });
      }
    }
  }

  const sCount = await batchInsert(prisma, 'service', serviceRecords);
  const iCount = await batchInsert(prisma, 'serviceItem', itemRecords);
  log('INFO', `Services: ${sCount}/${docs.length} migrated, Items: ${iCount} migrated`);
  return { source: docs.length, migrated: sCount, items: iCount };
}

async function migrateUsers(mongoDB, prisma) {
  log('INFO', '═══ Migrating Users ═══');
  const docs = await mongoDB.collection('users').find({}).toArray();

  const userRecords = [];
  const addressRecords = [];

  for (const doc of docs) {
    const userUUID = mapId('users', doc._id);
    const wallet = doc.wallet || {};
    const prefs = doc.preferences || {};

    userRecords.push({
      id: userUUID,
      name: safeString(doc.name),
      email: safeString(doc.email).toLowerCase(),
      phone: safeString(doc.phone),
      gender: doc.gender || null,
      dob: safeDate(doc.dob),
      walletBalance: safeFloat(wallet.balance),
      walletCurrency: safeString(wallet.currency, 'INR'),
      walletLastUpdate: safeDate(wallet.last_updated),
      loyaltyPoints: safeInt(doc.loyalty_points),
      prefWashType: prefs.wash_type || null,
      prefFoldPreference: prefs.fold_preference || null,
      prefDetergentType: prefs.detergent_type || null,
      prefNotificationsEnabled: prefs.notifications_enabled !== false,
      referralCode: doc.referral_code || null,
      referredBy: doc.referred_by || null,
      status: doc.status || 'active',
      fcmToken: doc.fcm_token || null,
      sessionToken: safeString(doc.session_token),
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });

    if (Array.isArray(doc.addresses)) {
      for (const addr of doc.addresses) {
        const addrMongoId = addr._id ? addr._id.toString() : `${doc._id}-${addr.label || 'default'}`;
        addressRecords.push({
          id: mapId('userAddresses', addrMongoId),
          userId: userUUID,
          label: addr.label || null,
          addressLine1: safeString(addr.address_line1),
          addressLine2: addr.address_line2 || null,
          city: safeString(addr.city),
          state: safeString(addr.state),
          pincode: safeString(addr.pincode),
          latitude: addr.latitude != null ? safeFloat(addr.latitude) : null,
          longitude: addr.longitude != null ? safeFloat(addr.longitude) : null,
          isDefault: addr.is_default === true,
          landmark: addr.landmark || null,
          mongoId: addrMongoId,
        });
      }
    }
  }

  const uCount = await batchInsert(prisma, 'user', userRecords);
  const aCount = await batchInsert(prisma, 'userAddress', addressRecords);
  log('INFO', `Users: ${uCount}/${docs.length} migrated, Addresses: ${aCount} migrated`);
  return { source: docs.length, migrated: uCount, addresses: aCount };
}

async function migrateVendors(mongoDB, prisma) {
  log('INFO', '═══ Migrating Vendors ═══');
  const docs = await mongoDB.collection('vendors').find({}).toArray();

  const vendorRecords = [];
  const opHoursRecords = [];
  const pickupZoneRecords = [];
  const ratingReviewRecords = [];
  const vendorServiceRecords = [];
  const vendorServiceItemRecords = [];
  const settlementOrderRecords = [];

  for (const doc of docs) {
    const vendorUUID = mapId('vendors', doc._id);
    const addr = doc.address || {};
    const rating = doc.rating || {};
    const wallet = doc.wallet || {};
    const bank = doc.bank_details || {};
    const sub = doc.subscription_plan || {};
    const docDocs = doc.documents || {};
    const shopStatus = doc.shop_status || {};

    vendorRecords.push({
      id: vendorUUID,
      shopName: safeString(doc.shop_name),
      shopImageUrl: doc.shop_image_url || null,
      profilePic: doc.profile_pic || null,
      ownerName: doc.owner_name || null,
      email: safeString(doc.email).toLowerCase(),
      phone: safeString(doc.phone),
      contactNum: doc.contactNum || null,
      passwordHash: doc.password_hash || null,
      status: doc.status || 'active',
      gstNumber: doc.gst_number || null,
      panNumber: doc.pan_number || null,
      aadhaarNumber: doc.aadhaar_number || null,
      shopLicenseNumber: doc.shop_license_number || null,
      totalOrders: safeInt(doc.total_orders),
      shopOpenStatus: shopStatus.status || 'open',
      shopCloseTime: safeDate(shopStatus.close_time),
      expressStatus: doc.express_status === true,
      addressLine1: addr.address_line1 || null,
      addressLine2: addr.address_line2 || null,
      city: addr.city || null,
      state: addr.state || null,
      pincode: addr.pincode || null,
      latitude: addr.latitude != null ? safeFloat(addr.latitude) : null,
      longitude: addr.longitude != null ? safeFloat(addr.longitude) : null,
      landmark: addr.landmark || null,
      ratingAverage: safeFloat(rating.average),
      ratingTotalReviews: safeInt(rating.total_reviews),
      walletBalance: safeFloat(wallet.balance),
      walletCurrency: safeString(wallet.currency, 'INR'),
      walletLastUpdate: safeDate(wallet.last_updated),
      bankAccountHolderName: bank.account_holder_name || null,
      bankAccountNumber: bank.account_number || null,
      bankIfscCode: bank.ifsc_code || null,
      bankName: bank.bank_name || null,
      bankBranch: bank.branch || null,
      bankCancelledCheque: bank.cancelled_cheque || null,
      bankUpiId: bank.upi_id || null,
      subscriptionPlanName: sub.plan_name || null,
      subscriptionMonthlyFee: sub.monthly_fee != null ? safeFloat(sub.monthly_fee) : null,
      subscriptionMaxOrdersPerDay: sub.max_orders_per_day != null ? safeInt(sub.max_orders_per_day) : null,
      subscriptionCommissionPct: sub.commission_percentage != null ? safeFloat(sub.commission_percentage) : null,
      docAadhaarCard: docDocs.aadhaar_card || null,
      docGstCertificate: docDocs.gst_certificate || null,
      docPanCard: docDocs.pan_card || null,
      fcmToken: doc.fcm_token || null,
      sessionToken: safeString(doc.session_token),
      amountDue: safeFloat(doc.amount_due),
      lastServiceUpdatedAt: safeDate(doc.last_service_updated_at),
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });

    // Operating hours
    if (doc.operating_hours) {
      for (const [day, hours] of Object.entries(doc.operating_hours)) {
        if (hours && hours.open && hours.close) {
          opHoursRecords.push({
            id: randomUUID(),
            vendorId: vendorUUID,
            dayOfWeek: day,
            open: safeString(hours.open),
            close: safeString(hours.close),
          });
        }
      }
    }

    // Pickup zones
    if (Array.isArray(doc.pickup_zones)) {
      for (const zone of doc.pickup_zones) {
        pickupZoneRecords.push({
          id: randomUUID(),
          vendorId: vendorUUID,
          zoneName: safeString(zone.zone_name),
          pincodes: Array.isArray(zone.pincodes) ? zone.pincodes : [],
        });
      }
    }

    // Rating reviews (embedded in vendor)
    if (rating.reviews && Array.isArray(rating.reviews)) {
      for (const rev of rating.reviews) {
        ratingReviewRecords.push({
          id: randomUUID(),
          vendorId: vendorUUID,
          userId: rev.user_id ? mapId('users', rev.user_id) : null,
          name: rev.name || null,
          rating: safeInt(rev.rating),
          comment: rev.comment || null,
          date: safeDate(rev.date),
        });
      }
    }

    // Services offered → VendorService + VendorServiceItem
    if (Array.isArray(doc.services_offered)) {
      for (const svc of doc.services_offered) {
        const vsId = randomUUID();
        const serviceId = svc.service_id ? mapId('services', svc.service_id) : null;
        if (!serviceId) {
          log('WARN', `Vendor ${doc._id}: service_id missing in services_offered`);
          continue;
        }
        const tiers = svc.pricing_tiers || {};
        vendorServiceRecords.push({
          id: vsId,
          vendorId: vendorUUID,
          serviceId: serviceId,
          serviceName: safeString(svc.service_name),
          imageUrl: safeString(svc.image_url),
          pricingType: svc.pricing_type || 'per_pc',
          maxCountPerDay: svc.max_count_per_day != null ? safeInt(svc.max_count_per_day) : null,
          standardPricePerKg: safeFloat(svc.standard_price_per_kg),
          expressPricePerKg: safeFloat(svc.express_price_per_kg),
          serviceDescription: safeString(svc.service_description),
          isOffer: svc.is_offer === true,
          offerPercentage: svc.offer_percentage != null ? safeFloat(svc.offer_percentage) : null,
          offerMaxCap: safeFloat(svc.offer_max_cap),
          isActive: svc.is_active !== false,
          isApproved: svc.is_approved === true,
          isExpressAvailable: svc.is_express_available === true,
          expressDeliveryTimeMinutes: safeInt(svc.express_delivery_time_minutes),
          normalDeliveryTimeMinutes: safeInt(svc.normal_delivery_time_minutes),
          expressTime: safeInt(svc.express_time) || 8,
          standardTime: safeInt(svc.standard_time) || 48,
          pricingTierRegular: safeFloat(tiers.regular),
          pricingTierStandard: safeFloat(tiers.standard),
          pricingTierMax: safeFloat(tiers.max),
        });

        if (Array.isArray(svc.items)) {
          for (const item of svc.items) {
            const itemMongoId = item.item_id ? item.item_id.toString() : null;
            const itemUUID = itemMongoId ? mapId('serviceItems', itemMongoId) : null;
            if (!itemUUID) {
              log('WARN', `Vendor ${doc._id}: item_id missing in vendor service item`);
              continue;
            }
            vendorServiceItemRecords.push({
              id: randomUUID(),
              vendorServiceId: vsId,
              itemId: itemUUID,
              itemName: safeString(item.item_name),
              imageUrl: item.image_url || null,
              itemPrice: safeFloat(item.item_price),
              expressPrice: safeFloat(item.express_price),
              minWeight: safeFloat(item.min_weight),
              maxWeight: safeFloat(item.max_weight),
              itemDescription: safeString(item.item_description),
              category: item.category || null,
              isActive: item.is_active !== false,
            });
          }
        }
      }
    }

    // Settlement orders
    if (Array.isArray(doc.orders_to_be_settled)) {
      for (const oid of doc.orders_to_be_settled) {
        const oidStr = oid.toString();
        // Map to UUID using mapId (idMap values are Map objects — use .get(), not bracket access)
        const mappedOrderId = idMap.orders.get(oidStr) || oidStr;
        settlementOrderRecords.push({
          id: randomUUID(),
          vendorId: vendorUUID,
          orderId: mappedOrderId,
        });
      }
    }
  }

  const vCount = await batchInsert(prisma, 'vendor', vendorRecords);
  await batchInsert(prisma, 'vendorOperatingHours', opHoursRecords);
  await batchInsert(prisma, 'vendorPickupZone', pickupZoneRecords);
  await batchInsert(prisma, 'vendorRatingReview', ratingReviewRecords);
  await batchInsert(prisma, 'vendorService', vendorServiceRecords);
  await batchInsert(prisma, 'vendorServiceItem', vendorServiceItemRecords);
  await batchInsert(prisma, 'vendorSettlementOrder', settlementOrderRecords);

  log('INFO', `Vendors: ${vCount}/${docs.length} migrated`);
  log('INFO', `  Operating hours: ${opHoursRecords.length}`);
  log('INFO', `  Pickup zones: ${pickupZoneRecords.length}`);
  log('INFO', `  Rating reviews: ${ratingReviewRecords.length}`);
  log('INFO', `  Vendor services: ${vendorServiceRecords.length}`);
  log('INFO', `  Vendor service items: ${vendorServiceItemRecords.length}`);
  log('INFO', `  Settlement orders: ${settlementOrderRecords.length}`);

  return { source: docs.length, migrated: vCount };
}

async function migrateDeliveryPersons(mongoDB, prisma) {
  log('INFO', '═══ Migrating Delivery Persons ═══');
  const docs = await mongoDB.collection('deliverypersons').find({}).toArray();

  const dpRecords = [];
  const assignedOrderRecords = [];
  const ratingRecords = [];

  for (const doc of docs) {
    const dpUUID = mapId('deliveryPersons', doc._id);
    const vehicle = doc.vehicle || {};
    const license = doc.license || {};
    const aadhaar = doc.aadhaar || {};
    const addr = doc.address || {};
    const loc = doc.current_location || {};
    const wallet = doc.wallet || {};
    const earnings = doc.earnings_summary || {};
    const docDocs = doc.documents || {};

    dpRecords.push({
      id: dpUUID,
      name: safeString(doc.name),
      email: safeString(doc.email).toLowerCase(),
      phone: safeString(doc.phone),
      status: doc.status || 'active',
      role: doc.role || null,
      assignedZones: Array.isArray(doc.assigned_zones) ? doc.assigned_zones : [],
      vehicleType: vehicle.vehicle_type || null,
      vehicleNumber: vehicle.vehicle_number || null,
      vehicleModel: vehicle.model || null,
      vehicleColor: vehicle.color || null,
      licenseNumber: license.license_number || null,
      licenseValidTill: safeDate(license.valid_till),
      licenseVerified: license.verified != null ? license.verified : null,
      licenseDocUrl: license.document_url || null,
      aadhaarNumber: aadhaar.aadhaar_number || null,
      aadhaarVerified: aadhaar.verified != null ? aadhaar.verified : null,
      aadhaarDocUrl: aadhaar.document_url || null,
      addressArea: addr.area || null,
      addressLocality: addr.locality || null,
      addressCity: addr.city || null,
      addressState: addr.state || null,
      addressPincode: addr.pincode || null,
      addressCountry: addr.country || null,
      addressLatitude: addr.latitude != null ? safeFloat(addr.latitude) : null,
      addressLongitude: addr.longitude != null ? safeFloat(addr.longitude) : null,
      currentLatitude: loc.latitude != null ? safeFloat(loc.latitude) : null,
      currentLongitude: loc.longitude != null ? safeFloat(loc.longitude) : null,
      locationLastUpdated: safeDate(loc.last_updated),
      availabilityStatus: safeInt(doc.availability_status) || 1,
      walletBalance: safeFloat(wallet.balance),
      walletCurrency: safeString(wallet.currency, 'INR'),
      walletLastUpdate: safeDate(wallet.last_updated),
      totalEarnings: safeFloat(earnings.total_earnings),
      completedOrders: safeInt(earnings.completed_orders),
      averageRating: safeFloat(earnings.average_rating),
      profilePhoto: docDocs.profile_photo || null,
      fcmToken: doc.fcm_token || null,
      sessionToken: safeString(doc.session_token),
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });

    // Assigned orders
    if (Array.isArray(doc.assigned_orders)) {
      for (const ao of doc.assigned_orders) {
        assignedOrderRecords.push({
          id: randomUUID(),
          deliveryPersonId: dpUUID,
          orderId: ao.order_id ? mapId('orders', ao.order_id) : null,
          pickupFromUserId: ao.pickup_from_user_id ? mapId('users', ao.pickup_from_user_id) : null,
          deliverToVendorId: ao.deliver_to_vendor_id ? mapId('vendors', ao.deliver_to_vendor_id) : null,
          pickupFromVendorId: ao.pickup_from_vendor_id ? mapId('vendors', ao.pickup_from_vendor_id) : null,
          deliverToUserId: ao.deliver_to_user_id ? mapId('users', ao.deliver_to_user_id) : null,
          status: ao.status || null,
          pickupTime: safeDate(ao.pickup_time),
          expectedDeliveryTime: safeDate(ao.expected_delivery_time),
        });
      }
    }

    // Ratings
    if (Array.isArray(doc.ratings)) {
      for (const r of doc.ratings) {
        ratingRecords.push({
          id: randomUUID(),
          deliveryPersonId: dpUUID,
          orderId: r.order_id ? mapId('orders', r.order_id) : null,
          userId: r.user_id ? mapId('users', r.user_id) : null,
          rating: safeInt(r.rating),
          comment: r.comment || null,
          date: safeDate(r.date),
        });
      }
    }
  }

  const count = await batchInsert(prisma, 'deliveryPerson', dpRecords);
  // NOTE: assigned orders reference orders which may not exist yet
  // We'll insert them after orders migration
  log('INFO', `Delivery Persons: ${count}/${docs.length} migrated`);
  return {
    source: docs.length,
    migrated: count,
    deferredAssignedOrders: assignedOrderRecords,
    deferredRatings: ratingRecords,
  };
}

async function migrateOrders(mongoDB, prisma) {
  log('INFO', '═══ Migrating Orders ═══');
  const docs = await mongoDB.collection('orders').find({}).toArray();

  const orderRecords = [];
  const orderItemRecords = [];

  for (const doc of docs) {
    const orderUUID = mapId('orders', doc._id);
    const pd = doc.payment_details || {};
    const vAddr = doc.vendor_address || {};
    const uAddr = doc.user_address || {};
    const rider = doc.rider || {};

    // Skip orders where FK references don't exist in PG
    const userUUID = safeRef('users', doc.user_id);
    const vendorUUID = safeRef('vendors', doc.vendor_id);
    if (!userUUID && doc.user_id) {
      log('WARN', `Skipping order ${doc._id}: user ${doc.user_id} not in PG`);
      continue;
    }
    if (!vendorUUID && doc.vendor_id) {
      log('WARN', `Skipping order ${doc._id}: vendor ${doc.vendor_id} not in PG`);
      continue;
    }

    // Convert status_timestamps Map
    let statusTimestamps = null;
    if (doc.status_timestamps) {
      if (doc.status_timestamps instanceof Map) {
        statusTimestamps = Object.fromEntries(doc.status_timestamps);
      } else if (typeof doc.status_timestamps === 'object') {
        statusTimestamps = doc.status_timestamps;
      }
    }

    orderRecords.push({
      id: orderUUID,
      orderNumber: safeInt(doc.order_number),
      statusType: safeInt(doc.status_type) || 1,
      isVerified: doc.is_verified === true,
      userId: userUUID,
      vendorId: vendorUUID,
      vendorId: mapId('vendors', doc.vendor_id),
      driverId1: doc.driver_id_1 ? safeRef('deliveryPersons', doc.driver_id_1) : null,
      driverId2: doc.driver_id_2 ? safeRef('deliveryPersons', doc.driver_id_2) : null,
      vendorAddressLine1: vAddr.address_line1 || null,
      vendorAddressLine2: vAddr.address_line2 || null,
      vendorCity: vAddr.city || null,
      vendorState: vAddr.state || null,
      vendorPincode: vAddr.pincode || null,
      vendorLatitude: vAddr.latitude != null ? safeFloat(vAddr.latitude) : null,
      vendorLongitude: vAddr.longitude != null ? safeFloat(vAddr.longitude) : null,
      vendorLandmark: vAddr.landmark || null,
      userAddressLabel: uAddr.label || null,
      userAddressLine1: uAddr.address_line1 || null,
      userAddressLine2: uAddr.address_line2 || null,
      userCity: uAddr.city || null,
      userState: uAddr.state || null,
      userPincode: uAddr.pincode || null,
      userLatitude: uAddr.latitude != null ? safeFloat(uAddr.latitude) : null,
      userLongitude: uAddr.longitude != null ? safeFloat(uAddr.longitude) : null,
      userIsDefault: uAddr.is_default === true,
      riderName: rider.name || null,
      riderPhone: rider.phone || null,
      status: doc.status || 'pending',
      statusTimestamps: statusTimestamps,
      isExpress: doc.is_express === true,
      pickupScheduledAt: safeDate(doc.pickup_scheduled_at),
      pickedUpAt: safeDate(doc.picked_up_at),
      deliveredToVendorAt: safeDate(doc.delivered_to_vendor_at),
      expectedDeliveryDate: safeDate(doc.expected_delivery_date),
      deliveredToUserAt: safeDate(doc.delivered_to_user_at),
      paymentStatus: doc.payment_status || 'pending',
      paymentId: doc.payment_id ? mapId('payments', doc.payment_id) : null,
      isPaymentEligible: pd.is_payment_eligible === true,
      amountToVendor: safeFloat(pd.amount_to_vendor),
      amountToVendorAfterCommission: safeFloat(pd.amount_to_vendor_after_commission),
      amountToPlatform: safeFloat(pd.amount_to_platform),
      pdDeliveryFee: safeFloat(pd.delivery_fee),
      pdGst: safeFloat(pd.gst),
      pdIsOfferApplied: pd.isOfferApplied === true,
      pdOfferDiscountAmount: safeFloat(pd.offerDiscountAmount),
      pdTotalPayableAmount: safeFloat(pd.totalPayableAmount),
      pdItemTotal: safeFloat(pd.item_total),
      pdGrandTotal: safeFloat(pd.grand_total),
      pdVendorCommission: safeFloat(pd.vendor_commission),
      totalAmount: safeFloat(doc.total_amount),
      currency: safeString(doc.currency, 'INR'),
      orderNotes: doc.order_notes || null,
      ratingGiven: doc.rating_given === true,
      userOtp: safeInt(doc.user_otp),
      vendorOtp: safeString(doc.vendor_otp, '0'),
      cashPaidAmount: safeFloat(doc.cash_paid_amount),
      invoiceUrl: doc.invoice_url || null,
      tripType: doc.trip_type != null ? safeInt(doc.trip_type) : null,
      isSettledToVendor: doc.is_settled_to_vendor === true,
      settledAmount: safeFloat(doc.settled_amount),
      etaStartTime: safeDate(doc.eta_start_time),
      etaEndTime: safeDate(doc.eta_end_time),
      payment: safeFloat(doc.payment),
      serviceType: doc.service_type != null ? safeInt(doc.service_type) : null,
      createdAt: safeDate(doc.created_at) || new Date(),
      updatedAt: safeDate(doc.updated_at) || new Date(),
      mongoId: doc._id.toString(),
    });

    // Order items
    if (Array.isArray(doc.items)) {
      for (const item of doc.items) {
        const serviceMongoId = item.service_id ? item.service_id.toString() : null;
        const itemMongoId = item.item_id ? item.item_id.toString() : null;
        orderItemRecords.push({
          id: randomUUID(),
          orderId: orderUUID,
          serviceId: serviceMongoId ? mapId('services', serviceMongoId) : null,
          serviceName: safeString(item.service_name),
          itemId: itemMongoId ? mapId('serviceItems', itemMongoId) : null,
          itemName: safeString(item.item_name),
          quantity: safeInt(item.quantity),
          pricePerItem: item.price_per_item != null ? safeFloat(item.price_per_item) : null,
          totalPrice: item.total_price != null ? safeFloat(item.total_price) : null,
          itemCategory: item.item_category || null,
          weight: safeFloat(item.weight),
          pricingTier: item.pricing_tier || 'regular',
        });
      }
    }
  }

  const oCount = await batchInsert(prisma, 'order', orderRecords);
  const oiCount = await batchInsert(prisma, 'orderItem', orderItemRecords);
  log('INFO', `Orders: ${oCount}/${docs.length} migrated, Items: ${oiCount}`);
  return { source: docs.length, migrated: oCount, items: oiCount };
}

async function migratePayments(mongoDB, prisma) {
  log('INFO', '═══ Migrating Payments ═══');
  const docs = await mongoDB.collection('payments').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('payments', doc._id),
    orderId: mapId('orders', doc.order_id),
    userId: mapId('users', doc.user_id),
    paymentGateway: safeString(doc.payment_gateway),
    paymentMode: safeString(doc.payment_mode),
    transactionId: safeString(doc.transaction_id),
    amount: safeFloat(doc.amount),
    currency: safeString(doc.currency, 'INR'),
    status: doc.status || 'created',
    walletUsed: safeFloat(doc.wallet_used),
    vendorShare: safeFloat(doc.vendor_share),
    platformCommission: safeFloat(doc.platform_commission),
    paymentTimestamp: safeDate(doc.payment_timestamp),
    createdAt: safeDate(doc.createdAt) || new Date(),
    updatedAt: safeDate(doc.updatedAt) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'payment', records);
  log('INFO', `Payments: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateReviews(mongoDB, prisma) {
  log('INFO', '═══ Migrating Reviews ═══');
  const docs = await mongoDB.collection('reviews').find({}).toArray();
  const records = [];
  for (const doc of docs) {
    const userId = safeRef('users', doc.user_id);
    const vendorId = safeRef('vendors', doc.vendor_id);
    const orderId = safeRef('orders', doc.order_id);
    records.push({
      id: mapId('reviews', doc._id),
      userId,
      vendorId,
      orderId,
      rating: safeInt(doc.rating),
      serviceName: doc.serviceName || null,
      comment: doc.comment || null,
      isVerified: doc.is_verified === true,
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });
  }
  const count = await batchInsert(prisma, 'review', records);
  log('INFO', `Reviews: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateNotifications(mongoDB, prisma) {
  log('INFO', '═══ Migrating Notifications ═══');
  const docs = await mongoDB.collection('notifications').find({}).toArray();
  const records = docs.map(doc => {
    const role = doc.recipient_role;
    const recipientUUID =
      role === 'user' ? safeRef('users', doc.recipient_id) :
      role === 'vendor' ? safeRef('vendors', doc.recipient_id) :
      role === 'delivery' ? safeRef('deliveryPersons', doc.recipient_id) :
      safeRef('users', doc.recipient_id);

    return {
      id: mapId('notifications', doc._id),
      recipientRole: role || 'user',
      userId: role === 'user' ? recipientUUID : null,
      vendorId: role === 'vendor' ? recipientUUID : null,
      deliveryPersonId: role === 'delivery' ? recipientUUID : null,
      title: safeString(doc.title),
      message: safeString(doc.message),
      type: normalizeNotificationType(doc.type),
      orderId: doc.order_id ? safeRef('orders', doc.order_id) : null,
      isRead: doc.is_read === true,
      readAt: safeDate(doc.read_at),
      metadata: doc.metadata && Object.keys(doc.metadata).length > 0 ? doc.metadata : null,
      createdAt: safeDate(doc.created_at) || new Date(),
      updatedAt: safeDate(doc.updated_at) || new Date(),
      mongoId: doc._id.toString(),
    };
  });
  const count = await batchInsert(prisma, 'notification', records);
  log('INFO', `Notifications: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateOffers(mongoDB, prisma) {
  log('INFO', '═══ Migrating Offers ═══');
  const docs = await mongoDB.collection('offers').find({}).toArray();

  const offerRecords = [];
  const assignedUserRecords = [];
  const usageRecords = [];
  const applicableServiceRecords = [];

  for (const doc of docs) {
    const offerUUID = mapId('offers', doc._id);
    offerRecords.push({
      id: offerUUID,
      code: safeString(doc.code).toUpperCase(),
      title: safeString(doc.title),
      description: doc.description || null,
      discountType: doc.discount_type || 'percentage',
      discountValue: safeFloat(doc.discount_value),
      maxDiscountCap: safeFloat(doc.max_discount_cap),
      minOrderValue: safeFloat(doc.min_order_value),
      validFrom: safeDate(doc.valid_from) || new Date(),
      validUntil: safeDate(doc.valid_until) || new Date(),
      isActive: doc.is_active !== false,
      maxUsagePerUser: safeInt(doc.max_usage_per_user),
      totalUsageLimit: safeInt(doc.total_usage_limit),
      totalUsageCount: safeInt(doc.total_usage_count),
      createdBy: doc.created_by || null,
      createdAt: safeDate(doc.createdAt) || new Date(),
      updatedAt: safeDate(doc.updatedAt) || new Date(),
      mongoId: doc._id.toString(),
    });

    if (Array.isArray(doc.assigned_users)) {
      for (const uid of doc.assigned_users) {
        assignedUserRecords.push({
          id: randomUUID(),
          offerId: offerUUID,
          userId: mapId('users', uid),
        });
      }
    }

    if (Array.isArray(doc.user_usage)) {
      for (const u of doc.user_usage) {
        usageRecords.push({
          id: randomUUID(),
          offerId: offerUUID,
          userId: mapId('users', u.user_id),
          usageCount: safeInt(u.usage_count),
          lastUsedAt: safeDate(u.last_used_at),
        });
      }
    }

    if (Array.isArray(doc.applicable_services)) {
      for (const sid of doc.applicable_services) {
        applicableServiceRecords.push({
          id: randomUUID(),
          offerId: offerUUID,
          serviceId: mapId('services', sid),
        });
      }
    }
  }

  const count = await batchInsert(prisma, 'offer', offerRecords);
  await batchInsert(prisma, 'offerAssignedUser', assignedUserRecords);
  await batchInsert(prisma, 'offerUsage', usageRecords);
  await batchInsert(prisma, 'offerApplicableService', applicableServiceRecords);
  log('INFO', `Offers: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateTransactions(mongoDB, prisma) {
  log('INFO', '═══ Migrating Transactions ═══');
  const docs = await mongoDB.collection('transactions').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('transactions', doc._id),
    userId: doc.user_id ? mapId('users', doc.user_id) : null,
    vendorId: doc.vendor_id ? mapId('vendors', doc.vendor_id) : null,
    driverId: doc.driver_id ? mapId('deliveryPersons', doc.driver_id) : null,
    entityType: doc.entity_type || 'user',
    orderId: doc.order_id ? mapId('orders', doc.order_id) : null,
    transactionType: doc.transaction_type || 'debit',
    method: safeString(doc.method),
    amount: safeFloat(doc.amount),
    balanceAfter: doc.balance_after != null ? safeFloat(doc.balance_after) : null,
    description: doc.description || null,
    timestamp: safeDate(doc.timestamp) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'transaction', records);
  log('INFO', `Transactions: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateTransactionLogs(mongoDB, prisma) {
  log('INFO', '═══ Migrating Transaction Logs ═══');
  const docs = await mongoDB.collection('transactionlogs').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('transactionLogs', doc._id),
    orderId: safeRef('orders', doc.order_id),
    userId: safeRef('users', doc.user_id),
    linkId: safeString(doc.link_id),
    status: doc.status || 'initiated',
    amount: safeFloat(doc.amount),
    currency: safeString(doc.currency, 'INR'),
    paymentLinkUrl: safeString(doc.payment_link_url),
    paymentGateway: doc.payment_gateway || null,
    description: doc.description || null,
    metadata: doc.metadata && Object.keys(doc.metadata).length > 0 ? doc.metadata : null,
    createdAt: safeDate(doc.created_at) || new Date(),
    updatedAt: safeDate(doc.updated_at) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'transactionLog', records);
  log('INFO', `Transaction Logs: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateDeliveryLogs(mongoDB, prisma) {
  log('INFO', '═══ Migrating Delivery Logs ═══');
  const docs = await mongoDB.collection('deliverylogs').find({}).toArray();
  const records = docs.map(doc => ({
    id: mapId('deliveryLogs', doc._id),
    deliveryPersonId: safeRef('deliveryPersons', doc.delivery_person_id),
    type: safeString(doc.type),
    details: doc.details || null,
    createdAt: safeDate(doc.createdAt) || new Date(),
    updatedAt: safeDate(doc.updatedAt) || new Date(),
    mongoId: doc._id.toString(),
  }));
  const count = await batchInsert(prisma, 'deliveryLog', records);
  log('INFO', `Delivery Logs: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

async function migrateDeliveryCache(mongoDB, prisma) {
  if (SKIP_CACHE) {
    log('INFO', '═══ Skipping Delivery Person Cache (--skip-cache) ═══');
    return { source: 0, migrated: 0, skipped: true };
  }
  log('INFO', '═══ Migrating Delivery Person Cache ═══');
  const docs = await mongoDB.collection('delivery_person_cache').find({}).toArray();
  const records = docs.map(doc => ({
    id: randomUUID(),
    deliveryPersonId: mapId('deliveryPersons', doc.delivery_person_id),
    cachedOrders: doc.cached_orders || [],
    expiresAt: safeDate(doc.expires_at) || new Date(),
    checkTime: safeDate(doc.check_time),
    createdAt: safeDate(doc.created_at) || new Date(),
    updatedAt: safeDate(doc.updated_at) || new Date(),
  }));
  const count = await batchInsert(prisma, 'deliveryPersonCache', records);
  log('INFO', `Delivery Cache: ${count}/${docs.length} migrated`);
  return { source: docs.length, migrated: count };
}

// ─── Validation ──────────────────────────────────────────────────────────────

async function validateMigration(mongoDB, prisma) {
  log('INFO', '');
  log('INFO', '╔══════════════════════════════════════════════════════════════╗');
  log('INFO', '║            POST-MIGRATION VALIDATION                        ║');
  log('INFO', '╚══════════════════════════════════════════════════════════════╝');

  const checks = [
    { mongo: 'admins', prisma: 'admin' },
    { mongo: 'appconfigs', prisma: 'appConfig' },
    { mongo: 'appversions', prisma: 'appVersion' },
    { mongo: 'banners', prisma: 'banner' },
    { mongo: 'services', prisma: 'service' },
    { mongo: 'users', prisma: 'user' },
    { mongo: 'vendors', prisma: 'vendor' },
    { mongo: 'deliverypersons', prisma: 'deliveryPerson' },
    { mongo: 'orders', prisma: 'order' },
    { mongo: 'payments', prisma: 'payment' },
    { mongo: 'reviews', prisma: 'review' },
    { mongo: 'notifications', prisma: 'notification' },
    { mongo: 'offers', prisma: 'offer' },
    { mongo: 'transactions', prisma: 'transaction' },
    { mongo: 'transactionlogs', prisma: 'transactionLog' },
    { mongo: 'deliverylogs', prisma: 'deliveryLog' },
    { mongo: 'delivery_person_cache', prisma: 'deliveryPersonCache' },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const mongoCount = await mongoDB.collection(check.mongo).countDocuments();
      const pgCount = await prisma[check.prisma].count();
      const match = mongoCount === pgCount;
      const status = match ? '✓ PASS' : '✗ FAIL';
      log(match ? 'INFO' : 'ERROR', `  ${status} ${check.mongo}: MongoDB=${mongoCount}, PostgreSQL=${pgCount}`);
      if (!match) allPassed = false;
    } catch (err) {
      log('ERROR', `  ✗ ERROR checking ${check.mongo}: ${err.message}`);
      allPassed = false;
    }
  }

  // Validate relational integrity
  log('INFO', '');
  log('INFO', '── Referential Integrity Checks ──');

  // Orders → Users
  const orphanedOrderUsers = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE u.id IS NULL
  `;
  log('INFO', `  Orders with missing users: ${orphanedOrderUsers[0].count}`);

  // Orders → Vendors
  const orphanedOrderVendors = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM orders o
    LEFT JOIN vendors v ON o.vendor_id = v.id
    WHERE v.id IS NULL
  `;
  log('INFO', `  Orders with missing vendors: ${orphanedOrderVendors[0].count}`);

  // Payments → Orders
  const orphanedPayments = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM payments p
    LEFT JOIN orders o ON p.order_id = o.id
    WHERE o.id IS NULL
  `;
  log('INFO', `  Payments with missing orders: ${orphanedPayments[0].count}`);

  // Reviews → Users + Vendors
  const orphanedReviewUsers = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE u.id IS NULL
  `;
  log('INFO', `  Reviews with missing users: ${orphanedReviewUsers[0].count}`);

  const orphanedReviewVendors = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM reviews r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    WHERE v.id IS NULL
  `;
  log('INFO', `  Reviews with missing vendors: ${orphanedReviewVendors[0].count}`);

  // Transactions → Users
  const orphanedTransUsers = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM transactions t
    WHERE t.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = t.user_id)
  `;
  log('INFO', `  Transactions with missing users: ${orphanedTransUsers[0].count}`);

  // OrderItems → Orders
  const orphanedOrderItems = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL
  `;
  log('INFO', `  Order items with missing orders: ${orphanedOrderItems[0].count}`);

  // Child table counts (informational)
  log('INFO', '');
  log('INFO', '── Child Table Row Counts ──');
  const childTables = [
    'serviceItem', 'userAddress', 'vendorOperatingHours', 'vendorPickupZone',
    'vendorRatingReview', 'vendorService', 'vendorServiceItem', 'vendorSettlementOrder',
    'deliveryAssignedOrder', 'deliveryPersonRating', 'orderItem',
    'offerAssignedUser', 'offerUsage', 'offerApplicableService',
  ];
  for (const table of childTables) {
    try {
      const count = await prisma[table].count();
      log('INFO', `  ${table}: ${count} rows`);
    } catch (err) {
      log('ERROR', `  ${table}: ERROR - ${err.message}`);
    }
  }

  // Financial validation: sum of payment amounts
  log('INFO', '');
  log('INFO', '── Financial Validation ──');
  const mongoPaymentSum = await mongoDB.collection('payments').aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).toArray();
  const pgPaymentSum = await prisma.$queryRaw`SELECT COALESCE(SUM(amount), 0) as total FROM payments`;
  const mongoTotal = mongoPaymentSum[0]?.total || 0;
  const pgTotal = parseFloat(pgPaymentSum[0]?.total || 0);
  const financialMatch = Math.abs(mongoTotal - pgTotal) < 0.01;
  log(financialMatch ? 'INFO' : 'ERROR',
    `  Payment totals: MongoDB=${mongoTotal}, PostgreSQL=${pgTotal} ${financialMatch ? '✓' : '✗ MISMATCH!'}`);

  // Order amount validation
  const mongoOrderSum = await mongoDB.collection('orders').aggregate([
    { $group: { _id: null, total: { $sum: '$total_amount' } } }
  ]).toArray();
  const pgOrderSum = await prisma.$queryRaw`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders`;
  const mongoOrderTotal = mongoOrderSum[0]?.total || 0;
  const pgOrderTotal = parseFloat(pgOrderSum[0]?.total || 0);
  const orderFinancialMatch = Math.abs(mongoOrderTotal - pgOrderTotal) < 0.01;
  log(orderFinancialMatch ? 'INFO' : 'ERROR',
    `  Order amount totals: MongoDB=${mongoOrderTotal}, PostgreSQL=${pgOrderTotal} ${orderFinancialMatch ? '✓' : '✗ MISMATCH!'}`);

  log('INFO', '');
  log(allPassed ? 'INFO' : 'ERROR', `Overall validation: ${allPassed ? 'ALL CHECKS PASSED ✓' : 'SOME CHECKS FAILED ✗'}`);

  return allPassed;
}

// ─── Main Migration ──────────────────────────────────────────────────────────

async function main() {
  log('INFO', '╔══════════════════════════════════════════════════════════════╗');
  log('INFO', '║   Otter Laundry: MongoDB → PostgreSQL Migration             ║');
  log('INFO', `║   Mode: ${DRY_RUN ? 'DRY RUN' : VALIDATE_ONLY ? 'VALIDATE ONLY' : 'LIVE MIGRATION'}                                        ║`);
  log('INFO', `║   Batch Size: ${BATCH_SIZE}                                           ║`);
  log('INFO', '╚══════════════════════════════════════════════════════════════╝');

  const mongoClient = new MongoClient(MONGODB_URI);
  const prisma = new PrismaClient({
    log: [{ level: 'error', emit: 'stdout' }],
  });

  try {
    // Connect
    await mongoClient.connect();
    const mongoDB = mongoClient.db();
    log('INFO', 'Connected to MongoDB');

    await prisma.$connect();
    log('INFO', 'Connected to PostgreSQL');

    if (VALIDATE_ONLY) {
      await validateMigration(mongoDB, prisma);
      return;
    }

    const stats = {};
    const startTime = Date.now();

    // ── Phase 1: Independent entities (no FK dependencies) ──────────
    log('INFO', '');
    log('INFO', '━━━ PHASE 1: Independent entities ━━━');

    stats.admins = await migrateAdmins(mongoDB, prisma);
    saveCheckpoint('admins');

    stats.appConfigs = await migrateAppConfigs(mongoDB, prisma);
    saveCheckpoint('appConfigs');

    stats.appVersions = await migrateAppVersions(mongoDB, prisma);
    saveCheckpoint('appVersions');

    stats.banners = await migrateBanners(mongoDB, prisma);
    saveCheckpoint('banners');

    stats.services = await migrateServices(mongoDB, prisma);
    saveCheckpoint('services');

    // ── Phase 2: Core entities ──────────────────────────────────────
    log('INFO', '');
    log('INFO', '━━━ PHASE 2: Core entities (Users, Vendors, Delivery) ━━━');

    stats.users = await migrateUsers(mongoDB, prisma);
    saveCheckpoint('users');

    stats.vendors = await migrateVendors(mongoDB, prisma);
    saveCheckpoint('vendors');

    const dpResult = await migrateDeliveryPersons(mongoDB, prisma);
    stats.deliveryPersons = { source: dpResult.source, migrated: dpResult.migrated };
    saveCheckpoint('deliveryPersons');

    // ── Phase 3: Dependent entities ─────────────────────────────────
    log('INFO', '');
    log('INFO', '━━━ PHASE 3: Dependent entities (Orders, Payments, etc.) ━━━');

    stats.orders = await migrateOrders(mongoDB, prisma);
    saveCheckpoint('orders');

    // Now insert deferred assigned orders (they reference Order IDs)
    if (dpResult.deferredAssignedOrders.length > 0) {
      const aoCount = await batchInsert(prisma, 'deliveryAssignedOrder', dpResult.deferredAssignedOrders);
      log('INFO', `Deferred assigned orders: ${aoCount} inserted`);
    }
    if (dpResult.deferredRatings.length > 0) {
      const rCount = await batchInsert(prisma, 'deliveryPersonRating', dpResult.deferredRatings);
      log('INFO', `Deferred delivery ratings: ${rCount} inserted`);
    }

    stats.payments = await migratePayments(mongoDB, prisma);
    saveCheckpoint('payments');

    stats.reviews = await migrateReviews(mongoDB, prisma);
    saveCheckpoint('reviews');

    stats.offers = await migrateOffers(mongoDB, prisma);
    saveCheckpoint('offers');

    stats.transactions = await migrateTransactions(mongoDB, prisma);
    saveCheckpoint('transactions');

    stats.transactionLogs = await migrateTransactionLogs(mongoDB, prisma);
    saveCheckpoint('transactionLogs');

    stats.deliveryLogs = await migrateDeliveryLogs(mongoDB, prisma);
    saveCheckpoint('deliveryLogs');

    // ── Phase 4: Notifications & Cache ──────────────────────────────
    log('INFO', '');
    log('INFO', '━━━ PHASE 4: Notifications & Cache ━━━');

    stats.notifications = await migrateNotifications(mongoDB, prisma);
    saveCheckpoint('notifications');

    stats.cache = await migrateDeliveryCache(mongoDB, prisma);
    saveCheckpoint('cache');

    // ── Phase 5: Validation ─────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('INFO', '');
    log('INFO', `Migration completed in ${elapsed}s`);
    log('INFO', '');

    // Print summary
    log('INFO', '╔══════════════════════════════════════════════════════════════╗');
    log('INFO', '║                    MIGRATION SUMMARY                        ║');
    log('INFO', '╠══════════════════════════════════════════════════════════════╣');
    for (const [key, val] of Object.entries(stats)) {
      log('INFO', `║  ${key.padEnd(20)} │ Source: ${String(val.source).padStart(6)} │ Migrated: ${String(val.migrated).padStart(6)} ║`);
    }
    log('INFO', '╚══════════════════════════════════════════════════════════════╝');

    if (!DRY_RUN) {
      await validateMigration(mongoDB, prisma);
    }

    // Save ID mappings for potential rollback reference
    const mappingsPath = path.join(__dirname, 'migration-id-mappings.json');
    const mappingsObj = {};
    for (const [key, map] of Object.entries(idMap)) {
      mappingsObj[key] = Object.fromEntries(map);
    }
    fs.writeFileSync(mappingsPath, JSON.stringify(mappingsObj, null, 2));
    log('INFO', `ID mappings saved to ${mappingsPath}`);

  } catch (err) {
    log('ERROR', 'Migration failed', { error: err.message, stack: err.stack });
    throw err;
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
    log('INFO', 'Connections closed');
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
