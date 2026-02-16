import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAuthDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+919876543210',
  })
  @IsString()
  phoneNumber: string;
}

export class UserVerifyOtpDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+919876543210',
  })
  @IsString()
  phoneNumber: string;

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

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'User gender',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-01',
    type: Date,
  })
  @IsOptional()
  dob?: Date;
}

export class AddAddressDto {
  @ApiProperty({
    description: 'Address label (e.g., Home, Work)',
    example: 'Home',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Primary address line',
    example: '123 Main Street',
  })
  @IsString()
  address_line1: string;

  @ApiPropertyOptional({
    description: 'Secondary address line',
    example: 'Apt 4B',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 12.9716,
    type: Number,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 77.5946,
    type: Number,
  })
  @IsNumber()
  longitude: number;
}

export class RemoveAddressDto {
  @ApiProperty({
    description: 'Address ID to remove',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  addressId: string;
}

export class EditAddressDto {
  @ApiProperty({
    description: 'Address ID to edit',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  addressId: string;

  @ApiPropertyOptional({
    description: 'Address label (e.g., Home, Work, Office)',
    example: 'Home',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'Primary address line',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Secondary address line',
    example: 'Apt 4B',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 12.9716,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 77.5946,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Set as default address',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export enum SortOption {
  DISTANCE_LOW_TO_HIGH = 'distance-low-to-high',
  DISTANCE_HIGH_TO_LOW = 'distance-high-to-low',
  DELIVERY_LOW_TO_HIGH = 'delivery-low-to-high',
  DELIVERY_HIGH_TO_LOW = 'delivery-high-to-low',
  RATING_LOW_TO_HIGH = 'rating-low-to-high',
  RATING_HIGH_TO_LOW = 'rating-high-to-low',
  OFFER_LOW_TO_HIGH = 'offer-low-to-high',
  OFFER_HIGH_TO_LOW = 'offer-high-to-low',
  COST_LOW_TO_HIGH = 'cost-low-to-high',
  COST_HIGH_TO_LOW = 'cost-high-to-low',
}

export enum FilterOption {
  IS_EXPRESS = 'isExpress',
  IRON_AND_FOLD = 'ironandfold',
  DRY_CLEAN = 'dryclean',
  WASH_AND_FOLD = 'washandfold',
  IRON = 'iron',
  IS_OFFER = 'isOffer',
}

export class FilterVendorsDto {
  @ApiPropertyOptional({
    description: 'Sort options for vendor listing',
    enum: SortOption,
    isArray: true,
    example: [SortOption.DISTANCE_LOW_TO_HIGH, SortOption.RATING_HIGH_TO_LOW],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SortOption, { each: true })
  sort?: SortOption[];

  @ApiPropertyOptional({
    description: 'Filter by express service availability',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by vendors with offers',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOffer?: boolean;

  @ApiPropertyOptional({
    description: 'Array of service ids to filter ',
    example: ['690044c3984cde8ae7c1a70e'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceFilters?: string[];

  @ApiPropertyOptional({
    description:
      'Search vendors by shop name. Performs case-insensitive partial match on vendor shop names. Example: searching "Laundry" will match "Quick Laundry Service", "Laundry Express", etc.',
    example: 'Laundry',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateReviewDto {
  @ApiProperty({
    description: 'Order ID to review',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional review comment',
    example: 'Great service, very satisfied!',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class GetVendorReviewsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class ServiceItemDto {
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
    description: 'Item ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  item_id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'T-Shirt',
  })
  @IsString()
  item_name: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 5,
    minimum: 1,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class MakeOrderDto {
  @ApiProperty({
    description: 'User address ID for pickup',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  pickup_address_id: string;

  @ApiProperty({
    description: 'Vendor ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  vendor_id: string;

  @ApiProperty({
    description: 'Array of service items',
    type: [ServiceItemDto],
    example: [
      {
        service_id: '507f1f77bcf86cd799439011',
        service_name: 'Wash and Fold',
        item_id: '507f1f77bcf86cd799439012',
        item_name: 'T-Shirt',
        quantity: 5,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  service_items: ServiceItemDto[];

  @ApiPropertyOptional({
    description: 'Express delivery flag',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_express?: boolean;

  @ApiPropertyOptional({
    description: 'Order notes',
    example: 'Please handle with care',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  order_notes?: string;

  @ApiPropertyOptional({
    description: 'Coupon code to apply',
    example: 'WELCOME50',
  })
  @IsOptional()
  @IsString()
  offer_code?: string;
}
