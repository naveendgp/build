import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateOfferDto,
    UpdateOfferDto,
    ValidateCouponDto,
    CouponValidationResponse,
    UserOfferResponse,
    ApplyCouponDto,
} from './dto';

@Injectable()
export class OfferService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new offer
     */
    async createOffer(dto: CreateOfferDto, createdBy: string) {
        console.log('Creating offer with DTO:', JSON.stringify(dto, null, 2));
        const existing = await this.prisma.offer.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (existing) {
            throw new BadRequestException('Offer with this code already exists');
        }

        return this.prisma.offer.create({
            data: {
                code: dto.code.toUpperCase(),
                title: dto.title,
                description: dto.description,
                discountType: dto.discount_type,
                discountValue: dto.discount_value,
                maxDiscountCap: dto.max_discount_cap || 0,
                minOrderValue: dto.min_order_value || 0,
                maxUsagePerUser: dto.max_usage_per_user || 0,
                totalUsageLimit: dto.total_usage_limit || 0,
                totalUsageCount: 0,
                isActive: dto.is_active !== false,
                validFrom: new Date(dto.valid_from),
                validUntil: new Date(dto.valid_until),
                createdBy,
                assignedUsers: dto.assigned_users?.length
                    ? { createMany: { data: dto.assigned_users.map((uid) => ({ userId: uid })) } }
                    : undefined,
                applicableServices: dto.applicable_services?.length
                    ? { createMany: { data: dto.applicable_services.map((sid) => ({ serviceId: sid })) } }
                    : undefined,
            },
            include: { assignedUsers: true, applicableServices: true, userUsages: true },
        });
    }

    /**
     * Get all offers (for admin)
     */
    async getAllOffers(search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.offer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                assignedUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                applicableServices: true,
                userUsages: true
            },
        });
    }

    /**
     * Get offer by ID
     */
    async getOfferById(id: string) {
        const offer = await this.prisma.offer.findUnique({
            where: { id },
            include: {
                assignedUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                applicableServices: true,
                userUsages: true
            },
        });
        if (!offer) throw new NotFoundException('Offer not found');
        return offer;
    }

    /**
     * Update an offer
     */
    async updateOffer(id: string, dto: UpdateOfferDto) {
        const existing = await this.prisma.offer.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Offer not found');

        const updateData: any = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.discount_type !== undefined) updateData.discountType = dto.discount_type;
        if (dto.discount_value !== undefined) updateData.discountValue = dto.discount_value;
        if (dto.max_discount_cap !== undefined) updateData.maxDiscountCap = dto.max_discount_cap;
        if (dto.min_order_value !== undefined) updateData.minOrderValue = dto.min_order_value;
        if (dto.max_usage_per_user !== undefined) updateData.maxUsagePerUser = dto.max_usage_per_user;
        if (dto.total_usage_limit !== undefined) updateData.totalUsageLimit = dto.total_usage_limit;
        if (dto.is_active !== undefined) updateData.isActive = dto.is_active;
        if (dto.valid_from) updateData.validFrom = new Date(dto.valid_from);
        if (dto.valid_until) updateData.validUntil = new Date(dto.valid_until);

        if (dto.assigned_users) {
            await this.prisma.offerAssignedUser.deleteMany({ where: { offerId: id } });
            if (dto.assigned_users.length > 0) {
                await this.prisma.offerAssignedUser.createMany({
                    data: dto.assigned_users.map((uid) => ({ offerId: id, userId: uid })),
                });
            }
        }

        if (dto.applicable_services) {
            await this.prisma.offerApplicableService.deleteMany({ where: { offerId: id } });
            if (dto.applicable_services.length > 0) {
                await this.prisma.offerApplicableService.createMany({
                    data: dto.applicable_services.map((sid) => ({ offerId: id, serviceId: sid })),
                });
            }
        }

        return this.prisma.offer.update({
            where: { id },
            data: updateData,
            include: { assignedUsers: true, applicableServices: true, userUsages: true },
        });
    }

    /**
     * Delete an offer
     */
    async deleteOffer(id: string): Promise<void> {
        const existing = await this.prisma.offer.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Offer not found');
        await this.prisma.offer.delete({ where: { id } });
    }

    /**
     * Get offers available for a specific user
     */
    async getUserOffers(userId: string): Promise<UserOfferResponse[]> {
        const now = new Date();

        const offers = await this.prisma.offer.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validUntil: { gte: now },
            },
            include: { assignedUsers: true, userUsages: true },
        });

        const availableOffers: UserOfferResponse[] = [];

        for (const offer of offers) {
            if (
                offer.assignedUsers.length > 0 &&
                !offer.assignedUsers.some((au) => au.userId === userId)
            ) {
                continue;
            }

            if (offer.totalUsageLimit > 0 && offer.totalUsageCount >= offer.totalUsageLimit) {
                continue;
            }

            if (offer.maxUsagePerUser > 0) {
                const userUsage = offer.userUsages.find((u) => u.userId === userId);
                if (userUsage && userUsage.usageCount >= offer.maxUsagePerUser) {
                    continue;
                }
            }

            availableOffers.push({
                _id: offer.id,
                code: offer.code,
                title: offer.title,
                description: offer.description,
                discount_type: offer.discountType,
                discount_value: offer.discountValue,
                max_discount_cap: offer.maxDiscountCap,
                min_order_value: offer.minOrderValue,
                valid_until: offer.validUntil,
            });
        }

        return availableOffers;
    }

    /**
     * Validate a coupon code for a given order
     */
    async validateCoupon(userId: string, dto: ValidateCouponDto): Promise<CouponValidationResponse> {
        const now = new Date();
        const code = dto.code.toUpperCase();

        const offer = await this.prisma.offer.findUnique({
            where: { code },
            include: { assignedUsers: true, applicableServices: true, userUsages: true },
        });

        if (!offer) return { valid: false, discount_amount: 0, message: 'Invalid coupon code' };
        if (!offer.isActive) return { valid: false, discount_amount: 0, message: 'This coupon is no longer active' };
        if (now < offer.validFrom || now > offer.validUntil) {
            return { valid: false, discount_amount: 0, message: 'This coupon has expired or is not yet valid' };
        }

        if (offer.assignedUsers.length > 0) {
            const isAssigned = offer.assignedUsers.some((au) => au.userId === userId);
            if (!isAssigned) {
                return { valid: false, discount_amount: 0, message: 'This coupon is not available for your account' };
            }
        }

        if (offer.minOrderValue > 0 && dto.order_total < offer.minOrderValue) {
            return { valid: false, discount_amount: 0, message: `Minimum order value of â‚¹${offer.minOrderValue} required` };
        }

        if (offer.applicableServices.length > 0 && dto.service_ids) {
            const serviceMatch = dto.service_ids.some((sid) =>
                offer.applicableServices.some((as) => as.serviceId === sid),
            );
            if (!serviceMatch) {
                return { valid: false, discount_amount: 0, message: 'This coupon is not applicable for the selected services' };
            }
        }

        if (offer.totalUsageLimit > 0 && offer.totalUsageCount >= offer.totalUsageLimit) {
            return { valid: false, discount_amount: 0, message: 'This coupon has reached its maximum usage limit' };
        }

        if (offer.maxUsagePerUser > 0) {
            const userUsage = offer.userUsages.find((u) => u.userId === userId);
            if (userUsage && userUsage.usageCount >= offer.maxUsagePerUser) {
                return { valid: false, discount_amount: 0, message: 'You have already used this coupon the maximum number of times' };
            }
        }

        let discountAmount = 0;
        if (offer.discountType === 'percentage') {
            discountAmount = (dto.order_total * offer.discountValue) / 100;
            if (offer.maxDiscountCap > 0 && discountAmount > offer.maxDiscountCap) {
                discountAmount = offer.maxDiscountCap;
            }
        } else {
            discountAmount = Math.min(offer.discountValue, dto.order_total);
        }

        return {
            valid: true,
            discount_amount: Math.round(discountAmount * 100) / 100,
            message: 'Coupon applied successfully',
            offer: {
                code: offer.code,
                title: offer.title,
                discount_type: offer.discountType,
                discount_value: offer.discountValue,
                max_discount_cap: offer.maxDiscountCap,
            },
        };
    }

    /**
     * Record usage of a coupon by a user
     */
    async recordCouponUsage(code: string, userId: string): Promise<void> {
        const offer = await this.prisma.offer.findUnique({
            where: { code: code.toUpperCase() },
            include: { userUsages: true },
        });
        if (!offer) return;

        await this.prisma.offer.update({
            where: { id: offer.id },
            data: { totalUsageCount: { increment: 1 } },
        });

        const existingUsage = offer.userUsages.find((u) => u.userId === userId);
        if (existingUsage) {
            await this.prisma.offerUsage.update({
                where: { id: existingUsage.id },
                data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
            });
        } else {
            await this.prisma.offerUsage.create({
                data: { offerId: offer.id, userId, usageCount: 1, lastUsedAt: new Date() },
            });
        }
    }

    /**
     * Calculate discount for order preview
     */
    async calculateDiscountForOrder(
        userId: string,
        code: string,
        orderTotal: number,
        serviceIds?: string[],
    ): Promise<{ valid: boolean; discount: number; message: string }> {
        const validation = await this.validateCoupon(userId, {
            code,
            order_total: orderTotal,
            service_ids: serviceIds,
        });
        return { valid: validation.valid, discount: validation.discount_amount, message: validation.message };
    }

    /**
     * Apply a coupon to an order
     */
    async applyCoupon(userId: string, dto: ApplyCouponDto): Promise<any> {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.order_id },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        const validResult = await this.validateCoupon(userId, {
            code: dto.code,
            order_total: order.pdItemTotal,
            service_ids: order.items.map((item) => item.serviceId).filter(Boolean) as string[],
        });

        if (!validResult.valid) throw new BadRequestException(validResult.message);

        const discountAmount = validResult.discount_amount;
        const newTotalPayable = Math.max(0, order.pdGrandTotal - discountAmount);

        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                pdIsOfferApplied: true,
                pdOfferDiscountAmount: discountAmount,
                pdTotalPayableAmount: newTotalPayable,
            },
        });

        await this.recordCouponUsage(dto.code, userId);

        return {
            success: true,
            data: { discount_amount: discountAmount, total_payable: newTotalPayable },
        };
    }
}
