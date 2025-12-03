export interface VendorErrors {
  owner_name?: string;
  mobile?: string;
  email?: string;
  aadhaar_or_pan?: string; // At least one of Aadhaar or PAN is required
}

export interface ShopErrors {
  shop_name?: string;
  gst_number?: string;
  address?: string;
  contact_number?: string;
  shop_front_photo?: string;
  business_hours?: string; // Timings are required
  pincode?: string;
  landmark?: string;
}

export interface BankErrors {
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  cancelled_cheque?: string;
}

const hasErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).some(Boolean);

export const useVendorValidation = () => {
  const validateVendor = (vendor: any): VendorErrors => {
    const errors: VendorErrors = {};
    if (!vendor.owner_name?.trim()) {
      errors.owner_name = 'Full name is required';
    }
    if (!vendor.mobile?.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(vendor.mobile)) {
      errors.mobile = 'Enter a valid 10-digit mobile number';
    }
    // At least one of Aadhaar or PAN (ID number or file) is required
    const hasAadhaar = (vendor.aadhaar_no?.trim() || vendor.aadhaar_file);
    const hasPan = (vendor.pan_number?.trim() || vendor.pan_file);
    if (!hasAadhaar && !hasPan) {
      errors.aadhaar_or_pan = 'Either Aadhaar ID or PAN ID is required';
    }
    if (vendor.email?.trim() && !/^\S+@\S+\.\S+$/.test(vendor.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    return errors;
  };

  const validateShop = (shop: any): ShopErrors => {
    const errors: ShopErrors = {};
    if (!shop.shop_name?.trim()) {
      errors.shop_name = 'Shop name is required';
    }
    // GST number is optional (not mandatory)
    // if (!shop.gst_number?.trim()) {
    //   errors.gst_number = 'GST number is required';
    // }
    if (!shop.address?.trim()) {
      errors.address = 'Address is required';
    }
    if (!shop.contact_number?.trim()) {
      errors.contact_number = 'Contact number is required';
    } else if (!/^\d{10}$/.test(shop.contact_number.trim())) {
      errors.contact_number = 'Enter a valid 10-digit contact number';
    }
    if (!shop.shop_front_photo) {
      errors.shop_front_photo = 'Shop photo is required';
    }
    if (!shop.business_hours?.trim()) {
      errors.business_hours = 'Shop timings are required';
    }
    if (!shop.pincode?.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(shop.pincode.trim())) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    if (!shop.landmark?.trim()) {
      errors.landmark = 'Landmark is required';
    }
    return errors;
  };

  const validateBank = (bank: any): BankErrors => {
    const errors: BankErrors = {};
    if (!bank.account_holder_name?.trim()) {
      errors.account_holder_name = 'Account holder name is required';
    }
    if (!bank.account_number?.trim()) {
      errors.account_number = 'Account number is required';
    }
    if (!bank.bank_name?.trim()) {
      errors.bank_name = 'Bank name is required';
    }
    if (!bank.ifsc_code?.trim()) {
      errors.ifsc_code = 'IFSC code is required';
    }
    if (!bank.cancelled_cheque) {
      errors.cancelled_cheque = 'Cancelled cheque is required';
    }
    return errors;
  };

  const validateServices = (services: { selectedServices: string[] }) => {
    return services.selectedServices.length > 0
      ? ''
      : 'Select at least one service to continue';
  };

  const validateStep = (step: number, data: any) => {
    if (step === 1) {
      return !hasErrors(validateVendor(data.vendor));
    }
    if (step === 2) {
      return !hasErrors(validateShop(data.shop));
    }
    if (step === 3) {
      return !hasErrors(validateBank(data.bank));
    }
    if (step === 4) {
      return validateServices(data.services) === '';
    }
    return true;
  };

  return { validateStep, validateVendor, validateShop, validateBank, validateServices };
};
