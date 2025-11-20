import api from './axios';
import { OrderStatusCode, OrdersResponse } from '../types/ordersTypes';

export interface FetchOrdersParams {
  status: OrderStatusCode;
  page?: number;
  limit?: number;
}

export const fetchOrdersByStatus = async (
  params: FetchOrdersParams,
): Promise<OrdersResponse> => {
  const { status, page = 1, limit = 10 } = params;
  const response = await api.get('/vendor/orders', {
    params: { status, page, limit },
  });

  return response.data;
};

