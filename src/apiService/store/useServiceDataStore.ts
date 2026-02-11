import { create } from 'zustand';
import { Service } from '../types/profileTypes';

interface ServiceFormData {
    expressServiceEnabled?: boolean;
    offerEnabled?: boolean;
    maxItemsPerDay?: string;
    serviceTimeData?: {
        standardTime: number;
        expressTime: number;
    };
    offerData?: {
        offerPercentage: number;
        maxCap: number;
    };
    standardPricePerKg?: string;
    expressPricePerKg?: string;
    pricingTiers?: {
        regular: string;
        standard: string;
        max: string;
    };
}

interface ServiceDataState {
    updatedService: Service | null;
    setUpdatedService: (service: Service | null) => void;
    clearUpdatedService: () => void;
    serviceFormData: { [serviceName: string]: ServiceFormData };
    setServiceFormData: (serviceName: string, data: ServiceFormData) => void;
    clearServiceFormData: (serviceName: string) => void;
}

export const useServiceDataStore = create<ServiceDataState>(set => ({
    updatedService: null,
    setUpdatedService: (service: Service | null) => set({ updatedService: service }),
    clearUpdatedService: () => set({ updatedService: null }),
    serviceFormData: {},
    setServiceFormData: (serviceName: string, data: ServiceFormData) =>
        set(state => ({
            serviceFormData: {
                ...state.serviceFormData,
                [serviceName]: data,
            },
        })),
    clearServiceFormData: (serviceName: string) =>
        set(state => {
            const { [serviceName]: _, ...rest } = state.serviceFormData;
            return { serviceFormData: rest };
        }),
}));

