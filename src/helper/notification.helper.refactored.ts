// ============================================================================
// REFACTORED: notification.helper.ts — Prisma version
// Replaces Model<NotificationDocument> param with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   async createNotifications(recipients, params, notificationModel: Model<NotificationDocument>)
//   notificationModel.insertMany(notificationDocuments)
//   each doc had: recipient_id: new Types.ObjectId(id), recipient_role: 'user'
//
// AFTER (Prisma):
//   async createNotifications(recipients, params, prisma: PrismaService)
//   prisma.notification.createMany({ data: [...] })
//   each row has: userId/vendorId/deliveryPersonId (polymorphic nullable FKs)
// ============================================================================

import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'order' | 'payment' | 'system' | 'promotion';
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRecipients {
  users?: string[];
  vendors?: string[];
  drivers?: string[];
}

export interface CreateNotificationResult {
  success: boolean;
  createdCount: number;
  error?: string;
}

/**
 * Notification Helper — Prisma version
 *
 * KEY CHANGE: The Notification model now uses 3 separate nullable FK columns
 * (userId, vendorId, deliveryPersonId) instead of a single recipientId.
 * Only one FK is populated per row, determined by recipientRole.
 */
class NotificationHelper {
  /**
   * Create notifications for multiple recipients
   *
   * BEFORE: notificationModel.insertMany(notificationDocuments)
   * AFTER:  prisma.notification.createMany({ data: [...], skipDuplicates: true })
   */
  async createNotifications(
    recipients: NotificationRecipients,
    params: CreateNotificationParams,
    prisma: PrismaService,
  ): Promise<CreateNotificationResult> {
    try {
      if (!params.title || !params.message) {
        return { success: false, createdCount: 0, error: 'Title and message are required' };
      }

      const hasRecipients =
        (recipients.users && recipients.users.length > 0) ||
        (recipients.vendors && recipients.vendors.length > 0) ||
        (recipients.drivers && recipients.drivers.length > 0);

      if (!hasRecipients) {
        return { success: false, createdCount: 0, error: 'At least one recipient required' };
      }

      // Build notification rows with polymorphic FK columns
      const data: any[] = [];

      // BEFORE: { recipient_id: new Types.ObjectId(userId), recipient_role: 'user' }
      // AFTER:  { userId: userId, vendorId: null, deliveryPersonId: null, recipientRole: 'user' }
      if (recipients.users) {
        for (const userId of recipients.users) {
          data.push({
            userId,
            vendorId: null,
            deliveryPersonId: null,
            recipientRole: 'user',
            title: params.title,
            message: params.message,
            type: params.type || 'system',
            orderId: params.orderId || null,
            metadata: params.metadata && Object.keys(params.metadata).length > 0 ? params.metadata : undefined,
            isRead: false,
          });
        }
      }

      if (recipients.vendors) {
        for (const vendorId of recipients.vendors) {
          data.push({
            userId: null,
            vendorId,
            deliveryPersonId: null,
            recipientRole: 'vendor',
            title: params.title,
            message: params.message,
            type: params.type || 'system',
            orderId: params.orderId || null,
            metadata: params.metadata && Object.keys(params.metadata).length > 0 ? params.metadata : undefined,
            isRead: false,
          });
        }
      }

      if (recipients.drivers) {
        for (const driverId of recipients.drivers) {
          data.push({
            userId: null,
            vendorId: null,
            deliveryPersonId: driverId,
            recipientRole: 'delivery',
            title: params.title,
            message: params.message,
            type: params.type || 'system',
            orderId: params.orderId || null,
            metadata: params.metadata && Object.keys(params.metadata).length > 0 ? params.metadata : undefined,
            isRead: false,
          });
        }
      }

      // BEFORE: const created = await notificationModel.insertMany(docs);
      // AFTER:
      const result = await prisma.notification.createMany({
        data,
        skipDuplicates: true,
      });

      return { success: true, createdCount: result.count };
    } catch (error) {
      return {
        success: false,
        createdCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ── Convenience methods (same API, updated param type) ──

  async createUserNotification(userId: string, params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ users: [userId] }, params, prisma);
  }

  async createVendorNotification(vendorId: string, params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ vendors: [vendorId] }, params, prisma);
  }

  async createDriverNotification(driverId: string, params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ drivers: [driverId] }, params, prisma);
  }

  async createUsersNotifications(userIds: string[], params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ users: userIds }, params, prisma);
  }

  async createVendorsNotifications(vendorIds: string[], params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ vendors: vendorIds }, params, prisma);
  }

  async createDriversNotifications(driverIds: string[], params: CreateNotificationParams, prisma: PrismaService) {
    return this.createNotifications({ drivers: driverIds }, params, prisma);
  }
}

export const notificationHelper = new NotificationHelper();
