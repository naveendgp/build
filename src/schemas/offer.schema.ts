import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OfferDocument = HydratedDocument<Offer>;

@Schema({ _id: false })
export class OfferUsage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    usage_count: number;

    @Prop({ type: Date })
    last_used_at?: Date;
}

export const OfferUsageSchema = SchemaFactory.createForClass(OfferUsage);

@Schema({ timestamps: true })
export class Offer {
    @Prop({ required: true, unique: true, trim: true, uppercase: true })
    code: string;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ enum: ['percentage', 'fixed'], required: true })
    discount_type: 'percentage' | 'fixed';

    @Prop({ type: Number, required: true })
    discount_value: number;

    @Prop({ type: Number, default: 0 })
    max_discount_cap: number; // For percentage discounts, max cap

    @Prop({ type: Number, default: 0 })
    min_order_value: number;

    @Prop({ type: Date, required: true })
    valid_from: Date;

    @Prop({ type: Date, required: true })
    valid_until: Date;

    @Prop({ type: Boolean, default: true })
    is_active: boolean;

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    assigned_users: Types.ObjectId[]; // Empty array means all users

    @Prop({ type: Number, default: 0 })
    max_usage_per_user: number; // 0 means unlimited

    @Prop({ type: Number, default: 0 })
    total_usage_limit: number; // 0 means unlimited

    @Prop({ type: Number, default: 0 })
    total_usage_count: number;

    @Prop({ type: [OfferUsageSchema], default: [] })
    user_usage: OfferUsage[];

    @Prop({ trim: true })
    created_by?: string; // Admin email

    @Prop({ type: [Types.ObjectId], ref: 'Service', default: [] })
    applicable_services: Types.ObjectId[]; // Empty array means all services
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

// Index for faster lookups
OfferSchema.index({ code: 1 });
OfferSchema.index({ is_active: 1, valid_from: 1, valid_until: 1 });
OfferSchema.index({ assigned_users: 1 });
