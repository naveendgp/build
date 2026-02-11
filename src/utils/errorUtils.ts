/**
 * Formats error messages to provide user-friendly error messages
 * @param errorMessage - The raw error message from API or error object
 * @param defaultMessage - Default message to return if error doesn't match any pattern (optional)
 * @returns A user-friendly error message
 */
export const getErrorMessage = (
    errorMessage: string | null | undefined,
    defaultMessage: string = 'Please Check After Sometime And Try Again'
): string => {
    if (!errorMessage) {
        return defaultMessage;
    }

    const error = errorMessage.toLowerCase();

    // Network/Connection errors
    if (
        error.includes('network') ||
        error.includes('connection') ||
        error.includes('network error') ||
        error.includes('fetch') ||
        error.includes('internet')
    ) {
        return 'Unable to connect to server. Please check your internet connection.';
    }

    // Server errors (500, 502, 503, etc.)
    if (
        error.includes('server') ||
        error.includes('500') ||
        error.includes('502') ||
        error.includes('503') ||
        error.includes('504') ||
        error.includes('server error') ||
        error.includes('internal server')
    ) {
        return 'Server is temporarily unavailable. Please try again later.';
    }

    // Timeout errors
    if (
        error.includes('timeout') ||
        error.includes('timed out') ||
        error.includes('request timeout')
    ) {
        return 'Request timed out. Please try again.';
    }

    // Unauthorized errors
    if (
        error.includes('unauthorized') ||
        error.includes('401') ||
        error.includes('session expired') ||
        error.includes('token')
    ) {
        return 'Session expired. Please login again.';
    }

    // Forbidden errors
    if (error.includes('forbidden') || error.includes('403')) {
        return 'Access denied. Please check your permissions.';
    }

    // Not found errors
    if (error.includes('not found') || error.includes('404')) {
        return 'Resource not found. Please try again.';
    }

    // Bad request errors
    if (error.includes('bad request') || error.includes('400')) {
        return 'Invalid request. Please check your input and try again.';
    }

    // Return the original error message if it doesn't match any pattern
    // or return default message if original is too technical
    return errorMessage.length > 100 ? defaultMessage : errorMessage;
};

/**
 * Gets user-friendly error message from multiple error sources
 * @param errors - Array of error messages or single error message
 * @param defaultMessage - Default message to return if no errors match (optional)
 * @returns A user-friendly error message
 */
export const getErrorMessageFromMultiple = (
    errors: (string | null | undefined)[] | string | null | undefined,
    defaultMessage: string = 'Please Check After Sometime And Try Again'
): string => {
    if (!errors) {
        return defaultMessage;
    }

    // Handle single error string
    if (typeof errors === 'string') {
        return getErrorMessage(errors, defaultMessage);
    }

    // Handle array of errors
    if (Array.isArray(errors)) {
        // Find first non-null error
        const firstError = errors.find((err) => err);
        return getErrorMessage(firstError, defaultMessage);
    }

    return defaultMessage;
};

