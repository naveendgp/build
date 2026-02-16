import { IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryRegisterDto {
  @ApiPropertyOptional({
    description: 'Delivery person full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Delivery person phone number',
    example: '+919876543210',
  })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Delivery person email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

export class DeliveryLoginDto {
  @ApiProperty({
    description: 'Delivery person phone number',
    example: '+919876543210',
  })
  @IsString()
  phoneNumber: string;
}

export class DeliveryVerifyOtpDto {
  @ApiProperty({
    description: 'Delivery person phone number',
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

export class UpdateLocationDto {
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

export class UpdateAvailabilityDto {
  @ApiProperty({
    description:
      'Availability status: 1-available, 2-unavailable, 3-busy, 0-offline',
    example: 1,
    enum: [0, 1, 2, 3],
    type: Number,
  })
  @IsNumber()
  status: number; // '1-available', '2-unavailable', '3-busy', '0-offline'
}
