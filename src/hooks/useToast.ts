import { useState, useCallback } from 'react';

export interface ToastConfig {
  message: string;
  textColor?: string;
  backgroundColor?: string;
  duration?: number;
  showCancelIcon?: boolean;
}

export interface ToastState {
  visible: boolean;
  message: string;
  textColor: string;
  backgroundColor: string;
  duration: number;
  showCancelIcon: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    textColor: '#FFFFFF',
    backgroundColor: '#333333',
    duration: 5000,
    showCancelIcon: true,
  });

  const showToast = useCallback((config: ToastConfig) => {
    setToast(prev => ({
      ...prev,
      visible: true,
      message: config.message,
      textColor: config.textColor || '#FFFFFF',
      backgroundColor: config.backgroundColor || '#333333',
      duration: config.duration || 5000,
      showCancelIcon: config.showCancelIcon !== false,
    }));
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};