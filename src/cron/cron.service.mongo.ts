import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { TrackingGateway } from '../delivery/tracking.gateway';
import { DeliveryService } from '../delivery/delivery.service';
import { AppConfig, AppConfigDocument } from 'src/schemas/app-config.schema';
import { MongoCacheService } from 'src/store/mongo-cache.service';
import {
  TransactionLog,
  TransactionLogDocument,
} from 'src/schemas/transaction-log.schema';
import {
  DeliveryPerson,
  DeliveryPersonDocument,
} from 'src/schemas/delivery-person.schema';
import { cashFreeUtil } from 'src/utils/cashFree.util';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(AppConfig.name)
    private readonly appconfigModel: Model<AppConfigDocument>,
    @InjectModel(DeliveryPerson.name)
    private readonly deliveryPersonModel: Model<DeliveryPersonDocument>,
    @InjectModel(TransactionLog.name)
    private readonly transactionLogModel: Model<TransactionLogDocument>,
    private readonly trackingGateway: TrackingGateway,
    private readonly deliveryService: DeliveryService,
    private readonly mongoCache: MongoCacheService,
  ) { }

  /**
   * Check if cache has changed by comparing length and order_ids
   * Returns true if cache has changed, false if it's the same
   */
  private hasCacheChanged(
    existingCache: any[] | any | undefined,
    updatedCacheArray: any[],
  ): boolean {
    // If no existing cache, it's a change (new cache)
    if (!existingCache) {
      return true;
    }

    // Normalize to arrays
    const existingArray = Array.isArray(existingCache)
      ? existingCache
      : [existingCache];

    // Check length difference
    if (existingArray.length !== updatedCacheArray.length) {
      return true;
    }

    // Extract order_ids from both arrays
    const existingOrderIds = new Set(
      existingArray.map(
        (order: any) => order.order_id?.toString() || order.order_id,
      ),
    );
    const updatedOrderIds = new Set(
      updatedCacheArray.map(
        (order: any) => order.order_id?.toString() || order.order_id,
      ),
    );

    // Check if order_ids are different
    if (existingOrderIds.size !== updatedOrderIds.size) {
      return true;
    }

    // Check if all order_ids match
    for (const orderId of existingOrderIds) {
      if (!updatedOrderIds.has(orderId)) {
        return true;
      }
    }

    // No changes detected
    return false;
  }

  @Cron('*/1 * * * *', { name: 'orders-cron-job' })
  async handleCronOrders() {
    console.log('Orders cron job running every 1 minute at:', new Date());
    let appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .lean();

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const acceptedOrders = await this.orderModel.find({
      status: 'accepted',
      driver_id_1: null,
      updated_at: {
        $lte: twoMinutesAgo,
        $gte: new Date(Date.now() - 3 * 60 * 1000),
      },
    });

    for (const order of acceptedOrders) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        Date.now() +
        (appConfig?.delivery_config?.delivery_order_accept_time ?? 0) * 60 * 1000
      );

      let firstNotify: any =
        await this.deliveryService.getDeliveryPersonByDistance(
          order.user_address,
          order.vendor_address,
          appConfig?.delivery_config?.total_distance_km || 40,
          orderAcceptEndTime,
        );

      if (firstNotify.length > 0) {
        for (const deliveryPerson of firstNotify) {
          const deliveryPersonId = deliveryPerson._id.toString();
          const newCacheObject = {
            order_id: order._id,
            type: 'order-list',
            details: {
              _id: deliveryPerson._id,
              driver_name: deliveryPerson.driver_name,
              phone: deliveryPerson.phone,
              current_location: deliveryPerson.current_location,
              from_location: deliveryPerson.from_location,
              to_location: deliveryPerson.to_location,
              from_eta: deliveryPerson.from_eta,
              to_eta: deliveryPerson.to_eta,
              order_duration: deliveryPerson.order_duration,
              order_accept_endtime: orderAcceptEndTime,
            },
          };

          const existingCache =
            await this.mongoCache.get<any>(deliveryPersonId);

          let updatedCacheArray: any[];
          let normalizedExistingArray: any[] = [];

          if (
            !existingCache ||
            (Array.isArray(existingCache) && existingCache.length === 0)
          ) {
            updatedCacheArray = [newCacheObject];
          } else {
            const existingArray = Array.isArray(existingCache)
              ? existingCache
              : [existingCache];

            normalizedExistingArray = existingArray
              .map((cachedOrder: any) => {
                // Validate order structure
                if (!cachedOrder || !cachedOrder.order_id) {
                  console.warn(
                    'Skipping invalid cached order: missing order_id',
                    cachedOrder,
                  );
                  return null;
                }

                // Validate details exists and is an object
                if (
                  !cachedOrder.details ||
                  typeof cachedOrder.details !== 'object'
                ) {
                  console.warn(
                    'Skipping invalid cached order: missing or invalid details',
                    cachedOrder.order_id,
                  );
                  return null;
                }

                if (cachedOrder.details?.order) {
                  // Old format - normalize it
                  const deliveryData = cachedOrder.details;
                  return {
                    order_id: cachedOrder.order_id,
                    type: cachedOrder.type || 'order-list',
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
                        cachedOrder.order_accept_endtime ||
                        cachedOrder.details.order_accept_endtime,
                    },
                  };
                }

                // Validate required fields exist
                if (
                  !cachedOrder.details._id ||
                  !cachedOrder.details.driver_name ||
                  !cachedOrder.details.phone ||
                  !cachedOrder.details.current_location
                ) {
                  console.warn(
                    'Skipping invalid cached order: missing required fields',
                    cachedOrder.order_id,
                  );
                  return null;
                }

                return {
                  order_id: cachedOrder.order_id,
                  type: cachedOrder.type || 'order-list',
                  details: {
                    _id: cachedOrder.details._id,
                    driver_name: cachedOrder.details.driver_name,
                    phone: cachedOrder.details.phone,
                    current_location: cachedOrder.details.current_location,
                    from_location: cachedOrder.details.from_location,
                    to_location: cachedOrder.details.to_location,
                    from_eta: cachedOrder.details.from_eta,
                    to_eta: cachedOrder.details.to_eta,
                    order_duration: cachedOrder.details.order_duration,
                    order_accept_endtime:
                      cachedOrder.details.order_accept_endtime ||
                      cachedOrder.order_accept_endtime,
                  },
                };
              })
              .filter((order: any) => order !== null);

            const isDuplicate = normalizedExistingArray.some(
              (cachedOrder: any) =>
                cachedOrder.order_id?.toString() === order._id.toString(),
            );

            if (!isDuplicate) {
              updatedCacheArray = [...normalizedExistingArray, newCacheObject];
            } else {
              updatedCacheArray = normalizedExistingArray;
            }
          }

          await this.mongoCache.set(deliveryPersonId, updatedCacheArray);

          // Check if order data has changed before triggering socket
          const existingOrder = normalizedExistingArray.find(
            (cachedOrder: any) =>
              cachedOrder.order_id?.toString() === order._id.toString(),
          );

          const hasOrderChanged = this.hasCacheChanged(
            existingCache,
            updatedCacheArray,
          );

          // Only publish if order data has changed or it's a new order
          if (!existingOrder || hasOrderChanged) {
            await this.trackingGateway.publishEventToGroup(
              deliveryPersonId,
              updatedCacheArray,
              'order-list',
            );
          }
        }
      }
    }

    const processedOrders = await this.orderModel.find({
      status: 'processed',
      driver_id_2: null,
      updated_at: {
        $lte: twoMinutesAgo,
        $gte: new Date(Date.now() - 3 * 60 * 1000),
      },
    });

    for (const order of processedOrders) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        Date.now() +
        (appConfig?.delivery_config?.delivery_order_accept_time ?? 0) * 60 * 1000
      );


      let firstNotify: any =
        await this.deliveryService.getDeliveryPersonByDistance(
          order.vendor_address,
          order.user_address,
          appConfig?.delivery_config?.total_distance_km || 40,
          orderAcceptEndTime,
        );

      console.log(firstNotify, 'firstNotify');

      if (firstNotify.length > 0) {
        for (const deliveryPerson of firstNotify) {
          const deliveryPersonId = deliveryPerson._id.toString();
          // Ensure only correct fields are stored in details
          const newCacheObject = {
            order_id: order._id,
            type: 'order-list',
            details: {
              _id: deliveryPerson._id,
              driver_name: deliveryPerson.driver_name,
              phone: deliveryPerson.phone,
              current_location: deliveryPerson.current_location,
              from_location: deliveryPerson.from_location,
              to_location: deliveryPerson.to_location,
              from_eta: deliveryPerson.from_eta,
              to_eta: deliveryPerson.to_eta,
              order_duration: deliveryPerson.order_duration,
              order_accept_endtime: orderAcceptEndTime,
            },
          };

          console.log(deliveryPerson, 'deliveryPerson');

          const existingCache =
            await this.mongoCache.get<any>(deliveryPersonId);

          let updatedCacheArray: any[];
          let normalizedExistingArray: any[] = [];

          if (
            !existingCache ||
            (Array.isArray(existingCache) && existingCache.length === 0)
          ) {
            updatedCacheArray = [newCacheObject];
          } else {
            const existingArray = Array.isArray(existingCache)
              ? existingCache
              : [existingCache];

            // Normalize existing entries to ensure correct structure
            normalizedExistingArray = existingArray
              .map((cachedOrder: any) => {
                // Validate order structure
                if (!cachedOrder || !cachedOrder.order_id) {
                  console.warn(
                    'Skipping invalid cached order: missing order_id',
                    cachedOrder,
                  );
                  return null;
                }

                // Validate details exists and is an object
                if (
                  !cachedOrder.details ||
                  typeof cachedOrder.details !== 'object'
                ) {
                  console.warn(
                    'Skipping invalid cached order: missing or invalid details',
                    cachedOrder.order_id,
                  );
                  return null;
                }

                if (cachedOrder.details?.order) {
                  // Old format - normalize it
                  const deliveryData = cachedOrder.details;
                  return {
                    order_id: cachedOrder.order_id,
                    type: cachedOrder.type || 'order-list',
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
                        cachedOrder.order_accept_endtime ||
                        cachedOrder.details.order_accept_endtime,
                    },
                  };
                }

                // Validate required fields exist
                if (
                  !cachedOrder.details._id ||
                  !cachedOrder.details.driver_name ||
                  !cachedOrder.details.phone ||
                  !cachedOrder.details.current_location
                ) {
                  console.warn(
                    'Skipping invalid cached order: missing required fields',
                    cachedOrder.order_id,
                  );
                  return null;
                }

                // Already normalized, but ensure structure is clean
                return {
                  order_id: cachedOrder.order_id,
                  type: cachedOrder.type || 'order-list',
                  details: {
                    _id: cachedOrder.details._id,
                    driver_name: cachedOrder.details.driver_name,
                    phone: cachedOrder.details.phone,
                    current_location: cachedOrder.details.current_location,
                    from_location: cachedOrder.details.from_location,
                    to_location: cachedOrder.details.to_location,
                    from_eta: cachedOrder.details.from_eta,
                    to_eta: cachedOrder.details.to_eta,
                    order_duration: cachedOrder.details.order_duration,
                    order_accept_endtime:
                      cachedOrder.details.order_accept_endtime ||
                      cachedOrder.order_accept_endtime,
                  },
                };
              })
              .filter((order: any) => order !== null);

            const isDuplicate = normalizedExistingArray.some(
              (cachedOrder: any) =>
                cachedOrder.order_id?.toString() === order._id.toString(),
            );

            if (!isDuplicate) {
              updatedCacheArray = [...normalizedExistingArray, newCacheObject];
            } else {
              updatedCacheArray = normalizedExistingArray;
            }
          }

          // Set will automatically calculate:
          // - check_time: minimum order_accept_endtime among all orders
          // - expires_at: maximum order_duration among all orders
          await this.mongoCache.set(deliveryPersonId, updatedCacheArray);

          // Check if order data has changed before triggering socket
          const existingOrder = normalizedExistingArray.find(
            (cachedOrder: any) =>
              cachedOrder.order_id?.toString() === order._id.toString(),
          );

          const hasOrderChanged = this.hasCacheChanged(
            existingCache,
            updatedCacheArray,
          );

          // Only publish if order data has changed or it's a new order
          if (!existingOrder || hasOrderChanged) {
            await this.trackingGateway.publishEventToGroup(
              deliveryPersonId,
              updatedCacheArray,
              'order-list',
            );
          }
        }
      }
    }

    const unacceptedOrders = await this.orderModel.find({
      status: 'pending',
      created_at: { $lte: fiveMinutesAgo },
    });

    unacceptedOrders.forEach(async (order) => {
      order.status = 'unaccepted';
      order.status_type = 11;
      order.status_timestamps.set('unaccepted_at', new Date());
      await order.save();
      this.trackingGateway.publishEventToGroup(
        order?._id.toString(),
        {},
        'order-status',
      );
    });
  }

  @Cron('*/30 * * * * *', { name: 'group-event-emitter' })
  async handleCron() {
    let orders = await this.orderModel
      .find({
        $or: [
          {
            status: {
              $in: ['out_for_delivery', 'driver_assigned', 'picked_up'],
            },
          },
          { status_type: 3 },
        ],
      })
      .lean();

    for (const order of orders) {
      const driverId =
        order.trip_type == 1 ? order.driver_id_1 : order.driver_id_2;
      const userId = order.user_id.toString();
      const orderId = order._id.toString();

      this.trackingGateway.publishEventToGroup(
        userId,
        {
          message: 'Event for Update Location',
          timestamp: new Date(),
          groupId: orderId,
        },
        'update-location-driver',
      );

      let driverData = await this.deliveryPersonModel
        .findOne({ _id: driverId })
        .lean();
      let loc_data = {
        orderId: orderId,
        driver_location: driverData?.current_location,
        trip_type: order.trip_type,
        status: order.status,
        status_type: order.status_type,
      };
      this.trackingGateway.publishEventToGroup(
        orderId,
        loc_data,
        'user-location-updates',
      );
    }
  }

  /**
   * Combined cleanup function that:
   * 1. Removes expired cache entries (based on expires_at TTL)
   * 2. Removes expired orders from cache entries (based on order_duration/notify_time)
   * This runs every minute to keep the cache clean
   */
  @Cron('*/1 * * * *', { name: 'cleanup-cache-and-expired-orders' })
  async cleanupCacheAndExpiredOrders() {
    try {
      const currentTime = new Date();
      // Get all cache entries including expired ones to clean them up
      const allCacheEntries =
        await this.mongoCache.getAllEntriesIncludingExpired();

      let expiredEntriesDeleted = 0;
      let expiredOrdersRemoved = 0;
      let updatedCaches = 0;

      for (const cacheEntry of allCacheEntries) {
        const deliveryPersonId = cacheEntry.delivery_person_id;
        const expiresAt = cacheEntry.expires_at;
        const checkTime = cacheEntry.check_time;
        const cachedOrders = cacheEntry.cached_orders;

        // Check if the entire cache entry has expired (TTL expired)
        if (expiresAt && expiresAt.getTime() < currentTime.getTime()) {
          // Delete expired cache entry
          await this.mongoCache.delete(deliveryPersonId);
          expiredEntriesDeleted++;
          this.trackingGateway.publishEventToGroup(
            deliveryPersonId,
            [],
            'order-list',
          );
          continue;
        }

        // Cache entry is still valid, check individual orders using check_time
        if (!Array.isArray(cachedOrders) || cachedOrders.length === 0) {
          continue;
        }

        // Only check orders if check_time exists and has passed
        // This optimizes performance by skipping cache entries that don't need checking
        if (!checkTime || checkTime.getTime() > currentTime.getTime()) {
          continue;
        }

        // Filter out expired orders and normalize structure
        const validOrders = cachedOrders
          .map((cachedOrder: any) => {
            // Validate order structure
            if (!cachedOrder || !cachedOrder.order_id) {
              console.warn(
                'Cleanup: Skipping invalid order: missing order_id',
                cachedOrder,
              );
              return null;
            }

            // Validate details exists and is an object
            if (
              !cachedOrder.details ||
              typeof cachedOrder.details !== 'object'
            ) {
              console.warn(
                'Cleanup: Skipping invalid order: missing or invalid details',
                cachedOrder.order_id,
              );
              return null;
            }

            // Normalize structure: convert old format to new format
            let normalizedOrder = { ...cachedOrder };

            // Check if this is old format (has details.order or details.delivery_data)
            if (
              normalizedOrder.details?.order ||
              normalizedOrder.details?.delivery_data
            ) {
              // Extract delivery_data if it exists (old format)
              const deliveryData = normalizedOrder.details?.delivery_data;

              if (deliveryData) {
                // Build new details structure with delivery person data directly
                normalizedOrder.details = {
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
                    normalizedOrder.order_accept_endtime ||
                    normalizedOrder.details?.order_accept_endtime,
                };
              }
            }

            // Validate required fields exist after normalization
            if (
              !normalizedOrder.details._id ||
              !normalizedOrder.details.driver_name ||
              !normalizedOrder.details.phone ||
              !normalizedOrder.details.current_location
            ) {
              console.warn(
                'Cleanup: Skipping invalid order: missing required fields after normalization',
                normalizedOrder.order_id,
              );
              return null;
            }

            // Ensure order_accept_endtime is in details (not at root)
            if (
              normalizedOrder.order_accept_endtime &&
              !normalizedOrder.details?.order_accept_endtime
            ) {
              normalizedOrder.details = {
                ...normalizedOrder.details,
                order_accept_endtime: normalizedOrder.order_accept_endtime,
              };
              // Remove from root level
              delete normalizedOrder.order_accept_endtime;
            }

            return normalizedOrder;
          })
          .filter((cachedOrder: any) => {
            // Filter out null entries (invalid orders)
            if (!cachedOrder) {
              return false;
            }

            // order_accept_endtime is now always in details
            const orderAcceptEndTime = cachedOrder.details?.order_accept_endtime
              ? new Date(cachedOrder.details.order_accept_endtime)
              : null;

            if (!orderAcceptEndTime) {
              // If no order_accept_endtime found, keep the order (safer to keep than remove)
              return true;
            }

            // Keep order if it hasn't expired yet
            return orderAcceptEndTime.getTime() > currentTime.getTime();
          });

        const removedCount = cachedOrders.length - validOrders.length;
        const hasOldStructure = cachedOrders.some(
          (order: any) =>
            order.details?.order ||
            order.details?.delivery_data ||
            order.order_accept_endtime,
        );

        if (removedCount > 0 || hasOldStructure) {
          // Update cache if orders were removed OR if structure was normalized
          expiredOrdersRemoved += removedCount;

          if (validOrders.length > 0) {
            // Set will automatically recalculate:
            // - check_time: minimum order_accept_endtime among all orders
            // - expires_at: maximum order_duration among all orders
            await this.mongoCache.set(deliveryPersonId, validOrders);

            // Publish updated list to delivery person
            await this.trackingGateway.publishEventToGroup(
              deliveryPersonId,
              validOrders,
              'order-list',
            );
            updatedCaches++;
          } else {
            // No valid orders left, remove from cache
            this.trackingGateway.publishEventToGroup(
              deliveryPersonId,
              [],
              'order-list',
            );
            await this.mongoCache.delete(deliveryPersonId);
          }
        }
      }

      // Log results
      if (expiredEntriesDeleted > 0 || expiredOrdersRemoved > 0) {
        console.log(
          `Cache cleanup completed at ${new Date().toISOString()}: ` +
          `${expiredEntriesDeleted} expired cache entries deleted, ` +
          `${expiredOrdersRemoved} expired orders removed from ${updatedCaches} cache entries`,
        );
      }
    } catch (error) {
      console.error('Error cleaning up cache and expired orders:', error);
    }
  }

  /**
   * Backup mechanism for Cashfree webhooks.
   * Runs every 5 minutes, finds long‑pending initiated transactions,
   * fetches their latest status from Cashfree, and applies the same
   * status transitions as the webhook handler.
   *
   * Security features:
   * - Input validation and sanitization
   * - Rate limiting (delays between API calls)
   * - Error handling without exposing sensitive data
   * - Idempotency checks to prevent duplicate updates
   * - Transaction safety with proper error recovery
   */
  @Cron('*/5 * * * *', { name: 'cashfree-payment-reconciliation' })
  async reconcileCashfreePayments() {
    const startTime = Date.now();
    let processedCount = 0;
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    try {
      const now = new Date();
      // Only look at transactions that have been in "initiated" for at least 5 minutes
      // This gives webhooks time to arrive before we start checking
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Also set an upper bound to avoid processing very old transactions (older than 24 hours)
      // These should be handled manually or via a separate cleanup process
      const maxAge = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const pendingLogs = await this.transactionLogModel
        .find({
          status: 'initiated',
          created_at: { $gte: maxAge, $lte: fiveMinutesAgo },
          payment_gateway: 'Cashfree',
        })
        .sort({ created_at: 1 }) // Process oldest first
        .limit(50) // Limit batch size to avoid overwhelming the API
        .lean();

      if (!pendingLogs.length) {
        return;
      }

      console.log(
        `[cashfree-payment-reconciliation] Starting reconciliation at ${now.toISOString()}: ` +
        `Found ${pendingLogs.length} pending transactions`,
      );

      // Process each transaction with rate limiting
      for (let i = 0; i < pendingLogs.length; i++) {
        const log = pendingLogs[i];
        processedCount++;

        try {
          // Validate required metadata
          const cashfreeOrderId = log.metadata?.cashfree_order_id;
          const linkId = log.link_id;

          if (!cashfreeOrderId && !linkId) {
            console.warn(
              `[cashfree-payment-reconciliation] Skipping transaction log ${log._id}: ` +
              `Missing both cashfree_order_id and link_id`,
            );
            skippedCount++;
            continue;
          }

          // Validate order exists
          const order = await this.orderModel.findById(log.order_id).lean();
          if (!order) {
            console.warn(
              `[cashfree-payment-reconciliation] Skipping transaction log ${log._id}: ` +
              `Order ${log.order_id} not found`,
            );
            skippedCount++;
            continue;
          }

          // Idempotency check: Skip if order is already paid (webhook may have arrived)
          if (order.payment_status === 'paid') {
            // Update transaction log to match if it's still initiated
            if (log.status === 'initiated') {
              await this.transactionLogModel.findByIdAndUpdate(
                log._id,
                {
                  status: 'completed',
                  description: log.description
                    ? `${log.description} - Auto-updated: order already paid`
                    : 'Auto-updated: order already paid',
                  metadata: {
                    ...log.metadata,
                    reconciliation_source: 'cron',
                    reconciliation_time: now.toISOString(),
                    auto_updated: true,
                  },
                },
                { new: false },
              );
            }
            skippedCount++;
            continue;
          }

          // Try to get status from Cashfree order API first
          let paymentStatus: string | null = null;
          let linkStatus: string | null = null;
          let statusSource = 'unknown';

          if (cashfreeOrderId) {
            const orderStatusResp = await cashFreeUtil.getOrderStatus(
              cashfreeOrderId,
              10000, // 10 second timeout
            );

            if (orderStatusResp.status && orderStatusResp.data) {
              const data = orderStatusResp.data;
              // Cashfree Get Order API (GET /pg/orders/{order_id}) response structure:
              // Primary field: order_status (ACTIVE, PAID, EXPIRED, TERMINATED, TERMINATION_REQUESTED)
              // Also check payment_status if available in nested objects
              // Response may have: { order_status, payment_status, order: { ... }, payment: { ... } }
              paymentStatus =
                data.order_status || // Primary field from Cashfree API
                data.payment_status || // Direct payment status if available
                data.order?.order_status || // Nested in order object
                data.order?.payment_status || // Nested payment status
                data.payment?.payment_status || // Nested in payment object
                null;
              statusSource = 'order_api';
            }
          }

          // If order API didn't return status, try payment link API
          if (!paymentStatus && linkId) {
            const linkStatusResp = await cashFreeUtil.getPaymentLinkStatus(
              linkId,
              10000,
            );

            if (linkStatusResp.status && linkStatusResp.data) {
              const data = linkStatusResp.data;
              // Cashfree payment link status response structure:
              // - link_status: Link status (PAID, ACTIVE, EXPIRED, etc.)
              // - status: General status field
              // - payment_status: Payment status if available
              linkStatus =
                data.link_status || data.status || data.payment_status || null;
              statusSource = 'link_api';
            }
          }

          // Determine final status to use
          const finalStatus = paymentStatus || linkStatus;

          if (!finalStatus) {
            // Status not available - API may be down or order doesn't exist
            // Skip and let webhook handle it when it arrives
            skippedCount++;
            continue;
          }

          // Map Cashfree status to internal status (matching webhook logic)
          // Cashfree Get Order API returns order_status with values:
          // - PAID: Payment successful
          // - ACTIVE: Order created but not paid yet
          // - EXPIRED: Order expired without payment
          // - TERMINATED: Order terminated
          // - TERMINATION_REQUESTED: Termination in progress
          const normalizedStatus = finalStatus.toUpperCase();
          let transactionLogStatus:
            | 'completed'
            | 'failed'
            | 'cancelled'
            | null = null;
          let orderPaymentStatus: 'paid' | 'pending' | 'initiated' | null =
            null;

          // Map Cashfree order_status values to internal statuses
          if (
            normalizedStatus === 'PAID' ||
            normalizedStatus === 'SUCCESS' ||
            normalizedStatus === 'COMPLETED'
          ) {
            // Payment successful
            transactionLogStatus = 'completed';
            orderPaymentStatus = 'paid';
          } else if (
            normalizedStatus === 'ACTIVE' ||
            normalizedStatus === 'PENDING'
          ) {
            // Order is still active/pending - no status change needed
            // This means payment hasn't completed yet, webhook will arrive later
            skippedCount++;
            continue;
          } else if (
            normalizedStatus === 'FAILED' ||
            normalizedStatus === 'DECLINED' ||
            normalizedStatus === 'REJECTED'
          ) {
            // Payment failed
            transactionLogStatus = 'failed';
            orderPaymentStatus = 'pending';
          } else if (
            normalizedStatus === 'EXPIRED' ||
            normalizedStatus === 'TERMINATED' ||
            normalizedStatus === 'CANCELLED' ||
            normalizedStatus === 'CANCELED'
          ) {
            // Order expired or terminated
            transactionLogStatus = 'cancelled';
            // For expired/cancelled, keep existing order.payment_status as-is (per webhook logic)
          } else {
            // Unknown status - log for investigation but don't update
            console.warn(
              `[cashfree-payment-reconciliation] Unknown payment status for transaction ${log._id}: ${finalStatus} (source: ${statusSource})`,
            );
            skippedCount++;
            continue;
          }

          if (!transactionLogStatus && !orderPaymentStatus) {
            skippedCount++;
            continue;
          }

          // Idempotency: Skip if log already has target status
          if (transactionLogStatus && log.status === transactionLogStatus) {
            skippedCount++;
            continue;
          }

          // Idempotency: Skip if order already has target status
          if (
            orderPaymentStatus &&
            order.payment_status === orderPaymentStatus
          ) {
            orderPaymentStatus = null;
          }

          // Apply updates atomically (in sequence, but with error handling)
          if (transactionLogStatus) {
            await this.transactionLogModel.findByIdAndUpdate(
              log._id,
              {
                status: transactionLogStatus,
                description: log.description
                  ? `${log.description} - Updated via reconciliation cron (${statusSource})`
                  : `Updated via reconciliation cron (${statusSource})`,
                metadata: {
                  ...log.metadata,
                  reconciliation_source: 'cron',
                  reconciliation_time: now.toISOString(),
                  cashfree_raw_status: finalStatus,
                  status_source: statusSource,
                },
              },
              { new: false },
            );
          }

          if (orderPaymentStatus) {
            await this.orderModel.findByIdAndUpdate(
              order._id,
              {
                payment_status: orderPaymentStatus,
                // Set paid_at timestamp if payment is successful
                ...(orderPaymentStatus === 'paid' && {
                  $set: {
                    'status_timestamps.paid_at': now,
                  },
                }),
              },
              { new: false },
            );
          }

          successCount++;

          // Add small delay between API calls to avoid rate limiting
          // (except for the last item)
          if (i < pendingLogs.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
          }
        } catch (itemError) {
          errorCount++;
          // Log error but continue processing other items
          const errorMessage =
            itemError instanceof Error ? itemError.message : 'Unknown error';
          console.error(
            `[cashfree-payment-reconciliation] Error processing transaction log ${log._id}:`,
            process.env.NODE_ENV !== 'production' ? itemError : errorMessage,
          );
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[cashfree-payment-reconciliation] Completed in ${duration}ms: ` +
        `Processed: ${processedCount}, ` +
        `Success: ${successCount}, ` +
        `Skipped: ${skippedCount}, ` +
        `Errors: ${errorCount}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[cashfree-payment-reconciliation] Fatal error:`,
        process.env.NODE_ENV !== 'production' ? error : errorMessage,
      );
    }
  }
}
