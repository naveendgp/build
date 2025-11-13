import api from './axios';
import { 
  ProfileResponse, 
  UpdateServiceInput, 
  UpdateServicesResponse,
  OperatingHoursInput,
  UpdateOperatingHoursResponse,
  UpdateBankDetailsInput,
  UpdateBankDetailsResponse
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
