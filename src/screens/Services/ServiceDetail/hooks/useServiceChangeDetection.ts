import { useCallback, useEffect, useRef } from 'react';
import { Service, ServiceItem } from '../../../../apiService/types/profileTypes';
import { PRICING_TYPES } from '../../../../constants';
import { OfferData, ServiceTimeData } from '../../PricingDialog';

interface UseServiceChangeDetectionParams {
    initialService: Service | undefined;
    expressServiceEnabled: boolean;
    offerEnabled: boolean;
    maxItemsPerDay: string;
    serviceTimeData: ServiceTimeData;
    offerData: OfferData;
    standardPricePerKg: string;
    expressPricePerKg: string;
    pricingTiers: { regular: string; standard: string; max: string };
    editableItems: { [key: string]: ServiceItem };
}

export const useServiceChangeDetection = ({
    initialService,
    expressServiceEnabled,
    offerEnabled,
    maxItemsPerDay,
    serviceTimeData,
    offerData,
    standardPricePerKg,
    expressPricePerKg,
    pricingTiers,
    editableItems,
}: UseServiceChangeDetectionParams) => {
    const initialServiceRef = useRef<Service | undefined>(initialService);

    // Update initialServiceRef when service changes
    useEffect(() => {
        if (initialService) {
            initialServiceRef.current = initialService;
        }
    }, [initialService]);

    const hasUnsavedChanges = useCallback((): boolean => {
        const service = initialServiceRef.current;
        if (!service) return false;

        // Check if express service enabled changed
        if (expressServiceEnabled !== (service.is_express_available ?? true)) {
            return true;
        }

        // Check if offer enabled changed
        if (offerEnabled !== (service.is_offer ?? true)) {
            return true;
        }

        // Check if max items per day changed
        if (maxItemsPerDay !== (service.max_count_per_day?.toString() || '100')) {
            return true;
        }

        // Check if service time data changed
        if (
            serviceTimeData.standardTime !== (service.standard_time ?? 48) ||
            serviceTimeData.expressTime !== (service.express_time ?? 8)
        ) {
            return true;
        }

        // Check if offer data changed
        if (
            offerData.offerPercentage !== (service.offer_percentage ?? 50) ||
            offerData.maxCap !== (service.offer_max_cap ?? 100)
        ) {
            return true;
        }

        // Check if price per kg changed (for PER_KG services)
        if (service.pricing_type === PRICING_TYPES.PER_KG) {
            const currentStandardPrice = standardPricePerKg !== '' ? standardPricePerKg : (service.standard_price_per_kg?.toString() || '');
            const initialStandardPrice = service.standard_price_per_kg?.toString() || '';
            if (currentStandardPrice !== initialStandardPrice) {
                return true;
            }

            const currentExpressPrice = expressPricePerKg !== '' ? expressPricePerKg : (service.express_price_per_kg?.toString() || '');
            const initialExpressPrice = service.express_price_per_kg?.toString() || '';
            if (currentExpressPrice !== initialExpressPrice) {
                return true;
            }

            // Check if pricing tiers changed
            const initialRegular = service.pricing_tiers?.regular?.toString() || '';
            const initialStandard = service.pricing_tiers?.standard?.toString() || '';
            const initialMax = service.pricing_tiers?.max?.toString() || '';

            if (
                pricingTiers.regular !== initialRegular ||
                pricingTiers.standard !== initialStandard ||
                pricingTiers.max !== initialMax
            ) {
                return true;
            }
        }

        // Check if editable items changed (for PER_PC services)
        if (service.pricing_type === PRICING_TYPES.PER_PC && service.items) {
            const currentItemsStr = JSON.stringify(
                Object.values(editableItems).sort((a, b) =>
                    `${a.item_name}_${a.category}`.localeCompare(`${b.item_name}_${b.category}`)
                )
            );
            const initialItemsStr = JSON.stringify(
                [...service.items].sort((a, b) =>
                    `${a.item_name}_${a.category}`.localeCompare(`${b.item_name}_${b.category}`)
                )
            );
            if (currentItemsStr !== initialItemsStr) {
                return true;
            }
        }

        return false;
    }, [
        expressServiceEnabled,
        offerEnabled,
        maxItemsPerDay,
        serviceTimeData,
        offerData,
        standardPricePerKg,
        expressPricePerKg,
        pricingTiers,
        editableItems,
    ]);

    const updateInitialServiceRef = (updatedService: Service) => {
        initialServiceRef.current = updatedService;
    };

    return {
        hasUnsavedChanges,
        updateInitialServiceRef,
        initialServiceRef,
    };
};

