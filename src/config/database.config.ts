export const AppConfig = {
  DB: {
    URL: 'mongodb://otterprod:b3R0ZXJhZG1pbg==@db-otter.otterlaundry.com:27017/otter-db?authSource=admin',
  },
  JWT: {
    USER_SECRET: 'user-secret-change-me',
    DELIVERY_SECRET: 'delivery-secret-change-me',
    VENDOR_SECRET: 'vendor-secret-change-me',
  },
  S3: {
    REGION: 'ap-south-1',
    BUCKET: 'otterlaundry-production',
    ACCESS_KEY_ID: 'AKIAZDK7ZSLBINLNONFF',
    SECRET_ACCESS_KEY:
      process.env.S3_SECRET_ACCESS_KEY ||
      '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',
  },
} as const;

export const GoogleConfig = {
  CLIENT_ID: process.env.GOOGLE_MAPS_API_KEY,
} as const;
