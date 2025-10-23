// src/store/useDialogStore.ts
import { create } from 'zustand';

interface DialogState {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  imageSource?: any;
  onClose?: () => void;
  showDialog: (
    title: string,
    subtitle: string,
    buttonText?: string,
    imageSource?: any,
    onClose?: () => void
  ) => void;
  hideDialog: () => void;
}

export const useDialogStore = create<DialogState>(set => ({
  visible: false,
  title: '',
  subtitle: '',
  buttonText: 'Close',
  imageSource: undefined,
  onClose: undefined,

  showDialog: (title, subtitle, buttonText = 'Close', imageSource, onClose) =>
    set({
      visible: true,
      title,
      subtitle,
      buttonText,
      imageSource,
      onClose,
    }),

  hideDialog: () =>
    set({
      visible: false,
      title: '',
      subtitle: '',
      buttonText: 'Close',
      imageSource: undefined,
      onClose: undefined,
    }),
}));
