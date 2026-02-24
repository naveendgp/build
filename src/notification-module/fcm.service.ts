import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FcmService {
    private readonly logger = new Logger(FcmService.name);

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Send push notification to a single FCM token.
     */
    async sendToToken(
        token: string,
        payload: { title: string; body: string; data?: Record<string, string> },
    ) {
        if (!token || typeof token !== 'string') {
            this.logger.warn('sendToToken called with invalid token');
            return { success: false, error: 'Invalid token' };
        }

        try {
            const firebaseAdmin = this.firebaseService.getFirebaseAdmin();
            const message: any = {
                notification: { title: payload.title, body: payload.body },
                data: payload.data || {},
                token,
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const result = await firebaseAdmin.messaging().send(message);
            return { success: true, messageId: result };
        } catch (error) {
            this.logger.error(`sendToToken failed: ${error?.message}`, error?.stack);
            return { success: false, error: error?.message };
        }
    }

    /**
     * Core batch sender: send push notification to multiple FCM tokens.
     * Chunks into batches of 500, processes sequentially with 100ms delay.
     */
    async sendToTokens(
        tokens: string[],
        payload: { title: string; body: string; data?: Record<string, string> },
    ) {
        // Filter out invalid tokens
        const validTokens = (tokens || []).filter(
            (t) => t && typeof t === 'string' && t.trim().length > 0,
        );

        if (validTokens.length === 0) {
            this.logger.warn('sendToTokens: No valid tokens to send to');
            return {
                successCount: 0,
                failureCount: 0,
                failedTokens: [],
                responses: [],
            };
        }

        this.logger.log(`sendToTokens: Sending to ${validTokens.length} valid tokens`);

        let firebaseAdmin: any;
        try {
            firebaseAdmin = this.firebaseService.getFirebaseAdmin();
        } catch (error) {
            this.logger.error('Firebase Admin not initialized, cannot send notifications');
            return {
                successCount: 0,
                failureCount: validTokens.length,
                failedTokens: validTokens,
                responses: [],
            };
        }

        const CHUNK_SIZE = 500;
        const DELAY_MS = 100;
        let totalSuccess = 0;
        let totalFailure = 0;
        const allFailedTokens: string[] = [];
        const allResponses: any[] = [];

        // Chunk tokens into batches of 500
        const chunks: string[][] = [];
        for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
            chunks.push(validTokens.slice(i, i + CHUNK_SIZE));
        }

        this.logger.log(`sendToTokens: Processing ${chunks.length} chunk(s)`);

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];

            const multicastMessage = {
                notification: { title: payload.title, body: payload.body },
                data: payload.data || {},
                tokens: chunk,
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            try {
                const response = await firebaseAdmin
                    .messaging()
                    .sendEachForMulticast(multicastMessage);

                totalSuccess += response.successCount;
                totalFailure += response.failureCount;

                // Collect failed tokens with error details
                response.responses.forEach((resp: any, idx: number) => {
                    allResponses.push(resp);
                    if (!resp.success) {
                        const failedToken = chunk[idx];
                        allFailedTokens.push(failedToken);
                        this.logger.warn(
                            `FCM failed for token ${failedToken?.substring(0, 20)}...: ` +
                            `code=${resp.error?.code}, message=${resp.error?.message}`,
                        );
                    }
                });

                this.logger.log(
                    `Chunk ${chunkIndex + 1}/${chunks.length}: ` +
                    `${response.successCount} success, ${response.failureCount} failures`,
                );
            } catch (error) {
                this.logger.error(
                    `Chunk ${chunkIndex + 1} failed entirely: ${error?.message}`,
                    error?.stack,
                );
                totalFailure += chunk.length;
                allFailedTokens.push(...chunk);
            }

            // Delay between chunks to avoid rate limiting
            if (chunkIndex < chunks.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
            }
        }

        this.logger.log(
            `sendToTokens complete: ${totalSuccess} success, ${totalFailure} failures out of ${validTokens.length} tokens`,
        );

        return {
            successCount: totalSuccess,
            failureCount: totalFailure,
            failedTokens: allFailedTokens,
            responses: allResponses,
        };
    }

    /**
     * Send push notification to ALL users of a given type.
     */
    async sendToAllUsers(
        userType: 'user' | 'vendor' | 'delivery',
        payload: { title: string; body: string; data?: Record<string, string> },
    ) {
        const tokens = await this.getTokensByType(userType);
        return this.sendToTokens(tokens, payload);
    }

    /**
     * Send push notification to specific users by IDs.
     */
    async sendToSpecificUsers(
        userType: 'user' | 'vendor' | 'delivery',
        userIds: string[],
        payload: { title: string; body: string; data?: Record<string, string> },
    ) {
        const tokens = await this.getTokensByTypeAndIds(userType, userIds);
        return this.sendToTokens(tokens, payload);
    }

    /**
     * Get all FCM tokens for a given user type.
     */
    private async getTokensByType(userType: 'user' | 'vendor' | 'delivery'): Promise<string[]> {
        let records: any[];

        switch (userType) {
            case 'user':
                records = await this.prisma.user.findMany({
                    where: { fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            case 'vendor':
                records = await this.prisma.vendor.findMany({
                    where: { fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            case 'delivery':
                records = await this.prisma.deliveryPerson.findMany({
                    where: { fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            default:
                return [];
        }

        return records.map((r) => r.fcmToken).filter(Boolean);
    }

    /**
     * Get FCM tokens for specific user IDs of a given type.
     */
    private async getTokensByTypeAndIds(
        userType: 'user' | 'vendor' | 'delivery',
        userIds: string[],
    ): Promise<string[]> {
        if (!userIds || userIds.length === 0) return [];

        let records: any[];

        switch (userType) {
            case 'user':
                records = await this.prisma.user.findMany({
                    where: { id: { in: userIds }, fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            case 'vendor':
                records = await this.prisma.vendor.findMany({
                    where: { id: { in: userIds }, fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            case 'delivery':
                records = await this.prisma.deliveryPerson.findMany({
                    where: { id: { in: userIds }, fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                break;
            default:
                return [];
        }

        return records.map((r) => r.fcmToken).filter(Boolean);
    }
}
