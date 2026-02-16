export const SESConfig = {
  REGION: process.env.SES_REGION || 'ap-south-1',
  ACCESS_KEY_ID: process.env.SES_ACCESS_KEY_ID || '',
  SECRET_ACCESS_KEY: process.env.SES_SECRET_ACCESS_KEY || '',
  FROM_EMAIL: process.env.SES_FROM_EMAIL || '',
  FROM_NAME: process.env.SES_FROM_NAME || 'Laundry Service',
} as const;

