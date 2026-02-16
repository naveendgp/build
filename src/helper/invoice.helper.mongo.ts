import PDFDocument = require('pdfkit');
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { uploadToS3 } from '../utils/s3.util';

export interface InvoiceData {
  order: OrderDocument;
  user: UserDocument;
  vendor: VendorDocument;
}

export interface InvoiceResult {
  success: boolean;
  invoiceUrl?: string;
  error?: string;
}

/**
 * Invoice Helper Class
 * Generates PDF invoices for delivered orders and stores them in S3
 */
/**
 * Invoice Helper Class
 * Generates PDF invoices for delivered orders and stores them in S3
 */
@Injectable()
export class InvoiceHelper {
  constructor(
    @InjectModel(Order.name) private readonly orderModel?: Model<OrderDocument>,
    @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
    @InjectModel(Vendor.name) private readonly vendorModel?: Model<VendorDocument>,
  ) { }
  /**
   * Generate invoice PDF for a delivered order
   * @param orderId - Order ID to generate invoice for
   * @param orderModel - Mongoose Order model
   * @param userModel - Mongoose User model
   * @param vendorModel - Mongoose Vendor model
   * @returns InvoiceResult with S3 URL or error
   */
  async generateInvoice(
    orderId: string,
    orderModel: Model<OrderDocument>,
    userModel: Model<UserDocument>,
    vendorModel: Model<VendorDocument>,
  ): Promise<InvoiceResult> {
    try {
      // Fetch order with populated references
      const order = await orderModel
        .findById(orderId)
        .populate('user_id', 'name email phone')
        .populate('vendor_id', 'shop_name phone email address')
        .lean();

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Verify order is delivered
      // if (order.status !== 'delivered') {
      //   return {
      //     success: false,
      //     error: `Invoice can only be generated for delivered orders. Current status: ${order.status}`,
      //   };
      // }

      // Fetch user and vendor details
      const user = await userModel.findById(order.user_id).lean();
      const vendor = await vendorModel.findById(order.vendor_id).lean();

      if (!user || !vendor) {
        return {
          success: false,
          error: 'User or vendor not found',
        };
      }

      // Generate PDF
      const pdfBuffer = await this.createInvoicePDF({
        order: order as any,
        user: user as any,
        vendor: vendor as any,
      });

      // Upload to S3
      const invoiceUrl = await this.uploadInvoiceToS3(
        pdfBuffer,
        orderId,
        order.order_number,
      );

      return {
        success: true,
        invoiceUrl,
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create PDF invoice document
   */
  private async createInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        this.addHeader(doc, data.vendor);

        // Invoice Info
        this.addInvoiceInfo(doc, data.order);

        // Customer & Vendor Details
        const partyDetailsBottom = this.addPartyDetails(
          doc,
          data.user,
          data.vendor,
          data.order,
        );

        // Items Table
        const itemsBottom = this.addItemsTable(
          doc,
          data.order,
          Math.max(360, partyDetailsBottom + 20),
        );

        // Payment Summary
        this.addPaymentSummary(doc, data.order, itemsBottom + 20);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getStatusTimestamp(
    timestamps: any,
    key: string,
  ): string | Date | undefined {
    if (!timestamps) return undefined;
    if (typeof timestamps.get === 'function') {
      return timestamps.get(key);
    }
    return timestamps[key];
  }

  /**
   * Add header section with company logo and title
   */
  private addHeader(doc: any, vendor: any): void {
    const headerHeight = 120;
    doc.save();
    doc.rect(45, 30, 510, headerHeight).fill('#f4f5fb');
    doc.restore();

    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#1a1a1a')
      .text('Otter Laundry', 55, 55, {
        width: 300,
        align: 'left',
      });

    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#f47c20')
      .text('INVOICE', 320, 50, {
        width: 200,
        align: 'right',
      });

    doc
      .moveTo(45, 150)
      .lineTo(555, 150)
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .stroke();
  }

  /**
   * Add invoice information (Invoice Number, Date, etc.)
   */
  private addInvoiceInfo(doc: any, order: any): void {
    const infoBoxX = 320;
    const infoBoxY = 80;
    const infoBoxWidth = 240;
    const infoBoxHeight = 110;

    const deliveredAt = this.getStatusTimestamp(
      order.status_timestamps,
      'delivered_at',
    );
    const invoiceDate = deliveredAt ? new Date(deliveredAt) : new Date();
    const orderDate = order.created_at
      ? new Date(order.created_at)
      : new Date();
    const dueDate = new Date(orderDate);
    dueDate.setDate(dueDate.getDate() + 7);

    const infoLines = [
      {
        label: 'Order ID',
        value: `${order._id?.toString() || ''}`,
      },
      {
        label: 'Invoice Date',
        value: this.formatDate(invoiceDate),
      },
      {
        label: 'Due Date',
        value: this.formatDate(dueDate),
      },
    ];

    doc.fontSize(10).font('Helvetica').fillColor('#4a4a4a');
    let lineY = 90;
    infoLines.forEach((line) => {
      doc.text(line.label, infoBoxX, lineY);
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text(line.value, infoBoxX + 90, lineY, {
          width: infoBoxWidth - 90,
          align: 'left',
        });
      lineY += 18;
      doc.font('Helvetica').fillColor('#666666');
    });
  }

  /**
   * Add customer and vendor details
   */
  private addPartyDetails(
    doc: any,
    user: any,
    vendor: any,
    order: any,
  ): number {
    const startY = 200;
    const leftX = 50;
    const rightX = 300;
    const boxWidth = 240;
    const boxPadding = 8;

    doc.save();
    doc
      .rect(leftX - 5, startY - boxPadding, boxWidth + boxPadding, 150)
      .strokeColor('#dddddd')
      .lineWidth(1)
      .stroke();
    doc
      .rect(rightX - 5, startY - boxPadding, boxWidth + boxPadding, 150)
      .strokeColor('#dddddd')
      .lineWidth(1)
      .stroke();
    doc.restore();

    let leftY = startY;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Bill To', leftX, leftY);
    leftY += 18;
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    const customerName = user.name || 'Customer';
    doc.text(customerName, leftX, leftY);
    leftY += 14;
    if (user.email) {
      doc.text(`Email: ${user.email}`, leftX, leftY);
      leftY += 14;
    }
    if (user.phone) {
      doc.text(`Phone: ${user.phone}`, leftX, leftY);
      leftY += 14;
    }
    if (order.user_address) {
      if (user.phone) {
        leftY += 6;
      }
      const addr = order.user_address;
      const primary = this.buildAddressLines(addr.address_line1);
      primary.forEach((line) => {
        doc.text(line, leftX, leftY);
        leftY += 12;
      });
      const secondary = this.buildAddressLines(addr.address_line2);
      secondary.forEach((line) => {
        doc.text(line, leftX, leftY);
        leftY += 12;
      });
      doc.text(
        `${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.trim(),
        leftX,
        leftY,
      );
      leftY += 12;
    }

    let rightY = startY;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Service Provider', rightX, rightY);
    rightY += 18;
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(vendor.shop_name || 'Vendor', rightX, rightY);
    rightY += 14;
    if (vendor.email) {
      doc.text(`Email: ${vendor.email}`, rightX, rightY);
      rightY += 14;
    }
    if (vendor.phone) {
      doc.text(`Phone: ${vendor.phone}`, rightX, rightY);
      rightY += 14;
    }
    if (vendor.address) {
      if (vendor.phone) {
        rightY += 6;
      }
      const addr = vendor.address;
      const primary = this.buildAddressLines(addr.address_line1);
      primary.forEach((line) => {
        doc.text(line, rightX, rightY);
        rightY += 12;
      });
      const secondary = this.buildAddressLines(addr.address_line2);
      secondary.forEach((line) => {
        doc.text(line, rightX, rightY);
        rightY += 12;
      });
      doc.text(
        `${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.trim(),
        rightX,
        rightY,
      );
      rightY += 12;
    }

    const bottomY = Math.max(leftY, rightY) + 10;
    // doc
    //   .moveTo(45, bottomY)
    //   .lineTo(555, bottomY)
    //   .strokeColor('#e0e0e0')
    //   .lineWidth(1)
    //   .stroke();

    return bottomY;
  }

  /**
   * Add items table
   */
  private addItemsTable(doc: any, order: any, startY: number = 360): number {
    let yPos = startY;

    // Table Header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .rect(50, yPos, 500, 25)
      .fill('#333333');

    doc
      .strokeColor('#ffffff')
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(550, yPos)
      .stroke();

    doc.fillColor('#ffffff');
    doc.text('sno', 60, yPos + 8);
    doc.text('items', 100, yPos + 8);
    doc.text('count', 320, yPos + 8);
    doc.text('unit price', 390, yPos + 8, { width: 70, align: 'right' });
    doc.text('total', 480, yPos + 8, { width: 60, align: 'right' });

    yPos += 30;

    // Table Rows
    doc.font('Helvetica').fillColor('#000000');

    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any, index: number) => {
        const rowHeight = 28;
        const isEven = index % 2 === 0;

        if (isEven) {
          doc
            .rect(50, yPos, 500, rowHeight)
            .fillColor('#f9f9f9')
            .fill()
            .fillColor('#000000');
        }

        doc.text(`${index + 1}`, 60, yPos + 8);
        const itemLabel = `${item.item_name || 'N/A'}${item.service_name ? ` (${item.service_name})` : ''
          }`;
        doc.text(itemLabel, 100, yPos + 8, { width: 200 });
        doc.text(`${item.quantity || 0}`, 320, yPos + 8);
        doc.text(this.formatCurrency(item.price_per_item), 390, yPos + 8, {
          width: 70,
          align: 'right',
        });
        doc.text(this.formatCurrency(item.total_price), 480, yPos + 8, {
          width: 60,
          align: 'right',
        });

        yPos += rowHeight;
      });
    } else {
      doc.text('No items found', 60, yPos + 8);
      yPos += 25;
    }

    // Table bottom border
    doc
      .moveTo(50, yPos)
      .lineTo(550, yPos)
      .strokeColor('#cccccc')
      .lineWidth(1)
      .stroke();

    return yPos;
  }

  /**
   * Add payment summary section
   */
  private addPaymentSummary(doc: any, order: any, startY: number): void {
    const paymentDetails = order.payment_details || {};
    const subtotal =
      order.items?.reduce(
        (sum: number, item: any) => sum + (item.total_price || 0),
        0,
      ) || 0;

    const pageWidth = doc.page.width || 595;
    const boxWidth = 270;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = startY + 15;
    const boxHeight = 150;
    const amountX = boxX + 10;
    const amountWidth = boxWidth - 20;

    doc
      .rect(boxX - 10, boxY - 10, boxWidth + 20, boxHeight)
      .strokeColor('#d3d3d3')
      .lineWidth(1)
      .stroke();

    let yPos = boxY;
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text('Subtotal', amountX, yPos);
    doc
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text(this.formatCurrency(subtotal), amountX, yPos, {
        align: 'right',
        width: amountWidth,
      });
    yPos += 16;

    if (
      paymentDetails.isOfferApplied &&
      paymentDetails.offerDiscountAmount > 0
    ) {
      doc.text('Offer Discount', amountX, yPos);
      doc
        .font('Helvetica-Bold')
        .fillColor('#00aa00')
        .text(
          this.formatCurrency(-paymentDetails.offerDiscountAmount),
          amountX,
          yPos,
          {
            align: 'right',
            width: amountWidth,
          },
        );
      yPos += 16;
      doc.font('Helvetica').fillColor('#666666');
    }

    if (paymentDetails.delivery_fee > 0) {
      doc.text('Delivery Fee', amountX, yPos);
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text(
          this.formatCurrency(paymentDetails.delivery_fee),
          amountX,
          yPos,
          {
            align: 'right',
            width: amountWidth,
          },
        );
      yPos += 16;
    }

    if (paymentDetails.gst > 0) {
      doc.text('GST', amountX, yPos);
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text(
          this.formatCurrency(paymentDetails.gst),
          amountX,
          yPos,
          {
            align: 'right',
            width: amountWidth,
          },
        );
      yPos += 16;
    }

    if (paymentDetails.amount_to_platform > 0) {
      doc.text('Platform Fee', amountX, yPos);
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text(
          this.formatCurrency(paymentDetails.amount_to_platform),
          amountX,
          yPos,
          {
            align: 'right',
            width: amountWidth,
          },
        );
      yPos += 16;
    }

    doc
      .moveTo(boxX, yPos + 5)
      .lineTo(boxX + boxWidth, yPos + 5)
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .stroke();
    yPos += 15;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Grand Total', amountX, yPos);
    doc
      .fontSize(16)
      .text(
        this.formatCurrency(order.total_amount),
        amountX,
        yPos,
        {
          align: 'right',
          width: amountWidth,
        },
      );

    if (order.is_express) {
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(50, yPos + 30, 110, 20)
        .fill('#ff6600')
        .text('EXPRESS DELIVERY', 55, yPos + 33);
    }
  }

  /**
   * Add footer with terms and conditions
   */
  private addFooter(doc: any): void {
    const pageHeight = 842; // A4 height in points
    const footerY = pageHeight - 100;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your business!', 50, footerY, {
        align: 'center',
        width: 500,
      });

    doc.text(
      'This is a computer-generated invoice and does not require a signature.',
      50,
      footerY + 15,
      { align: 'center', width: 500 },
    );

    doc.text(
      'For any queries, please contact customer support.',
      50,
      footerY + 30,
      { align: 'center', width: 500 },
    );
  }

  private buildAddressLines(
    value?: string,
    maxLineLength: number = 60,
  ): string[] {
    if (!value) return [];
    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const lines: string[] = [];
    for (const part of parts) {
      if (!lines.length) {
        lines.push(part);
        continue;
      }

      const combined = `${lines[lines.length - 1]}, ${part}`;
      if (combined.length <= maxLineLength) {
        lines[lines.length - 1] = combined;
      } else {
        lines.push(part);
      }
    }

    if (!lines.length && value.trim()) {
      lines.push(value.trim());
    }

    return lines;
  }

  private formatCurrency(value?: number): string {
    const amount = typeof value === 'number' ? value : 0;
    const sign = amount < 0 ? '-' : '';
    const absValue = Math.abs(amount);
    return `${sign}INR${absValue.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Upload invoice PDF to S3
   */
  private async uploadInvoiceToS3(
    pdfBuffer: Buffer,
    orderId: string,
    orderNumber: number,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const filename = `invoice-${orderNumber}-${orderId}.pdf`;
    const folder = `invoices/${year}/${month}`;

    const url = await uploadToS3({
      buffer: pdfBuffer,
      mimeType: 'application/pdf',
      folder,
      filename,
    });

    return url;
  }


  public async generateInvoiceForOrder(
    orderId: string,
  ): Promise<void> {
    try {
      if (!this.orderModel || !this.userModel || !this.vendorModel) {
        throw new Error('Models not injected into InvoiceHelper');
      }

      const result = await this.generateInvoice(
        orderId,
        this.orderModel,
        this.userModel,
        this.vendorModel,
      );

      if (result.success && result.invoiceUrl) {
        // Update order with invoice URL
        await this.orderModel.findByIdAndUpdate(orderId, {
          invoice_url: result.invoiceUrl,
        });
        console.log(
          `Invoice generated successfully for order ${orderId}: ${result.invoiceUrl}`,
        );
      } else {
        console.error(
          `Failed to generate invoice for order ${orderId}:`,
          result.error,
        );
      }
    } catch (error) {
      console.error(
        `Error in generateInvoiceForOrder for order ${orderId}:`,
        error,
      );
    }
  }



}

// Export singleton instance
export const invoiceHelper = new InvoiceHelper();
