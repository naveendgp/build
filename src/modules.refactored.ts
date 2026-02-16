// ============================================================================
// REFACTORED MODULE FILES — MongoDB → PostgreSQL
// Shows how each NestJS module should be updated to remove MongooseModule
// and rely on the global PrismaModule instead.
//
// Since PrismaModule is registered as global: true in AppModule, feature
// modules do NOT need to import it explicitly — PrismaService is auto-
// available for injection in any provider/guard/gateway.
// ============================================================================

// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 1. auth.module.ts                                                        │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   imports: [
//     JwtModule.register({}),
//     MongooseModule.forFeature([
//       { name: User.name, schema: UserSchema },
//       { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
//       { name: Vendor.name, schema: VendorSchema },
//     ]),
//   ],
//
// AFTER:
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// REMOVED: MongooseModule, schema imports
import { JwtHelper } from './auth/jwt.helper';

@Module({
  imports: [
    JwtModule.register({}),
    // PrismaModule is global — no import needed here
  ],
  providers: [JwtHelper],
  exports: [JwtHelper, JwtModule],
})
export class AuthModuleRefactored {}


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 2. in-memory-store.module.ts (cache module)                              │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   imports: [
//     MongooseModule.forFeature([
//       { name: DeliveryPersonCache.name, schema: DeliveryPersonCacheSchema },
//     ]),
//   ],
//   providers: [MongoCacheService],
//   exports: [MongoCacheService],
//
// AFTER:
// import { Module, Global } from '@nestjs/common';
// import { PrismaCacheService } from './prisma-cache.service';
//
// @Global()
// @Module({
//   // No imports needed — PrismaModule is global
//   providers: [PrismaCacheService],
//   exports: [PrismaCacheService],
// })
// export class InMemoryStoreModule {}
//
// NOTE: All consumers that inject MongoCacheService must be updated
// to inject PrismaCacheService instead.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 3. admin.module.ts                                                       │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: Admin.name, schema: AdminSchema },
//     { name: User.name, schema: UserSchema },
//     { name: Vendor.name, schema: VendorSchema },
//     { name: Order.name, schema: OrderSchema },
//     { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
//     { name: Services.name, schema: ServicesSchema },
//   ]),
//
// AFTER: Remove the entire MongooseModule.forFeature([...]) block.
//        PrismaService is injected directly in AdminService.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 4. user.module.ts                                                        │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: User.name, schema: UserSchema },
//     { name: Vendor.name, schema: VendorSchema },
//     { name: Banners.name, schema: BannersSchema },
//     { name: Services.name, schema: ServicesSchema },
//     { name: Order.name, schema: OrderSchema },
//     { name: AppConfig.name, schema: AppConfigSchema },
//     { name: Review.name, schema: ReviewSchema },
//     { name: Notification.name, schema: NotificationSchema },
//     { name: TransactionLog.name, schema: TransactionLogSchema },
//   ]),
//
// AFTER: Remove entire MongooseModule.forFeature block.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 5. vendor.module.ts                                                      │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: Vendor.name, schema: VendorSchema },
//     { name: Order.name, schema: OrderSchema },
//     { name: Services.name, schema: ServicesSchema },
//     { name: AppConfig.name, schema: AppConfigSchema },
//     { name: DeliveryLog.name, schema: DeliveryLogSchema },
//     { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
//     { name: AppVersion.name, schema: AppVersionSchema },
//     { name: Notification.name, schema: NotificationSchema },
//     { name: Review.name, schema: ReviewSchema },
//   ]),
//
// AFTER: Remove entire MongooseModule.forFeature block.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 6. delivery.module.ts                                                    │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
//     { name: DeliveryLog.name, schema: DeliveryLogSchema },
//     { name: AppVersion.name, schema: AppVersionSchema },
//     { name: Order.name, schema: OrderSchema },
//     { name: User.name, schema: UserSchema },
//     { name: Vendor.name, schema: VendorSchema },
//     { name: Notification.name, schema: NotificationSchema },
//     { name: AppConfig.name, schema: AppConfigSchema },
//     { name: Services.name, schema: ServicesSchema },
//   ]),
//
// AFTER: Remove entire MongooseModule.forFeature block.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 7. cron.module.ts                                                        │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: Order.name, schema: OrderSchema },
//     { name: AppConfig.name, schema: AppConfigSchema },
//     { name: TransactionLog.name, schema: TransactionLogSchema },
//     { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
//   ]),
//
// AFTER: Remove entire MongooseModule.forFeature block.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 8. offer.module.ts                                                       │
// └──────────────────────────────────────────────────────────────────────────┘
//
// BEFORE:
//   MongooseModule.forFeature([
//     { name: Offer.name, schema: OfferSchema },
//     { name: User.name, schema: UserSchema },
//     { name: Order.name, schema: OrderSchema },
//   ]),
//
// AFTER: Remove entire MongooseModule.forFeature block.


// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 9. database.module.ts — DELETE ENTIRELY                                  │
// └──────────────────────────────────────────────────────────────────────────┘
//
// DatabaseModule registered Mongoose schemas globally. With Prisma,
// there are no schema registrations — PrismaModule replaces it entirely.
// Remove DatabaseModule from AppModule imports and delete the file.


// ============================================================================
// PATTERN: Service Constructor Migration
// ============================================================================
//
// Every service that uses @InjectModel must change its constructor:
//
// BEFORE:
//   constructor(
//     @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//     @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
//     @InjectModel(Vendor.name) private readonly vendorModel: Model<VendorDocument>,
//   ) {}
//
// AFTER:
//   constructor(
//     private readonly prisma: PrismaService,
//   ) {}
//
// A single PrismaService replaces ALL model injections since it provides
// access to every table via prisma.user, prisma.order, prisma.vendor, etc.
