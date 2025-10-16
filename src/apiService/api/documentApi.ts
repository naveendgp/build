import { ShopDocumentUploadPayload, ShopDocumentUploadResponse } from "../types/docTypes";
import api from "./axios";

export const documentUploadApi = async (payload: ShopDocumentUploadPayload): Promise<ShopDocumentUploadResponse> => {
    const response = await api.post('/vendor/register-complete', payload);
    return response.data;
  };