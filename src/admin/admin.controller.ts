import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service'; // Added AdminService import

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly adminService: AdminService // Added AdminService to constructor
    ) { }

    @Get('fix-permissions')
    @ApiOperation({ summary: 'Emergency fix for admin permissions' })
    async fixPermissions() {
        return this.adminService.fixAdminPermissions();
    }

    @Post('auth/login')
    @ApiOperation({ summary: 'Admin Login' })
    @ApiResponse({ status: 200, description: 'Return JWT access token' })
    async login(@Body() loginDto: AdminLoginDto) {
        return this.adminAuthService.login(loginDto);
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('me')
    @ApiOperation({ summary: 'Get current admin profile' })
    async getProfile(@Request() req) {
        return req.user;
    }
}
