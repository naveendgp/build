import { useState, useCallback } from 'react';
import { orderService } from '../../../services/orderService';
import { PlaceOrderRequest, PlaceOrderResponse } from '../../../types/order/order';
import { showErrorToast, showSuccessToast, showToast } from '../../../components/Toast/Toast';

interface UsePlaceOrderReturn {
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
    message: string | null;
    orderData: PlaceOrderResponse | null;
    placeOrder: (orderData: PlaceOrderRequest) => Promise<PlaceOrderResponse | null>;
}

export const usePlaceOrder = (): UsePlaceOrderReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<PlaceOrderResponse | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const placeOrder = useCallback(async (orderData: PlaceOrderRequest): Promise<PlaceOrderResponse | null> => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        setOrderData(null);

        try {
            const response = await orderService.placeOrder(orderData);
            if (response.success && response.data) {
                console.log("response :", response);
                const orderResponse = orderService.extractOrderData(response);
                if (orderResponse && orderService.validateOrderResponse(orderResponse)) {
                    setOrderData(orderResponse);
                    console.log("orderCheck :", orderResponse);
                    showSuccessToast(response?.message);

                    // setMessage(response?.message);
                    setIsSuccess(true);
                    return orderResponse;
                } else {
                    setError('Invalid order response received');
                    return null;
                }
            } else {
                showErrorToast(response?.message || 'Failed to place order');

                setIsSuccess(false);
                setError(response.error || 'Failed to place order');
                setMessage(response.message || null);
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            console.error('Error placing order:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        isSuccess,
        message,
        orderData,
        placeOrder,
    };
};

