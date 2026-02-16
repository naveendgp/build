const mongoose = require('mongoose');

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/laundry_backend?authSource=admin';

// App Config Schema
const appConfigSchema = new mongoose.Schema({
  config_key: { type: String, required: true, unique: true },
  config_name: { type: String, required: true },
  description: String,
  payment_config: {
    gst: Number,
    platform_fee: Number,
    delivery_fee: Number,
    vendor_commission: Number,
    currency: String,
    min_order_amount: Number,
    max_order_amount: Number,
    wallet_enabled: Boolean,
    offer_enabled: Boolean,
    express_delivery_fee: Number,
    standard_delivery_fee: Number,
  },
  general_config: {
    app_version: String,
    maintenance_mode: Boolean,
    support_contact: String,
    terms_url: String,
    privacy_url: String,
  },
  delivery_config: {
    initial_distance_km: Number,
    total_distance_km: Number,
    delivery_order_accept_time: Number,
    order_distance: Number,
  },
  is_active: { type: Boolean, default: true },
  effective_from: Date,
  effective_until: Date,
}, { timestamps: true });

// App Version Schema
const appVersionSchema = new mongoose.Schema({
  app_type: {
    type: String,
    required: true,
    enum: ['user_android', 'user_ios', 'vendor_android', 'delivery_android']
  },
  version: { type: String, required: true },
  is_forceupdate: { type: Boolean, default: false },
}, { timestamps: true });

// Services Schema
const itemsSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  image_url: { type: String, required: true },
  item_description: { type: String, required: true },
  item_slug: { type: String, required: true },
  category: { type: String, default: 'general' },
}, { _id: false });

const servicesSchema = new mongoose.Schema({
  service_name: { type: String, required: true },
  image_url: { type: String, required: true },
  pricing_type: {
    type: String,
    required: true,
    enum: ['per_kg', 'per_pc']
  },
  service_description: { type: String, required: true },
  items: { type: [itemsSchema], default: [] },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

const AppConfig = mongoose.model('AppConfig', appConfigSchema);
const AppVersion = mongoose.model('AppVersion', appVersionSchema);
const Services = mongoose.model('Services', servicesSchema);

const BASE_ITEM_IMAGE = 'https://cdn.otter-laundry.com/master-services/items';
const BASE_SERVICE_IMAGE = 'https://cdn.otter-laundry.com/master-services/services';

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const capitalize = (text) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const createItems = (category, names, options = {}) =>
  names.map((name) => {
    const slug = slugify(`${options.slugPrefix || category}-${name}`);
    const displayCategory = options.displayCategory || capitalize(category);
    return {
      item_name: options.keepName ? name : `${displayCategory} - ${name}`,
      image_url: `${BASE_ITEM_IMAGE}/${slug}.jpg`,
      item_description:
        options.itemDescriptionPrefix || `${name} for ${displayCategory}`,
      item_slug: slug,
      category: options.customCategory || category,
    };
  });

const weightItems = [
  {
    item_name: '0.5 kg - 3 kg',
    image_url: `${BASE_ITEM_IMAGE}/weight-0-3kg.jpg`,
    item_description: 'Light load weighing between 0.5 kg and 3 kg',
    item_slug: 'weight-0-3kg',
    category: 'weight',
  },
  {
    item_name: '3 kg - 5 kg',
    image_url: `${BASE_ITEM_IMAGE}/weight-3-5kg.jpg`,
    item_description: 'Regular load weighing between 3 kg and 5 kg',
    item_slug: 'weight-3-5kg',
    category: 'weight',
  },
  {
    item_name: 'More than 5 kg',
    image_url: `${BASE_ITEM_IMAGE}/weight-5kg-plus.jpg`,
    item_description: 'Heavy load weighing above 5 kg',
    item_slug: 'weight-5kg-plus',
    category: 'weight',
  },
];

const menItems = createItems('men', [
  'Shirt - casual',
  'Shirt - formal',
  'Shirt - party wear',
  'T-shirt',
  'Sweatshirt',
  'Pullover',
  'Hoodie',
  'Jacket - light',
  'Jacket - denim',
  'Jacket - leather',
  'Coat',
  'Blazer',
  'Waistcoat',
  'Suit - 2 piece',
  'Suit - 3 piece',
  'Pant',
  'Trousers',
  'Jeans',
  'Track pant',
  'Sweat pant',
  'Gym wear',
  'Shorts',
  'Dhoti - cotton',
  'Dhoti - silk',
  'Kurta',
  'Kurta set',
  'Sherwani',
  'Tie/ bow tie',
  'Co-Ord set',
  'Pyjamas',
]);

const womenItems = createItems('women', [
  'Top',
  'Kurti',
  'Hoodie',
  'Skirt',
  'Jeans',
  'Palazzo/leggings',
  'Track pant',
  'Pant',
  'Trousers',
  'Dress',
  'Jumpsuit',
  'Co-Ord set',
  'Petticoat',
  'Blouse - plain',
  'Blouse - silk',
  'Blouse - designer',
  'Saree - plain',
  'Saree - silk',
  'Saree - cotton',
  'Saree - designer',
  'Lehenga choli - plain',
  'Lehenga choli - designer',
  'Anarkali',
  'Salwar/ churidar',
  'Kameez',
  'Dupatta/ shawl',
  'Gym wear',
  'Pyjamas',
]);

const kidsItems = createItems('kids', [
  'Shirt',
  'T-shirt',
  'Sweatshirt',
  'Hoodie',
  'Blazer',
  'Coat',
  'Pant',
  'Jeans',
  'Track pant',
  'Shorts',
  'Skirt',
  'Dress',
  'Jumpsuit',
  'Pyjamas',
  'Uniform - set',
]);

const householdItems = createItems('household', [
  'Bed sheet - single',
  'Bed sheet - double',
  'Pillow cover',
  'Cushion cover',
  'Sofa cover',
  'Quilt - single',
  'Quilt - double',
  'Blanket - single',
  'Blanket - double',
  'Towels',
  'Bathrobe',
  'Curtain',
  'Carpet',
  'Foot mat',
  'Apron',
]);

const petItems = createItems('pet', [
  'Pet blanket',
  'Pet bed',
  'Pet towel',
  'Pet clothes',
  'Soft harness/ collar/ leashes',
]);

const perPieceItems = [
  ...menItems,
  ...womenItems,
  ...kidsItems,
  ...householdItems,
  ...petItems,
];

// Seed data
const appConfigsData = [
  {
    config_key: 'payment_config_v1',
    config_name: 'Payment Configuration v1.0',
    description: 'Initial payment configuration for OTTER Laundry App',
    payment_config: {
      gst: 18,
      platform_fee: 5,
      delivery_fee: 30,
      vendor_commission: 15,
      currency: 'INR',
      min_order_amount: 100,
      max_order_amount: 5000,
      wallet_enabled: true,
      offer_enabled: true,
      express_delivery_fee: 50,
      standard_delivery_fee: 30,
    },
    general_config: {
      app_version: '1.0.0',
      maintenance_mode: false,
      support_contact: '+91-9876543210',
      terms_url: 'https://otterlaundry.com/terms',
      privacy_url: 'https://otterlaundry.com/privacy',
    },
    delivery_config: {
      initial_distance_km: 5,
      total_distance_km: 20,
      delivery_order_accept_time: 30,
      order_distance: 10,
    },
    is_active: true,
    effective_from: new Date('2024-01-01T00:00:00Z'),
  },
  {
    config_key: 'delivery_config_v1',
    config_name: 'Delivery Configuration v1.0',
    description: 'Delivery settings and fee structure',
    payment_config: {
      gst: 18,
      platform_fee: 5,
      delivery_fee: 25,
      vendor_commission: 15,
      currency: 'INR',
      min_order_amount: 150,
      max_order_amount: 10000,
      wallet_enabled: true,
      offer_enabled: true,
      express_delivery_fee: 75,
      standard_delivery_fee: 25,
    },
    general_config: {
      app_version: '1.0.0',
      maintenance_mode: false,
      support_contact: '+91-9876543210',
    },
    delivery_config: {
      initial_distance_km: 3,
      total_distance_km: 15,
      delivery_order_accept_time: 20,
      order_distance: 8,
    },
    is_active: false,
    effective_from: new Date('2024-02-01T00:00:00Z'),
    effective_until: new Date('2024-02-28T23:59:59Z'),
  },
  {
    config_key: 'premium_config_v1',
    config_name: 'Premium Service Configuration',
    description: 'Configuration for premium laundry services',
    payment_config: {
      gst: 18,
      platform_fee: 8,
      delivery_fee: 40,
      vendor_commission: 20,
      currency: 'INR',
      min_order_amount: 200,
      max_order_amount: 15000,
      wallet_enabled: true,
      offer_enabled: true,
      express_delivery_fee: 100,
      standard_delivery_fee: 40,
    },
    general_config: {
      app_version: '1.0.0',
      maintenance_mode: false,
      support_contact: '+91-9876543210',
    },
    delivery_config: {
      initial_distance_km: 10,
      total_distance_km: 30,
      delivery_order_accept_time: 45,
      order_distance: 15,
    },
    is_active: true,
    effective_from: new Date('2024-01-01T00:00:00Z'),
  },
];

const appVersionsData = [
  {
    app_type: 'user_android',
    version: '1.0.0',
    is_forceupdate: false,
  },
  {
    app_type: 'user_ios',
    version: '1.0.0',
    is_forceupdate: false,
  },
  {
    app_type: 'vendor_android',
    version: '1.0.0',
    is_forceupdate: false,
  },
  {
    app_type: 'delivery_android',
    version: '1.0.0',
    is_forceupdate: false,
  },
];

const servicesData = [
  {
    service_name: 'Wash & Fold',
    image_url: `${BASE_SERVICE_IMAGE}/wash-fold.jpg`,
    pricing_type: 'per_kg',
    service_description:
      'Standard wash and fold service for everyday garments. Sorted, washed, dried, and folded with care.',
    items: weightItems,
  },
  {
    service_name: 'Wash & Iron',
    image_url: `${BASE_SERVICE_IMAGE}/wash-iron.jpg`,
    pricing_type: 'per_kg',
    service_description:
      'Complete wash and iron package for wrinkle-free garments. Ideal for everyday and office wear.',
    items: weightItems,
  },
  {
    service_name: 'Ironing Service',
    image_url: `${BASE_SERVICE_IMAGE}/ironing.jpg`,
    pricing_type: 'per_pc',
    service_description:
      'Per-piece ironing service covering men, women, kids, household, and pet garments from the provided master list.',
    items: perPieceItems,
  },
  {
    service_name: 'Premium Dry Cleaning',
    image_url: `${BASE_SERVICE_IMAGE}/dry-clean.jpg`,
    pricing_type: 'per_pc',
    service_description:
      'Premium dry cleaning for delicate, designer, and occasion wear garments across all categories.',
    items: perPieceItems,
  },
];

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\n🗑️  Clearing existing data...');
    await AppConfig.deleteMany({});
    await AppVersion.deleteMany({});
    await Services.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert App Configs
    console.log('\n📝 Inserting App Configs...');
    const appConfigs = await AppConfig.insertMany(appConfigsData);
    console.log(`✅ Inserted ${appConfigs.length} app configs`);

    // Insert App Versions
    console.log('\n📱 Inserting App Versions...');
    const appVersions = await AppVersion.insertMany(appVersionsData);
    console.log(`✅ Inserted ${appVersions.length} app versions`);

    // Insert Services
    console.log('\n🧺 Inserting Services...');
    const services = await Services.insertMany(servicesData);
    console.log(`✅ Inserted ${services.length} services`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log('App Configs:');
    appConfigs.forEach((config) => {
      console.log(`  - ${config.config_key}: ${config.config_name} (${config.is_active ? 'Active' : 'Inactive'})`);
    });
    console.log('\nApp Versions:');
    appVersions.forEach((version) => {
      console.log(`  - ${version.app_type}: v${version.version} (Force Update: ${version.is_forceupdate ? 'Yes' : 'No'})`);
    });
    console.log('\nServices:');
    services.forEach((service) => {
      console.log(`  - ${service.service_name}: ${service.pricing_type} (${service.items.length} items)`);
    });

    console.log('\n✅ Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedData();

