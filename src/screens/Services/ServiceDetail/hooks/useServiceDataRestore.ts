import React, { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Service, ServiceItem } from '../../../../apiService/types/profileTypes';
import { useProfileStore } from '../../../../apiService/store/useProfileStore';
import { useServiceDataStore } from '../../../../apiService/store/useServiceDataStore';
import { PRICING_TYPES } from '../../../../constants';
import { OfferData, ServiceTimeData } from '../../PricingDialog';

interface UseServiceDataRestoreParams {
    service: Service | undefined;
    setService: (service: Service) => void;
    expressServiceEnabled: boolean;
    offerEnabled: boolean;
    maxItemsPerDay: string;
    serviceTimeData: ServiceTimeData;
    offerData: OfferData;
    standardPricePerKg: string;
    expressPricePerKg: string;
    setExpressServiceEnabled: (value: boolean) => void;
    setOfferEnabled: (value: boolean) => void;
    setMaxItemsPerDay: (value: string) => void;
    setServiceTimeData: (data: ServiceTimeData) => void;
    setOfferData: (data: OfferData) => void;
    setStandardPricePerKg: (value: string) => void;
    setExpressPricePerKg: (value: string) => void;
    setEditableItems: (items: { [key: string]: ServiceItem }) => void;
    justUpdatedFromCategoryListRef: React.MutableRefObject<boolean>;
    previousItemsStrRef: React.MutableRefObject<string>;
}

export const useServiceDataRestore = ({
    service,
    setService,
    expressServiceEnabled,
    offerEnabled,
    maxItemsPerDay,
    serviceTimeData,
    offerData,
    standardPricePerKg,
    expressPricePerKg,
    setExpressServiceEnabled,
    setOfferEnabled,
    setMaxItemsPerDay,
    setServiceTimeData,
    setOfferData,
    setStandardPricePerKg,
    setExpressPricePerKg,
    setEditableItems,
    justUpdatedFromCategoryListRef,
    previousItemsStrRef,
}: UseServiceDataRestoreParams) => {
    const { profile } = useProfileStore();
    const { updatedService, clearUpdatedService, serviceFormData, clearServiceFormData } = useServiceDataStore();
    
    const isRestoringRef = useRef(false);
    const hasRestoredRef = useRef(false);

    // Restore form values when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            const serviceName = service?.service_name;

            // Get fresh serviceFormData from store to avoid stale closure
            const currentFormData = useServiceDataStore.getState().serviceFormData;

            // First, check if profile has updated service data (from server refresh)
            if (profile?.services_offered && serviceName) {
                const updatedServiceFromProfile = profile.services_offered.find(
                    (s: Service) => s.service_name === serviceName
                );

                if (updatedServiceFromProfile) {
                    // Check if profile data is different from current service
                    const hasChanges =
                        updatedServiceFromProfile.is_express_available !== service.is_express_available ||
                        updatedServiceFromProfile.is_offer !== service.is_offer ||
                        updatedServiceFromProfile.max_count_per_day !== service.max_count_per_day ||
                        updatedServiceFromProfile.standard_time !== service.standard_time ||
                        updatedServiceFromProfile.express_time !== service.express_time ||
                        updatedServiceFromProfile.offer_percentage !== service.offer_percentage ||
                        updatedServiceFromProfile.offer_max_cap !== service.offer_max_cap ||
                        JSON.stringify(updatedServiceFromProfile.items) !== JSON.stringify(service.items) ||
                        JSON.stringify(updatedServiceFromProfile.items_by_category) !== JSON.stringify(service.items_by_category);

                    if (hasChanges) {
                        // Clear saved form data since we have fresh data from server
                        clearServiceFormData(serviceName);
                        // Reset restore flag to allow fresh data to be used
                        hasRestoredRef.current = false;
                        // Update service state with fresh data
                        setService(updatedServiceFromProfile);
                        // Don't restore form data if we just updated from profile
                        return;
                    }
                }
            }

            // Restore form values from saved data (only if no profile update)
            if (serviceName && currentFormData[serviceName] && !hasRestoredRef.current) {
                isRestoringRef.current = true;
                hasRestoredRef.current = true;
                const savedData = currentFormData[serviceName];
                // Restore form values from store
                if (savedData.expressServiceEnabled !== undefined) {
                    setExpressServiceEnabled(savedData.expressServiceEnabled);
                }
                if (savedData.offerEnabled !== undefined) {
                    setOfferEnabled(savedData.offerEnabled);
                }
                if (savedData.maxItemsPerDay !== undefined) {
                    setMaxItemsPerDay(savedData.maxItemsPerDay);
                }
                if (savedData.serviceTimeData) {
                    setServiceTimeData(savedData.serviceTimeData);
                }
                if (savedData.offerData) {
                    setOfferData(savedData.offerData);
                }
                if (savedData.standardPricePerKg !== undefined) {
                    setStandardPricePerKg(savedData.standardPricePerKg);
                }
                if (savedData.expressPricePerKg !== undefined) {
                    setExpressPricePerKg(savedData.expressPricePerKg);
                }
                // Reset flag after state updates complete
                setTimeout(() => {
                    isRestoringRef.current = false;
                }, 200);
            }

            // Update service when coming back from CategoryList (only for PER_PC)
            if (service?.pricing_type === PRICING_TYPES.PER_PC) {
                // Check if there's updated service data from CategoryList
                if (updatedService && updatedService.service_name === service.service_name) {
                    // Check if items or items_by_category have changed
                    const itemsChanged = JSON.stringify(updatedService.items) !== JSON.stringify(service.items);
                    const itemsByCategoryChanged = JSON.stringify(updatedService.items_by_category) !== JSON.stringify(service.items_by_category);
                    if (itemsChanged || itemsByCategoryChanged) {
                        console.log('📦 Updated service data from CategoryList:', {
                            serviceName: updatedService.service_name,
                            items: updatedService.items,
                            itemsCount: updatedService.items?.length || 0,
                            selectedItems: updatedService.items?.filter((item: ServiceItem) => item.is_active).length || 0,
                            itemsByCategory: updatedService.items_by_category,
                        });

                        // Update editableItems directly from the updated service
                        const newEditableItems: { [key: string]: ServiceItem } = {};
                        if (updatedService.items && updatedService.items.length > 0) {
                            updatedService.items.forEach((item: ServiceItem) => {
                                const itemKey = `${item.item_name}_${item.category}`;
                                newEditableItems[itemKey] = { ...item };
                            });
                        }

                        console.log('📦 Directly updating editableItems:', {
                            editableItemsCount: Object.keys(newEditableItems).length,
                            selectedItems: Object.values(newEditableItems).filter(item => item.is_active).length,
                        });

                        setEditableItems(newEditableItems);
                        previousItemsStrRef.current = JSON.stringify(newEditableItems);

                        // Set flag to prevent useEffect from overwriting
                        justUpdatedFromCategoryListRef.current = true;

                        setService(updatedService);
                        // Clear the temporary store after using it
                        clearUpdatedService();
                        // Force refresh by resetting the restore flag
                        hasRestoredRef.current = false;

                        // Reset flag after a short delay to allow useEffect to skip this update
                        setTimeout(() => {
                            justUpdatedFromCategoryListRef.current = false;
                        }, 100);
                    }
                }
            }
        }, [updatedService, service, clearUpdatedService, profile?.services_offered, clearServiceFormData, setService, setExpressServiceEnabled, setOfferEnabled, setMaxItemsPerDay, setServiceTimeData, setOfferData, setStandardPricePerKg, setExpressPricePerKg, setEditableItems]),
    );

    // Sync service data from refreshed profile (when profile updates while on screen)
    useEffect(() => {
        if (profile?.services_offered && service?.service_name && !isRestoringRef.current) {
            // Find the updated service in the refreshed profile
            const updatedServiceFromProfile = profile.services_offered.find(
                (s: Service) => s.service_name === service.service_name
            );

            if (updatedServiceFromProfile) {
                // Only update if the service data has actually changed
                // Compare key fields to avoid unnecessary updates
                const hasChanges =
                    updatedServiceFromProfile.is_express_available !== service.is_express_available ||
                    updatedServiceFromProfile.is_offer !== service.is_offer ||
                    updatedServiceFromProfile.max_count_per_day !== service.max_count_per_day ||
                    updatedServiceFromProfile.standard_time !== service.standard_time ||
                    updatedServiceFromProfile.express_time !== service.express_time ||
                    updatedServiceFromProfile.offer_percentage !== service.offer_percentage ||
                    updatedServiceFromProfile.offer_max_cap !== service.offer_max_cap ||
                    JSON.stringify(updatedServiceFromProfile.items) !== JSON.stringify(service.items) ||
                    JSON.stringify(updatedServiceFromProfile.items_by_category) !== JSON.stringify(service.items_by_category);

                if (hasChanges) {
                    // Clear saved form data since we have fresh data from server
                    clearServiceFormData(service.service_name);
                    // Reset restore flag to allow fresh data to be used
                    hasRestoredRef.current = false;
                    // Update service state with fresh data
                    setService(updatedServiceFromProfile);
                }
            }
        }
    }, [profile?.services_offered, service?.service_name, clearServiceFormData, service, setService]);

    // Reset restore flag when service changes
    useEffect(() => {
        hasRestoredRef.current = false;
    }, [service?.service_name]);

    // Update state when service changes (including when updated from CategoryList or refreshed)
    // Only update if we don't have saved form data (to avoid overwriting user edits)
    useEffect(() => {
        if (service && !isRestoringRef.current) {
            const serviceName = service.service_name;
            const hasSavedData = serviceName && serviceFormData[serviceName];

            // Only update from service if we don't have saved form data
            if (!hasSavedData) {
                // Update express service toggle
                if (service.is_express_available !== undefined) {
                    setExpressServiceEnabled(service.is_express_available);
                }
                // Update offer toggle
                if (service.is_offer !== undefined) {
                    setOfferEnabled(service.is_offer);
                }
                // Update max items per day
                if (service.max_count_per_day !== undefined) {
                    setMaxItemsPerDay(service.max_count_per_day.toString());
                }
                // Update service time data
                if (service.standard_time !== undefined || service.express_time !== undefined) {
                    setServiceTimeData({
                        standardTime: service.standard_time ?? 48,
                        expressTime: service.express_time ?? 8,
                    });
                }
                // Update offer data
                if (service.offer_percentage !== undefined || service.offer_max_cap !== undefined) {
                    setOfferData({
                        offerPercentage: service.offer_percentage ?? 50,
                        maxCap: service.offer_max_cap ?? 100,
                    });
                }
                if (service.standard_price_per_kg !== undefined) {
                    setStandardPricePerKg((service.standard_price_per_kg ?? '').toString());
                }
                if (service.express_price_per_kg !== undefined) {
                    setExpressPricePerKg((service.express_price_per_kg ?? '').toString());
                }
            }
        }
    }, [service, serviceFormData, setExpressServiceEnabled, setOfferEnabled, setMaxItemsPerDay, setServiceTimeData, setOfferData, setStandardPricePerKg, setExpressPricePerKg]);

    // Save form values to store whenever they change (but not during restore)
    useEffect(() => {
        if (isRestoringRef.current) return; // Skip saving during restore
        if (service?.service_name) {
            const { setServiceFormData } = useServiceDataStore.getState();
            setServiceFormData(service.service_name, {
                expressServiceEnabled,
                offerEnabled,
                maxItemsPerDay,
                serviceTimeData,
                offerData,
                standardPricePerKg,
                expressPricePerKg,
            });
        }
    }, [service?.service_name, expressServiceEnabled, offerEnabled, maxItemsPerDay, serviceTimeData, offerData, standardPricePerKg, expressPricePerKg]);

    return {
        isRestoringRef,
    };
};

