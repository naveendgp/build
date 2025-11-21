// src/store/useDialogStore.ts
import { create } from 'zustand';

interface DialogState {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  imageSource?: any;
  onClose?: () => void;
  closable?: boolean;
  showDialog: (
    title: string,
    subtitle: string,
    buttonText?: string,
    imageSource?: any,
    onClose?: () => void,
    closable?: boolean
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
  closable: true,

  showDialog: (title, subtitle, buttonText = 'Close', imageSource, onClose, closable = true) =>
    set({
      visible: true,
      title,
      subtitle,
      buttonText,
      imageSource,
      onClose,
      closable,
    }),

  hideDialog: () =>
    set({
      visible: false,
      title: '',
      subtitle: '',
      buttonText: 'Close',
      imageSource: undefined,
      onClose: undefined,
      closable: true,
    }),
}));
