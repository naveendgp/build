import { create } from 'zustand';

interface VendorData {
  owner_name: string;
  email: string;
  address: string;
  aadhaar_no: string;
  pan_number: string;
  mobile: string;
  date_of_birth: string;
  gender?: string;
  profile_pic: any;
  aadhaar_file: any;
  pan_file: any;
}

interface ShopData {
  shop_name: string;
  gst_number: string;
  shop_license_number: string;
  address: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  shop_time: string;
  landmark: string;
  latitude: string;
  longitude: string;
  contact_number: string;
  shop_front_photo: any;
  business_hours: string;
  auto_receive_orders: boolean;
  repeat_days: string;
}

interface BankData {
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  bank_name: string;
  upi_id: string;
  cancelled_cheque: any;
}

interface ServicesData {
  selectedServices: string[];
}

interface VendorVerificationState {
  vendor: VendorData;
  shop: ShopData;
  bank: BankData;
  services: ServicesData;
  setVendor: (vendor: Partial<VendorData>) => void;
  setShop: (shop: Partial<ShopData>) => void;
  setBank: (bank: Partial<BankData>) => void;
  setServices: (services: Partial<ServicesData>) => void;
  setVendorData: (vendor: VendorData) => void;
  setShopData: (shop: ShopData) => void;
  setBankData: (bank: BankData) => void;
  setServicesData: (services: ServicesData) => void;
  clearAll: () => void;
}

const initialVendor: VendorData = {
  owner_name: '',
  email: '',
  address: '',
  aadhaar_no: '',
  pan_number: '',
  mobile: '',
  date_of_birth: '',
  gender: '',
  profile_pic: null,
  aadhaar_file: null,
  pan_file: null,
};

const initialShop: ShopData = {
  shop_name: '',
  gst_number: '',
  shop_license_number: '',
  address: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  shop_time: '',
  landmark: '',
  latitude: '',
  longitude: '',
  contact_number: '',
  shop_front_photo: null,
  business_hours: '',
  auto_receive_orders: false,
  repeat_days: '',
};

const initialBank: BankData = {
  account_number: '',
  account_holder_name: '',
  ifsc_code: '',
  bank_name: '',
  upi_id: '',
  cancelled_cheque: null,
};

const initialServices: ServicesData = {
  selectedServices: [],
};

export const useVendorVerificationStore = create<VendorVerificationState>()(
  set => ({
    vendor: initialVendor,
    shop: initialShop,
    bank: initialBank,
    services: initialServices,
    setVendor: (vendorData: Partial<VendorData>) =>
      set(state => ({
        vendor: { ...state.vendor, ...vendorData },
      })),
    setShop: (shopData: Partial<ShopData>) =>
      set(state => ({
        shop: { ...state.shop, ...shopData },
      })),
    setBank: (bankData: Partial<BankData>) =>
      set(state => ({
        bank: { ...state.bank, ...bankData },
      })),
    setServices: (servicesData: Partial<ServicesData>) =>
      set(state => ({
        services: { ...state.services, ...servicesData },
      })),
    setVendorData: (vendorData: VendorData) => set({ vendor: vendorData }),
    setShopData: (shopData: ShopData) => set({ shop: shopData }),
    setBankData: (bankData: BankData) => set({ bank: bankData }),
    setServicesData: (servicesData: ServicesData) => set({ services: servicesData }),
    clearAll: () =>
      set({
        vendor: initialVendor,
        shop: initialShop,
        bank: initialBank,
        services: initialServices,
      }),
  }),
);

