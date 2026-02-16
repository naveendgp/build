// ============================================================================
// REFACTORED: jwt.helper.ts — Prisma version
// Replaces @InjectModel(User/DeliveryPerson/Vendor) with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   @InjectModel(User.name) private readonly userModel: Model<User>
//   @InjectModel(DeliveryPerson.name) private readonly deliveryPersonModel: Model<DeliveryPerson>
//   @InjectModel(Vendor.name) private readonly vendorModel: Model<Vendor>
//   const person = await model.findOne({ phone }).lean().exec();
//   await model.findOneAndUpdate({ phone }, { session_token: null, fcm_token: "" }).lean().exec();
//
// AFTER (Prisma):
//   private readonly prisma: PrismaService
//   const person = await this.prisma.user.findUnique({ where: { phone } });
//   await this.prisma.user.update({ where: { phone }, data: { sessionToken: null, fcmToken: "" } });
// ============================================================================

import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '../config/database.config';
import { PrismaService } from '../prisma/prisma.service';

export type JwtRole = 'user' | 'delivery' | 'vendor';

@Injectable()
export class JwtHelper {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private getSecretForRole(role: JwtRole): string {
    const value =
      role === 'user'
        ? AppConfig.JWT.USER_SECRET
        : role === 'delivery'
          ? AppConfig.JWT.DELIVERY_SECRET
          : AppConfig.JWT.VENDOR_SECRET;
    if (!value) {
      throw new Error(`JWT secret missing for role: ${role}`);
    }
    return value;
  }

  /**
   * Look up an entity by phone, polymorphically based on role.
   *
   * BEFORE: const model = this.getModel(role); model.findOne({ phone }).lean()
   * AFTER:  switch on role → prisma.user / prisma.deliveryPerson / prisma.vendor
   */
  private async findByPhone(role: JwtRole, phone: string): Promise<any> {
    switch (role) {
      case 'user':
        return this.prisma.user.findUnique({ where: { phone } });
      case 'delivery':
        return this.prisma.deliveryPerson.findUnique({ where: { phone } });
      case 'vendor':
        return this.prisma.vendor.findUnique({ where: { phone } });
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  /**
   * Invalidate session for a phone/role.
   *
   * BEFORE: model.findOneAndUpdate({ phone }, { session_token: null, fcm_token: "" })
   * AFTER:  prisma[model].update({ where: { phone }, data: { sessionToken: null, fcmToken: "" } })
   */
  private async invalidateSession(role: JwtRole, phone: string): Promise<void> {
    const data = { sessionToken: null, fcmToken: '' };
    switch (role) {
      case 'user':
        await this.prisma.user.update({ where: { phone }, data });
        break;
      case 'delivery':
        await this.prisma.deliveryPerson.update({ where: { phone }, data });
        break;
      case 'vendor':
        await this.prisma.vendor.update({ where: { phone }, data });
        break;
    }
  }

  sign(payload: Record<string, unknown>, role: JwtRole, options?: JwtSignOptions): string {
    const secret = this.getSecretForRole(role);
    return this.jwt.sign(payload, { secret, ...(options ?? {}) });
  }

  async verify<T extends object = any>(token: string, role: JwtRole): Promise<T> {
    const secret = this.getSecretForRole(role);
    const payload = this.jwt.verify<T>(token, { secret });
    const phone = payload['phoneNumber'] || payload['phone'];

    const person: any = await this.findByPhone(role, phone);
    if (!person) {
      throw new Error('User not found for the given token');
    }

    if (token === person.sessionToken) {
      return person as T;
    } else {
      await this.invalidateSession(role, phone);
      throw new Error('Invalid session token');
    }
  }
}
