import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
    @ApiProperty({ example: 'admin@otter.com', description: 'Admin email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Admin password' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
