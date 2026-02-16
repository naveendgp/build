import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type DeliveryPersonDocument = HydratedDocument<DeliveryPerson>;

@Schema({ _id: false })
export class DriverVehicle {
  @Prop({ required: true, trim: true })
  vehicle_type: string;

  @Prop({ required: true, trim: true })
  vehicle_number: string;

  @Prop({ trim: true })
  model?: string;

  @Prop({ trim: true })
  color?: string;
}

export const DriverVehicleSchema = SchemaFactory.createForClass(DriverVehicle);

@Schema({ _id: false })
export class DriverLicense {
  @Prop({ trim: true })
  license_number?: string;

  @Prop({ type: Date })
  valid_till?: Date;

  @Prop({ type: Boolean })
  verified?: boolean;

  @Prop({ trim: true })
  document_url?: string;
}

export const DriverLicenseSchema = SchemaFactory.createForClass(DriverLicense);

@Schema({ _id: false })
export class DriverAadhaar {
  @Prop({ trim: true })
  aadhaar_number?: string;

  @Prop({ type: Boolean })
  verified?: boolean;

  @Prop({ trim: true })
  document_url?: string;
}

export const DriverAadhaarSchema = SchemaFactory.createForClass(DriverAadhaar);

@Schema({ _id: false })
export class DriverAddress {
  @Prop({ required: false, trim: true })
  area: string;

  @Prop({ trim: true })
  locality?: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  pincode: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

export const DriverAddressSchema = SchemaFactory.createForClass(DriverAddress);

@Schema({ _id: false })
export class GeoPointWithTime {
  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Date })
  last_updated?: Date;
}

export const GeoPointWithTimeSchema =
  SchemaFactory.createForClass(GeoPointWithTime);

@Schema({ _id: false })
export class DriverWallet {
  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ type: Date })
  last_updated?: Date;
}

export const DriverWalletSchema = SchemaFactory.createForClass(DriverWallet);

@Schema({ _id: false })
export class AssignedOrderBrief {
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  pickup_from_user_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  deliver_to_vendor_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  pickup_from_vendor_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  deliver_to_user_id?: Types.ObjectId;

  @Prop({ enum: ['accepted', 'in_transit', 'delivered'] })
  status?: 'accepted' | 'in_transit' | 'delivered';

  @Prop({ type: Date })
  pickup_time?: Date;

  @Prop({ type: Date })
  expected_delivery_time?: Date;
}

export const AssignedOrderBriefSchema =
  SchemaFactory.createForClass(AssignedOrderBrief);

@Schema({ _id: false })
export class DriverDocuments {

  @Prop({ trim: true })
  profile_photo?: string;
}

export const DriverDocumentsSchema =
  SchemaFactory.createForClass(DriverDocuments);

@Schema({ timestamps: true })
export class DeliveryPerson {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;


  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @Prop({ trim: true })
  role?: string; // pickup_delivery_driver

  @Prop({ type: [String], default: [] })
  assigned_zones: string[];

  @Prop({ type: DriverVehicleSchema })
  vehicle?: DriverVehicle;

  @Prop({ type: DriverLicenseSchema })
  license?: DriverLicense;

  @Prop({ type: DriverAadhaarSchema })
  aadhaar?: DriverAadhaar;

  @Prop({ type: DriverAddressSchema })
  address?: DriverAddress;

  @Prop({ type: GeoPointWithTimeSchema })
  current_location?: GeoPointWithTime;

  // '1-available', '2-unavailable', '3-busy', '0-offline'
  @Prop({ enum: [1, 2, 3, 4], default: 1 })
  availability_status: 1 | 2 | 3 | 4;

  @Prop({ type: [AssignedOrderBriefSchema], default: [] })
  assigned_orders: AssignedOrderBrief[];

  @Prop({ type: DriverWalletSchema, default: {} })
  wallet: DriverWallet;

  @Prop({
    type: {
      total_earnings: { type: Number, default: 0 },
      completed_orders: { type: Number, default: 0 },
      average_rating: { type: Number, default: 0 },
    },
    default: {},
  })
  earnings_summary: {
    total_earnings: number;
    completed_orders: number;
    average_rating: number;
  };

  @Prop({
    type: [
      new MongooseSchema({
        order_id: { type: Types.ObjectId, ref: 'Order' },
        user_id: { type: Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        date: { type: Date },
      }),
    ],
    default: [],
  })
  ratings: Array<{
    order_id?: Types.ObjectId;
    user_id?: Types.ObjectId;
    rating: number;
    comment?: string;
    date?: Date;
  }>;

  @Prop({ type: DriverDocumentsSchema })
  documents?: DriverDocuments;

  @Prop({ trim: true })
  fcm_token?: string;

  @Prop({ type: String, default: '' })
  session_token?: string;
}

export const DeliveryPersonSchema =
  SchemaFactory.createForClass(DeliveryPerson);
