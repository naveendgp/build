// src/state/zustand/dialogStore.ts
import { create } from 'zustand';

interface DialogState {
    visible: boolean;
    title: string;
    content: string;
    showSingleBtn?: boolean;
    onConfirm?: () => void;
    onClose?: () => void;
    showDialog: (options: {
        title: string;
        content: string;
        showSingleBtn?: boolean;
        onConfirm?: () => void;
        onClose?: () => void;
    }) => void;
    hideDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
    visible: false,
    title: '',
    content: '',
    showSingleBtn: false,
    onConfirm: undefined,
    onClose: undefined,
    showDialog: (options) => set({ visible: true, ...options }),
    hideDialog: () =>
        set({
            visible: false,
            title: '',
            content: '',
            showSingleBtn: false,
            onConfirm: undefined,
            onClose: undefined,
        }),
}));
