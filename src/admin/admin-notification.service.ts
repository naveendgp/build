import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../notification-module/fcm.service';
import { SendNotificationDto, RecipientType } from './dto/send-notification.dto';

@Injectable()
export class AdminNotificationService {
    private readonly logger = new Logger(AdminNotificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fcmService: FcmService,
    ) { }

    /**
     * Send notification to recipients and persist records in DB.
     */
    async sendNotification(dto: SendNotificationDto, adminId: string) {
        const { title, message, recipientType, recipientIds } = dto;

        // Map recipientType to Prisma's NotificationRole
        const roleMap: Record<string, 'user' | 'vendor' | 'delivery'> = {
            user: 'user',
            vendor: 'vendor',
            deliveryperson: 'delivery',
        };
        const recipientRole = roleMap[recipientType];
        if (!recipientRole) {
            throw new BadRequestException(
                `Invalid recipientType: ${recipientType}`,
            );
        }

        // Fetch recipient IDs (all or specific)
        let targetIds: string[];
        if (recipientIds && recipientIds.length > 0) {
            targetIds = recipientIds;
        } else {
            targetIds = await this.getAllRecipientIds(recipientRole);
        }

        if (targetIds.length === 0) {
            return {
                message: 'No recipients found for the specified type',
                successCount: 0,
                failureCount: 0,
            };
        }

        this.logger.log(
            `Sending notification to ${targetIds.length} ${recipientType}(s): "${title}"`,
        );

        // Step 1: Persist notification records in DB (bulk insert)
        const notificationData = targetIds.map((id) => {
            const base: any = {
                recipientRole,
                title,
                message,
                type: 'system',
                metadata: { sent_by: adminId, batch_notification: targetIds.length > 1 },
            };

            // Set the correct polymorphic FK
            switch (recipientRole) {
                case 'user':
                    base.userId = id;
                    break;
                case 'vendor':
                    base.vendorId = id;
                    break;
                case 'delivery':
                    base.deliveryPersonId = id;
                    break;
            }

            return base;
        });

        try {
            await this.prisma.notification.createMany({ data: notificationData });
            this.logger.log(
                `Created ${notificationData.length} notification records in DB`,
            );
        } catch (dbError) {
            this.logger.error(
                `Failed to create notification records: ${dbError?.message}`,
                dbError?.stack,
            );
            // Don't fail the whole operation — continue with FCM
        }

        // Step 2: Send FCM push notifications
        let fcmResult = { successCount: 0, failureCount: 0, failedTokens: [] as string[] };
        try {
            const fcmPayload = { title, body: message };

            if (recipientIds && recipientIds.length > 0) {
                fcmResult = await this.fcmService.sendToSpecificUsers(
                    recipientRole,
                    recipientIds,
                    fcmPayload,
                );
            } else {
                fcmResult = await this.fcmService.sendToAllUsers(recipientRole, fcmPayload);
            }
        } catch (fcmError) {
            this.logger.error(
                `FCM sending failed: ${fcmError?.message}`,
                fcmError?.stack,
            );
            // Don't fail — DB records are saved
        }

        return {
            message: `Notification sent to ${targetIds.length} recipient(s)`,
            successCount: fcmResult.successCount,
            failureCount: fcmResult.failureCount,
        };
    }

    /**
     * Get all recipient IDs for a given role.
     */
    private async getAllRecipientIds(
        role: 'user' | 'vendor' | 'delivery',
    ): Promise<string[]> {
        switch (role) {
            case 'user': {
                const users = await this.prisma.user.findMany({
                    select: { id: true },
                });
                return users.map((u) => u.id);
            }
            case 'vendor': {
                const vendors = await this.prisma.vendor.findMany({
                    select: { id: true },
                });
                return vendors.map((v) => v.id);
            }
            case 'delivery': {
                const deliveryPersons = await this.prisma.deliveryPerson.findMany({
                    select: { id: true },
                });
                return deliveryPersons.map((d) => d.id);
            }
            default:
                return [];
        }
    }

    /**
     * Get recipients list for the admin UI, with FCM token presence.
     */
    async getRecipients(type: string, search?: string) {
        switch (type) {
            case 'user':
                return this.getUserRecipients(search);
            case 'vendor':
                return this.getVendorRecipients(search);
            case 'deliveryperson':
                return this.getDeliveryRecipients(search);
            default:
                throw new BadRequestException(`Invalid recipient type: ${type}`);
        }
    }

    private async getUserRecipients(search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                fcmToken: true,
            },
            orderBy: { name: 'asc' },
        });

        return users.map((u) => ({
            id: u.id,
            name: u.name || 'Unnamed User',
            email: u.email || '',
            phone: u.phone,
            hasFcmToken: !!u.fcmToken,
        }));
    }

    private async getVendorRecipients(search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { ownerName: { contains: search, mode: 'insensitive' } },
                { shopName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const vendors = await this.prisma.vendor.findMany({
            where,
            select: {
                id: true,
                ownerName: true,
                shopName: true,
                email: true,
                phone: true,
                fcmToken: true,
            },
            orderBy: { ownerName: 'asc' },
        });

        return vendors.map((v) => ({
            id: v.id,
            name: v.ownerName || v.shopName || 'Unnamed Vendor',
            shopName: v.shopName,
            email: v.email || '',
            phone: v.phone,
            hasFcmToken: !!v.fcmToken,
        }));
    }

    private async getDeliveryRecipients(search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        const deliveryPersons = await this.prisma.deliveryPerson.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                fcmToken: true,
            },
            orderBy: { name: 'asc' },
        });

        return deliveryPersons.map((d) => ({
            id: d.id,
            name: d.name || 'Unnamed Agent',
            email: d.email || '',
            phone: d.phone,
            hasFcmToken: !!d.fcmToken,
        }));
    }
}
