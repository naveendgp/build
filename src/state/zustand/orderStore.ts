import { create } from 'zustand';
import { OrderItem } from '../../screens/OrderReview/OrderReviewTopServiceItemOrder';
import { VendorDisplayData } from '../../types/vendor/vendorDetail';

interface OrderState {
  selectedOrderItems: OrderItem[] | null;
  isExpress: boolean;
  vendorDetails: VendorDisplayData | null;
  note: string;
}

interface OrderActions {
  setSelectedOrderItems: (selectedOrderItems: OrderItem[] | null) => void;
  setVendorDetails: (vendorDetails: VendorDisplayData | null) => void;
  setIsExpress: (isExpress: boolean) => void;
  setNote: (note: string) => void;
  clearItems: () => void;
  clearVendorDetails: () => void;
  clearAll: () => void;
}

type OrderStore = OrderState & OrderActions;

export const useOrderStore = create<OrderStore>()((set, get) => ({
  // Initial state
  selectedOrderItems: null,
  vendorDetails: null,
  isExpress: false,
  note: "",
  // Actions
  setSelectedOrderItems: (selectedOrderItems: OrderItem[] | null) => set({ selectedOrderItems }),
  setVendorDetails: (vendorDetails: VendorDisplayData | null) => set({ vendorDetails }),
  setIsExpress: (isExpress: boolean) => set({ isExpress }),
  setNote: (note: string) => set({ note }),
  clearItems: () => set({ selectedOrderItems: null }),
  clearVendorDetails: () => set({ vendorDetails: null }),
  clearAll: () => set({ selectedOrderItems: null, isExpress: false, note: "" }),
}));



