import { useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Service, ServiceItem } from '../../../../apiService/types/profileTypes';
import { useServiceDataStore } from '../../../../apiService/store/useServiceDataStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { PRICING_TYPES } from '../../../../constants';
import React from 'react';

type ServiceDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'ServiceDetail'>;

interface UseServiceNavigationParams {
    hasUnsavedChanges: () => boolean;
    shouldPreventNavigation: boolean;
    showDiscardDialog: boolean;
    setShowDiscardDialog: (show: boolean) => void;
    setShouldPreventNavigation: (value: boolean) => void;
    isNavigatingAfterSaveRef: React.MutableRefObject<boolean>;
    shouldAllowNavigationRef: React.MutableRefObject<boolean>;
    updateServicesMutationIsPending: boolean;
    initialService: Service | undefined;
    setExpressServiceEnabled: (value: boolean) => void;
    setOfferEnabled: (value: boolean) => void;
    setMaxItemsPerDay: (value: string) => void;
    setServiceTimeData: (data: { standardTime: number; expressTime: number }) => void;
    setOfferData: (data: { offerPercentage: number; maxCap: number }) => void;
    setStandardPricePerKg: (value: string) => void;
    setExpressPricePerKg: (value: string) => void;
    setEditableItems: (items: { [key: string]: ServiceItem }) => void;
}

export const useServiceNavigation = ({
    hasUnsavedChanges,
    shouldPreventNavigation,
    showDiscardDialog,
    setShowDiscardDialog,
    setShouldPreventNavigation,
    isNavigatingAfterSaveRef,
    shouldAllowNavigationRef,
    updateServicesMutationIsPending,
    initialService,
    setExpressServiceEnabled,
    setOfferEnabled,
    setMaxItemsPerDay,
    setServiceTimeData,
    setOfferData,
    setStandardPricePerKg,
    setExpressPricePerKg,
    setEditableItems,
}: UseServiceNavigationParams) => {
    const navigation = useNavigation<ServiceDetailNavProp>();
    const { clearServiceFormData } = useServiceDataStore();

    // Handle navigation back with unsaved changes check
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Allow navigation if we're navigating after successful save or after discard
            if (isNavigatingAfterSaveRef.current || shouldAllowNavigationRef.current) {
                // Don't reset refs here - let them reset on unmount or after navigation completes
                return;
            }

            // Don't prevent navigation if we're saving or if navigation is already allowed
            if (updateServicesMutationIsPending || !shouldPreventNavigation) {
                return;
            }

            // Check if there are unsaved changes
            if (hasUnsavedChanges()) {
                // Prevent default behavior of leaving the screen
                e.preventDefault();

                // Show discard dialog
                setShowDiscardDialog(true);
            }
        });

        return () => {
            // Reset refs when component unmounts or listener is removed
            isNavigatingAfterSaveRef.current = false;
            shouldAllowNavigationRef.current = false;
            unsubscribe();
        };
    }, [navigation, hasUnsavedChanges, shouldPreventNavigation, updateServicesMutationIsPending, isNavigatingAfterSaveRef, shouldAllowNavigationRef, setShowDiscardDialog]);

    // Handle discard confirmation
    const handleDiscardChanges = useCallback(() => {
        if (!initialService) return;

        // Clear saved form data
        if (initialService.service_name) {
            clearServiceFormData(initialService.service_name);
        }

        // Reset all form states to initial values
        setExpressServiceEnabled(initialService.is_express_available ?? true);
        setOfferEnabled(initialService.is_offer ?? true);
        setMaxItemsPerDay(initialService.max_count_per_day?.toString() || '100');
        setServiceTimeData({
            standardTime: initialService.standard_time ?? 48,
            expressTime: initialService.express_time ?? 8,
        });
        setOfferData({
            offerPercentage: initialService.offer_percentage ?? 50,
            maxCap: initialService.offer_max_cap ?? 100,
        });
        setStandardPricePerKg(initialService.standard_price_per_kg?.toString() || '');
        setExpressPricePerKg(initialService.express_price_per_kg?.toString() || '');

        // Reset editable items for PER_PC services
        if (initialService.pricing_type === PRICING_TYPES.PER_PC && initialService.items) {
            const items: { [key: string]: ServiceItem } = {};
            initialService.items.forEach((item: ServiceItem) => {
                const itemKey = `${item.item_name}_${item.category}`;
                items[itemKey] = { ...item };
            });
            setEditableItems(items);
        }

        // Close dialog first
        setShowDiscardDialog(false);

        // Mark that navigation should be allowed (this prevents the beforeRemove listener from blocking)
        shouldAllowNavigationRef.current = true;
        setShouldPreventNavigation(false);

        // Navigate back immediately
        navigation.goBack();
    }, [initialService, clearServiceFormData, navigation, setExpressServiceEnabled, setOfferEnabled, setMaxItemsPerDay, setServiceTimeData, setOfferData, setStandardPricePerKg, setExpressPricePerKg, setEditableItems, setShowDiscardDialog, shouldAllowNavigationRef, setShouldPreventNavigation]);

    // Handle cancel discard (stay on screen)
    const handleCancelDiscard = useCallback(() => {
        setShowDiscardDialog(false);
    }, [setShowDiscardDialog]);

    // Handle back button when discard dialog is open
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (showDiscardDialog) {
                    // Close dialog if it's open
                    setShowDiscardDialog(false);
                    return true; // Prevent default back action
                }
                return false; // Allow default back action
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => backHandler.remove();
        }, [showDiscardDialog, setShowDiscardDialog])
    );

    // Custom back handler for Toolbar
    const handleBackPress = useCallback(() => {
        if (hasUnsavedChanges()) {
            setShowDiscardDialog(true);
        } else {
            navigation.goBack();
        }
    }, [hasUnsavedChanges, navigation, setShowDiscardDialog]);

    return {
        handleDiscardChanges,
        handleCancelDiscard,
        handleBackPress,
    };
};

