import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminOrderController } from './admin-order.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminVendorController } from './admin-vendor.controller';
import { AdminManagementController } from './admin-management.controller';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminOtpService } from './admin-otp.service';
import { SnsService } from './sns.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { UserModule } from '../user/user.module';
import { VendorModule } from '../vendor/vendor.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { OfferModule } from '../offer/offer.module';
import { NotificationModule } from '../notification-module/notification-module.module';
import { AdminNotificationController } from './admin-notification.controller';
import { AdminNotificationService } from './admin-notification.service';
import { AdminSettlementService } from './admin-settlement.service';

import { AdminRiderController } from './admin-rider.controller';
import { AdminSettlementController } from './admin-settlement.controller';
import { AdminServiceController } from './admin-service.controller';
import { AdminPaymentController } from './admin-payment.controller';
import { AdminBannerController } from './admin-banner.controller';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
        UserModule,
        VendorModule,
        DeliveryModule,
        OfferModule,
        NotificationModule,
    ],
    controllers: [
        AdminController,
        AdminDashboardController,
        AdminOrderController,
        AdminUserController,
        AdminVendorController,
        AdminRiderController,
        AdminSettlementController,
        AdminServiceController,
        AdminPaymentController,
        AdminManagementController,
        AdminBannerController,
        AdminNotificationController,
    ],
    providers: [AdminService, AdminAuthService, AdminOtpService, SnsService, AdminJwtStrategy, AdminNotificationService, AdminSettlementService],
    exports: [AdminService],
})
export class AdminModule { }
