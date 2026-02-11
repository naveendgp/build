import { useState } from 'react';
import { Service } from '../../../../apiService/types/profileTypes';
import { OfferData, ServiceTimeData } from '../../PricingDialog';

export const useServiceForm = (initialService: Service | undefined) => {
    const [expressServiceEnabled, setExpressServiceEnabled] = useState<boolean>(
        initialService?.is_express_available ?? true,
    );
    const [offerEnabled, setOfferEnabled] = useState<boolean>(
        initialService?.is_offer ?? true,
    );
    const [maxItemsPerDay, setMaxItemsPerDay] = useState<string>(
        initialService?.max_count_per_day?.toString() || '100',
    );
    const [standardPricePerKg, setStandardPricePerKg] = useState<string>(
        initialService?.standard_price_per_kg?.toString() || ''
    );
    const [expressPricePerKg, setExpressPricePerKg] = useState<string>(
        initialService?.express_price_per_kg?.toString() || ''
    );
    const [serviceTimeData, setServiceTimeData] = useState<ServiceTimeData>({
        standardTime: initialService?.standard_time ?? 48,
        expressTime: initialService?.express_time ?? 8,
    });
    const [offerData, setOfferData] = useState<OfferData>({
        offerPercentage: initialService?.offer_percentage ?? 50,
        maxCap: initialService?.offer_max_cap ?? 100,
    });

    const [pricingTiers, setPricingTiers] = useState({
        regular: initialService?.pricing_tiers?.regular?.toString() || '',
        standard: initialService?.pricing_tiers?.standard?.toString() || '',
        max: initialService?.pricing_tiers?.max?.toString() || '',
    });

    const updatePricingTier = (tier: 'regular' | 'standard' | 'max', value: string) => {
        setPricingTiers(prev => ({
            ...prev,
            [tier]: value
        }));
    };

    return {
        expressServiceEnabled,
        setExpressServiceEnabled,
        offerEnabled,
        setOfferEnabled,
        maxItemsPerDay,
        setMaxItemsPerDay,
        standardPricePerKg,
        setStandardPricePerKg,
        expressPricePerKg,
        setExpressPricePerKg,
        serviceTimeData,
        setServiceTimeData,
        offerData,
        setOfferData,
        pricingTiers,
        updatePricingTier,
        setPricingTiers,
    };
};

