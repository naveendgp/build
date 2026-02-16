// ============================================================================
// REFACTORED: vendor.service.ts — MongoDB → Prisma Query Examples
// ============================================================================

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorServiceRefactored {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. VENDOR LOGIN
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const vendor = await this.vendorModel.findOne({ phone });
  */

  async findByPhone(phone: string) {
    return this.prisma.vendor.findUnique({
      where: { phone },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. UPDATE VENDOR DOCUMENTS (Dot-notation $set → flat fields)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.vendorModel.updateOne(
    { _id: vendorId },
    { $set: {
      'documents.aadhaar_card': url,
      'documents.gst_certificate': gstUrl,
      'bank_details.account_number': accNum,
      'bank_details.ifsc_code': ifsc,
    }}
  );
  */

  async updateVendorDocuments(vendorId: string, dto: {
    aadhaarCard?: string;
    gstCertificate?: string;
    accountNumber?: string;
    ifscCode?: string;
  }) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.aadhaarCard && { docAadhaarCard: dto.aadhaarCard }),
        ...(dto.gstCertificate && { docGstCertificate: dto.gstCertificate }),
        ...(dto.accountNumber && { bankAccountNumber: dto.accountNumber }),
        ...(dto.ifscCode && { bankIfscCode: dto.ifscCode }),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. VIEW ORDERS (Aggregation with $lookup)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose — 30-line aggregation pipeline) ──
  const orders = await this.orderModel.aggregate([
    { $match: { vendor_id: new ObjectId(vendorId), ...statusFilter } },
    { $sort: { created_at: -1 } },
    { $skip: skip }, { $limit: limit },
    { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
  ]);
  */

  async viewOrders(vendorId: string, statusFilter: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Build where clause from status filter
    const where: Prisma.OrderWhereInput = {
      vendorId,
      ...(statusFilter.status && { status: statusFilter.status }),
      ...(statusFilter.trip_type !== undefined && { tripType: statusFilter.trip_type }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true },
          },
          items: true,
          driver1: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. UPDATE SERVICES OFFERED (markModified + nested array mutation)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const vendor = await this.vendorModel.findById(vendorId);
  const serviceIdx = vendor.services_offered.findIndex(s => s.service_id.toString() === serviceId);
  vendor.services_offered[serviceIdx].items[itemIdx].item_price = newPrice;
  vendor.markModified('services_offered');
  await vendor.save();
  */

  async updateVendorServiceItemPrice(
    vendorId: string,
    serviceId: string,
    itemId: string,
    newPrice: number,
  ) {
    // Find the vendor service
    const vendorService = await this.prisma.vendorService.findUnique({
      where: {
        vendorId_serviceId: { vendorId, serviceId },
      },
    });

    if (!vendorService) {
      throw new HttpException('Service not found for vendor', HttpStatus.NOT_FOUND);
    }

    // Update the specific item
    return this.prisma.vendorServiceItem.updateMany({
      where: {
        vendorServiceId: vendorService.id,
        itemId,
      },
      data: { itemPrice: newPrice },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. VENDOR SETTLEMENT (Atomic $inc/$push)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.vendorModel.findByIdAndUpdate(vendorId, {
    $inc: { 'wallet.balance': amount, amount_due: -amount },
    $push: { orders_to_be_settled: orderId },
    $set: { 'wallet.last_updated': new Date() },
  });
  */

  async settleVendor(vendorId: string, orderId: string, amount: number) {
    return this.prisma.executeInTransaction(async (tx) => {
      // Atomic increment/decrement
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          walletBalance: { increment: amount },
          amountDue: { decrement: amount },
          walletLastUpdate: new Date(),
        },
      });

      // Add settlement order record
      await tx.vendorSettlementOrder.create({
        data: { vendorId, orderId },
      });

      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. UPDATE OPERATING HOURS (Nested object → relational table)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.vendorModel.updateOne(
    { _id: vendorId },
    { $set: { 'operating_hours.monday': { open: '08:00', close: '21:00' } } }
  );
  */

  async updateOperatingHours(vendorId: string, day: string, open: string, close: string) {
    return this.prisma.vendorOperatingHours.upsert({
      where: {
        vendorId_dayOfWeek: { vendorId, dayOfWeek: day },
      },
      update: { open, close },
      create: { vendorId, dayOfWeek: day, open, close },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. GET VENDOR REVIEWS (with populate)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const reviews = await this.reviewModel
    .find({ vendor_id: vendorId })
    .populate('user_id', 'name')
    .populate('order_id', 'order_number')
    .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  */

  async getVendorReviews(vendorId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    return this.prisma.review.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ORDER COUNT BY STATUS (Promise.all countDocuments)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const [pending, processing, completed, cancelled] = await Promise.all([
    this.orderModel.countDocuments({ vendor_id: vendorId, status: 'pending' }),
    this.orderModel.countDocuments({ vendor_id: vendorId, status: 'processing' }),
    this.orderModel.countDocuments({ vendor_id: vendorId, status: 'delivered' }),
    this.orderModel.countDocuments({ vendor_id: vendorId, status: 'cancelled' }),
  ]);
  */

  async getOrderCounts(vendorId: string) {
    // More efficient: single groupBy query instead of 4 count queries
    const counts = await this.prisma.order.groupBy({
      by: ['status'],
      where: { vendorId },
      _count: { status: true },
    });

    const statusMap = Object.fromEntries(
      counts.map(c => [c.status, c._count.status])
    );

    return {
      pending: statusMap['pending'] || 0,
      processing: statusMap['processing'] || 0,
      completed: statusMap['delivered'] || 0,
      cancelled: statusMap['cancelled'] || 0,
      total: counts.reduce((sum, c) => sum + c._count.status, 0),
    };
  }
}
