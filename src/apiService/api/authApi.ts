// src/api/authApi.ts
import api from './axios';
import {
  LoginPayload,
  LoginResponse,
  OtpPayload,
  OtpResponse,
  RegisterPayload,
  RegisterResponse,
  RegisterCompletePayload,
  RegisterCompleteResponse,
  ReSendOtpPayload,
  ReSendOtpResponse,
  LogoutResponse,
} from '../types/authTypes';

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await api.post('/vendor/send-otp', payload);
  return response.data;
};

export const verifyOtp = async (payload: OtpPayload): Promise<OtpResponse> => {
  const response = await api.post('/vendor/verify-otp', payload);
  return response.data;
};

export const resendOtp = async (payload: ReSendOtpPayload): Promise<ReSendOtpResponse> => {
  const response = await api.post('/vendor/resend-otp', payload);
  return response.data;
};

export const logout = async (): Promise<LogoutResponse> => {
  const response = await api.post('/vendor/logout');
  return response.data;
};

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  const response = await api.post('/vendor/register', payload);
  return response.data;
};

export const registerComplete = async (
  payload: RegisterCompletePayload,
  images?: {
    profile_pic?: { uri: string; name: string; type?: string };
    aadhaar_card?: { uri: string; name: string; type?: string };
    pan_card?: { uri: string; name: string; type?: string };
    shop_image?: { uri: string; name: string; type?: string };
    cancelled_cheque?: { uri: string; name: string; type?: string };
  }
): Promise<RegisterCompleteResponse> => {

  const formData = new FormData();

  // --- Add Text Fields Exactly Like Postman ---
  const appendIfExists = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  };

  appendIfExists("shop_name", payload.shop_name);
  appendIfExists("owner_name", payload.owner_name);
  appendIfExists("email", payload.email);
  appendIfExists("gst_number", payload.gst_number);
  appendIfExists("address_line1", payload.address_line1);
  appendIfExists("address_line2", payload.address_line2);
  appendIfExists("pincode", payload.pincode);
  appendIfExists("landmark", payload.landmark);
  appendIfExists("latitude", payload.latitude);
  appendIfExists("longitude", payload.longitude);
  appendIfExists("contactNum", payload.contactNum);
  appendIfExists("account_holder_name", payload.account_holder_name);
  appendIfExists("account_number", payload.account_number);
  appendIfExists("ifsc_code", payload.ifsc_code);
  appendIfExists("bank_name", payload.bank_name);
  appendIfExists("branch", payload.branch);
  appendIfExists("upi_id", payload.upi_id);

  // 🔥 VERY IMPORTANT: backend expects TEXT, not object
  appendIfExists("operating_hours", JSON.stringify(payload.operating_hours));

  appendIfExists("pan_number", payload.pan_number);
  appendIfExists("aadhaar_number", payload.aadhaar_number);

  // --- Add Images Exactly as File Objects ---
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
  addFile("shop_image", images?.shop_image);
  addFile("cancelled_cheque", images?.cancelled_cheque);

  console.log("FINAL FORMDATA SENT FROM APP:");
  // debug full form data

  const response = await api.post("/vendor/register-complete", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // important for mobile Axios
    },
  });

  return response.data;
};

