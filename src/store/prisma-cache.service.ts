// ============================================================================
// REFACTORED: mongo-cache.service.ts → prisma-cache.service.ts
// Replaces MongoDB TTL-based cache with PostgreSQL + Prisma
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PrismaCacheService {
  private readonly logger = new Logger(PrismaCacheService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Set cached orders for a delivery person
   * Replaces: cacheModel.findOneAndUpdate({ delivery_person_id }, ..., { upsert: true })
   */
  async set(deliveryPersonId: string, orders: any[], ttlMs: number = 300000): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);

    // Calculate check_time as min(order_accept_endtime) across all orders
    let checkTime: Date | null = null;
    if (orders.length > 0) {
      const endTimes = orders
        .map(o => o.details?.order_accept_endtime)
        .filter(Boolean)
        .map(t => new Date(t).getTime());
      if (endTimes.length > 0) {
        checkTime = new Date(Math.min(...endTimes));
      }
    }

    await this.prisma.deliveryPersonCache.upsert({
      where: { deliveryPersonId },
      update: {
        cachedOrders: orders as any,
        expiresAt,
        checkTime,
      },
      create: {
        deliveryPersonId,
        cachedOrders: orders as any,
        expiresAt,
        checkTime,
      },
    });
  }

  /**
   * Get cached orders for a delivery person
   * Replaces: cacheModel.findOne({ delivery_person_id, expires_at: { $gt: new Date() } })
   */
  async get(deliveryPersonId: string): Promise<any[] | null> {
    const entry = await this.prisma.deliveryPersonCache.findUnique({
      where: { deliveryPersonId },
    });

    if (!entry || entry.expiresAt < new Date()) {
      return null;
    }

    return entry.cachedOrders as any[];
  }

  /**
   * Delete cache for a delivery person
   * Replaces: cacheModel.deleteOne({ delivery_person_id })
   */
  async delete(deliveryPersonId: string): Promise<void> {
    await this.prisma.deliveryPersonCache.deleteMany({
      where: { deliveryPersonId },
    });
  }

  /**
   * Remove a specific order from ALL delivery person caches
   * Replaces: cacheModel.updateMany({}, { $pull: { cached_orders: { order_id } } })
   *
   * NOTE: JSON array manipulation in PostgreSQL
   */
  async removeOrderFromAll(orderId: string): Promise<void> {
    // Get all entries that contain this order
    const entries = await this.prisma.$queryRaw<Array<{ id: string; cached_orders: any }>>`
      SELECT id, cached_orders FROM delivery_person_cache
      WHERE cached_orders @> ${JSON.stringify([{ order_id: orderId }])}::jsonb
    `;

    for (const entry of entries) {
      const filtered = (entry.cached_orders as any[]).filter(
        (o: any) => o.order_id?.toString() !== orderId
      );

      await this.prisma.deliveryPersonCache.update({
        where: { id: entry.id },
        data: { cachedOrders: filtered as any },
      });
    }
  }

  /**
   * Find entries that have a specific order
   * Replaces: cacheModel.find({ 'cached_orders.order_id': orderId })
   */
  async findEntriesWithOrder(orderId: string): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT * FROM delivery_person_cache
      WHERE cached_orders @> ${JSON.stringify([{ order_id: orderId }])}::jsonb
      AND expires_at > NOW()
    `;
  }

  /**
   * Get all entries including expired (for cleanup cron)
   * Replaces: cacheModel.find({})
   */
  async getAllEntriesIncludingExpired() {
    return this.prisma.deliveryPersonCache.findMany();
  }

  /**
   * Cleanup expired entries
   * Replaces: MongoDB TTL index (expires_at with expireAfterSeconds: 0)
   * Since PostgreSQL doesn't have native TTL indexes, we use a cron job
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async cleanupExpired(): Promise<void> {
    const result = await this.prisma.deliveryPersonCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired cache entries`);
    }
  }

  /**
   * Count all active entries
   */
  async countActive(): Promise<number> {
    return this.prisma.deliveryPersonCache.count({
      where: { expiresAt: { gt: new Date() } },
    });
  }

  /**
   * Check if a cache entry exists for a delivery person
   */
  async has(deliveryPersonId: string): Promise<boolean> {
    const count = await this.prisma.deliveryPersonCache.count({
      where: {
        deliveryPersonId,
        expiresAt: { gt: new Date() },
      },
    });
    return count > 0;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.prisma.deliveryPersonCache.deleteMany({});
  }

  /**
   * Get all active delivery person IDs
   */
  async keys(): Promise<string[]> {
    const entries = await this.prisma.deliveryPersonCache.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: { deliveryPersonId: true },
    });
    return entries.map((e) => e.deliveryPersonId);
  }

  /**
   * Get all active cached order arrays
   */
  async values(): Promise<any[]> {
    const entries = await this.prisma.deliveryPersonCache.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: { cachedOrders: true },
    });
    return entries.map((e) => e.cachedOrders);
  }

  /**
   * Get all active entries as [deliveryPersonId, cachedOrders] pairs
   */
  async entries(): Promise<[string, any][]> {
    const entries = await this.prisma.deliveryPersonCache.findMany({
      where: { expiresAt: { gt: new Date() } },
    });
    return entries.map((e) => [e.deliveryPersonId, e.cachedOrders]);
  }

  /**
   * Count active entries
   */
  async size(): Promise<number> {
    return this.prisma.deliveryPersonCache.count({
      where: { expiresAt: { gt: new Date() } },
    });
  }
}
