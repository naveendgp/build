import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionLogDocument = HydratedDocument<TransactionLog>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TransactionLog {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  link_id: string; // Link ID from payment link response

  @Prop({
    enum: ['initiated', 'completed', 'failed', 'cancelled'],
    default: 'initiated',
    required: true,
  })
  status: 'initiated' | 'completed' | 'failed' | 'cancelled';

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ required: true, trim: true })
  payment_link_url: string;

  @Prop({ trim: true })
  payment_gateway?: string; // e.g., 'Cashfree'

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // For storing additional details

  created_at?: Date;
  updated_at?: Date;
}

export const TransactionLogSchema = SchemaFactory.createForClass(TransactionLog);

