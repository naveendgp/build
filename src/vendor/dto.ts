import {
  IsString,
  Length,
  IsEmail,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorRegisterDto {
  @ApiProperty({
    description: 'Vendor phone number',
    example: '+919876543210',
  })
  @IsString()
  phone: string;
}

export class OperatingDayDto {
  @ApiProperty({
    description: 'Opening time (HH:mm format)',
    example: '09:00',
  })
  @IsString()
  open: string;

  @ApiProperty({
    description: 'Closing time (HH:mm format)',
    example: '18:00',
  })
  @IsString()
  close: string;
}

export class OperatingHoursDto {
  @ApiPropertyOptional({
    description: 'Monday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  monday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Tuesday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  tuesday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Wednesday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  wednesday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Thursday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  thursday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Friday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  friday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Saturday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  saturday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Sunday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  sunday?: OperatingDayDto;
}

export class VendorRegisterCompleteDto {
  @ApiProperty({
    description: 'Shop name',
    example: 'Clean Laundry Services',
  })
  @IsString()
  shop_name: string;

  @ApiProperty({
    description: 'Owner full name',
    example: 'John Doe',
  })
  @IsString()
  owner_name: string;

  @ApiPropertyOptional({
    description: 'Vendor email address',
    example: 'vendor@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'GST number',
    example: '27ABCDE1234F1Z5',
  })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiPropertyOptional({
    description: 'PAN number',
    example: 'ABCDE1234F',
  })
  @IsOptional()
  @IsString()
  pan_number?: string;

  @ApiPropertyOptional({
    description: 'Shop license number',
    example: 'LIC123456',
  })
  @IsOptional()
  @IsString()
  shop_license_number?: string;

  @ApiPropertyOptional({
    description: 'Aadhaar number',
    example: '123456789012',
  })
  @IsOptional()
  @IsString()
  aadhaar_number?: string;

  @ApiProperty({
    description: 'Primary address line',
    example: '123 Main Street',
  })
  @IsString()
  address_line1: string;

  @ApiPropertyOptional({
    description: 'Secondary address line',
    example: 'Near Market',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Landmark',
    example: 'Near Metro Station',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 19.076,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 72.8777,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Contact number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  contactNum?: string;

  @ApiPropertyOptional({
    description: 'Bank account holder name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  account_holder_name?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiPropertyOptional({
    description: 'IFSC code',
    example: 'HDFC0001234',
  })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'HDFC Bank',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Bank branch',
    example: 'Andheri West',
  })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description: 'UPI ID linked to the bank account',
    example: 'vendor@upi',
  })
  @IsOptional()
  @IsString()
  upi_id?: string;

  @ApiPropertyOptional({
    description: 'Operating hours for all days of the week',
    type: OperatingHoursDto,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    // If it's already an object, return as is
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    // If it's a string, parse it
    if (typeof value === 'string') {
      try {
        const trimmed = value.trim();
        return trimmed ? JSON.parse(trimmed) : value;
      } catch (error) {
        return value; // Return original if parsing fails
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operating_hours?: OperatingHoursDto;
}

export class VendorUserUpdateDto {
  @ApiPropertyOptional({
    description: 'Vendor display/shop name',
    example: 'Clean Laundry Services',
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Primary contact number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  contactNum?: string;

  @ApiPropertyOptional({
    description: 'Vendor email address',
    example: 'vendor@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Owner full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  owner_name?: string;
}

export class VendorLoginDto {
  @ApiProperty({
    description: 'Vendor phone number',
    example: '+919876543210',
  })
  @IsString()
  phone: string;
}

export class VendorSendOtpDto {
  @ApiProperty({
    description: 'Vendor phone number',
    example: '+919876543210',
  })
  @IsString()
  phone: string;
}

export class VendorVerifyOtpDto {
  @ApiProperty({
    description: 'Vendor phone number',
    example: '+919876543210',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'OTP code received via SMS',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @Length(4, 6)
  otp: string;

  @ApiProperty({
    description: 'Firebase Cloud Messaging token for push notifications',
    example: 'fcm_token_here',
  })
  @IsString()
  fcm_token: string;
}

export class UpdateOperatingHoursDto {
  @ApiPropertyOptional({
    description: 'Monday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  monday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Tuesday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  tuesday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Wednesday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  wednesday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Thursday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  thursday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Friday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  friday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Saturday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  saturday?: OperatingDayDto;

  @ApiPropertyOptional({
    description: 'Sunday operating hours',
    type: OperatingDayDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingDayDto)
  sunday?: OperatingDayDto;
}

export class UpdateBankDetailsDto {
  @ApiPropertyOptional({
    description: 'Bank account holder name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  account_holder_name?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiPropertyOptional({
    description: 'IFSC code',
    example: 'HDFC0001234',
  })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'HDFC Bank',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Bank branch',
    example: 'Andheri West',
  })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description: 'UPI ID linked to the bank account',
    example: 'vendor@upi',
  })
  @IsOptional()
  @IsString()
  upi_id?: string;
}

export class ItemsServicesDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Shirt',
  })
  @IsString()
  item_name: string;

  @ApiProperty({
    description: 'Item category',
    example: 'Clothing',
  })
  @IsString()
  item_category: string;

  @ApiProperty({
    description: 'Regular price',
    example: 50,
    type: Number,
  })
  @IsNumber()
  item_price: number;

  @ApiProperty({
    description: 'Express service price',
    example: 75,
    type: Number,
  })
  @IsNumber()
  express_price: number;

  @ApiProperty({
    description: 'Discount percentage',
    example: 10,
    type: Number,
  })
  @IsNumber()
  discount_percentage: number;

  @ApiProperty({
    description: 'Whether the item service is active',
    example: true,
  })
  @IsBoolean()
  is_active: boolean;
}

export class ServiceOfferedDto {
  @ApiProperty({
    description: 'Service ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  service_id: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Wash and Fold',
  })
  @IsString()
  service_name: string;

  @ApiProperty({
    description: 'Maximum count per day for this service',
    example: 100,
    type: Number,
  })
  @IsNumber()
  max_count_per_day: number;

  @ApiProperty({
    description: 'Whether express service is available for this item',
    example: true,
  })
  @IsBoolean()
  is_express: boolean;

  @ApiPropertyOptional({
    description: 'Maximum cap for offer discount',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  offer_max_cap?: number;

  @ApiPropertyOptional({
    description: 'Whether offer is available for this service',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_offer?: boolean;

  @ApiPropertyOptional({
    description: 'Offer percentage discount',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  offer_percentage?: number;

  @ApiPropertyOptional({
    description: 'Express delivery time in hours',
    example: 8,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  express_time?: number;

  @ApiPropertyOptional({
    description: 'Standard delivery time in hours',
    example: 48,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  standard_time?: number;

  @ApiPropertyOptional({
    description:
      'Standard price per kg (only applicable for services with pricing_type as per_kg)',
    example: 50,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  standard_price_per_kg?: number;

  @ApiPropertyOptional({
    description:
      'Express price per kg (only applicable for services with pricing_type as per_kg)',
    example: 80,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  express_price_per_kg?: number;

  @ApiPropertyOptional({
    description: 'Pricing tiers for regular, standard, and max',
    example: { regular: 40, standard: 50, max: 80 },
    type: Object,
  })
  @IsOptional()
  pricing_tiers?: {
    regular: number;
    standard: number;
    max: number;
  };

  @ApiProperty({
    description: 'Items/services in this category',
    type: [ItemsServicesDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemsServicesDto)
  items: ItemsServicesDto[];
}

export class UpdateServicesOfferedDto {
  @ApiPropertyOptional({
    description: 'Service details to update',
    type: ServiceOfferedDto,
  })
  @IsOptional()
  service: ServiceOfferedDto;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  order_id: string;

  @ApiProperty({
    description: 'Order status',
    example: 'processing',
    enum: ['processing', 'processed'],
  })
  @IsString()
  @IsIn(['processing', 'processed'])
  status: string;
}

export class ServiceToggleItemDto {
  @ApiProperty({
    description: 'Service ID to activate/deactivate',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  service_id: string;

  @ApiProperty({
    description: 'Service active status',
    example: true,
  })
  @IsBoolean()
  is_active: boolean;
}

export class ToggleServiceActiveDto {
  @ApiProperty({
    description: 'Array of services to activate/deactivate',
    type: [ServiceToggleItemDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceToggleItemDto)
  services: ServiceToggleItemDto[];
}

export class VendorAddressUpdateDto {
  @ApiPropertyOptional({
    description: 'Primary address line',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Secondary address line',
    example: 'Near Market',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 19.076,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 72.8777,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Landmark',
    example: 'Near Metro Station',
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class UpdateShopDetailsDto {
  @ApiPropertyOptional({
    description: 'Shop name',
    example: 'Clean Laundry Services',
  })
  @IsOptional()
  @IsString()
  shop_name?: string;

  @ApiPropertyOptional({
    description: 'Contact number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  contactNum?: string;

  @ApiPropertyOptional({
    description: 'Shop address details',
    type: VendorAddressUpdateDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorAddressUpdateDto)
  address?: VendorAddressUpdateDto;

  @ApiPropertyOptional({
    description: 'Operating hours for all days of the week',
    type: OperatingHoursDto,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    // If it's already an object, return as is
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    // If it's a string, parse it
    if (typeof value === 'string') {
      try {
        const trimmed = value.trim();
        return trimmed ? JSON.parse(trimmed) : value;
      } catch (error) {
        return value; // Return original if parsing fails
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operating_hours?: OperatingHoursDto;
}

export class ToggleVendorSettingsDto {
  @ApiPropertyOptional({
    description:
      'Toggle vendor express status (enable/disable express services)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  express_status?: boolean;

  @ApiPropertyOptional({
    description:
      'Toggle shop status (open/close): true = open, false = close. If not provided, will toggle current status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  shop_status?: boolean;
}

export class OrderItemUpdateDto {
  @ApiProperty({
    description: 'Item ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  item_id: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
    type: Number,
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Weight',
    example: 1.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  pricing_tier?: string;
}

export class UpdateOrderItemsDto {
  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  order_id: string;

  @ApiProperty({
    description: 'Items to update',
    type: [OrderItemUpdateDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemUpdateDto)
  items: OrderItemUpdateDto[];
}
