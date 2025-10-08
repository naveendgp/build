// src/store/userStore.ts
import { create } from 'zustand';

export interface Delivery {
  id: string;
  pickup: string;
  drop: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface UserState {
  mobile: string;
  username: string;
  isLoggedIn: boolean;
  online: boolean;
  earnings: number;
  deliveries: Delivery[];
  setMobile: (mobile: string) => void;
  setUsername: (username: string) => void;
  setLoggedIn: (status: boolean) => void;
  setOnline: (status: boolean) => void;
  addDelivery: (delivery: Delivery) => void;
  completeDelivery: (id: string) => void;
  setEarnings: (amount: number) => void;
}

export const useUserStore = create<UserState>(set => ({
  mobile: '',
  username: '',
  isLoggedIn: false,
  online: false,
  earnings: 0,
  deliveries: [
    { id: '1', pickup: 'Location A', drop: 'Location B', status: 'pending' },
    { id: '2', pickup: 'Location C', drop: 'Location D', status: 'pending' },
  ],
  setMobile: mobile => set({ mobile }),
  setUsername: username => set({ username }),
  setLoggedIn: status => set({ isLoggedIn: status }),
  setOnline: status => set({ online: status }),
  addDelivery: delivery =>
    set(state => ({ deliveries: [...state.deliveries, delivery] })),
  completeDelivery: id =>
    set(state => ({
      deliveries: state.deliveries.map(d =>
        d.id === id ? { ...d, status: 'completed' } : d,
      ),
    })),
  setEarnings: amount => set({ earnings: amount }),
}));
