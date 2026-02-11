import { useState, useCallback } from 'react';
import { orderService } from '../../../services/orderService';
import { OrderPreviewRequest, OrderPreview } from '../../../types/order/order';

interface UseOrderPreviewReturn {
    isLoading: boolean;
    error: string | null;
    message: string | null;
    previewData: OrderPreview | null;
    getOrderPreview: (previewData: OrderPreviewRequest) => Promise<void>;
}

export const useOrderPreview = (): UseOrderPreviewReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<OrderPreview | null>(null);

    const getOrderPreview = useCallback(async (previewData: OrderPreviewRequest) => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        setPreviewData(null);

        try {
            const response = await orderService.getOrderPreview(previewData);
            if (response.success && response.data) {
                const preview = orderService.extractPreviewData(response);

                if (preview && orderService.validatePreviewResponse(preview)) {
                    setPreviewData(preview);
                    setMessage(response.message || 'Order preview generated successfully');
                } else {
                    setError('Invalid preview response received');
                }
            } else {
                const errorMsg = response.error || response.message || 'Failed to get order preview';
                setError(errorMsg);
                setMessage(response.message || null);
                setIsLoading(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            console.error('Error getting order preview:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        message,
        previewData,
        getOrderPreview,
    };
};

