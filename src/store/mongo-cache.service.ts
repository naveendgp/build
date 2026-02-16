import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPersonCache,
  DeliveryPersonCacheDocument,
} from '../schemas/delivery-person-cache.schema';

@Injectable()
export class MongoCacheService {
  constructor(
    @InjectModel(DeliveryPersonCache.name)
    private readonly cacheModel: Model<DeliveryPersonCacheDocument>,
  ) {}

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    // Normalize structure before processing
    let normalizedValue = value;
    if (Array.isArray(value) && value.length > 0) {
      normalizedValue = value
        .map((order: any) => {
          // Validate order structure - filter out invalid orders
          if (!order || !order.order_id) {
            console.warn('Skipping invalid order: missing order_id', order);
            return null;
          }

          // Validate details exists and is an object
          if (!order.details || typeof order.details !== 'object') {
            console.warn('Skipping invalid order: missing or invalid details', order.order_id);
            return null;
          }

          // Normalize each order to ensure correct structure
          if (order.details.order ) {
            const deliveryData =  order.details;
            order.details = {
              _id: deliveryData._id,
              driver_name: deliveryData.driver_name,
              phone: deliveryData.phone,
              current_location: deliveryData.current_location,
              from_location: deliveryData.from_location,
              to_location: deliveryData.to_location,
              from_eta: deliveryData.from_eta,
              to_eta: deliveryData.to_eta,
              order_duration: deliveryData.order_duration,
              order_accept_endtime:
                deliveryData.order_accept_endtime ||
                order.order_accept_endtime ||
                order.details.order_accept_endtime,
            };
          } else {
            // Validate required fields exist before normalizing
            if (!order.details._id || !order.details.driver_name || !order.details.phone || !order.details.current_location) {
              console.warn('Skipping invalid order: missing required fields in details', order.order_id);
              return null;
            }

            // Clean details to only include allowed fields
            order.details = {
              _id: order.details._id,
              driver_name: order.details.driver_name,
              phone: order.details.phone,
              current_location: order.details.current_location,
              from_location: order.details.from_location,
              to_location: order.details.to_location,
              from_eta: order.details.from_eta,
              to_eta: order.details.to_eta,
              order_duration: order.details.order_duration,
              order_accept_endtime:
                order.details.order_accept_endtime || order.order_accept_endtime,
            };
          }
          // Remove order_accept_endtime from root if it exists
          if (order.order_accept_endtime) {
            delete order.order_accept_endtime;
          }
          return {
            order_id: order.order_id,
            type: order.type || 'order-list',
            details: order.details,
          };
        })
        .filter((order: any) => order !== null) as any;
    }

    // Calculate check_time as minimum order_accept_endtime from all orders
    let checkTime: Date | undefined = undefined;
    // Calculate expires_at as maximum order_duration (expiry time) from all orders
    let expiresAt: Date | undefined = undefined;

    if (Array.isArray(normalizedValue) && normalizedValue.length > 0) {
      // Get all order_accept_endtime values for check_time (minimum)
      // order_accept_endtime is now inside details
      const orderAcceptEndTimes = normalizedValue
        .map((order: any) => {
          const orderAcceptEndTime = order.details?.order_accept_endtime
            ? new Date(order.details.order_accept_endtime)
            : null;
          return orderAcceptEndTime;
        })
        .filter((time: Date | null) => time !== null) as Date[];

      if (orderAcceptEndTimes.length > 0) {
        // check_time = minimum order_accept_endtime among all orders
        checkTime = orderAcceptEndTimes.reduce(
          (min: Date, time: Date) => (time < min ? time : min),
          orderAcceptEndTimes[0],
        );
      }

      // Get all order_duration values for expires_at (maximum)
      // order_duration is now inside details
      const orderDurations = normalizedValue
        .map((order: any) => {
          const orderDuration = order.details?.order_duration
            ? new Date(order.details.order_duration)
            : null;
          return orderDuration;
        })
        .filter((duration: Date | null) => duration !== null) as Date[];

      if (orderDurations.length > 0) {
        // expires_at = maximum order_duration among all orders
        expiresAt = orderDurations.reduce(
          (max: Date, duration: Date) => (duration > max ? duration : max),
          orderDurations[0],
        );
      }
    }

    // Fallback: if no order durations found, use TTL or default
    if (!expiresAt) {
      expiresAt = ttlMs && ttlMs > 0 
        ? new Date(Date.now() + ttlMs) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
    }

    await this.cacheModel.findOneAndUpdate(
      { delivery_person_id: new Types.ObjectId(key) },
      {
        delivery_person_id: new Types.ObjectId(key),
        cached_orders: normalizedValue,
        expires_at: expiresAt,
        ...(checkTime && { check_time: checkTime }),
      },
      { upsert: true, new: true },
    );
  }

  async get<T>(key: string): Promise<T | undefined> {
    const cacheEntry = await this.cacheModel
      .findOne({
        delivery_person_id: new Types.ObjectId(key),
        expires_at: { $gt: new Date() },
      })
      .lean();

    if (!cacheEntry) {
      return undefined;
    }

    // Normalize cached_orders before returning
    if (Array.isArray(cacheEntry.cached_orders) && cacheEntry.cached_orders.length > 0) {
      const normalizedOrders = cacheEntry.cached_orders
        .map((order: any) => {
          // Validate order structure - filter out invalid orders
          if (!order || !order.order_id) {
            console.warn('Skipping invalid order in get(): missing order_id', order);
            return null;
          }

          // Validate details exists and is an object
          if (!order.details || typeof order.details !== 'object') {
            console.warn('Skipping invalid order in get(): missing or invalid details', order.order_id);
            return null;
          }

          // Normalize each order to ensure correct structure
          if (order.details.order ) {
            const deliveryData =  order.details;
            return {
              order_id: order.order_id,
              type: order.type || 'order-list',
              details: {
                _id: deliveryData._id,
                driver_name: deliveryData.driver_name,
                phone: deliveryData.phone,
                current_location: deliveryData.current_location,
                from_location: deliveryData.from_location,
                to_location: deliveryData.to_location,
                from_eta: deliveryData.from_eta,
                to_eta: deliveryData.to_eta,
                order_duration: deliveryData.order_duration,
                order_accept_endtime:
                  deliveryData.order_accept_endtime ||
                  order.order_accept_endtime ||
                  order.details.order_accept_endtime,
              },
            };
          } else {
            // Validate required fields exist
            if (!order.details._id || !order.details.driver_name || !order.details.phone || !order.details.current_location) {
              console.warn('Skipping invalid order in get(): missing required fields', order.order_id);
              return null;
            }

            // Clean details to only include allowed fields
            return {
              order_id: order.order_id,
              type: order.type || 'order-list',
              details: {
                _id: order.details._id,
                driver_name: order.details.driver_name,
                phone: order.details.phone,
                current_location: order.details.current_location,
                from_location: order.details.from_location,
                to_location: order.details.to_location,
                from_eta: order.details.from_eta,
                to_eta: order.details.to_eta,
                order_duration: order.details.order_duration,
                order_accept_endtime:
                  order.details.order_accept_endtime || order.order_accept_endtime,
              },
            };
          }
        })
        .filter((order: any) => order !== null);

      // Return undefined if all orders were invalid
      if (normalizedOrders.length === 0) {
        return undefined;
      }

      return normalizedOrders as T;
    }

    return cacheEntry.cached_orders as T;
  }

  async has(key: string): Promise<boolean> {
    const count = await this.cacheModel.countDocuments({
      delivery_person_id: new Types.ObjectId(key),
      expires_at: { $gt: new Date() },
    });

    return count > 0;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.cacheModel.deleteOne({
      delivery_person_id: new Types.ObjectId(key),
    });

    return result.deletedCount > 0;
  }

  async clear(): Promise<void> {
    await this.cacheModel.deleteMany({});
  }

  async keys(): Promise<string[]> {
    const entries = await this.cacheModel
      .find({
        expires_at: { $gt: new Date() },
      })
      .select('delivery_person_id')
      .lean();

    return entries.map((entry) => entry.delivery_person_id.toString());
  }

  async values(): Promise<any[]> {
    const entries = await this.cacheModel
      .find({
        expires_at: { $gt: new Date() },
      })
      .select('cached_orders')
      .lean();

    return entries.map((entry) => entry.cached_orders);
  }

  async entries(): Promise<[string, any][]> {
    const entries = await this.cacheModel
      .find({
        expires_at: { $gt: new Date() },
      })
      .lean();

    return entries.map((entry) => [
      entry.delivery_person_id.toString(),
      entry.cached_orders,
    ]);
  }

  async size(): Promise<number> {
    return await this.cacheModel.countDocuments({
      expires_at: { $gt: new Date() },
    });
  }

  /**
   * Find all cache entries that contain a specific order_id
   */
  async findEntriesWithOrder(orderId: string): Promise<any[]> {
    return await this.cacheModel
      .find({
        'cached_orders.order_id': new Types.ObjectId(orderId),
        expires_at: { $gt: new Date() },
      })
      .lean();
  }

  /**
   * Remove a specific order from all cache entries
   */
  async removeOrderFromAllCaches(orderId: string): Promise<void> {
    await this.cacheModel.updateMany(
      {
        'cached_orders.order_id': new Types.ObjectId(orderId),
        expires_at: { $gt: new Date() },
      },
      {
        $pull: {
          cached_orders: { order_id: new Types.ObjectId(orderId) },
        },
      },
    );

    // Clean up entries with empty arrays
    await this.cacheModel.deleteMany({
      cached_orders: { $size: 0 },
    });
  }

  /**
   * Get all cache entries including expired ones (for cleanup purposes)
   */
  async getAllEntriesIncludingExpired(): Promise<
    Array<{
      delivery_person_id: string;
      cached_orders: any;
      expires_at: Date;
      check_time?: Date;
    }>
  > {
    const entries = await this.cacheModel.find({}).lean();
    return entries.map((entry) => ({
      delivery_person_id: entry.delivery_person_id.toString(),
      cached_orders: entry.cached_orders,
      expires_at: entry.expires_at,
      check_time: entry.check_time,
    }));
  }

  /**
   * Manually clean up expired cache entries
   * This is a backup to MongoDB's TTL index which runs every 60 seconds
   */
  async cleanupExpiredEntries(): Promise<number> {
    const result = await this.cacheModel.deleteMany({
      expires_at: { $lt: new Date() },
    });

    return result.deletedCount;
  }
}

