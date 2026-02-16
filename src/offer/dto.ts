import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    IsDateString,
    Min,
    Max,
} from 'class-validator';

export class CreateOfferDto {
    @ApiProperty({ description: 'Unique coupon code' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Offer title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Offer description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: ['percentage', 'fixed'], description: 'Type of discount' })
    @IsEnum(['percentage', 'fixed'])
    discount_type: 'percentage' | 'fixed';

    @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
    @IsNumber()
    @Min(0)
    discount_value: number;

    @ApiPropertyOptional({ description: 'Maximum discount cap for percentage discounts' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    max_discount_cap?: number;

    @ApiPropertyOptional({ description: 'Minimum order value required' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    min_order_value?: number;

    @ApiProperty({ description: 'Start date of offer validity' })
    @IsDateString()
    valid_from: string;

    @ApiProperty({ description: 'End date of offer validity' })
    @IsDateString()
    valid_until: string;

    @ApiPropertyOptional({ description: 'Whether the offer is active', default: true })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @ApiPropertyOptional({ description: 'List of user IDs this offer is assigned to (empty = all users)' })
    @IsArray()
    @IsOptional()
    assigned_users?: string[];

    @ApiPropertyOptional({ description: 'Maximum usage per user (0 = unlimited)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    max_usage_per_user?: number;

    @ApiPropertyOptional({ description: 'Total usage limit (0 = unlimited)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    total_usage_limit?: number;

    @ApiPropertyOptional({ description: 'Applicable service IDs (empty = all services)' })
    @IsArray()
    @IsOptional()
    applicable_services?: string[];
}

export class UpdateOfferDto {
    @ApiPropertyOptional({ description: 'Offer title' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: 'Offer description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: ['percentage', 'fixed'], description: 'Type of discount' })
    @IsEnum(['percentage', 'fixed'])
    @IsOptional()
    discount_type?: 'percentage' | 'fixed';

    @ApiPropertyOptional({ description: 'Discount value' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    discount_value?: number;

    @ApiPropertyOptional({ description: 'Maximum discount cap' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    max_discount_cap?: number;

    @ApiPropertyOptional({ description: 'Minimum order value' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    min_order_value?: number;

    @ApiPropertyOptional({ description: 'Start date of validity' })
    @IsDateString()
    @IsOptional()
    valid_from?: string;

    @ApiPropertyOptional({ description: 'End date of validity' })
    @IsDateString()
    @IsOptional()
    valid_until?: string;

    @ApiPropertyOptional({ description: 'Whether the offer is active' })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @ApiPropertyOptional({ description: 'List of assigned user IDs' })
    @IsArray()
    @IsOptional()
    assigned_users?: string[];

    @ApiPropertyOptional({ description: 'Maximum usage per user' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    max_usage_per_user?: number;

    @ApiPropertyOptional({ description: 'Total usage limit' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    total_usage_limit?: number;

    @ApiPropertyOptional({ description: 'Applicable service IDs' })
    @IsArray()
    @IsOptional()
    applicable_services?: string[];
}

export class ValidateCouponDto {
    @ApiProperty({ description: 'Coupon code to validate' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Order total amount' })
    @IsNumber()
    @Min(0)
    order_total: number;

    @ApiPropertyOptional({ description: 'Service IDs in the order' })
    @IsArray()
    @IsOptional()
    service_ids?: string[];
}

export class ApplyCouponDto {
    @ApiProperty({ description: 'Coupon code to apply' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'Order ID to apply the coupon to' })
    @IsString()
    @IsNotEmpty()
    order_id: string;
}

export class CouponValidationResponse {
    valid: boolean;
    discount_amount: number;
    message: string;
    offer?: {
        code: string;
        title: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        max_discount_cap: number;
    };
}

export class UserOfferResponse {
    _id: string;
    code: string;
    title: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_cap: number;
    min_order_value: number;
    valid_until: Date;
}
