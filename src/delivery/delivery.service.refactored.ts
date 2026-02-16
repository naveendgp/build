// ============================================================================
// REFACTORED: delivery.service.ts — MongoDB → Prisma Query Examples
// ============================================================================

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeliveryServiceRefactored {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. FIND NEARBY DELIVERY PERSONS (Geo bounding box)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const drivers = await this.deliveryPersonModel.find({
    status: 'active',
    availability_status: 1,
    assigned_orders: { $size: 0 },
    'current_location.latitude': { $gte: minLat, $lte: maxLat },
    'current_location.longitude': { $gte: minLng, $lte: maxLng },
  });
  */

  async findNearbyDrivers(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 110.574;
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

    return this.prisma.deliveryPerson.findMany({
      where: {
        status: 'active',
        availabilityStatus: 1,
        // No assigned orders = empty assignments
        assignedOrders: { none: {} },
        currentLatitude: {
          gte: lat - latDelta,
          lte: lat + latDelta,
        },
        currentLongitude: {
          gte: lng - lngDelta,
          lte: lng + lngDelta,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentLatitude: true,
        currentLongitude: true,
        vehicleType: true,
        vehicleNumber: true,
        fcmToken: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ACCEPT ORDER (Atomic findOneAndUpdate for race conditions)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const driver = await this.deliveryPersonModel.findOneAndUpdate(
    { _id: driverId, availability_status: 1 },
    { $set: {
      availability_status: 3,
      'assigned_orders': [{ order_id: orderId, status: 'accepted', pickup_time: new Date() }],
    }},
    { new: true }
  );
  if (!driver) throw new Error('Driver not available');
  */

  async acceptOrder(driverId: string, orderId: string) {
    return this.prisma.executeInTransaction(async (tx) => {
      // Atomic check: driver must be available
      const driver = await tx.deliveryPerson.findFirst({
        where: { id: driverId, availabilityStatus: 1 },
      });

      if (!driver) {
        throw new HttpException('Driver not available or already busy', HttpStatus.CONFLICT);
      }

      // Set to busy
      await tx.deliveryPerson.update({
        where: { id: driverId },
        data: { availabilityStatus: 3 },
      });

      // Create assigned order
      await tx.deliveryAssignedOrder.create({
        data: {
          deliveryPersonId: driverId,
          orderId,
          status: 'accepted',
          pickupTime: new Date(),
        },
      });

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          driverId1: driverId,
          status: 'driver_assigned',
          statusType: 3,
        },
      });

      return driver;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. UPDATE LOCATION
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.deliveryPersonModel.updateOne(
    { _id: driverId },
    { $set: {
      'current_location.latitude': lat,
      'current_location.longitude': lng,
      'current_location.last_updated': new Date(),
    }}
  );
  */

  async updateLocation(driverId: string, lat: number, lng: number) {
    return this.prisma.deliveryPerson.update({
      where: { id: driverId },
      data: {
        currentLatitude: lat,
        currentLongitude: lng,
        locationLastUpdated: new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. GET DRIVER ORDERS (Multi-status OR query)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const orders = await this.orderModel.find({
    $or: [
      { driver_id_1: driverId },
      { driver_id_2: driverId },
    ],
    status: { $in: ['accepted', 'picked_up', 'out_for_delivery', 'driver_assigned'] },
  }).sort({ created_at: -1 });
  */

  async getDriverActiveOrders(driverId: string) {
    return this.prisma.order.findMany({
      where: {
        OR: [
          { driverId1: driverId },
          { driverId2: driverId },
        ],
        status: {
          in: ['accepted', 'picked_up', 'out_for_delivery', 'driver_assigned'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, name: true, phone: true,
            addresses: { where: { isDefault: true }, take: 1 },
          },
        },
        vendor: {
          select: {
            id: true, shopName: true, phone: true,
            latitude: true, longitude: true,
            addressLine1: true, city: true,
          },
        },
        items: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CREATE DELIVERY LOG
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  await this.logModel.create({
    delivery_person_id: driverId,
    type: 'availability_change',
    details: { from: oldStatus, to: newStatus },
  });
  */

  async createLog(driverId: string, type: string, details: any) {
    return this.prisma.deliveryLog.create({
      data: {
        deliveryPersonId: driverId,
        type,
        details,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DELIVERY COMPLETION + VENDOR SETTLEMENT (Multi-entity update)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  order.status = 'delivered';
  order.delivered_to_user_at = new Date();
  order.is_settled_to_vendor = false;
  await order.save();
  await this.vendorModel.findByIdAndUpdate(order.vendor_id, {
    $inc: { 'wallet.balance': amount, amount_due: amount },
    $push: { orders_to_be_settled: order._id.toString() },
  });
  driver.availability_status = 1;
  driver.assigned_orders = [];
  await driver.save();
  */

  async completeDelivery(orderId: string, driverId: string) {
    return this.prisma.executeInTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { vendorId: true, amountToVendorAfterCommission: true },
      });

      if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND);

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          deliveredToUserAt: new Date(),
          isSettledToVendor: false,
        },
      });

      // Credit vendor
      await tx.vendor.update({
        where: { id: order.vendorId },
        data: {
          walletBalance: { increment: order.amountToVendorAfterCommission },
          amountDue: { increment: order.amountToVendorAfterCommission },
          walletLastUpdate: new Date(),
        },
      });

      // Add to settlement tracking
      await tx.vendorSettlementOrder.create({
        data: { vendorId: order.vendorId, orderId },
      });

      // Release driver
      await tx.deliveryPerson.update({
        where: { id: driverId },
        data: { availabilityStatus: 1 },
      });

      // Clear assigned orders for driver
      await tx.deliveryAssignedOrder.deleteMany({
        where: { deliveryPersonId: driverId },
      });

      return true;
    });
  }
}
