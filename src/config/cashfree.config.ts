export const CashfreeConfig = {
  clientId: process.env.CASHFREE_CLIENT_ID || 'YOUR_CLIENT_ID',
  clientSecret: process.env.CASHFREE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  env: process.env.CASHFREE_ENV || 'production', // 'sandbox' or 'production'
};

export function getCashfreeBaseUrl() {
  return CashfreeConfig.env === 'production'
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com';
}

export const CASH_FREE_PAYMENT = {
  client_id: 'TEST10867980b5a7c6855302948d0c6108976801',
  client_secret: 'cfsk_ma_test_34fa9540b789cd80f38edfe38b89f236_eb5548dc',
  payment_currency: 'INR',
  apiversion: '2023-08-01',
  environment: 'SANDBOX',
  order_link: 'https://sandbox.cashfree.com/pg/orders',
  payment_link: 'https://sandbox.cashfree.com/pg/links',
  add_beneficiary: 'https://sandbox.cashfree.com/payout/beneficiary',
  add_benificary_v2: '2024-01-01',
  notify_url: "https://api.otterlaundry.com/user/webhook-cf",
  return_url: "http://13.201.170.46:3000/payment/success?order_id=692d2fa7b0b76b0e5415c3f5&success=true"

}

export const CASH_FREE_PAYMENT_PROD = {
  client_id: '1120770631de9063c4911cc6a0c0770211',
  client_secret: 'cfsk_ma_prod_cb22f280ab7854fff0cb490fdf5d9e74_ff0c999b',
  payment_currency: 'INR',
  apiversion: '2023-08-01',
  environment: 'PRODUCTION',
  order_link: 'https://api.cashfree.com/pg/orders',
  payment_link: 'https://api.cashfree.com/pg/links',
  add_beneficiary: 'https://api.cashfree.com/payout/beneficiary',
  add_benificary_v2: '2024-01-01',
  notify_url: "https://lr2zac77k9.execute-api.ap-south-1.amazonaws.com/dev/updatepayment-fsp",
  return_url: "https://www.thefantasysport.com/#"

}
