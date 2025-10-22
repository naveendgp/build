import api from './axios';
import { ProfileResponse } from '../types/profileTypes';

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get('/vendor/profile');
  return response.data;
};
