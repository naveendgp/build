import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserAddress } from './user.schema';
import { VendorAddress } from './vendor.schema';
import { boolean } from 'joi';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  service_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  service_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  item_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  item_name: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number })
  price_per_item?: number;

  @Prop({ type: Number })
  total_price?: number;

  @Prop({ type: String, trim: true })
  item_category?: string;

  @Prop({ type: Number, default: 0 })
  weight?: number;

  @Prop({ type: String, enum: ['regular', 'standard', 'max'], default: 'regular' })
  pricing_tier?: string;
}

@Schema({ _id: false })
export class PaymentDetails {
  @Prop({ type: Boolean, required: true, default: false })
  is_payment_eligible: boolean = false;
  @Prop({ type: Number, required: true })
  amount_to_vendor: number;
  @Prop({ type: Number, required: true })
  amount_to_vendor_after_commission: number;
  @Prop({ type: Number, required: true })
  amount_to_platform: number;
  @Prop({ type: Number, required: true })
  delivery_fee: number;
  @Prop({ type: Number, required: true })
  gst: number;
  @Prop({ type: Boolean, default: false })
  isOfferApplied: boolean;
  @Prop({ type: Number, default: 0 })
  offerDiscountAmount: number;
  @Prop({ type: Number, default: 0 })
  totalPayableAmount: number;
  @Prop({ type: Number, default: 0 })
  item_total: number;
  @Prop({ type: Number, default: 0 })
  grand_total: number;
  @Prop({ type: Number, default: 0 })
  vendor_commission?: number;
}

export const PaymentDetailsSchema = SchemaFactory.createForClass(PaymentDetails);

export class riderDetails {
  name: string;
  phone: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Order {
  @Prop({ required: true })
  order_number: number;

  @Prop({ required: true, default: 1 })
  status_type: number;

  @Prop({ default: false })
  is_verified?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendor_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPerson' })
  driver_id_1?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPerson' })
  driver_id_2?: Types.ObjectId | null;

  @Prop({ type: VendorAddress, required: true })
  vendor_address: VendorAddress;

  @Prop({ type: UserAddress, required: true })
  user_address: UserAddress;

  @Prop({ type: riderDetails })
  rider?: riderDetails;

  created_at?: Date;
  updated_at?: Date;

  @Prop({
    enum: [
      'pending',
      'processing',
      'processed',
      'cancelled',
      'reached_to_user',
      'reached_to_vendor',
      'delivered',
      'picked_up',
      'accepted',
      'rejected',
      'processed',
      'unaccepted',
      'driver_assigned',
      'out_for_delivery',
      'delivery_OTP_verified',
      'verified',
    ],
    default: 'pending',
  })
  status:
    | 'pending'
    | 'processing'
    | 'reached_to_user'
    | 'reached_to_vendor'
    | 'driver_assigned'
    | 'processed'
    | 'cancelled'
    | 'delivered'
    | 'picked_up'
    | 'accepted'
    | 'rejected'
    | 'unaccepted'
    | 'processed'
    | 'out_for_delivery'
    | 'delivery_OTP_verified'
    | 'verified';

  @Prop({
    type: Map,
    of: Date,
    default: {},
  })
  status_timestamps?: Map<
    | 'processing_at'
    | 'processed_at'
    | 'cancelled_at'
    | 'delivered_at'
    | 'picked_up_at'
    | 'accepted_at'
    | 'rejected_at'
    | 'unaccepted_at'
    | 'out_for_delivery_at'
    | 'verified_at'
    | 'driver_assigned_at'
    | 'paid_at',
    Date
  >;

  @Prop({ type: Boolean, default: false })
  is_express: boolean;

  @Prop({ type: Date })
  pickup_scheduled_at?: Date;

  @Prop({ type: Date })
  picked_up_at?: Date | null;

  @Prop({ type: Date })
  delivered_to_vendor_at?: Date | null;

  @Prop({ type: Date })
  expected_delivery_date?: Date;

  @Prop({ type: Date })
  delivered_to_user_at?: Date | null;

  @Prop({ enum: ['pending', 'paid', 'initiated'], default: 'pending' })
  payment_status: 'pending' | 'paid' | 'initiated';

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  payment_id?: Types.ObjectId | null;

  @Prop({ type: PaymentDetailsSchema, required: true })
  payment_details: PaymentDetails;

  @Prop({ type: Number, required: true })
  total_amount: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ trim: true })
  order_notes?: string;


  @Prop({ type: Boolean, default: false })
  rating_given: boolean;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({
    type: Number,
    default: () => Math.floor(1000 + Math.random() * 9000),
    // default: 1234,
  })
  user_otp: number;

  @Prop({
    type: String,
    default: () => Math.floor(1000 + Math.random() * 9000),
    // default: 1234,
  })
  vendor_otp: number;

  @Prop({
    type: Number,
    default: 0,
  })
  cash_paid_amount?: number;

  @Prop({ trim: true })
  invoice_url?: string;

  @Prop({ type: Number })
  trip_type?: number;

  @Prop({ type: Boolean, default: false })
  is_settled_to_vendor?: boolean;

  @Prop({ type: Number, default: 0 })
  settled_amount?: number;

  @Prop({ type: Date })
  eta_start_time?: Date;

  @Prop({ type: Date })
  eta_end_time?: Date;

  @Prop({ type: Number, default: 0 })
  payment: number;

  @Prop({ type: Number })
  service_type?: number;
}

export class deliveryOrderDetails {
  orderId: string;
  fromLocation: string;
  fromLocationDistance: number;
  fromLocationEta: string;
  toLocation: string;
  toLocationDistance: number;
  deadlineTime: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
