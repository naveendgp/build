import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { OtpHelper } from '../auth/otp.helper';
import { VendorHelper } from '../helper/vendor.helper';
import { TrackingGateway } from '../delivery/tracking.gateway';
import { NotificationModule } from '../notification-module/notification-module.module';
import { InvoiceHelper } from '../helper/invoice.helper';
import { OfferModule } from '../offer/offer.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    OfferModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    OtpHelper,
    VendorHelper,
    TrackingGateway,
    InvoiceHelper,
  ],
})
export class UserModule {}
