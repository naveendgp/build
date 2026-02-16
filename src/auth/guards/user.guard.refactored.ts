// ============================================================================
// REFACTORED: guards/user.guard.ts — Prisma version
// Replaces @InjectModel(User) with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   @InjectModel(User.name) private readonly userModel: Model<UserDocument>
//   const person = await this.userModel.findOne({ phone: payload?.phone });
//   await this.userModel.findOneAndUpdate({phone}, {session_token: null, fcm_token: ""});
//
// AFTER (Prisma):
//   private readonly prisma: PrismaService
//   const person = await this.prisma.user.findUnique({ where: { phone } });
//   await this.prisma.user.update({ where: { phone }, data: { ... } });
// ============================================================================

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtHelper } from '../jwt.helper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
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
      const payload = await this.jwtHelper.verify(token, 'user');

      // BEFORE: await this.userModel.findOne({ phone: payload?.phone });
      // AFTER:
      const person = await this.prisma.user.findUnique({
        where: { phone: (payload as any)?.phone },
      });

      if (person?.sessionToken !== token) {
        // BEFORE: await this.userModel.findOneAndUpdate({phone}, {session_token: null, fcm_token: ""});
        // AFTER:
        await this.prisma.user.update({
          where: { phone: (payload as any)?.phone },
          data: { sessionToken: null, fcmToken: '' },
        });
        throw new UnauthorizedException('Session Expired or Invalid Session');
      }

      if (!person || person.status !== 'active') {
        throw new UnauthorizedException('Account is inactive or not found');
      }

      request.user = person;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
