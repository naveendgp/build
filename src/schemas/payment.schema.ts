import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  payment_gateway: string; // Razorpay

  @Prop({ required: true, trim: true })
  payment_mode: string; // UPI, card, etc.

  @Prop({ required: true, trim: true })
  transaction_id: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({
    enum: ['created', 'captured', 'failed', 'refunded'],
    default: 'created',
  })
  status: 'created' | 'captured' | 'failed' | 'refunded';

  @Prop({ type: Number, default: 0 })
  wallet_used: number;

  @Prop({ type: Number, default: 0 })
  vendor_share: number;

  @Prop({ type: Number, default: 0 })
  platform_commission: number;

  @Prop({ type: Date })
  payment_timestamp?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
