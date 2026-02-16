import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../admin.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly adminService: AdminService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        const admin = await this.adminService.findByEmail(payload.email);
        if (!admin || !admin.isActive) {
            throw new UnauthorizedException();
        }
        // Return a subset of user object or the whole doc, attached to req.user
        return {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };
    }
}
