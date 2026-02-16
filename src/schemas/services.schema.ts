import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ServicesDocument = HydratedDocument<Services>;

@Schema({ _id: false })
export class Items {
  @Prop({ type: String, required: true })
  item_name: string;

  @Prop({ type: String, required: true })
  image_url: string;

  @Prop({ type: String, required: true })
  item_description: string;

  @Prop({type:String,required:true})
  item_slug: string;

  @Prop({ type: String, default: true })
  category: string;
}

@Schema({ timestamps: true })
export class Services {
  @Prop({ type: String, required: true })
  service_name: string;

  @Prop({ type: String, required: true })
  image_url: string;

  @Prop({ type: String, enum: ['per_kg', 'per_pc'], required: true })
  pricing_type: string;

  @Prop({ type: String, required: true })
  service_description: string;

  @Prop({ type: [Items], default: [] })
  items: Items[];
}
export const ServicesSchema = SchemaFactory.createForClass(Services);
