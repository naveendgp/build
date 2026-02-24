import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RecipientType {
    USER = 'user',
    VENDOR = 'vendor',
    DELIVERYPERSON = 'deliveryperson',
}

export class SendNotificationDto {
    @ApiProperty({ description: 'Notification title' })
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title: string;

    @ApiProperty({ description: 'Notification message body' })
    @IsString()
    @IsNotEmpty({ message: 'Message is required' })
    message: string;

    @ApiProperty({ enum: RecipientType, description: 'Recipient type' })
    @IsEnum(RecipientType, {
        message: 'recipientType must be one of: user, vendor, deliveryperson',
    })
    @IsNotEmpty()
    recipientType: RecipientType;

    @ApiPropertyOptional({
        description: 'Specific recipient IDs (omit to send to all)',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recipientIds?: string[];
}
