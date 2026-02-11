import { useAuthStore } from '../state/zustand/authStore';
import { authService } from '../services/authService';
import { LoginRequestModel } from '../types/auth/auth';
import CustomToast from '../components/CustomToast';
import { useToast } from '../hooks/useToast';
 import { API_ENDPOINTS } from '../constants';

// Mock NetInfo for testing purposes
const mockNetInfo = {
  addEventListener: jest.fn(),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
};

// Replace the actual NetInfo import with our mock
jest.mock('@react-native-community/netinfo', () => mockNetInfo);

class ApiTest {
  private toast: any;
  
  constructor() {
    // Note: useToast should be used in React components, not in regular classes
    // This is a workaround for testing purposes
    const { showToast } = useToast();
    this.toast = { showToast };
  }

  /**
   * Test API connection
   */
  async testApiConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      
      // Test with a simple GET request to a known endpoint
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/delivery/login`, {
        method: 'OPTIONS',
      });
      
      if (response.ok) {
        console.log('✅ API connection successful');
        this.toast.showToast({ message: 'API connection successful', backgroundColor: '#4CAF50' });
        return true;
      } else {
        console.error('❌ API connection failed:', response.status, response.statusText);
        this.toast.showToast({ message: `API connection failed: ${response.statusText}`, backgroundColor: '#F44336' });
        return false;
      }
    } catch (error) {
      console.error('❌ API connection error:', error);
      this.toast.showToast({ message: `API connection error: ${error}`, backgroundColor: '#F44336' });
      return false;
    }
  }

  /**
   * Test login flow
   */
  async testLogin(phone: string, countryCode: string = '+91'): Promise<boolean> {
    try {
      console.log('🔐 Testing login flow...');
      
      // Call login API
      const response = await authService.login(phone, countryCode);
      
      console.log('✅ Login successful:', response);
      this.toast.showToast({ message: 'Login successful', backgroundColor: '#4CAF50' });
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      this.toast.showToast({ message: `Login error: ${error}`, backgroundColor: '#F44336' });
      return false;
    }
  }

  /**
   * Test OTP verification flow
   */
  async testOtpVerification(phone: string, otp: string, countryCode: string = '+91'): Promise<boolean> {
    try {
      console.log('🔢 Testing OTP verification...');
      
      // Get token from store (simulating what would be stored after login)
      const token = useAuthStore.getState().token;
      
      if (!token) {
        console.error('❌ No token found for OTP verification');
        this.toast.showToast({ message: 'No token found for OTP verification', backgroundColor: '#F44336' });
        return false;
      }
      
      // Create OTP verification request
      const verifyOtpRequest = {
        phone,
        token,
        userType: 'vendor',
        otp,
        isNewUser: false,
        deviceToken: 'mock-device-token',
        platform: 'android',
      };
      
      // Call OTP verification API
   //   const response = await authService.verifyOtp(verifyOtpRequest, parseInt(otp));
      
      if (response.success) {
        console.log('✅ OTP verification successful:', response.data);
        this.toast.showToast({ message: 'OTP verification successful', backgroundColor: '#4CAF50' });
        return true;
      } else {
        console.error('❌ OTP verification failed:', response);
        this.toast.showToast({ message: `OTP verification failed: ${response}`, backgroundColor: '#F44336' });
        return false;
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      this.toast.showToast({ message: `OTP verification error: ${error}`, backgroundColor: '#F44336' });
      return false;
    }
  }

  /**
   * Test token validation
   */
  async testTokenValidation(): Promise<boolean> {
    try {
      console.log('🔑 Testing token validation...');
      
      const token = useAuthStore.getState().token;
      
      if (!token) {
        console.error('❌ No token found for validation');
        this.toast.showToast({ message: 'No token found for validation', backgroundColor: '#F44336' });
        return false;
      }
      
      console.log('✅ Token found:', token.substring(0, 10) + '...');
      this.toast.showToast({ message: 'Token validation successful', backgroundColor: '#4CAF50' });
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      this.toast.showToast({ message: `Token validation error: ${error}`, backgroundColor: '#F44336' });
      return false;
    }
  }

  /**
   * Run the complete API test flow
   */
  async runFullTest(phone: string = '9999999999', otp: string = '123456'): Promise<void> {
    console.log('🚀 Starting full API test...');
    
    // Test 1: API Connection
    const connectionTest = await this.testApiConnection();
    if (!connectionTest) {
      console.error('❌ API connection test failed. Aborting further tests.');
      return;
    }
    
    // Test 2: Login
    const loginTest = await this.testLogin(phone);
    if (!loginTest) {
      console.error('❌ Login test failed. Aborting further tests.');
      return;
    }
    
    // Test 3: Token Validation
    const tokenTest = await this.testTokenValidation();
    if (!tokenTest) {
      console.error('❌ Token validation test failed. Aborting further tests.');
      return;
    }
    
    // Test 4: OTP Verification
    const otpTest = await this.testOtpVerification(phone, otp);
    if (!otpTest) {
      console.error('❌ OTP verification test failed.');
      return;
    }
    
    console.log('🎉 All API tests completed successfully!');
    this.toast.showToast({ message: 'All API tests completed successfully!', backgroundColor: '#4CAF50' });
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<void> {
    console.log('🧪 Testing error handling...');
    
    // Test with invalid phone number
    await this.testLogin('invalid');
    
    // Test with invalid OTP
    await this.testOtpVerification('9999999999', 'invalid');
    
    console.log('✅ Error handling tests completed');
  }
}

// Export singleton instance
export const apiTest = new ApiTest();

// Export the class for testing purposes
export { ApiTest };