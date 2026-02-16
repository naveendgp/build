// ============================================================================
// REFACTORED: admin.service.ts — MongoDB → Prisma Query Examples
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminServiceRefactored {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD STATS (Promise.all + Aggregation Pipelines)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose — 11 parallel queries + 3 aggregation pipelines) ──
  const [
    totalUsers, totalVendors, totalOrders, totalDrivers, activeOrders,
    pendingOrders, completedOrders, cancelledOrders, totalRevenue,
    revenueAgg, orderStatusAgg, dailyGraphAgg,
  ] = await Promise.all([
    this.userModel.countDocuments(),
    this.vendorModel.countDocuments({ status: 'active' }),
    this.orderModel.countDocuments(),
    this.deliveryPersonModel.countDocuments({ status: 'active' }),
    this.orderModel.countDocuments({ status: { $in: ['processing', 'accepted', ...] } }),
    this.orderModel.countDocuments({ status: 'pending' }),
    this.orderModel.countDocuments({ status: 'delivered' }),
    this.orderModel.countDocuments({ status: 'cancelled' }),
    this.orderModel.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    this.orderModel.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$total_amount' } } },
    ]),
    this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    this.orderModel.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        orders: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0] } },
      }},
      { $sort: { _id: 1 } },
    ]),
  ]);
  */

  async getDashboardStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalVendors,
      totalOrders,
      totalDrivers,
      orderStatusCounts,
      revenueData,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count({ where: { status: 'active' } }),
      this.prisma.order.count(),
      this.prisma.deliveryPerson.count({ where: { status: 'active' } }),

      // Single groupBy replaces 4 separate countDocuments
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Revenue aggregation
      this.prisma.order.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: { totalAmount: true },
      }),
    ]);

    // Daily graph — Prisma doesn't support dateToString, use raw SQL
    const dailyGraph = await this.prisma.$queryRaw<
      Array<{ date: string; orders: bigint; revenue: number }>
    >`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const statusMap = Object.fromEntries(
      orderStatusCounts.map(c => [c.status, c._count.status])
    );

    return {
      totalUsers,
      totalVendors,
      totalOrders,
      totalDrivers,
      activeOrders:
        (statusMap['processing'] || 0) +
        (statusMap['accepted'] || 0) +
        (statusMap['driver_assigned'] || 0) +
        (statusMap['picked_up'] || 0) +
        (statusMap['out_for_delivery'] || 0),
      pendingOrders: statusMap['pending'] || 0,
      completedOrders: statusMap['delivered'] || 0,
      cancelledOrders: statusMap['cancelled'] || 0,
      totalRevenue: revenueData._sum.totalAmount || 0,
      dailyGraph: dailyGraph.map(d => ({
        date: d.date,
        orders: Number(d.orders),
        revenue: Number(d.revenue),
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LIST ORDERS WITH SEARCH (regex $or + populate)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const orders = await this.orderModel.find(filter)
    .populate('user_id', 'name phone')
    .populate('vendor_id', 'shop_name')
    .sort({ created_at: -1 })
    .skip(skip).limit(limit).lean();
  const total = await this.orderModel.countDocuments(filter);
  */

  async listOrders(page: number, limit: number, search?: string, statusFilter?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusFilter) where.status = statusFilter;
    if (search) {
      const numSearch = parseInt(search);
      where.OR = [
        ...(isNaN(numSearch) ? [] : [{ orderNumber: numSearch }]),
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
        { vendor: { shopName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          vendor: { select: { id: true, shopName: true } },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. MANAGE SERVICES (CRUD on master catalog)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  // Add item to service:
  const service = await this.servicesModel.findById(serviceId);
  service.items.push(itemDto);
  await service.save();
  
  // Delete item from service (also pull from vendors):
  await this.servicesModel.findByIdAndUpdate(serviceId, { $pull: { items: { _id: itemId } } });
  await this.vendorModel.updateMany(
    { 'services_offered.service_id': serviceId },
    { $pull: { 'services_offered.$.items': { item_id: itemId } } }
  );
  */

  async addServiceItem(serviceId: string, itemDto: any) {
    return this.prisma.serviceItem.create({
      data: {
        serviceId,
        itemName: itemDto.item_name,
        imageUrl: itemDto.image_url,
        itemDescription: itemDto.item_description,
        itemSlug: itemDto.item_slug,
        category: itemDto.category,
      },
    });
  }

  async deleteServiceItem(serviceId: string, itemId: string) {
    return this.prisma.executeInTransaction(async (tx) => {
      // Delete from vendor service items first (cascade would work too)
      await tx.vendorServiceItem.deleteMany({
        where: { itemId },
      });

      // Delete from master catalog
      await tx.serviceItem.delete({
        where: { id: itemId },
      });

      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SETTLEMENT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const vendors = await this.vendorModel.find({ amount_due: { $gt: 0 } })
    .select('shop_name phone amount_due wallet').lean();
  */

  async getVendorsWithDues() {
    return this.prisma.vendor.findMany({
      where: { amountDue: { gt: 0 } },
      select: {
        id: true,
        shopName: true,
        phone: true,
        amountDue: true,
        walletBalance: true,
      },
    });
  }
}
