import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: false })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendor_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPerson' })
  driver_id?: Types.ObjectId;

  @Prop({ enum: ['user', 'vendor', 'driver'], required: true })
  entity_type: 'user' | 'vendor' | 'driver';

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id?: Types.ObjectId;

  @Prop({ enum: ['debit', 'credit'], required: true })
  transaction_type: 'debit' | 'credit';

  @Prop({ required: true, trim: true })
  method: string; // Razorpay, system, etc.

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number })
  balance_after?: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
