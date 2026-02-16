import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../delivery/tracking.gateway';
import { DeliveryService } from '../delivery/delivery.service';
import { PrismaCacheService } from '../store/prisma-cache.service';
import { cashFreeUtil } from 'src/utils/cashFree.util';

@Injectable()
export class CronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
    private readonly deliveryService: DeliveryService,
    private readonly mongoCache: PrismaCacheService,
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

  /**
   * Helper to construct user address object from flattened Prisma order fields
   */
  private buildUserAddress(order: any) {
    return {
      label: order.userAddressLabel,
      address_line1: order.userAddressLine1,
      address_line2: order.userAddressLine2,
      city: order.userCity,
      state: order.userState,
      pincode: order.userPincode,
      latitude: order.userLatitude,
      longitude: order.userLongitude,
      is_default: order.userIsDefault,
    };
  }

  /**
   * Helper to construct vendor address object from flattened Prisma order fields
   */
  private buildVendorAddress(order: any) {
    return {
      address_line1: order.vendorAddressLine1,
      address_line2: order.vendorAddressLine2,
      city: order.vendorCity,
      state: order.vendorState,
      pincode: order.vendorPincode,
      latitude: order.vendorLatitude,
      longitude: order.vendorLongitude,
      landmark: order.vendorLandmark,
    };
  }

  @Cron('*/1 * * * *', { name: 'orders-cron-job' })
  async handleCronOrders() {
    console.log('Orders cron job running every 1 minute at:', new Date());
    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
    });

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const acceptedOrders = await this.prisma.order.findMany({
      where: {
        status: 'accepted',
        driverId1: null,
        updatedAt: {
          lte: twoMinutesAgo,
          gte: new Date(Date.now() - 3 * 60 * 1000),
        },
      },
    });

    for (const order of acceptedOrders) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        Date.now() +
        (appConfig?.deliveryOrderAcceptTime ?? 0) * 60 * 1000
      );

      const userAddress = this.buildUserAddress(order);
      const vendorAddress = this.buildVendorAddress(order);

      let firstNotify: any =
        await this.deliveryService.getDeliveryPersonByDistance(
          userAddress,
          vendorAddress,
          appConfig?.totalDistanceKm || 40,
          orderAcceptEndTime,
        );

      if (firstNotify.length > 0) {
        for (const deliveryPerson of firstNotify) {
          const deliveryPersonId = (deliveryPerson.id || deliveryPerson._id).toString();
          const newCacheObject = {
            order_id: order.id,
            type: 'order-list',
            details: {
              _id: deliveryPerson.id || deliveryPerson._id,
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
            await this.mongoCache.get(deliveryPersonId);

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
                cachedOrder.order_id?.toString() === order.id.toString(),
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
              cachedOrder.order_id?.toString() === order.id.toString(),
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

    const processedOrders = await this.prisma.order.findMany({
      where: {
        status: 'processed',
        driverId2: null,
        updatedAt: {
          lte: twoMinutesAgo,
          gte: new Date(Date.now() - 3 * 60 * 1000),
        },
      },
    });

    for (const order of processedOrders) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        Date.now() +
        (appConfig?.deliveryOrderAcceptTime ?? 0) * 60 * 1000
      );

      const vendorAddress = this.buildVendorAddress(order);
      const userAddress = this.buildUserAddress(order);

      let firstNotify: any =
        await this.deliveryService.getDeliveryPersonByDistance(
          vendorAddress,
          userAddress,
          appConfig?.totalDistanceKm || 40,
          orderAcceptEndTime,
        );

      console.log(firstNotify, 'firstNotify');

      if (firstNotify.length > 0) {
        for (const deliveryPerson of firstNotify) {
          const deliveryPersonId = (deliveryPerson.id || deliveryPerson._id).toString();
          // Ensure only correct fields are stored in details
          const newCacheObject = {
            order_id: order.id,
            type: 'order-list',
            details: {
              _id: deliveryPerson.id || deliveryPerson._id,
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
            await this.mongoCache.get(deliveryPersonId);

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
                cachedOrder.order_id?.toString() === order.id.toString(),
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
              cachedOrder.order_id?.toString() === order.id.toString(),
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

    const unacceptedOrders = await this.prisma.order.findMany({
      where: {
        status: 'pending',
        createdAt: { lte: fiveMinutesAgo },
      },
    });

    for (const order of unacceptedOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'unaccepted',
          statusType: 11,
          statusTimestamps: {
            ...((order.statusTimestamps as Record<string, any>) || {}),
            unaccepted_at: new Date().toISOString(),
          },
        },
      });
      this.trackingGateway.publishEventToGroup(
        order.id.toString(),
        {},
        'order-status',
      );
    }
  }

  @Cron('*/30 * * * * *', { name: 'group-event-emitter' })
  async handleCron() {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          {
            status: {
              in: ['out_for_delivery', 'driver_assigned', 'picked_up'],
            },
          },
          { statusType: 3 },
        ],
      },
    });

    for (const order of orders) {
      const driverId =
        order.tripType == 1 ? order.driverId1 : order.driverId2;
      const userId = order.userId.toString();
      const orderId = order.id.toString();

      this.trackingGateway.publishEventToGroup(
        userId,
        {
          message: 'Event for Update Location',
          timestamp: new Date(),
          groupId: orderId,
        },
        'update-location-driver',
      );

      const driverData = driverId
        ? await this.prisma.deliveryPerson.findUnique({ where: { id: driverId } })
        : null;
      const loc_data = {
        orderId: orderId,
        driver_location: driverData
          ? {
              latitude: driverData.currentLatitude,
              longitude: driverData.currentLongitude,
            }
          : null,
        trip_type: order.tripType,
        status: order.status,
        status_type: order.statusType,
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
        const deliveryPersonId = cacheEntry.deliveryPersonId;
        const expiresAt = cacheEntry.expiresAt;
        const checkTime = cacheEntry.checkTime;
        const cachedOrders = cacheEntry.cachedOrders;

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

      const pendingLogs = await this.prisma.transactionLog.findMany({
        where: {
          status: 'initiated',
          createdAt: { gte: maxAge, lte: fiveMinutesAgo },
          paymentGateway: 'Cashfree',
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

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
          const cashfreeOrderId = (log.metadata as any)?.cashfree_order_id;
          const linkId = log.linkId;

          if (!cashfreeOrderId && !linkId) {
            console.warn(
              `[cashfree-payment-reconciliation] Skipping transaction log ${log.id}: ` +
              `Missing both cashfree_order_id and link_id`,
            );
            skippedCount++;
            continue;
          }

          // Validate order exists
          const order = await this.prisma.order.findUnique({
            where: { id: log.orderId },
          });
          if (!order) {
            console.warn(
              `[cashfree-payment-reconciliation] Skipping transaction log ${log.id}: ` +
              `Order ${log.orderId} not found`,
            );
            skippedCount++;
            continue;
          }

          // Idempotency check: Skip if order is already paid (webhook may have arrived)
          if (order.paymentStatus === 'paid') {
            // Update transaction log to match if it's still initiated
            if (log.status === 'initiated') {
              await this.prisma.transactionLog.update({
                where: { id: log.id },
                data: {
                  status: 'completed',
                  description: log.description
                    ? `${log.description} - Auto-updated: order already paid`
                    : 'Auto-updated: order already paid',
                  metadata: {
                    ...((log.metadata as Record<string, any>) || {}),
                    reconciliation_source: 'cron',
                    reconciliation_time: now.toISOString(),
                    auto_updated: true,
                  },
                },
              });
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
              `[cashfree-payment-reconciliation] Unknown payment status for transaction ${log.id}: ${finalStatus} (source: ${statusSource})`,
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
            order.paymentStatus === orderPaymentStatus
          ) {
            orderPaymentStatus = null;
          }

          // Apply updates atomically (in sequence, but with error handling)
          if (transactionLogStatus) {
            await this.prisma.transactionLog.update({
              where: { id: log.id },
              data: {
                status: transactionLogStatus,
                description: log.description
                  ? `${log.description} - Updated via reconciliation cron (${statusSource})`
                  : `Updated via reconciliation cron (${statusSource})`,
                metadata: {
                  ...((log.metadata as Record<string, any>) || {}),
                  reconciliation_source: 'cron',
                  reconciliation_time: now.toISOString(),
                  cashfree_raw_status: finalStatus,
                  status_source: statusSource,
                },
              },
            });
          }

          if (orderPaymentStatus) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: orderPaymentStatus,
                // Set paid_at timestamp if payment is successful
                ...(orderPaymentStatus === 'paid' && {
                  statusTimestamps: {
                    ...((order.statusTimestamps as Record<string, any>) || {}),
                    paid_at: now.toISOString(),
                  },
                }),
              },
            });
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
            `[cashfree-payment-reconciliation] Error processing transaction log ${log.id}:`,
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
