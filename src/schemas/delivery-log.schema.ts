import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryLogDocument = HydratedDocument<DeliveryLog>;

@Schema({ timestamps: true })
export class DeliveryLog {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPerson', required: true })
  delivery_person_id: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object })
  details?: any;
}

export const DeliveryLogSchema = SchemaFactory.createForClass(DeliveryLog);