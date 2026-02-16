import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { AuthModule } from '../auth/auth.module';
import { OtpHelper } from '../auth/otp.helper';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    AuthModule,
    DeliveryModule,
  ],
  controllers: [VendorController],
  providers: [VendorService, OtpHelper],
})
export class VendorModule {}
