// ============================================================================
// REFACTORED: cron.service.ts — MongoDB → Prisma Query Examples
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CronServiceRefactored {
  private readonly logger = new Logger(CronServiceRefactored.name);

  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ORDERS CRON — Find stale orders without drivers
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const staleAccepted = await this.orderModel.find({
    status: 'accepted',
    driver_id_1: null,
    accepted_at: { $lte: fiveMinAgo },
  });
  const staleProcessed = await this.orderModel.find({
    status: 'processed',
    driver_id_2: null,
    processed_at: { $lte: fiveMinAgo },
  });
  const unacceptedPending = await this.orderModel.find({
    status: 'pending',
    created_at: { $lte: fiveMinAgo },
  });
  */

  @Cron(CronExpression.EVERY_MINUTE)
  async handleOrdersCron() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [staleAccepted, staleProcessed, unaccepted] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: 'accepted',
          driverId1: null,
          createdAt: { lte: fiveMinAgo },
        },
      }),
      this.prisma.order.findMany({
        where: {
          status: 'processed',
          driverId2: null,
          createdAt: { lte: fiveMinAgo },
        },
      }),
      this.prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: { lte: fiveMinAgo },
        },
      }),
    ]);

    // Process stale orders...
    for (const order of unaccepted) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'unaccepted' },
      });
    }

    this.logger.log(
      `Orders cron: ${staleAccepted.length} stale accepted, ` +
      `${staleProcessed.length} stale processed, ${unaccepted.length} unaccepted`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PAYMENT RECONCILIATION (Complex filter + external API)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const pendingLogs = await this.transactionLogModel.find({
    status: 'initiated',
    created_at: { $gte: oneHourAgo, $lte: fiveMinAgo },
    payment_gateway: 'Cashfree',
  }).sort({ created_at: 1 }).limit(50);
  */

  @Cron('*/5 * * * *') // Every 5 minutes
  async handlePaymentReconciliation() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const pendingLogs = await this.prisma.transactionLog.findMany({
      where: {
        status: 'initiated',
        createdAt: { gte: oneHourAgo, lte: fiveMinAgo },
        paymentGateway: 'Cashfree',
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    for (const log of pendingLogs) {
      try {
        // Call Cashfree API to check status...
        // const cfStatus = await this.checkCashfreeStatus(log.linkId);

        // Idempotent update
        // if (cfStatus === 'PAID') {
        //   await this.prisma.executeInTransaction(async (tx) => {
        //     await tx.transactionLog.update({
        //       where: { id: log.id },
        //       data: { status: 'completed' },
        //     });
        //     await tx.order.update({
        //       where: { id: log.orderId },
        //       data: { paymentStatus: 'paid' },
        //     });
        //   });
        // }
      } catch (err) {
        this.logger.error(`Reconciliation failed for ${log.linkId}: ${err.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GROUP EVENT EMITTER (Active delivery orders)
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const activeOrders = await this.orderModel.find({
    $or: [
      { status: { $in: ['driver_assigned', 'picked_up', 'out_for_delivery'] } },
      { status_type: { $in: [3, 4, 5] } },
    ],
  });
  */

  @Cron('*/30 * * * * *') // Every 30 seconds
  async handleGroupEventEmitter() {
    const activeOrders = await this.prisma.order.findMany({
      where: {
        OR: [
          { status: { in: ['driver_assigned', 'picked_up', 'out_for_delivery'] } },
          { statusType: { in: [3, 4, 5] } },
        ],
      },
      include: {
        driver1: {
          select: {
            id: true, name: true, phone: true,
            currentLatitude: true, currentLongitude: true,
          },
        },
        driver2: {
          select: {
            id: true, name: true, phone: true,
            currentLatitude: true, currentLongitude: true,
          },
        },
      },
    });

    // Emit socket events...
    for (const order of activeOrders) {
      // this.trackingGateway.emitOrderUpdate(order);
    }
  }
}
