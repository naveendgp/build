// ============================================================================
// REFACTORED: invoice.helper.ts — Prisma version
// Replaces @InjectModel(Order/User/Vendor) with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>
//   const order = await orderModel.findById(orderId)
//     .populate('user_id', 'name email phone')
//     .populate('vendor_id', 'shop_name phone email address').lean();
//   const user = await userModel.findById(order.user_id).lean();
//   const vendor = await vendorModel.findById(order.vendor_id).lean();
//
// AFTER (Prisma):
//   private readonly prisma: PrismaService
//   const order = await this.prisma.order.findUnique({
//     where: { id: orderId },
//     include: { user: true, vendor: true, items: true },
//   });
// ============================================================================

import PDFDocument = require('pdfkit');
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { uploadToS3 } from '../utils/s3.util';

export interface InvoiceData {
  order: any;
  user: any;
  vendor: any;
}

export interface InvoiceResult {
  success: boolean;
  invoiceUrl?: string;
  error?: string;
}

@Injectable()
export class InvoiceHelper {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate invoice PDF for a delivered order
   *
   * BEFORE (Mongoose — accepted models as params):
   *   async generateInvoice(orderId, orderModel, userModel, vendorModel)
   *   const order = await orderModel.findById(orderId)
   *     .populate('user_id', 'name email phone')
   *     .populate('vendor_id', 'shop_name phone email address').lean();
   *
   * AFTER (Prisma — uses injected PrismaService):
   *   async generateInvoice(orderId: string)
   *   const order = await this.prisma.order.findUnique({ where: { id: orderId },
   *     include: { user: true, vendor: true, items: true } });
   */
  async generateInvoice(orderId: string): Promise<InvoiceResult> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          vendor: true,
          items: true,
        },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const user = order.user;               // BEFORE: userModel.findById(order.user_id)
      const vendor = order.vendor;             // BEFORE: vendorModel.findById(order.vendor_id)

      if (!user || !vendor) {
        return { success: false, error: 'User or vendor not found' };
      }

      // Map Prisma field names to what the PDF generator expects
      const orderData = {
        ...order,
        order_number: order.orderNumber,
        status_timestamps: order.statusTimestamps,
        created_at: order.createdAt,
        items: order.items.map(i => ({
          service_name: i.serviceName,
          item_name: i.itemName,
          quantity: i.quantity,
          price_per_item: i.pricePerItem,
          total_price: i.totalPrice,
          item_category: i.itemCategory,
          weight: i.weight,
        })),
        // Payment details (flattened in Prisma)
        payment_details: {
          item_total: order.pdItemTotal,
          grand_total: order.pdGrandTotal,
          delivery_fee: order.pdDeliveryFee,
          gst: order.pdGst,
          isOfferApplied: order.pdIsOfferApplied,
          offerDiscountAmount: order.pdOfferDiscountAmount,
          totalPayableAmount: order.pdTotalPayableAmount,
          vendor_commission: order.pdVendorCommission,
        },
        total_amount: order.totalAmount,
        currency: order.currency,
      };

      const userData = {
        ...user,
        // Map Prisma fields to what PDF expects
        name: user.name,
        email: user.email,
        phone: user.phone,
      };

      const vendorData = {
        ...vendor,
        shop_name: vendor.shopName,
        phone: vendor.phone,
        email: vendor.email,
        address: {
          address_line1: vendor.addressLine1,
          address_line2: vendor.addressLine2,
          city: vendor.city,
          state: vendor.state,
          pincode: vendor.pincode,
        },
      };

      const pdfBuffer = await this.createInvoicePDF({
        order: orderData,
        user: userData,
        vendor: vendorData,
      });

      const invoiceUrl = await this.uploadInvoiceToS3(
        pdfBuffer,
        orderId,
        order.orderNumber,
      );

      return { success: true, invoiceUrl };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ── PDF generation methods (unchanged from original) ──────────────────

  private async createInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, data.vendor);
        this.addInvoiceInfo(doc, data.order);
        const partyBottom = this.addPartyDetails(doc, data.user, data.vendor, data.order);
        const itemsBottom = this.addItemsTable(doc, data.order, Math.max(360, partyBottom + 20));
        this.addPaymentSummary(doc, data.order, itemsBottom + 20);
        this.addFooter(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Note: addHeader, addInvoiceInfo, addPartyDetails, addItemsTable,
  // addPaymentSummary, addFooter, uploadInvoiceToS3, formatDate, formatCurrency
  // are all pure PDF-rendering methods. They remain identical to the original.
  // Not repeating 500+ lines of PDF layout code here — copy from original.

  private addHeader(doc: any, vendor: any): void { /* same as original */ }
  private addInvoiceInfo(doc: any, order: any): void { /* same as original */ }
  private addPartyDetails(doc: any, user: any, vendor: any, order: any): number { return 0; /* same as original */ }
  private addItemsTable(doc: any, order: any, startY: number): number { return 0; /* same as original */ }
  private addPaymentSummary(doc: any, order: any, startY: number): void { /* same as original */ }
  private addFooter(doc: any): void { /* same as original */ }
  private async uploadInvoiceToS3(buffer: Buffer, id: string, orderNum: number): Promise<string> { return ''; /* same as original */ }
  private formatDate(d: Date): string { return d.toLocaleDateString(); }
  private formatCurrency(n: number, currency = 'INR'): string { return `₹${n.toFixed(2)}`; }
}
