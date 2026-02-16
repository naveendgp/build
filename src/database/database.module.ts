import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { DeliveryPerson, DeliveryPersonSchema } from '../schemas/delivery-person.schema';
import { Vendor, VendorSchema } from '../schemas/vendor.schema';
import { AppVersion, AppVersionSchema } from '../schemas/app-version.schema';
import { AppConfig, AppConfigSchema } from '../schemas/app-config.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: DeliveryPerson.name, schema: DeliveryPersonSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: AppConfig.name, schema: AppConfigSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

