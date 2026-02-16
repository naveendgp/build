// ============================================================================
// REFACTORED: app.module.ts
// PostgreSQL/Prisma version — replaces MongooseModule.forRootAsync
// ============================================================================
//
// BEFORE (MongoDB):
//   MongooseModule.forRootAsync({
//     inject: [ConfigService],
//     useFactory: async () => ({
//       uri: AppConfig.DB.URL,
//       connectionFactory: (connection) => { ... },
//     }),
//   }),
//   DatabaseModule,          // registers all Mongoose schemas
//   InMemoryStoreModule,     // MongoDB-backed cache
//
// AFTER (PostgreSQL):
//   PrismaModule,            // global Prisma client (replaces MongooseModule + DatabaseModule)
//   InMemoryStoreModule,     // now uses PrismaCacheService internally
//
// ============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ── NEW: Prisma replaces Mongoose + DatabaseModule ──
import { PrismaModule } from './prisma/prisma.module';

// ── Feature modules (unchanged imports, but internally use PrismaService) ──
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
    // ── Global config (unchanged) ──
    ConfigModule.forRoot({ isGlobal: true }),

    // ── REMOVED: MongooseModule.forRootAsync(...) ──
    // ── REMOVED: DatabaseModule (registered Mongoose schemas) ──

    // ── NEW: PrismaModule (global: true) provides PrismaService everywhere ──
    PrismaModule,

    // ── Feature modules (same as before; they now inject PrismaService
    //    instead of @InjectModel() Mongoose models) ──
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
