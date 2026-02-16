import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ timestamps: true })
export class AppConfig {
  @Prop({ required: true, unique: true, trim: true })
  config_key: string;

  @Prop({ required: true, trim: true })
  config_name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Object, required: true })
  payment_config: {
    gst: number;
    platform_fee: number;
    delivery_fee: number;
    vendor_commission: number;
    currency: string;
    min_order_amount?: number;
    max_order_amount?: number;
    wallet_enabled?: boolean;
    offer_enabled?: boolean;
    express_delivery_fee?: number;
    standard_delivery_fee?: number;
  };

  @Prop({ type: Object })
  general_config?: {
    app_version?: string;
    maintenance_mode?: boolean;
    support_contact?: string;
    terms_url?: string;
    privacy_url?: string;
  };

  @Prop({ type: Object })
  delivery_config?: {
    initial_distance_km?: number;
    total_distance_km?: number;
    delivery_order_accept_time?: number;
    order_distance?: number;
  };

  @Prop({ trim: true })
  support_phone_number?: string;

  @Prop({ trim: true })
  privacy_policy_url?: string;

  @Prop({ trim: true })
  terms_url?: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Date })
  effective_from?: Date;

  @Prop({ type: Date })
  effective_until?: Date;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
