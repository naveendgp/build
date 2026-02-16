import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminOrderController } from './admin-order.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminVendorController } from './admin-vendor.controller';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { UserModule } from '../user/user.module';
import { VendorModule } from '../vendor/vendor.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { OfferModule } from '../offer/offer.module';

import { AdminRiderController } from './admin-rider.controller';
import { AdminSettlementController } from './admin-settlement.controller';
import { AdminServiceController } from './admin-service.controller';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
        UserModule,
        VendorModule,
        DeliveryModule,
        OfferModule,
    ],
    controllers: [
        AdminController,
        AdminDashboardController,
        AdminOrderController,
        AdminUserController,
        AdminVendorController,
        AdminRiderController,
        AdminSettlementController,
        AdminServiceController
    ],
    providers: [AdminService, AdminAuthService, AdminJwtStrategy],
    exports: [AdminService],
})
export class AdminModule {}
