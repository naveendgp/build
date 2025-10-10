// import { QueryClient } from '@tanstack/react-query';

// Placeholder until @tanstack/react-query is installed
export const queryClient = {
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
};