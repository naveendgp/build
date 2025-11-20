import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { documentUploadApi } from '../../../../apiService/api/documentApi';
import { toggleServiceActive, listServices } from '../../../../apiService/api/profileApi';
import { ShopDocumentUploadPayload } from '../../../../apiService/types/docTypes';
import { ToggleServiceActiveInput, ListServiceItem } from '../../../../apiService/types/profileTypes';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';

interface UseSubmitVerificationProps {
    onSuccess: () => void;
}

interface ApiStatus {
    documentUpload: 'idle' | 'success' | 'error';
    servicesToggle: 'idle' | 'success' | 'error';
}

export const useSubmitVerification = ({ onSuccess }: UseSubmitVerificationProps) => {
    const [apiStatus, setApiStatus] = useState<ApiStatus>({
        documentUpload: 'idle',
        servicesToggle: 'idle',
    });

    const [documentError, setDocumentError] = useState<string | null>(null);
    const [servicesError, setServicesError] = useState<string | null>(null);
    const successHandledRef = useRef(false);

    // Check if both APIs succeeded
    useEffect(() => {
        if (
            apiStatus.documentUpload === 'success' &&
            apiStatus.servicesToggle === 'success' &&
            !successHandledRef.current
        ) {
            successHandledRef.current = true;
            showSuccessToast('Verification completed successfully!');
            onSuccess();
        }
    }, [apiStatus.documentUpload, apiStatus.servicesToggle, onSuccess]);

    // Document upload mutation
    const documentMutation = useMutation({
        mutationFn: (payload: ShopDocumentUploadPayload) => documentUploadApi(payload),
        onSuccess: () => {
            setApiStatus(prev => ({ ...prev, documentUpload: 'success' as const }));
            setDocumentError(null);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            const msg = error.response?.data?.message || error.message;
            setApiStatus(prev => ({ ...prev, documentUpload: 'error' as const }));
            setDocumentError(msg);
            showErrorToast(`Document upload failed: ${msg}`);
        },
    });

    // Services toggle mutation
    const servicesMutation = useMutation({
        mutationFn: (input: ToggleServiceActiveInput) => toggleServiceActive(input),
        onSuccess: () => {
            setApiStatus(prev => ({ ...prev, servicesToggle: 'success' as const }));
            setServicesError(null);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            const msg = error.response?.data?.message || error.message;
            setApiStatus(prev => ({ ...prev, servicesToggle: 'error' as const }));
            setServicesError(msg);
            showErrorToast(`Services update failed: ${msg}`);
        },
    });

    // Prepare services payload by mapping service names to IDs
    const prepareServicesPayload = async (
        selectedServiceNames: string[],
    ): Promise<ToggleServiceActiveInput> => {
        try {
            // Fetch all available services to get their IDs
            const servicesResponse = await listServices();
            const allServices = servicesResponse.data || [];

            // Map selected service names to service IDs
            const services: ToggleServiceActiveInput['services'] = allServices
                .filter((service: ListServiceItem) => selectedServiceNames.includes(service.service_name))
                .map((service: ListServiceItem) => ({
                    service_id: service._id,
                    is_active: true,
                }));

            // Also set unselected services to inactive
            const unselectedServices = allServices
                .filter((service: ListServiceItem) => !selectedServiceNames.includes(service.service_name))
                .map((service: ListServiceItem) => ({
                    service_id: service._id,
                    is_active: false,
                }));

            return {
                services: [...services, ...unselectedServices],
            };
        } catch (error) {
            throw new Error('Failed to fetch services list');
        }
    };

    const submitBoth = async (
        documentPayload: ShopDocumentUploadPayload,
        selectedServiceNames: string[],
    ) => {
        // Reset status
        successHandledRef.current = false;
        setApiStatus({
            documentUpload: 'idle',
            servicesToggle: 'idle',
        });
        setDocumentError(null);
        setServicesError(null);

        try {
            // Prepare services payload
            const servicesPayload = await prepareServicesPayload(selectedServiceNames);

            // Call both APIs simultaneously
            await Promise.all([
                documentMutation.mutateAsync(documentPayload),
                servicesMutation.mutateAsync(servicesPayload),
            ]);
        } catch (error) {
            // Individual errors are handled in onError callbacks
            // This catch is for any unexpected errors
            console.error('Unexpected error in submitBoth:', error);
        }
    };

    // Retry individual APIs
    const retryDocumentUpload = (payload: ShopDocumentUploadPayload) => {
        documentMutation.mutate(payload);
    };

    const retryServicesToggle = async (selectedServiceNames: string[]) => {
        try {
            const servicesPayload = await prepareServicesPayload(selectedServiceNames);
            servicesMutation.mutate(servicesPayload);
        } catch (error) {
            showErrorToast('Failed to prepare services payload');
        }
    };

    const isLoading = documentMutation.isPending || servicesMutation.isPending;
    const bothSuccess = apiStatus.documentUpload === 'success' && apiStatus.servicesToggle === 'success';

    return {
        submitBoth,
        retryDocumentUpload,
        retryServicesToggle,
        isLoading,
        bothSuccess,
        apiStatus,
        documentError,
        servicesError,
        documentSuccess: apiStatus.documentUpload === 'success',
        servicesSuccess: apiStatus.servicesToggle === 'success',
    };
};

