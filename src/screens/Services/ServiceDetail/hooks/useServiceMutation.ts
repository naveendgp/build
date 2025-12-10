import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { AxiosError } from 'axios';
import { Service, ServiceItem, UpdateServiceInput, UpdateServicesResponse } from '../../../../apiService/types/profileTypes';
import { ErrorResponse } from '../../../../apiService/types/authTypes';
import { updateServicesOffered } from '../../../../apiService/api/profileApi';
import { useProfileStore } from '../../../../apiService/store/useProfileStore';
import { useServiceDataStore } from '../../../../apiService/store/useServiceDataStore';
import { showSuccessToast, showErrorToast } from '../../../../utils/Toast';
import { PRICING_TYPES } from '../../../../constants';
import { OfferData, ServiceTimeData } from '../../PricingDialog';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';

type ServiceDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'ServiceDetail'>;

interface UseServiceMutationParams {
    service: Service | undefined;
    expressServiceEnabled: boolean;
    offerEnabled: boolean;
    maxItemsPerDay: string;
    serviceTimeData: ServiceTimeData;
    offerData: OfferData;
    standardPricePerKg: string;
    expressPricePerKg: string;
    editableItems: { [key: string]: ServiceItem };
    setShowDialog: (show: boolean) => void;
    updateInitialServiceRef: (service: Service) => void;
    isNavigatingAfterSaveRef: React.MutableRefObject<boolean>;
    shouldAllowNavigationRef: React.MutableRefObject<boolean>;
    setShouldPreventNavigation: (value: boolean) => void;
}

export const useServiceMutation = ({
    service,
    expressServiceEnabled,
    offerEnabled,
    maxItemsPerDay,
    serviceTimeData,
    offerData,
    standardPricePerKg,
    expressPricePerKg,
    editableItems,
    setShowDialog,
    updateInitialServiceRef,
    isNavigatingAfterSaveRef,
    shouldAllowNavigationRef,
    setShouldPreventNavigation,
}: UseServiceMutationParams) => {
    const navigation = useNavigation<ServiceDetailNavProp>();
    const queryClient = useQueryClient();
    const { refreshProfile } = useProfileStore();
    const { clearServiceFormData } = useServiceDataStore();

    const convertToApiFormat = (): UpdateServiceInput => {
        // Use editableItems which contains all items (from all categories for PER_PC, or direct edits for PER_KG)
        const allItems: ServiceItem[] = Object.values(editableItems);

        console.log('📤 Converting to API format:', {
            pricingType: service?.pricing_type,
            editableItemsCount: allItems.length,
            selectedItems: allItems.filter(item => item.is_active).length,
            editableItemsKeys: Object.keys(editableItems).length,
            serviceItemsCount: service?.items?.length || 0,
            serviceItemsByCategoryKeys: service?.items_by_category ? Object.keys(service.items_by_category).length : 0,
            sampleEditableItem: allItems[0],
            items: allItems.slice(0, 5).map(item => ({
                name: item.item_name,
                category: item.category,
                is_active: item.is_active,
                item_price: item.item_price,
                express_price: item.express_price,
            })),
        });

        const parsedStandardPerKg =
            standardPricePerKg !== '' ? Number(standardPricePerKg) : service?.standard_price_per_kg || 0;
        const parsedExpressPerKg =
            expressPricePerKg !== '' ? Number(expressPricePerKg) : service?.express_price_per_kg || 0;

        const apiInput: UpdateServiceInput = {
            service: {
                service_id: (service as any)?._id || (service as any)?.service_id || '',
                service_name: service?.service_name || '',
                max_count_per_day: parseInt(maxItemsPerDay) || service?.max_count_per_day || 0,
                is_express: expressServiceEnabled,
                is_offer: offerEnabled,
                offer_max_cap: offerData.maxCap || 0,
                offer_percentage: offerData.offerPercentage || 0,
                express_time: serviceTimeData.expressTime || 0,
                standard_time: serviceTimeData.standardTime || 0,
                standard_price_per_kg: parsedStandardPerKg,
                express_price_per_kg: parsedExpressPerKg,
                items: allItems.map(item => ({
                    item_name: item.item_name,
                    item_price: item.item_price,
                    item_category: item.category,
                    express_price: item.express_price,
                    discount_percentage: item.discount_percentage,
                    is_active: item.is_active,
                })),
            },
        };

        console.log('📤 API Payload:', JSON.stringify(apiInput, null, 2));

        return apiInput;
    };

    const updateServicesMutation = useMutation<
        UpdateServicesResponse,
        AxiosError<ErrorResponse>,
        UpdateServiceInput
    >({
        mutationFn: updateServicesOffered,
        onSuccess: async () => {
            // Mark that we're navigating after successful save (to prevent discard dialog)
            // Set this BEFORE refreshProfile to ensure it's set when navigation happens
            isNavigatingAfterSaveRef.current = true;
            shouldAllowNavigationRef.current = true;
            setShouldPreventNavigation(false);

            // Refresh profile
            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: ['profile'] });

            // Clear saved form data since it's been saved
            if (service?.service_name) {
                clearServiceFormData(service.service_name);
            }

            // Update initial service ref with current form values (the values that were just saved)
            // This ensures hasUnsavedChanges() returns false after save
            if (service) {
                const updatedService: Service = {
                    ...service,
                    is_express_available: expressServiceEnabled,
                    is_offer: offerEnabled,
                    max_count_per_day: parseInt(maxItemsPerDay) || service.max_count_per_day || 0,
                    standard_time: serviceTimeData.standardTime,
                    express_time: serviceTimeData.expressTime,
                    offer_percentage: offerData.offerPercentage,
                    offer_max_cap: offerData.maxCap,
                    standard_price_per_kg: standardPricePerKg ? Number(standardPricePerKg) : service.standard_price_per_kg,
                    express_price_per_kg: expressPricePerKg ? Number(expressPricePerKg) : service.express_price_per_kg,
                    items: service.pricing_type === PRICING_TYPES.PER_PC ? Object.values(editableItems) : service.items,
                };
                updateInitialServiceRef(updatedService);
            }

            // Show success dialog for 1 second
            setShowDialog(true);
            setTimeout(() => {
                showSuccessToast('Service updated successfully');
                navigation.goBack();
            }, 1000);
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            console.error('Error updating service:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to update service. Please try again.';
            showErrorToast(errorMessage);
        },
    });

    const handleConfirm = () => {
        const apiInput = convertToApiFormat();
        updateServicesMutation.mutate(apiInput);
    };

    return {
        updateServicesMutation,
        handleConfirm,
    };
};

