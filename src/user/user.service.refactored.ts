// ============================================================================
// REFACTORED: user.service.ts — MongoDB → Prisma Query Examples
// ============================================================================
//
// This file shows BEFORE (Mongoose) and AFTER (Prisma) for every major
// query pattern in UserService. Use this as a reference when refactoring.
//
// Key changes:
//   - @InjectModel(User.name) private userModel: Model<UserDocument>
//     → constructor(private prisma: PrismaService) {}
//   - All .findOne() / .find() / .aggregate() → prisma.user.findUnique/findMany
//   - MongoDB $lookup → Prisma include/select (eager loading)
//   - MongoDB $match/$group → Prisma where/groupBy
//   - doc.save() → prisma.user.update()
// ============================================================================

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserServiceRefactored {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LOGIN / FIND BY PHONE
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const user = await this.userModel.findOne({ phone });
  */

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { addresses: true },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CREATE USER
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const user = await this.userModel.create({
    phone, name, email,
    wallet: { balance: 0, currency: 'INR' },
    preferences: { notifications_enabled: true },
  });
  */

  async createUser(phone: string, name: string, email: string) {
    return this.prisma.user.create({
      data: {
        phone,
        name,
        email,
        walletBalance: 0,
        walletCurrency: 'INR',
        prefNotificationsEnabled: true,
      },
      include: { addresses: true },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. UPDATE PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const user = await this.userModel.findById(userId);
  user.name = dto.name;
  user.email = dto.email;
  await user.save();
  */

  async updateProfile(userId: string, dto: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ADD ADDRESS (embedded array → separate table)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const user = await this.userModel.findById(userId);
  user.addresses.push(addressDto);
  await user.save();
  */

  async addAddress(userId: string, addressDto: any) {
    // If setting as default, unset all existing defaults first
    if (addressDto.is_default) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.userAddress.create({
      data: {
        userId,
        label: addressDto.label,
        addressLine1: addressDto.address_line1,
        addressLine2: addressDto.address_line2,
        city: addressDto.city,
        state: addressDto.state,
        pincode: addressDto.pincode,
        latitude: addressDto.latitude,
        longitude: addressDto.longitude,
        isDefault: addressDto.is_default || false,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. LIST VENDORS (Complex aggregation + geo-filter)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose - 100+ line aggregation pipeline) ──
  const vendors = await this.vendorModel.aggregate([
    { $match: {
      status: 'active',
      'shop_status.status': 'open',
      'address.latitude': { $gte: minLat, $lte: maxLat },
      'address.longitude': { $gte: minLng, $lte: maxLng },
    }},
    { $addFields: {
      services_offered: {
        $filter: {
          input: '$services_offered',
          as: 'svc',
          cond: { $and: [
            { $eq: ['$$svc.is_approved', true] },
            { $eq: ['$$svc.is_active', true] },
          ]}
        }
      }
    }},
    { $match: { 'services_offered.0': { $exists: true } } },
    // ...more stages for express, offer filtering, projection
  ]);
  */

  async listVendors(lat: number, lng: number, radius: number, filters?: {
    express_only?: boolean;
    has_offers?: boolean;
    service_id?: string;
  }) {
    // Calculate bounding box (same logic as calculateLatLong helper)
    const latDelta = radius / 110.574;
    const lngDelta = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // Build where clause
    const where: Prisma.VendorWhereInput = {
      status: 'active',
      shopOpenStatus: 'open',
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
      // Only vendors with at least one approved, active service
      servicesOffered: {
        some: {
          isApproved: true,
          isActive: true,
          ...(filters?.express_only ? { isExpressAvailable: true } : {}),
          ...(filters?.has_offers ? { isOffer: true } : {}),
          ...(filters?.service_id ? { serviceId: filters.service_id } : {}),
        },
      },
    };

    const vendors = await this.prisma.vendor.findMany({
      where,
      select: {
        id: true,
        shopName: true,
        shopImageUrl: true,
        profilePic: true,
        latitude: true,
        longitude: true,
        ratingAverage: true,
        ratingTotalReviews: true,
        expressStatus: true,
        shopOpenStatus: true,
        addressLine1: true,
        city: true,
        pincode: true,
        servicesOffered: {
          where: { isApproved: true, isActive: true },
          select: {
            id: true,
            serviceName: true,
            imageUrl: true,
            pricingType: true,
            standardPricePerKg: true,
            expressPricePerKg: true,
            isExpressAvailable: true,
            isOffer: true,
            offerPercentage: true,
            expressTime: true,
            standardTime: true,
            items: {
              where: { isActive: true },
              select: {
                id: true,
                itemName: true,
                imageUrl: true,
                itemPrice: true,
                expressPrice: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Filter out vendors with zero services after filtering
    return vendors.filter(v => v.servicesOffered.length > 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PLACE ORDER (Complex create with embedded docs)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const lastOrder = await this.orderModel.findOne({}).sort({ order_number: -1 });
  const orderNumber = (lastOrder?.order_number || 0) + 1;
  const order = await this.orderModel.create({
    order_number: orderNumber,
    user_id: userId,
    vendor_id: vendorId,
    items: [...],
    payment_details: { ... },
    vendor_address: { ... },
    user_address: { ... },
    total_amount: totalAmount,
  });
  */

  async placeOrder(userId: string, vendorId: string, dto: any) {
    return this.prisma.executeInTransaction(async (tx) => {
      // Get next order number (atomic via transaction)
      const lastOrder = await tx.order.findFirst({
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });
      const orderNumber = (lastOrder?.orderNumber || 0) + 1;

      // Create order with items in a single transaction
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          vendorId,
          status: 'pending',
          statusType: 1,

          // Vendor address snapshot
          vendorAddressLine1: dto.vendor_address.address_line1,
          vendorCity: dto.vendor_address.city,
          vendorState: dto.vendor_address.state,
          vendorPincode: dto.vendor_address.pincode,
          vendorLatitude: dto.vendor_address.latitude,
          vendorLongitude: dto.vendor_address.longitude,

          // User address snapshot
          userAddressLine1: dto.user_address.address_line1,
          userCity: dto.user_address.city,
          userState: dto.user_address.state,
          userPincode: dto.user_address.pincode,
          userLatitude: dto.user_address.latitude,
          userLongitude: dto.user_address.longitude,

          // Payment details
          totalAmount: dto.total_amount,
          isPaymentEligible: dto.payment_details.is_payment_eligible,
          amountToVendor: dto.payment_details.amount_to_vendor,
          amountToVendorAfterCommission: dto.payment_details.amount_to_vendor_after_commission,
          amountToPlatform: dto.payment_details.amount_to_platform,
          pdDeliveryFee: dto.payment_details.delivery_fee,
          pdGst: dto.payment_details.gst,
          pdItemTotal: dto.payment_details.item_total,
          pdGrandTotal: dto.payment_details.grand_total,
          pdVendorCommission: dto.payment_details.vendor_commission,

          isExpress: dto.is_express,
          userOtp: Math.floor(1000 + Math.random() * 9000),
          vendorOtp: String(Math.floor(1000 + Math.random() * 9000)),

          // Create items as nested creates
          items: {
            createMany: {
              data: dto.items.map((item: any) => ({
                serviceId: item.service_id,
                serviceName: item.service_name,
                itemId: item.item_id,
                itemName: item.item_name,
                quantity: item.quantity,
                pricePerItem: item.price_per_item,
                totalPrice: item.total_price,
                weight: item.weight || 0,
                pricingTier: item.pricing_tier || 'regular',
              })),
            },
          },
        },
        include: { items: true },
      });

      return order;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. GET ORDER HISTORY (Aggregation with $lookup + $switch sort)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose - ~80 line aggregation) ──
  const orders = await this.orderModel.aggregate([
    { $match: { user_id: new ObjectId(userId) } },
    { $addFields: { sort_priority: { $switch: { branches: [
      { case: { $in: ['$status', ['processing','accepted','driver_assigned',...]] }, then: 1 },
      { case: { $in: ['$status', ['pending','unaccepted']] }, then: 2 },
    ], default: 3 }}}},
    { $lookup: { from: 'vendors', localField: 'vendor_id', foreignField: '_id', as: 'vendor' } },
    { $unwind: '$vendor' },
    { $lookup: { from: 'reviews', let: { oid: '$_id', uid: '$user_id' },
      pipeline: [{ $match: { $expr: { $and: [
        { $eq: ['$order_id', '$$oid'] },
        { $eq: ['$user_id', '$$uid'] },
      ]}}}],
      as: 'user_review' }},
    { $sort: { sort_priority: 1, created_at: -1 } },
    { $skip: skip }, { $limit: limit },
    { $project: { ... 30+ fields ... } },
  ]);
  */

  async getOrderHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Active statuses for priority sorting
    const activeStatuses = [
      'processing', 'accepted', 'driver_assigned', 'picked_up',
      'out_for_delivery', 'reached_to_user', 'reached_to_vendor',
    ];
    const pendingStatuses = ['pending', 'unaccepted'];

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          vendor: {
            select: {
              id: true,
              shopName: true,
              shopImageUrl: true,
              phone: true,
              latitude: true,
              longitude: true,
            },
          },
          items: {
            select: {
              id: true,
              serviceName: true,
              itemName: true,
              quantity: true,
              pricePerItem: true,
              totalPrice: true,
              pricingTier: true,
            },
          },
          reviews: {
            where: { userId },
            take: 1,
            select: { rating: true, comment: true },
          },
        },
        orderBy: [
          // Prisma doesn't support computed sort, so we use raw for perf-critical,
          // or sort in application code for this volume
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    // Application-level priority sort (equivalent to $switch)
    const sorted = orders.sort((a, b) => {
      const getPriority = (status: string) => {
        if (activeStatuses.includes(status)) return 1;
        if (pendingStatuses.includes(status)) return 2;
        return 3;
      };
      const pDiff = getPriority(a.status) - getPriority(b.status);
      if (pDiff !== 0) return pDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return {
      orders: sorted.map(o => ({
        ...o,
        user_review: o.reviews[0] || null,
        reviews: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. GET NOTIFICATIONS (with pagination + mark read)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const [notifications, total, unread] = await Promise.all([
    this.notificationModel
      .find({ recipient_id: userId, recipient_role: 'user' })
      .sort({ created_at: -1 })
      .skip(skip).limit(limit).lean(),
    this.notificationModel.countDocuments({ recipient_id: userId, recipient_role: 'user' }),
    this.notificationModel.countDocuments({ recipient_id: userId, recipient_role: 'user', is_read: false }),
  ]);
  */

  async getNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { userId, recipientRole: 'user' as const };

    const [notifications, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    return { notifications, total, unread, page };
  }

  /*
  ── BEFORE (Mongoose) ──
  await this.notificationModel.updateMany(
    { recipient_id: userId, recipient_role: 'user', is_read: false },
    { $set: { is_read: true, read_at: new Date() } },
  );
  */

  async markNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        recipientRole: 'user',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. WALLET OPERATIONS (Atomic $inc → Prisma increment)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.userModel.findByIdAndUpdate(userId, {
    $inc: { 'wallet.balance': -amount },
    $set: { 'wallet.last_updated': new Date() },
  });
  */

  async debitWallet(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: amount },
        walletLastUpdate: new Date(),
      },
    });
  }

  async creditWallet(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { increment: amount },
        walletLastUpdate: new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. SUBMIT REVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const review = await this.reviewModel.create({
    user_id: userId, vendor_id: vendorId, order_id: orderId,
    rating, comment,
  });
  const vendor = await this.vendorModel.findById(vendorId);
  vendor.rating.reviews.push({ user_id: userId, rating, comment, date: new Date() });
  vendor.rating.total_reviews = vendor.rating.reviews.length;
  vendor.rating.average = vendor.rating.reviews.reduce((a,r)=>a+r.rating,0) / vendor.rating.reviews.length;
  await vendor.save();
  await this.orderModel.findByIdAndUpdate(orderId, { rating_given: true });
  */

  async submitReview(userId: string, vendorId: string, orderId: string, rating: number, comment?: string) {
    return this.prisma.executeInTransaction(async (tx) => {
      // Create review
      const review = await tx.review.create({
        data: { userId, vendorId, orderId, rating, comment },
      });

      // Update vendor rating (computed)
      const agg = await tx.review.aggregate({
        where: { vendorId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgRating = agg._avg?.rating ?? 0;
      const totalReviews = typeof agg._count === 'object' ? (agg._count?.rating ?? 0) : 0;

      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          ratingAverage: avgRating,
          ratingTotalReviews: totalReviews,
        },
      });

      // Also add to vendor_rating_reviews for backward compat
      await tx.vendorRatingReview.create({
        data: {
          vendorId,
          userId,
          rating,
          comment,
          date: new Date(),
        },
      });

      // Mark order as rated
      await tx.order.update({
        where: { id: orderId },
        data: { ratingGiven: true },
      });

      return review;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. SEARCH ORDERS (Text / regex)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const orders = await this.orderModel.find({
    $or: [
      { order_number: { $regex: search, $options: 'i' } },
      { status: { $regex: search, $options: 'i' } },
    ],
  }).sort({ created_at: -1 }).skip(skip).limit(limit);
  */

  async searchOrders(search: string, skip: number, limit: number) {
    // For order_number (integer), try to parse as number
    const numSearch = parseInt(search);

    return this.prisma.order.findMany({
      where: {
        OR: [
          ...(isNaN(numSearch) ? [] : [{ orderNumber: numSearch }]),
          { status: { equals: search as any } },
          { orderNotes: { contains: search, mode: 'insensitive' as const } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        vendor: { select: { id: true, shopName: true } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. PAYMENT WEBHOOK (Idempotent update)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const txLog = await this.transactionLogModel.findOne({ link_id: linkId });
  if (txLog.status === 'completed') return; // idempotent
  txLog.status = 'completed';
  txLog.metadata = webhookData;
  await txLog.save();
  await this.orderModel.findByIdAndUpdate(txLog.order_id, {
    $set: { payment_status: 'paid', 'status_timestamps.paid_at': new Date() },
  });
  */

  async handlePaymentWebhook(linkId: string, webhookData: any) {
    return this.prisma.executeInTransaction(async (tx) => {
      const txLog = await tx.transactionLog.findFirst({
        where: { linkId },
      });

      if (!txLog) throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      if (txLog.status === 'completed') return txLog; // Idempotent

      // Update transaction log
      await tx.transactionLog.update({
        where: { id: txLog.id },
        data: {
          status: 'completed',
          metadata: webhookData,
        },
      });

      // Update order payment status
      const order = await tx.order.findUnique({
        where: { id: txLog.orderId },
        select: { statusTimestamps: true },
      });

      const timestamps = (order?.statusTimestamps as any) || {};
      timestamps.paid_at = new Date().toISOString();

      await tx.order.update({
        where: { id: txLog.orderId },
        data: {
          paymentStatus: 'paid',
          statusTimestamps: timestamps,
        },
      });

      return txLog;
    });
  }
}
