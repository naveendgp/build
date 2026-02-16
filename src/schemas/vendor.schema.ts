import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema({ _id: true })
export class VendorAddress {
  @Prop({ trim: true })
  address_line1: string;

  @Prop({ trim: true })
  address_line2?: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  state: string;

  @Prop({ trim: true })
  pincode: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ trim: true })
  landmark?: string;
}

export const VendorAddressSchema = SchemaFactory.createForClass(VendorAddress);

@Schema({ _id: false })
export class OperatingHoursDay {
  @Prop({ trim: true })
  open: string; // HH:mm

  @Prop({ trim: true })
  close: string; // HH:mm
}

export const OperatingHoursDaySchema =
  SchemaFactory.createForClass(OperatingHoursDay);

@Schema({ _id: false })
export class VendorRatingReview {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id?: Types.ObjectId;

  @Prop({ trim: true })
  name?: string;

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true })
  comment?: string;

  @Prop({ type: Date })
  date?: Date;
}

export const VendorRatingReviewSchema =
  SchemaFactory.createForClass(VendorRatingReview);

@Schema({ _id: false })
export class VendorRating {
  @Prop({ type: Number, default: 0 })
  average: number;

  @Prop({ type: Number, default: 0 })
  total_reviews: number;

  @Prop({ type: [VendorRatingReviewSchema], default: [] })
  reviews: VendorRatingReview[];
}

export const VendorRatingSchema = SchemaFactory.createForClass(VendorRating);

@Schema({ _id: false })
export class VendorWallet {
  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ type: Date })
  last_updated?: Date;
}

export const VendorWalletSchema = SchemaFactory.createForClass(VendorWallet);

@Schema({ _id: false })
export class BankDetails {
  @Prop({ trim: true })
  account_holder_name?: string;

  @Prop({ trim: true })
  account_number?: string;

  @Prop({ trim: true })
  ifsc_code?: string;

  @Prop({ trim: true })
  bank_name?: string;

  @Prop({ trim: true })
  branch?: string;

  @Prop({ trim: true })
  cancelled_cheque?: string;

  @Prop({ trim: true })
  upi_id?: string;
}

export const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);

@Schema({ _id: false })
export class PickupZone {
  @Prop({ trim: true })
  zone_name: string;

  @Prop({ type: [String], default: [] })
  pincodes: string[];
}

export const PickupZoneSchema = SchemaFactory.createForClass(PickupZone);

@Schema({ _id: false })
export class SubscriptionPlan {
  @Prop({ trim: true })
  plan_name?: string;

  @Prop({ type: Number })
  monthly_fee?: number;

  @Prop({ type: Number })
  max_orders_per_day?: number;

  @Prop({ type: Number })
  commission_percentage?: number;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

@Schema({ _id: false })
export class VendorDocuments {
  @Prop({ trim: true })
  aadhaar_card?: string;

  @Prop({ trim: true })
  gst_certificate?: string;

  @Prop({ trim: true })
  pan_card?: string;
}

export const VendorDocumentsSchema =
  SchemaFactory.createForClass(VendorDocuments);

@Schema({ _id: false })
export class ItemsServices {
  @Prop({ type: Types.ObjectId, required: true })
  item_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  item_name: string;

  @Prop({
    type: String,
    required: false,
    set: (value: string) => (value === '' ? undefined : value),
  })
  image_url?: string;

  @Prop({ type: Number, required: true })
  item_price: number;

  @Prop({ type: Number, required: true, default: 0 })
  express_price: number;

  @Prop({ type: Number, default: 0 })
  min_weight: number;

  @Prop({ type: Number, default: 0 })
  max_weight: number;

  @Prop({ type: String, required: true })
  item_description: string;

  @Prop({ type: String })
  category: string;

  @Prop({ type: Boolean, required: true })
  is_active: boolean;
}

@Schema({ _id: false })
export class ServicesOffered {
  @Prop({ type: Types.ObjectId, required: true })
  service_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  service_name: string;

  @Prop({ type: String, required: true })
  image_url: string;

  @Prop({ type: String, enum: ['per_kg', 'per_pc'], required: true })
  pricing_type: string;

  @Prop({ type: Number })
  max_count_per_day: number;

  @Prop({ type: Number, default: 0 })
  standard_price_per_kg?: number;

  @Prop({ type: Number, default: 0 })
  express_price_per_kg?: number;

  @Prop({ type: String, required: true })
  service_description: string;

  @Prop({ type: [ItemsServices], default: [] })
  items: ItemsServices[];

  @Prop({ type: Boolean, required: true })
  is_offer: boolean;

  @Prop({ type: Number })
  offer_percentage: number;

  @Prop({ type: Number, default: 0 })
  offer_max_cap?: number;

  @Prop({ type: Boolean, required: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_approved: boolean;

  @Prop({ type: Boolean, default: false })
  is_express_available: boolean;

  @Prop({ type: Number, default: 0, required: true })
  express_delivery_time_minutes: number;

  @Prop({ type: Number, default: 0, required: true })
  normal_delivery_time_minutes: number;

  @Prop({ type: Number, default: 8 })
  express_time: number;

  @Prop({ type: Number, default: 48 })
  standard_time: number;

  @Prop({ type: Object, default: {} })
  pricing_tiers?: {
    regular: number;
    standard: number;
    max: number;
  };
}

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ trim: true })
  shop_name: string;

  @Prop({ trim: true })
  shop_image_url?: string;

  @Prop({ trim: true })
  profile_pic?: string;

  @Prop({ trim: true })
  owner_name?: string;

  @Prop({ lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, trim: true, required: true })
  phone: string;

  @Prop({ trim: true })
  contactNum?: string;

  @Prop({ trim: true })
  password_hash?: string;

  @Prop({
    enum: ['active', 'inactive', 'pending', 'upload', 'retry'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'pending' | 'upload' | 'retry';

  @Prop({ trim: true })
  gst_number?: string;

  @Prop({
    type: {
      status: { type: String, enum: ['open', 'close'] },
      close_time: { type: Date },
    },
    default: { status: 'open', close_time: null },
  })
  shop_status: {
    status: 'open' | 'close';
    close_time?: Date;
  };

  @Prop({ type: Boolean, default: false })
  express_status: boolean;

  @Prop({ trim: true })
  pan_number?: string;

  @Prop({ trim: true })
  aadhaar_number?: string;

  @Prop({ trim: true })
  shop_license_number?: string;

  @Prop()
  total_orders: number;

  @Prop({ type: VendorAddressSchema })
  address: VendorAddress;

  @Prop({
    type: {
      monday: OperatingHoursDaySchema,
      tuesday: OperatingHoursDaySchema,
      wednesday: OperatingHoursDaySchema,
      thursday: OperatingHoursDaySchema,
      friday: OperatingHoursDaySchema,
      saturday: OperatingHoursDaySchema,
      sunday: OperatingHoursDaySchema,
    },
  })
  operating_hours?: Record<string, OperatingHoursDay>;
  @Prop({ type: [ServicesOffered], default: [] })
  services_offered: ServicesOffered[];

  @Prop({ type: Date, default: null })
  last_service_updated_at?: Date;

  @Prop({ type: VendorRatingSchema, default: {} })
  rating: VendorRating;

  @Prop({ type: VendorWalletSchema, default: {} })
  wallet: VendorWallet;

  @Prop({ type: BankDetailsSchema })
  bank_details?: BankDetails;

  @Prop({ type: [PickupZoneSchema], default: [] })
  pickup_zones: PickupZone[];

  @Prop({ type: SubscriptionPlanSchema })
  subscription_plan?: SubscriptionPlan;

  @Prop({ type: VendorDocumentsSchema })
  documents?: VendorDocuments;

  @Prop({ trim: true })
  fcm_token?: string;

  @Prop({ type: String, default: '' })
  session_token?: string;

  @Prop({ type: Number, default: 0 })
  amount_due: number;

  @Prop({ type: [String], default: [] })
  orders_to_be_settled: string[];
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
