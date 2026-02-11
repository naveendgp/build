import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingKey: string | null;
  error: string | null;
}

export const useLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingKey: null,
    error: null,
  });

  const startLoading = useCallback((key: string) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      loadingKey: key,
      error: null,
    }));
  }, []);

  const stopLoading = useCallback((key: string, error: string | null = null) => {
    setLoadingState(prev => {
      if (prev.loadingKey === key) {
        return {
          isLoading: false,
          loadingKey: null,
          error,
        };
      }
      return prev;
    });
  }, []);

  const setError = useCallback((key: string, error: string) => {
    setLoadingState(prev => {
      if (prev.loadingKey === key) {
        return {
          ...prev,
          isLoading: false,
          loadingKey: null,
          error,
        };
      }
      return prev;
    });
  }, []);

  const clearError = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const isLoadingForKey = useCallback((key: string) => {
    return loadingState.isLoading && loadingState.loadingKey === key;
  }, [loadingState.isLoading, loadingState.loadingKey]);

  return {
    loadingState,
    startLoading,
    stopLoading,
    setError,
    clearError,
    isLoadingForKey,
  };
};