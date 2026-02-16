import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class UserAddress {
  @Prop({ trim: true })
  label?: string;

  @Prop({ trim: true })
  address_line1: string;

  @Prop({ trim: true })
  address_line2?: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  state: string;

  @Prop({ trim: true })
  pincode: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Boolean, default: false })
  is_default?: boolean;
}

export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

@Schema({ _id: false })
export class UserWallet {
  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ type: Date })
  last_updated?: Date;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ trim: true })
  wash_type?: string;

  @Prop({ trim: true })
  fold_preference?: string;

  @Prop({ trim: true })
  detergent_type?: string;

  @Prop({ type: Boolean, default: true })
  notifications_enabled?: boolean;
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true, default: '' })
  name?: string;

  @Prop({ lowercase: true, trim: true, default: '' })
  email?: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true })
  gender?: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ type: [UserAddressSchema], default: [] })
  addresses: UserAddress[];

  @Prop({ type: UserWalletSchema, default: {} })
  wallet: UserWallet;

  @Prop({ type: Number, default: 0 })
  loyalty_points: number;

  @Prop({ type: UserPreferencesSchema, default: {} })
  preferences: UserPreferences;

  @Prop({ trim: true })
  referral_code?: string;

  @Prop({ trim: true })
  referred_by?: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @Prop({ trim: true })
  fcm_token?: string;

  @Prop({ type: String, default: '' })
  session_token?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
