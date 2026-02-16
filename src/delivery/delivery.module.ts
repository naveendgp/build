import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { TrackingGateway } from './tracking.gateway';
import { DeliveryController } from './delivery.controller';
import { AuthModule } from '../auth/auth.module';
import { OtpHelper } from '../auth/otp.helper';
import { InvoiceHelper } from '../helper/invoice.helper';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, OtpHelper, TrackingGateway, InvoiceHelper],
  exports: [TrackingGateway, DeliveryService],
})
export class DeliveryModule {}
