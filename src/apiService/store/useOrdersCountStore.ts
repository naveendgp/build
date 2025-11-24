import { create } from 'zustand';
import { OrderStatus } from '../../types/order/order';

interface OrdersCountState {
    counts: Record<OrderStatus, number>;
    setCount: (status: OrderStatus, count: number) => void;
    getCount: (status: OrderStatus) => number;
    reset: () => void;
}

const initialCounts: Record<OrderStatus, number> = {
    [OrderStatus.RECEIVED]: 0,
    [OrderStatus.ACCEPTED]: 0,
    [OrderStatus.READY_FOR_PICK_UP]: 0,
    [OrderStatus.COMPLETED]: 0,
};

export const useOrdersCountStore = create<OrdersCountState>((set, get) => ({
    counts: initialCounts,
    setCount: (status, count) =>
        set(state => ({
            counts: { ...state.counts, [status]: count },
        })),
    getCount: status => get().counts[status] ?? 0,
    reset: () => set({ counts: initialCounts }),
}));
