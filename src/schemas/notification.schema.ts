import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
}

export enum NotificationRole {
  USER = 'user',
  VENDOR = 'vendor',
  DELIVERY = 'delivery',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true })
  recipient_id: Types.ObjectId;

  @Prop({ enum: NotificationRole, required: true })
  recipient_role: NotificationRole;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  is_read: boolean;

  @Prop({ type: Date })
  read_at?: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  created_at?: Date;
  updated_at?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes for better query performance
NotificationSchema.index({ recipient_id: 1, recipient_role: 1, created_at: -1 });
NotificationSchema.index({ recipient_id: 1, recipient_role: 1, is_read: 1 });

