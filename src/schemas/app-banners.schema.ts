import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BannersDocument = HydratedDocument<Banners>;

@Schema({ timestamps: true })
export class Banners {
    @Prop({ required: true })
    asseturl: string;

    @Prop({ required: true })
    isactive: boolean;

    @Prop({ required: true })
    enableStatus: boolean;

    @Prop()
    position: number;

    @Prop()
    type: string;

    @Prop()
    cta: string;
}

export const BannersSchema = SchemaFactory.createForClass(Banners);