export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation - adjust regex based on your requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  return phoneNumber.replace(/[^\d+]/g, '');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};