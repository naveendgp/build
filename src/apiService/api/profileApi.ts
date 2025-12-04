import api from './axios';
import {
  ProfileResponse,
  UpdateServiceInput,
  UpdateServicesResponse,
  OperatingHoursInput,
  UpdateOperatingHoursResponse,
  UpdateBankDetailsInput,
  UpdateBankDetailsResponse,
  ToggleServiceActiveInput,
  ToggleServiceActiveResponse,
  ListServicesResponse,
  ServicesByStateResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
  UpdateShopInput,
  UpdateShopResponse,
  UpdateBankDetailsInputWithCheque,
} from '../types/profileTypes';

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get('/vendor/profile');
  return response.data;
};

export const updateServicesOffered = async (input: UpdateServiceInput): Promise<UpdateServicesResponse> => {
  const response = await api.post('/vendor/services-offered', input);
  return response.data;
};

export const updateOperatingHours = async (input: OperatingHoursInput): Promise<UpdateOperatingHoursResponse> => {
  const response = await api.post('/vendor/operating-hours', input);
  return response.data;
};

export const updateBankDetails = async (input: UpdateBankDetailsInput): Promise<UpdateBankDetailsResponse> => {
  const response = await api.post('/vendor/bank-details', input);
  return response.data;
};

export const toggleServiceActive = async (
  input: ToggleServiceActiveInput,
): Promise<ToggleServiceActiveResponse> => {
  const response = await api.post('/vendor/service/toggle-active', input);
  return response.data;
};

export const listServices = async (): Promise<ListServicesResponse> => {
  const response = await api.get('/vendor/list-services');
  return response.data;
};

export const getServicesByState = async (): Promise<ServicesByStateResponse> => {
  const response = await api.get('/vendor/services-by-state');
  return response.data;
};

export const updateProfile = async (
  payload: UpdateProfileInput,
  images?: {
    profile_pic?: { uri: string; name: string; type?: string };
    aadhaar_card?: { uri: string; name: string; type?: string };
    pan_card?: { uri: string; name: string; type?: string };
  }
): Promise<UpdateProfileResponse> => {
  const formData = new FormData();

  // Add text fields
  const appendIfExists = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  };

  appendIfExists("owner_name", payload.owner_name);
  appendIfExists("email", payload.email);
  appendIfExists("address", payload.address);
  appendIfExists("aadhaar_number", payload.aadhaar_number);
  appendIfExists("pan_number", payload.pan_number);
  appendIfExists("mobile", payload.mobile);
  appendIfExists("date_of_birth", payload.date_of_birth);

  // Add images
  const addFile = (key: string, file?: { uri: string; name: string; type?: string }) => {
    if (file?.uri) {
      formData.append(key, {
        uri: file.uri.startsWith("file://") ? file.uri : `file://${file.uri}`,
        type: file.type || "image/jpeg",
        name: file.name || `${key}.jpg`,
      } as any);
    }
  };

  addFile("profile_pic", images?.profile_pic);
  addFile("aadhaar_card", images?.aadhaar_card);
  addFile("pan_card", images?.pan_card);

  const response = await api.post("/vendor/profile-update", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateShop = async (
  payload: UpdateShopInput,
  images?: {
    shop_image?: { uri: string; name: string; type?: string };
  }
): Promise<UpdateShopResponse> => {
  const formData = new FormData();

  // Add text fields
  const appendIfExists = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  };

  appendIfExists("shop_name", payload.shop_name);
  appendIfExists("gst_number", payload.gst_number);
  appendIfExists("address_line1", payload.address_line1);
  appendIfExists("address_line2", payload.address_line2);
  appendIfExists("pincode", payload.pincode);
  appendIfExists("landmark", payload.landmark);
  appendIfExists("latitude", payload.latitude);
  appendIfExists("longitude", payload.longitude);
  appendIfExists("contact_number", payload.contact_number);
  appendIfExists("auto_receive_orders", payload.auto_receive_orders);
  appendIfExists("repeat_days", payload.repeat_days);

  // Add operating_hours as JSON string (always include, even if empty object)
  if (payload.business_hours !== undefined) {
    appendIfExists("operating_hours", JSON.stringify(payload.business_hours));
  }

  // Add images
  const addFile = (key: string, file?: { uri: string; name: string; type?: string }) => {
    if (file?.uri) {
      formData.append(key, {
        uri: file.uri.startsWith("file://") ? file.uri : `file://${file.uri}`,
        type: file.type || "image/jpeg",
        name: file.name || `${key}.jpg`,
      } as any);
    }
  };

  addFile("shop_image", images?.shop_image);

  const response = await api.post("/vendor/shop-update", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateBankDetailsWithCheque = async (
  payload: UpdateBankDetailsInputWithCheque,
  images?: {
    cancelled_cheque?: { uri: string; name: string; type?: string };
  }
): Promise<UpdateBankDetailsResponse> => {
  const formData = new FormData();

  // Add text fields
  const appendIfExists = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  };

  appendIfExists("account_holder_name", payload.account_holder_name);
  appendIfExists("account_number", payload.account_number);
  appendIfExists("ifsc_code", payload.ifsc_code);
  appendIfExists("bank_name", payload.bank_name);
  appendIfExists("branch", payload.branch);
  appendIfExists("upi_id", payload.upi_id);

  // Add images
  const addFile = (key: string, file?: { uri: string; name: string; type?: string }) => {
    if (file?.uri) {
      formData.append(key, {
        uri: file.uri.startsWith("file://") ? file.uri : `file://${file.uri}`,
        type: file.type || "image/jpeg",
        name: file.name || `${key}.jpg`,
      } as any);
    }
  };

  addFile("cancelled_cheque", images?.cancelled_cheque);

  const response = await api.post("/vendor/bank-update", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
