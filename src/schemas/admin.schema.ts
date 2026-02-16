import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

export enum AdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
}

@Schema({ timestamps: true })
export class Admin {
    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, enum: AdminRole, default: AdminRole.ADMIN })
    role: AdminRole;

    @Prop({ type: [String], default: [] })
    permissions: string[];

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLogin?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
