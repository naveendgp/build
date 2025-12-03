import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { registerComplete } from '../../../../apiService/api/authApi';
import { toggleServiceActive, listServices } from '../../../../apiService/api/profileApi';
import { RegisterCompletePayload, RegisterCompleteResponse, OperatingHours, ShopDocumentUploadPayload } from '../../../../apiService/types/authTypes';
import { ToggleServiceActiveInput, ListServiceItem } from '../../../../apiService/types/profileTypes';
import { showErrorToast, showSuccessToast } from '../../../../utils/Toast';
import { useVendorVerificationStore } from '../../../../apiService/store/useVendorVerificationStore';
import { useAuthStore } from '../../../../apiService/store/useAuthStore';

interface UseSubmitVerificationProps {
    onSuccess: () => void;
}

interface ApiStatus {
    documentUpload: 'idle' | 'success' | 'error';
    servicesToggle: 'idle' | 'success' | 'error';
}

export const useSubmitVerification = ({ onSuccess }: UseSubmitVerificationProps) => {
    const { vendor, shop, bank } = useVendorVerificationStore();
    const [apiStatus, setApiStatus] = useState<ApiStatus>({
        documentUpload: 'idle',
        servicesToggle: 'idle',
    });

    const [documentError, setDocumentError] = useState<string | null>(null);
    const [servicesError, setServicesError] = useState<string | null>(null);
    const successHandledRef = useRef(false);

    // Helper function to parse operating hours from business_hours string
    const parseOperatingHours = (businessHours: string): OperatingHours => {
        if (!businessHours) {
            return {};
        }
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(businessHours);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed as OperatingHours;
            }
        } catch (e) {
            // If not JSON, return empty object (or you could parse string format if needed)
        }
        return {};
    };

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

    // Document upload mutation using registerComplete
    const documentMutation = useMutation<
        RegisterCompleteResponse,
        AxiosError<{ message: string }>,
        ShopDocumentUploadPayload
    >({
        mutationFn: (payload: ShopDocumentUploadPayload) => {
            // Convert ShopDocumentUploadPayload to RegisterCompletePayload
            const registerPayload: RegisterCompletePayload = {
                shop_name: payload.shop_name,
                owner_name: payload.owner_name,
                email: payload.email || '',
                gst_number: payload.gst_number,
                pan_number: payload.pan_number,
                shop_license_number: payload.shop_license_number,
                aadhaar_number: payload.aadhaar_number,
                address_line1: payload.address_line1,
                address_line2: payload.address_line2,
                pincode: payload.pincode,
                landmark: payload.landmark,
                latitude: payload.latitude,
                longitude: payload.longitude,
                contactNum: shop.contact_number || '',
                account_holder_name: payload.account_holder_name,
                account_number: payload.account_number,
                ifsc_code: payload.ifsc_code,
                bank_name: payload.bank_name,
                branch: '', // Optional field, not in current payload
                upi_id: bank.upi_id || '',
                operating_hours: parseOperatingHours(shop.business_hours || ''),
            };

            // Helper function to get MIME type from file extension
            const getMimeTypeFromExtension = (fileName: string): string => {
                if (!fileName) return 'image/jpeg';
                const extension = fileName.toLowerCase().split('.').pop();
                switch (extension) {
                    case 'jpg':
                    case 'jpeg':
                        return 'image/jpeg';
                    case 'png':
                        return 'image/png';
                    case 'gif':
                        return 'image/gif';
                    case 'webp':
                        return 'image/webp';
                    case 'pdf':
                        return 'application/pdf';
                    default:
                        return 'image/jpeg'; // Default to image format
                }
            };

            // Helper function to normalize file object
            const normalizeFile = (file: any, defaultName: string, defaultType: string = 'image/jpeg') => {
                if (!file) return undefined;
                // Handle string URI
                if (typeof file === 'string') {
                    return {
                        uri: file,
                        name: defaultName,
                        type: getMimeTypeFromExtension(defaultName),
                    };
                }
                // Handle object with uri and name
                if (file.uri) {
                    const fileName = file.name || defaultName;
                    // Use provided type, or detect from extension, or use default
                    const mimeType = file.type || getMimeTypeFromExtension(fileName) || defaultType;
                    return {
                        uri: file.uri,
                        name: fileName,
                        type: mimeType,
                    };
                }
                return undefined;
            };

            // Prepare images object
            const images = {
                profile_pic: normalizeFile(vendor.profile_pic, 'profile_pic.jpg'),
                // Don't force PDF - preserve original format (image or PDF)
                aadhaar_card: normalizeFile(vendor.aadhaar_file, 'aadhaar_card.jpg'),
                pan_card: normalizeFile(vendor.pan_file, 'pan_card.jpg'),
                shop_image: normalizeFile(shop.shop_front_photo, 'shop_image.jpg'),
                cancelled_cheque: normalizeFile(bank.cancelled_cheque, 'cancelled_cheque.jpg'),
            };

            return registerComplete(registerPayload, images);
        },
        onSuccess: (data) => {
            // Update document state from response
            if (data?.data?.status) {
                const { setDocumentState } = useAuthStore.getState();
                setDocumentState(data.data.status);
            }
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

