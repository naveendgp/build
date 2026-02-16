// ============================================================================
// REFACTORED: order-status.helper.ts — Prisma version
// Replaces Model<DeliveryPersonDocument> / Model<OrderDocument> params with PrismaService
// ============================================================================
//
// BEFORE (Mongoose — models passed as arguments):
//   async updateOrderStatus(params, deliveryModel, orderModel, userModel, vendorModel)
//   const deliveryPerson = await deliveryModel.findOne({ phone });
//   const order = await orderModel.findById(orderId);
//   order.status = 'picked_up';
//   order.status_timestamps.set('picked_up_at', new Date());
//   await order.save();
//   deliveryPerson.assigned_orders = [];
//   await deliveryPerson.save();
//
// AFTER (Prisma — PrismaService injected or passed):
//   const deliveryPerson = await prisma.deliveryPerson.findUnique({ where: { phone } });
//   const order = await prisma.order.findUnique({ where: { id: orderId } });
//   await prisma.order.update({ where: { id: orderId }, data: { status: 'picked_up', ... } });
//   await prisma.deliveryAssignedOrder.deleteMany({ where: { deliveryPersonId } });
// ============================================================================

import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateOrderStatusResult {
  status: boolean;
  message: string;
}

export interface UpdateOrderStatusParams {
  phone: string;
  orderId: string;
  status: number;
  otp?: number;
}

export class OrderStatusHelper {
  /**
   * Update order status from delivery end
   *
   * KEY CHANGES:
   * 1. Accepts PrismaService instead of 4 separate Mongoose models
   * 2. order.status_timestamps.set(key, val) → merge JSON object
   * 3. deliveryPerson.assigned_orders = [] → deleteMany on child table
   * 4. deliveryPerson._id.toString() → deliveryPerson.id (UUID)
   * 5. order.save() → prisma.order.update()
   */
  async updateOrderStatus(
    params: UpdateOrderStatusParams,
    prisma: PrismaService,
  ): Promise<UpdateOrderStatusResult> {
    const { phone, orderId, status, otp } = params;

    // BEFORE: const deliveryPerson = await deliveryModel.findOne({ phone });
    // AFTER:
    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { phone },
      include: { assignedOrders: true },
    });

    // BEFORE: const order = await orderModel.findById(orderId);
    // AFTER:
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!deliveryPerson) throw new NotFoundException('User not found');
    if (!order) throw new NotFoundException('Order not found');

    // Helper: merge new timestamp into the JSON status_timestamps field
    const mergeTimestamp = (key: string) => {
      const existing = (order.statusTimestamps as Record<string, any>) || {};
      return { ...existing, [key]: new Date().toISOString() };
    };

    // Helper: verify driver owns this order
    const verifyDriverOwns = (driverField: 'driverId1' | 'driverId2') => {
      // BEFORE: deliveryPerson._id.toString() != order.driver_id_1.toString()
      // AFTER: deliveryPerson.id !== order.driverId1
      if (deliveryPerson.id !== order[driverField]) {
        throw new NotFoundException('Order does not belong to rider');
      }
      // BEFORE: order._id.toString() != deliveryPerson.assigned_orders[0]?.order_id.toString()
      // AFTER: check assignedOrders child table
      const hasOrder = deliveryPerson.assignedOrders.some(ao => ao.orderId === orderId);
      if (!hasOrder) {
        throw new NotFoundException('Order does not belong to rider');
      }
    };

    switch (status) {
      case 2: // Verifying order status before pickup
        if (order.status !== 'accepted') throw new NotFoundException('Incorrect order status');
        verifyDriverOwns('driverId1');

        // BEFORE: order.status = 'verified'; order.status_timestamps.set('verified_at', new Date()); await order.save();
        // AFTER:
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'verified',
            statusTimestamps: mergeTimestamp('verified_at'),
          },
        });
        break;

      case 3: // Reached — no-op in original
        break;

      case 4: // Order pickup from user
        if (order.status !== 'verified') throw new NotFoundException('Incorrect order status');
        verifyDriverOwns('driverId1');
        if (otp !== order.userOtp) throw new NotFoundException('Incorrect OTP');

        // BEFORE: order.status = 'picked_up'; order.status_timestamps.set(...); await order.save(); await deliveryPerson.save();
        // AFTER:
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'picked_up',
            statusTimestamps: mergeTimestamp('picked_up_at'),
          },
        });
        break;

      case 5: // Drop off to vendor
        if (order.status !== 'picked_up') throw new NotFoundException('Incorrect order status');
        verifyDriverOwns('driverId1');

        // BEFORE: deliveryPerson.assigned_orders = []; await deliveryPerson.save();
        // AFTER: delete all assigned orders for this driver
        await prisma.$transaction([
          prisma.deliveryAssignedOrder.deleteMany({
            where: { deliveryPersonId: deliveryPerson.id },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'processing',
              statusTimestamps: mergeTimestamp('processing_at'),
            },
          }),
        ]);
        break;

      case 8: // Vendor pickup after processing
        if (order.status !== 'processed') throw new NotFoundException('Incorrect order status');
        verifyDriverOwns('driverId2');

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'out_for_delivery',
            statusTimestamps: mergeTimestamp('processed_at'),
          },
        });
        break;

      case 6: // Payment completed
        if (order.status !== 'out_for_delivery') throw new NotFoundException('Incorrect order status');
        verifyDriverOwns('driverId2');

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            statusTimestamps: mergeTimestamp('paid_at'),
          },
        });
        break;

      case 7: // Delivered to user
        if (order.status !== 'out_for_delivery' && order.paymentStatus === 'paid') {
          throw new NotFoundException('Incorrect order status');
        }
        verifyDriverOwns('driverId2');

        // BEFORE: deliveryPerson.assigned_orders = []; order.status = 'delivered'; order.status_timestamps.set(...);
        // AFTER: transaction — clear assigned orders + update order status
        await prisma.$transaction([
          prisma.deliveryAssignedOrder.deleteMany({
            where: { deliveryPersonId: deliveryPerson.id },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'delivered',
              statusTimestamps: mergeTimestamp('delivered_at'),
            },
          }),
        ]);
        break;

      default:
        throw new NotFoundException('Invalid status update');
    }

    return { status: true, message: 'Status update successful' };
  }
}

export const orderStatusHelper = new OrderStatusHelper();
