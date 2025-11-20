import { create } from 'zustand';
import { Service } from '../types/profileTypes';

interface ServiceDataState {
    updatedService: Service | null;
    setUpdatedService: (service: Service | null) => void;
    clearUpdatedService: () => void;
}

export const useServiceDataStore = create<ServiceDataState>(set => ({
    updatedService: null,
    setUpdatedService: (service: Service | null) => set({ updatedService: service }),
    clearUpdatedService: () => set({ updatedService: null }),
}));

