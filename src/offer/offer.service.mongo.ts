import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
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
    constructor(
        @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    ) { }

    /**
     * Create a new offer
     */
    async createOffer(dto: CreateOfferDto, createdBy: string): Promise<Offer> {
        // Check if code already exists
        const existing = await this.offerModel.findOne({ code: dto.code.toUpperCase() });
        if (existing) {
            throw new BadRequestException('Offer with this code already exists');
        }

        const offer = new this.offerModel({
            ...dto,
            code: dto.code.toUpperCase(),
            assigned_users: dto.assigned_users?.map((id) => new Types.ObjectId(id)) || [],
            applicable_services: dto.applicable_services?.map((id) => new Types.ObjectId(id)) || [],
            valid_from: new Date(dto.valid_from),
            valid_until: new Date(dto.valid_until),
            created_by: createdBy,
        });

        return offer.save();
    }

    /**
     * Get all offers (for admin)
     */
    async getAllOffers(search?: string): Promise<Offer[]> {
        const query: any = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { code: regex },
                { title: regex },
                { description: regex },
            ];
        }
        return this.offerModel.find(query).sort({ createdAt: -1 }).exec();
    }

    /**
     * Get offer by ID
     */
    async getOfferById(id: string): Promise<Offer> {
        const offer = await this.offerModel.findById(id).exec();
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return offer;
    }

    /**
     * Update an offer
     */
    async updateOffer(id: string, dto: UpdateOfferDto): Promise<Offer> {
        const updateData: any = { ...dto };

        if (dto.assigned_users) {
            updateData.assigned_users = dto.assigned_users.map((id) => new Types.ObjectId(id));
        }
        if (dto.applicable_services) {
            updateData.applicable_services = dto.applicable_services.map((id) => new Types.ObjectId(id));
        }
        if (dto.valid_from) {
            updateData.valid_from = new Date(dto.valid_from);
        }
        if (dto.valid_until) {
            updateData.valid_until = new Date(dto.valid_until);
        }

        const offer = await this.offerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return offer;
    }

    /**
     * Delete an offer
     */
    async deleteOffer(id: string): Promise<void> {
        const result = await this.offerModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Offer not found');
        }
    }

    /**
     * Get offers available for a specific user
     */
    async getUserOffers(userId: string): Promise<UserOfferResponse[]> {
        const now = new Date();
        const userObjectId = new Types.ObjectId(userId);

        const offers = await this.offerModel.find({
            is_active: true,
            valid_from: { $lte: now },
            valid_until: { $gte: now },
            $or: [
                { assigned_users: { $size: 0 } }, // Available to all users
                { assigned_users: userObjectId }, // Assigned to this user
            ],
        }).exec();

        // Filter out offers where user has exceeded max usage
        const availableOffers: UserOfferResponse[] = [];

        for (const offer of offers) {
            // Check total usage limit
            if (offer.total_usage_limit > 0 && offer.total_usage_count >= offer.total_usage_limit) {
                continue;
            }

            // Check per-user usage limit
            if (offer.max_usage_per_user > 0) {
                const userUsage = offer.user_usage.find(
                    (u) => u.user_id.toString() === userId,
                );
                if (userUsage && userUsage.usage_count >= offer.max_usage_per_user) {
                    continue;
                }
            }

            availableOffers.push({
                _id: (offer as any)._id.toString(),
                code: offer.code,
                title: offer.title,
                description: offer.description,
                discount_type: offer.discount_type,
                discount_value: offer.discount_value,
                max_discount_cap: offer.max_discount_cap,
                min_order_value: offer.min_order_value,
                valid_until: offer.valid_until,
            });
        }

        return availableOffers;
    }

    /**
     * Validate a coupon code for a given order
     */
    async validateCoupon(
        userId: string,
        dto: ValidateCouponDto,
    ): Promise<CouponValidationResponse> {
        const now = new Date();
        const code = dto.code.toUpperCase();

        const offer = await this.offerModel.findOne({ code }).exec();

        if (!offer) {
            return {
                valid: false,
                discount_amount: 0,
                message: 'Invalid coupon code',
            };
        }

        // Check if offer is active
        if (!offer.is_active) {
            return {
                valid: false,
                discount_amount: 0,
                message: 'This coupon is no longer active',
            };
        }

        // Check validity period
        if (now < offer.valid_from || now > offer.valid_until) {
            return {
                valid: false,
                discount_amount: 0,
                message: 'This coupon has expired or is not yet valid',
            };
        }

        // Check if user is eligible
        if (offer.assigned_users.length > 0) {
            const userObjectId = new Types.ObjectId(userId);
            const isAssigned = offer.assigned_users.some(
                (id) => id.toString() === userId,
            );
            if (!isAssigned) {
                return {
                    valid: false,
                    discount_amount: 0,
                    message: 'This coupon is not available for your account',
                };
            }
        }

        // Check minimum order value
        if (offer.min_order_value > 0 && dto.order_total < offer.min_order_value) {
            return {
                valid: false,
                discount_amount: 0,
                message: `Minimum order value of ₹${offer.min_order_value} required`,
            };
        }

        // Check service restrictions
        if (offer.applicable_services.length > 0 && dto.service_ids) {
            const serviceMatch = dto.service_ids.some((sid) =>
                offer.applicable_services.some((as) => as.toString() === sid),
            );
            if (!serviceMatch) {
                return {
                    valid: false,
                    discount_amount: 0,
                    message: 'This coupon is not applicable for the selected services',
                };
            }
        }

        // Check total usage limit
        if (offer.total_usage_limit > 0 && offer.total_usage_count >= offer.total_usage_limit) {
            return {
                valid: false,
                discount_amount: 0,
                message: 'This coupon has reached its maximum usage limit',
            };
        }

        // Check per-user usage limit
        if (offer.max_usage_per_user > 0) {
            const userUsage = offer.user_usage.find(
                (u) => u.user_id.toString() === userId,
            );
            if (userUsage && userUsage.usage_count >= offer.max_usage_per_user) {
                return {
                    valid: false,
                    discount_amount: 0,
                    message: 'You have already used this coupon the maximum number of times',
                };
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (offer.discount_type === 'percentage') {
            discountAmount = (dto.order_total * offer.discount_value) / 100;
            if (offer.max_discount_cap > 0 && discountAmount > offer.max_discount_cap) {
                discountAmount = offer.max_discount_cap;
            }
        } else {
            discountAmount = Math.min(offer.discount_value, dto.order_total);
        }

        return {
            valid: true,
            discount_amount: Math.round(discountAmount * 100) / 100,
            message: 'Coupon applied successfully',
            offer: {
                code: offer.code,
                title: offer.title,
                discount_type: offer.discount_type,
                discount_value: offer.discount_value,
                max_discount_cap: offer.max_discount_cap,
            },
        };
    }

    /**
     * Record usage of a coupon by a user
     */
    async recordCouponUsage(code: string, userId: string): Promise<void> {
        const offer = await this.offerModel.findOne({ code: code.toUpperCase() }).exec();
        if (!offer) return;

        const userObjectId = new Types.ObjectId(userId);

        // Update total usage count
        offer.total_usage_count += 1;

        // Update user-specific usage
        const existingUsage = offer.user_usage.find(
            (u) => u.user_id.toString() === userId,
        );

        if (existingUsage) {
            existingUsage.usage_count += 1;
            existingUsage.last_used_at = new Date();
        } else {
            offer.user_usage.push({
                user_id: userObjectId,
                usage_count: 1,
                last_used_at: new Date(),
            });
        }

        offer.markModified('user_usage');
        await offer.save();
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

        return {
            valid: validation.valid,
            discount: validation.discount_amount,
            message: validation.message,
        };
    }

    /**
     * Apply a coupon to an order
     */
    async applyCoupon(userId: string, dto: ApplyCouponDto): Promise<any> {
        // Fetch order to get the item total
        const order = await this.orderModel.findById(dto.order_id);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const validResult = await this.validateCoupon(userId, {
            code: dto.code,
            order_total: order.payment_details.item_total,
            service_ids: order.items.map(item => item.service_id.toString()),
        });

        if (!validResult.valid) {
            throw new BadRequestException(validResult.message);
        }

        // Apply discount
        const discountAmount = validResult.discount_amount;
        const newTotalPayable = Math.max(0, order.payment_details.grand_total - discountAmount);

        // Update order
        order.payment_details.isOfferApplied = true;
        order.payment_details.offerDiscountAmount = discountAmount;
        order.payment_details.totalPayableAmount = newTotalPayable;

        order.markModified('payment_details');

        // Save
        await order.save();
        await this.recordCouponUsage(dto.code, userId);

        return {
            success: true,
            data: {
                discount_amount: discountAmount,
                total_payable: newTotalPayable
            }
        };
    }
}
