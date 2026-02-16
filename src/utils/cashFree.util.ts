import {
  CASH_FREE_PAYMENT,
  CASH_FREE_PAYMENT_PROD,
  CashfreeConfig,
} from '../config/cashfree.config';
import { ApiResponse } from '../interfaces/api-response.interface';

export class CashFreeUtil {
  private env: typeof CASH_FREE_PAYMENT;

  constructor() {
    this.env =
      process.env.NODE_ENV === 'production' || CashfreeConfig.env === 'production'
        ? CASH_FREE_PAYMENT_PROD
        : CASH_FREE_PAYMENT;
  }

  async makePaymentLink(
    userId: string,
    amount: number,
    orderId: string,
    userPhone: string,
    userName: string,
  ): Promise<ApiResponse<{ link: string; linkId: string; orderId: string }>> {
    try {
      // Validate input parameters
      if (!userId || !amount || !orderId || !userPhone || !userName) {
        return {
          status: false,
          message: 'Missing required parameters for payment link creation',
          data: null,
        };
      }

      if (amount <= 0) {
        return {
          status: false,
          message: 'Payment amount must be greater than zero',
          data: null,
        };
      }

      // Step 1: Create order
      const createOrderBody = {
        order_currency: 'INR',
        order_amount: amount,
        customer_details: {
          customer_id: `OTTER${userId}`,
          customer_phone: userPhone,
        },
      };

      const orderOptions = {
        method: 'POST',
        headers: {
          'x-client-id': this.env.client_id,
          'x-client-secret': this.env.client_secret,
          'Content-Type': 'application/json',
          'x-api-version': this.env.apiversion,
        },
        body: JSON.stringify(createOrderBody),
      };

      const orderResponse = await this.createOrder(
        orderOptions,
        this.env.order_link,
      );

      if (!orderResponse.status) {
        const errorMessage =
          orderResponse.data?.message ||
          orderResponse.message ||
          'Failed to create order';
        return {
          status: false,
          message: `Order creation failed: ${errorMessage}`,
          data: null,
        };
      }

      // Step 2: Create payment link
      const paymentLinkRequest = {
        link_id: `OTTER_${userId}_${new Date().getTime()}`,
        link_amount: amount,
        link_currency: 'INR',
        link_purpose: `Making Payment for Order ${orderId}`,
        customer_details: {
          customer_name: userName,
          customer_phone: userPhone,
        },
        link_meta: {
          notify_url: this.env?.notify_url,
          return_url: this.env?.return_url,
        },
        link_expiry_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        link_notify: {
          send_sms: true,
          send_email: true,
        },
      };

      const paymentLinkOptions = {
        method: 'POST',
        headers: {
          'x-client-id': this.env.client_id,
          'x-client-secret': this.env.client_secret,
          'Content-Type': 'application/json',
          'x-api-version': this.env.apiversion,
        },
        body: JSON.stringify(paymentLinkRequest),
      };

      const paymentLinkResponse = await this.createOrder(
        paymentLinkOptions,
        this.env.payment_link,
      );

      if (!paymentLinkResponse.status) {
        const errorMessage =
          paymentLinkResponse.data?.message ||
          paymentLinkResponse.message ||
          'Failed to create payment link';
        return {
          status: false,
          message: `Payment link creation failed: ${errorMessage}`,
          data: null,
        };
      }

      if (!paymentLinkResponse.data?.link_url) {
        return {
          status: false,
          message: 'Payment link URL not found in response',
          data: null,
        };
      }

      return {
        status: true,
        message: 'Payment link created successfully',
        data: {
          link: paymentLinkResponse.data.link_url,
          linkId: paymentLinkResponse.data.link_id,
          orderId: orderResponse.data.order_id,
        },
      };
    } catch (error) {
      console.error('Error in makePaymentLink:', error);
      return {
        status: false,
        message:
          error instanceof Error
            ? `Payment link creation failed: ${error.message}`
            : 'Payment link creation failed due to an unexpected error',
        data: null,
      };
    }
  }

  /**
   * Internal helper to call Cashfree APIs with consistent error handling.
   */
  private async createOrder(
    options: RequestInit,
    url: string,
  ): Promise<ApiResponse<any>> {
    try {
      const response: Response = await fetch(url, options);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return {
          status: false,
          message: `Cashfree API error: ${errorData.message || response.statusText}`,
          data: errorData,
        };
      }

      const data = await response.json();

      // Check if response indicates an error (Cashfree may return 200 with error in body)
      if (data.message && data.type === 'error') {
        return {
          status: false,
          message: `Cashfree API error: ${data.message}`,
          data: data,
        };
      }

      return {
        status: true,
        message: 'Request successful',
        data: data,
      };
    } catch (error) {
      console.error('Error in createOrder:', error);
      return {
        status: false,
        message:
          error instanceof Error
            ? `Network error: ${error.message}`
            : 'Network error occurred while calling Cashfree API',
        data: null,
      };
    }
  }

  /**
   * Fetch the latest status of a Cashfree order using the Cashfree order_id.
   * This is used by cron as a backup in case webhooks fail or are delayed.
   * 
   * @param cashfreeOrderId - The Cashfree order ID (must be non-empty string)
   * @param timeoutMs - Request timeout in milliseconds (default: 10000)
   * @returns ApiResponse with order status data
   */
  async getOrderStatus(
    cashfreeOrderId: string,
    timeoutMs: number = 10000,
  ): Promise<ApiResponse<any>> {
    // Input validation
    if (!cashfreeOrderId || typeof cashfreeOrderId !== 'string') {
      return {
        status: false,
        message: 'cashfreeOrderId is required and must be a non-empty string',
        data: null,
      };
    }

    // Sanitize order ID to prevent injection
    const sanitizedOrderId = cashfreeOrderId.trim();
    if (!sanitizedOrderId || sanitizedOrderId.length > 100) {
      return {
        status: false,
        message: 'Invalid cashfreeOrderId format',
        data: null,
      };
    }

    try {
      // Cashfree Payment Gateway API: GET /pg/orders/{order_id}
      // The order_link already includes the base path '/pg/orders'
      // Example: https://sandbox.cashfree.com/pg/orders/{order_id}
      const url = `${this.env.order_link}/${encodeURIComponent(sanitizedOrderId)}`;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const options: RequestInit = {
        method: 'GET',
        headers: {
          'x-client-id': this.env.client_id,
          'x-client-secret': this.env.client_secret,
          'Content-Type': 'application/json',
          'x-api-version': this.env.apiversion,
        },
        signal: controller.signal,
      };

      let response: Response;
      try {
        response = await fetch(url, options);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            status: false,
            message: 'Request timeout: Cashfree API did not respond in time',
            data: null,
          };
        }
        throw fetchError;
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        // Don't log sensitive error details in production
        const errorMessage =
          response.status === 404
            ? 'Order not found in Cashfree'
            : response.status === 401 || response.status === 403
              ? 'Authentication failed with Cashfree'
              : `Cashfree API error: ${errorData.message || response.statusText}`;

        return {
          status: false,
          message: errorMessage,
          data: errorData,
        };
      }

      const data = await response.json();

      if (data.message && data.type === 'error') {
        return {
          status: false,
          message: `Cashfree API error: ${data.message}`,
          data,
        };
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        return {
          status: false,
          message: 'Invalid response format from Cashfree API',
          data: null,
        };
      }

      return {
        status: true,
        message: 'Order status fetched successfully',
        data,
      };
    } catch (error) {
      // Log error without exposing sensitive details
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Only log full error in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error in getOrderStatus:', error);
      } else {
        console.error('Error in getOrderStatus:', errorMessage);
      }

      return {
        status: false,
        message: 'Network error occurred while calling Cashfree API',
        data: null,
      };
    }
  }

  /**
   * Fetch the latest status of a Cashfree payment link using the link_id.
   * This provides an alternative way to check payment status.
   * 
   * @param linkId - The Cashfree payment link ID
   * @param timeoutMs - Request timeout in milliseconds (default: 10000)
   * @returns ApiResponse with link status data
   */
  async getPaymentLinkStatus(
    linkId: string,
    timeoutMs: number = 10000,
  ): Promise<ApiResponse<any>> {
    if (!linkId || typeof linkId !== 'string') {
      return {
        status: false,
        message: 'linkId is required and must be a non-empty string',
        data: null,
      };
    }

    const sanitizedLinkId = linkId.trim();
    if (!sanitizedLinkId || sanitizedLinkId.length > 100) {
      return {
        status: false,
        message: 'Invalid linkId format',
        data: null,
      };
    }

    try {
      // Cashfree API: GET /pg/links/{link_id}
      // The payment_link already includes the base path '/pg/links'
      const url = `${this.env.payment_link}/${encodeURIComponent(sanitizedLinkId)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const options: RequestInit = {
        method: 'GET',
        headers: {
          'x-client-id': this.env.client_id,
          'x-client-secret': this.env.client_secret,
          'Content-Type': 'application/json',
          'x-api-version': this.env.apiversion,
        },
        signal: controller.signal,
      };

      let response: Response;
      try {
        response = await fetch(url, options);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            status: false,
            message: 'Request timeout: Cashfree API did not respond in time',
            data: null,
          };
        }
        throw fetchError;
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return {
          status: false,
          message: `Cashfree API error: ${errorData.message || response.statusText}`,
          data: errorData,
        };
      }

      const data = await response.json();

      // Cashfree may return error in response body even with 200 status
      if (data.message && data.type === 'error') {
        return {
          status: false,
          message: `Cashfree API error: ${data.message}`,
          data,
        };
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        return {
          status: false,
          message: 'Invalid response format from Cashfree API',
          data: null,
        };
      }

      return {
        status: true,
        message: 'Payment link status fetched successfully',
        data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (process.env.NODE_ENV !== 'production') {
        console.error('Error in getPaymentLinkStatus:', error);
      } else {
        console.error('Error in getPaymentLinkStatus:', errorMessage);
      }

      return {
        status: false,
        message: 'Network error occurred while calling Cashfree API',
        data: null,
      };
    }
  }
}

// Export singleton instance for backward compatibility
export const cashFreeUtil = new CashFreeUtil();

// Export function wrapper for backward compatibility
export async function makePaymentLink(
  userId: string,
  amount: number,
  orderId: string,
  userPhone: string,
  userName: string,
): Promise<ApiResponse<{ link: string; linkId: string; orderId: string }>> {
  return cashFreeUtil.makePaymentLink(
    userId,
    amount,
    orderId,
    userPhone,
    userName,
  );
}
