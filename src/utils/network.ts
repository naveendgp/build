// Try to import from @react-native-community/netinfo, fallback to React Native's NetInfo
let NetInfo: any;
try {
  NetInfo = require('@react-native-community/netinfo').NetInfo;
} catch (error) {
  console.warn(
    '@react-native-community/netinfo not found, falling back to React Native NetInfo',
  );
  try {
    NetInfo = require('react-native').NetInfo;
  } catch (fallbackError) {
    console.error(
      'NetInfo not available in React Native either. Network monitoring will be limited.',
    );
  }
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType?: string | null;
}

/**
 * Check current network connectivity
 */
export const checkNetworkConnectivity = async (): Promise<NetworkStatus> => {
  if (!NetInfo) {
    console.warn('NetInfo not available, returning default network status');
    return {
      isConnected: true, // Default to true for development
      isInternetReachable: null,
      connectionType: null,
    };
  }

  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      connectionType: state.type ?? null,
    };
  } catch (error) {
    console.error('Error checking network connectivity:', error);
    return {
      isConnected: false,
      isInternetReachable: null,
      connectionType: null,
    };
  }
};

/**
 * Add network connectivity listener
 */
export const addNetworkListener = (
  callback: (status: NetworkStatus) => void,
) => {
  if (!NetInfo) {
    console.warn('NetInfo not available, listener will not be added');
    return () => {}; // Return empty unsubscribe function
  }

  const unsubscribe = NetInfo.addEventListener((state: any) => {
    callback({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      connectionType: state.type ?? null,
    });
  });
  return unsubscribe;
};

/**
 * Check if network is available for API calls
 */
export const isNetworkAvailable = async (): Promise<boolean> => {
  const status = await checkNetworkConnectivity();
  // isInternetReachable can be null, so we only check isConnected
  return status.isConnected && status.isInternetReachable !== false;
};

/**
 * Retry API call with network check
 */
export const retryWithNetworkCheck = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check network before each attempt
      const isAvailable = await isNetworkAvailable();
      if (!isAvailable) {
        throw new Error(
          'Network is not available. Please check your internet connection.',
        );
      }

      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      // If it's a network error and we have retries left, wait and try again
      if (
        attempt < maxRetries &&
        error instanceof Error &&
        (error.message.includes('Network request failed') ||
          error.message.includes('Unable to connect') ||
          error.message.includes('Network error'))
      ) {
        console.log(
          `Network error, retrying in ${delayMs}ms... (Attempt ${attempt}/${maxRetries})`,
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // If it's not a network error or no retries left, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Network request failed after retries');
};
