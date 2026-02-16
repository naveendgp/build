import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { SESConfig } from '../config/ses.config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailHelper {
  private sesClient: SESClient | null = null;

  /**
   * Initialize SES client
   */
  private initializeSES(): void {
    if (!this.sesClient) {
      if (!SESConfig.ACCESS_KEY_ID || !SESConfig.SECRET_ACCESS_KEY) {
        throw new Error(
          'SES credentials not configured. Please set SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY environment variables.',
        );
      }

      this.sesClient = new SESClient({
        region: SESConfig.REGION,
        credentials: {
          accessKeyId: SESConfig.ACCESS_KEY_ID,
          secretAccessKey: SESConfig.SECRET_ACCESS_KEY,
        },
      });
    }
  }

  /**
   * Send email using AWS SES
   * @param options Email options (to, subject, htmlBody, textBody, etc.)
   * @returns Promise<EmailResult>
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      this.initializeSES();

      if (!SESConfig.FROM_EMAIL) {
        throw new Error(
          'SES_FROM_EMAIL not configured. Please set the environment variable.',
        );
      }

      // Normalize recipients to arrays
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      const ccAddresses = options.cc
        ? Array.isArray(options.cc)
          ? options.cc
          : [options.cc]
        : undefined;
      const bccAddresses = options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc
          : [options.bcc]
        : undefined;

      // Build email content
      const emailParams: SendEmailCommandInput = {
        Source: SESConfig.FROM_NAME
          ? `${SESConfig.FROM_NAME} <${SESConfig.FROM_EMAIL}>`
          : SESConfig.FROM_EMAIL,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            ...(options.htmlBody && {
              Html: {
                Data: options.htmlBody,
                Charset: 'UTF-8',
              },
            }),
            ...(options.textBody && {
              Text: {
                Data: options.textBody,
                Charset: 'UTF-8',
              },
            }),
          },
        },
        ...(options.replyTo && {
          ReplyToAddresses: Array.isArray(options.replyTo)
            ? options.replyTo
            : [options.replyTo],
        }),
      };

      const command = new SendEmailCommand(emailParams);
      const response = await this.sesClient.send(command);

      console.log('Email sent successfully:', response.MessageId);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send OTP email
   * @param to Recipient email address
   * @param otp OTP code
   * @returns Promise<EmailResult>
   */
  async sendOTPEmail(to: string, otp: string): Promise<EmailResult> {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .otp-box { background-color: #fff; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OTP Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your One-Time Password (OTP) for verification is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Laundry Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
OTP Verification

Hello,

Your One-Time Password (OTP) for verification is: ${otp}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you didn't request this OTP, please ignore this email.

© ${new Date().getFullYear()} Laundry Service. All rights reserved.
    `;

    return this.sendEmail({
      to,
      subject: 'Your OTP Verification Code',
      htmlBody,
      textBody,
    });
  }

  /**
   * Send order confirmation email
   * @param to Recipient email address
   * @param orderData Order information
   * @returns Promise<EmailResult>
   */
  async sendOrderConfirmationEmail(
    to: string,
    orderData: {
      orderNumber: number;
      orderId: string;
      totalAmount: number;
      currency?: string;
      items?: Array<{ name: string; quantity: number; price: number }>;
      pickupAddress?: string;
      deliveryAddress?: string;
    },
  ): Promise<EmailResult> {
    const itemsList = orderData.items
      ? orderData.items
          .map(
            (item) =>
              `<tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${orderData.currency || 'INR'} ${item.price.toFixed(2)}</td>
              </tr>`,
          )
          .join('')
      : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-info { background-color: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #4CAF50; color: white; }
            .total { font-size: 18px; font-weight: bold; color: #4CAF50; text-align: right; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for your order! Your order has been confirmed.</p>
              
              <div class="order-info">
                <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              </div>

              ${orderData.items && itemsList ? `
                <h3>Order Details:</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>
                <div class="total">
                  Total Amount: ${orderData.currency || 'INR'} ${orderData.totalAmount.toFixed(2)}
                </div>
              ` : ''}

              ${orderData.pickupAddress ? `<p><strong>Pickup Address:</strong> ${orderData.pickupAddress}</p>` : ''}
              ${orderData.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>` : ''}

              <p>We'll keep you updated on your order status. You can track your order using the order number.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Laundry Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Order Confirmation

Hello,

Thank you for your order! Your order has been confirmed.

Order Number: #${orderData.orderNumber}
Order ID: ${orderData.orderId}

${orderData.items ? `Order Details:\n${orderData.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ${orderData.currency || 'INR'} ${item.price.toFixed(2)}`).join('\n')}\n\nTotal Amount: ${orderData.currency || 'INR'} ${orderData.totalAmount.toFixed(2)}` : ''}

${orderData.pickupAddress ? `Pickup Address: ${orderData.pickupAddress}` : ''}
${orderData.deliveryAddress ? `Delivery Address: ${orderData.deliveryAddress}` : ''}

We'll keep you updated on your order status. You can track your order using the order number.

© ${new Date().getFullYear()} Laundry Service. All rights reserved.
    `;

    return this.sendEmail({
      to,
      subject: `Order Confirmation - Order #${orderData.orderNumber}`,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send order status update email
   * @param to Recipient email address
   * @param orderData Order information
   * @returns Promise<EmailResult>
   */
  async sendOrderStatusUpdateEmail(
    to: string,
    orderData: {
      orderNumber: number;
      status: string;
      message?: string;
    },
  ): Promise<EmailResult> {
    const statusMessages: Record<string, string> = {
      pending: 'Your order is pending confirmation.',
      accepted: 'Your order has been accepted and is being processed.',
      processing: 'Your order is currently being processed.',
      ready_for_pickup: 'Your order is ready for pickup.',
      out_for_delivery: 'Your order is out for delivery.',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.',
    };

    const statusMessage =
      orderData.message || statusMessages[orderData.status] || 'Your order status has been updated.';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .status-box { background-color: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3; }
            .status { font-size: 18px; font-weight: bold; color: #2196F3; text-transform: uppercase; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <div class="status-box">
                <p class="status">Status: ${orderData.status}</p>
                <p>Order Number: #${orderData.orderNumber}</p>
              </div>
              <p>${statusMessage}</p>
              <p>You can track your order using the order number.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Laundry Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Order Status Update

Hello,

Status: ${orderData.status}
Order Number: #${orderData.orderNumber}

${statusMessage}

You can track your order using the order number.

© ${new Date().getFullYear()} Laundry Service. All rights reserved.
    `;

    return this.sendEmail({
      to,
      subject: `Order #${orderData.orderNumber} - Status Update`,
      htmlBody,
      textBody,
    });
  }
}

export default new EmailHelper();

