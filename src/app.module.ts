import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { DeliveryModule } from './delivery/delivery.module';
import { CronModule } from './cron/cron.module';
import { InMemoryStoreModule } from './store/in-memory-store.module';
import { NotificationModule } from './notification-module/notification-module.module';
import { OfferModule } from './offer/offer.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    VendorModule,
    DeliveryModule,
    CronModule,
    InMemoryStoreModule,
    NotificationModule,
    OfferModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
