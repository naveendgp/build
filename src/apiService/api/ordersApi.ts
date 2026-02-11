import api from './axios';
import { OrderStatusCode, OrdersResponse, AcceptOrderResponse, CompleteOrderResponse } from '../types/ordersTypes';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

export interface FetchOrdersParams {
  status: OrderStatusCode;
  page?: number;
  limit?: number;
}

export interface AcceptOrderParams {
  orderId: string;
  isReject?: boolean;
}

export const fetchOrdersByStatus = async (
  params: FetchOrdersParams,
): Promise<OrdersResponse> => {
  const { status, page = 1, limit = 10 } = params;
  const response = await api.get(API_ENDPOINTS.ORDERS, {
    params: { status, page, limit },
  });

  return response.data;
};

export const acceptOrder = async (
  params: AcceptOrderParams,
): Promise<AcceptOrderResponse> => {
  const { orderId, isReject = false } = params;
  const response = await api.get(`${API_ENDPOINTS.ACCEPT_ORDER}/${orderId}`, {
    params: { is_reject: isReject },
  });

  return response.data;
};



export const completeOrder = async (
  orderId: string,
): Promise<CompleteOrderResponse> => {
  const response = await api.patch(
    `${API_ENDPOINTS.COMPLETE_ORDER}/${orderId}`
  );
  return response.data;
};

export const fetchOrderById = async (
  orderId: string,
): Promise<OrdersResponse> => {
  const response = await api.get(API_ENDPOINTS.ORDERS, {
    params: { order_id: orderId },
  });
  return response.data;
};

export interface OrderItemUpdate {
  item_id: string;
  quantity: number;
  weight?: number;
  pricing_tier?: string;
}

export interface UpdateOrderItemsParams {
  order_id: string;
  items: OrderItemUpdate[];
}

export const updateOrderItems = async (
  params: UpdateOrderItemsParams,
): Promise<any> => {
  const response = await api.post(API_ENDPOINTS.UPDATE_ORDER_ITEMS, params);
  return response.data;
};

