import api from './axios';
import { OrderStatusCode, OrdersResponse } from '../types/ordersTypes';

export const fetchOrdersByStatus = async (
  status: OrderStatusCode,
): Promise<OrdersResponse> => {
  const response = await api.get('/vendor/orders', {
    params: { status },
  });

  return response.data;
};

