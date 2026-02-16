// ============================================================================
// REFACTORED: guards/delivery.guard.ts — Prisma version
// Replaces @InjectModel(DeliveryPerson) with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   @InjectModel(DeliveryPerson.name) private readonly deliveryModel: Model<DeliveryPersonDocument>
//   const person = await this.deliveryModel.findOne({ phone: payload?.phone });
//
// AFTER (Prisma):
//   private readonly prisma: PrismaService
//   const person = await this.prisma.deliveryPerson.findUnique({ where: { phone } });
// ============================================================================

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtHelper } from '../jwt.helper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryAuthGuard implements CanActivate {
  constructor(
    private readonly jwtHelper: JwtHelper,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'] as string | undefined;
    if (!header || !header.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    const token = header.slice(7);
    try {
      const payload: any = await this.jwtHelper.verify(token, 'delivery');

      // BEFORE: const person = await this.deliveryModel.findOne({ phone: payload?.phone });
      // AFTER:
      const person = await this.prisma.deliveryPerson.findUnique({
        where: { phone: payload?.phone },
      });

      if (!person || person.status !== 'active') {
        throw new UnauthorizedException('Account is inactive or not found');
      }

      request.delivery = person;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
