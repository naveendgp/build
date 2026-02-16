import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppVersionDocument = HydratedDocument<AppVersion>;

@Schema({ timestamps: true })
export class AppVersion {
  @Prop({ required: true, enum: ['user_android', 'user_ios', 'vendor_android', 'delivery_android'] })
  app_type: 'user_android' | 'user_ios' | 'vendor_android' | 'delivery_android';

  @Prop({ required: true })
  version: string;

  @Prop({ type: Boolean, default: false })
  is_forceupdate: boolean;
}

export const AppVersionSchema = SchemaFactory.createForClass(AppVersion);