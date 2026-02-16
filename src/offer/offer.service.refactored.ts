// ============================================================================
// REFACTORED: offer.service.ts — MongoDB → Prisma Query Examples
// ============================================================================

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OfferServiceRefactored {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. GET USER ELIGIBLE OFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const offers = await this.offerModel.find({
    is_active: true,
    valid_from: { $lte: now },
    valid_until: { $gte: now },
    $or: [
      { assigned_users: { $size: 0 } },
      { assigned_users: new ObjectId(userId) },
    ],
  });
  */

  async getUserEligibleOffers(userId: string) {
    const now = new Date();

    return this.prisma.offer.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          // No assigned users = available to all
          { assignedUsers: { none: {} } },
          // Or specifically assigned to this user
          { assignedUsers: { some: { userId } } },
        ],
      },
      include: {
        applicableServices: {
          include: {
            service: { select: { id: true, serviceName: true } },
          },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. VALIDATE & APPLY COUPON
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const offer = await this.offerModel.findOne({ code, is_active: true });
  // Check validity, usage limits, per-user usage...
  const userUsage = offer.user_usage.find(u => u.user_id.toString() === userId);
  if (userUsage && userUsage.usage_count >= offer.max_usage_per_user) throw ...;
  // Apply discount...
  offer.total_usage_count += 1;
  const usage = offer.user_usage.find(u => u.user_id.toString() === userId);
  if (usage) { usage.usage_count += 1; usage.last_used_at = new Date(); }
  else { offer.user_usage.push({ user_id: userId, usage_count: 1, last_used_at: new Date() }); }
  offer.markModified('user_usage');
  await offer.save();
  */

  async validateAndApplyCoupon(code: string, userId: string, orderAmount: number) {
    const now = new Date();

    const offer = await this.prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        assignedUsers: true,
        userUsages: { where: { userId } },
        applicableServices: true,
      },
    });

    if (!offer) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    if (!offer.isActive) throw new HttpException('Coupon is inactive', HttpStatus.BAD_REQUEST);
    if (now < offer.validFrom || now > offer.validUntil) {
      throw new HttpException('Coupon has expired', HttpStatus.BAD_REQUEST);
    }
    if (orderAmount < offer.minOrderValue) {
      throw new HttpException(
        `Minimum order value is ${offer.minOrderValue}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check user eligibility
    if (offer.assignedUsers.length > 0) {
      const isAssigned = offer.assignedUsers.some(u => u.userId === userId);
      if (!isAssigned) throw new HttpException('Coupon not available for you', HttpStatus.FORBIDDEN);
    }

    // Check per-user usage
    const userUsage = offer.userUsages[0];
    if (offer.maxUsagePerUser > 0 && userUsage && userUsage.usageCount >= offer.maxUsagePerUser) {
      throw new HttpException('Coupon usage limit reached', HttpStatus.BAD_REQUEST);
    }

    // Check total usage
    if (offer.totalUsageLimit > 0 && offer.totalUsageCount >= offer.totalUsageLimit) {
      throw new HttpException('Coupon is fully redeemed', HttpStatus.BAD_REQUEST);
    }

    // Calculate discount
    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = (orderAmount * offer.discountValue) / 100;
      if (offer.maxDiscountCap > 0) discount = Math.min(discount, offer.maxDiscountCap);
    } else {
      discount = offer.discountValue;
    }
    discount = Math.min(discount, orderAmount);

    // Update usage atomically
    await this.prisma.executeInTransaction(async (tx) => {
      await tx.offer.update({
        where: { id: offer.id },
        data: { totalUsageCount: { increment: 1 } },
      });

      await tx.offerUsage.upsert({
        where: { offerId_userId: { offerId: offer.id, userId } },
        update: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
        create: {
          offerId: offer.id,
          userId,
          usageCount: 1,
          lastUsedAt: new Date(),
        },
      });
    });

    return {
      valid: true,
      discount,
      offer_code: offer.code,
      discount_type: offer.discountType,
      discount_value: offer.discountValue,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ADMIN: CREATE / UPDATE / DELETE OFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const offer = new this.offerModel(dto);
  await offer.save();
  */

  async createOffer(dto: any) {
    return this.prisma.offer.create({
      data: {
        code: dto.code.toUpperCase(),
        title: dto.title,
        description: dto.description,
        discountType: dto.discount_type,
        discountValue: dto.discount_value,
        maxDiscountCap: dto.max_discount_cap || 0,
        minOrderValue: dto.min_order_value || 0,
        validFrom: new Date(dto.valid_from),
        validUntil: new Date(dto.valid_until),
        maxUsagePerUser: dto.max_usage_per_user || 0,
        totalUsageLimit: dto.total_usage_limit || 0,
        createdBy: dto.created_by,
        ...(dto.applicable_services?.length > 0 && {
          applicableServices: {
            createMany: {
              data: dto.applicable_services.map((sid: string) => ({ serviceId: sid })),
            },
          },
        }),
      },
    });
  }

  /*
  ── BEFORE (Mongoose) ──
  await this.offerModel.findByIdAndDelete(offerId);
  */

  async deleteOffer(offerId: string) {
    // Cascade deletes handle assigned_users, usage, applicable_services
    return this.prisma.offer.delete({
      where: { id: offerId },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SEARCH OFFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /*
  ── BEFORE (Mongoose) ──
  const offers = await this.offerModel.find({
    $or: [
      { code: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ],
  });
  */

  async searchOffers(search: string) {
    return this.prisma.offer.findMany({
      where: {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
