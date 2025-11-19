export interface ShopDocumentUploadPayload {
    shop_name: string;
    owner_name: string;
    email?: string;
    gst_number: string;
    pan_number: string;
    shop_license_number: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    latitude: number;
    longitude: number;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    aadhaar_number: string; 
   }

  export interface ShopDocumentUploadResponse {
    message: string;
    error: string;
  }
  