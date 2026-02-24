import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly adminAuthService: AdminAuthService,
    ) { }

    @Post('auth/login')
    @ApiOperation({ summary: 'Admin Login — Step 1: Validate credentials, send OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent, returns phone hint' })
    async login(@Body() body: { email: string; password: string }) {
        return this.adminAuthService.login(body.email, body.password);
    }

    @Post('auth/verify-otp')
    @ApiOperation({ summary: 'Admin Login — Step 2: Verify OTP, issue JWT' })
    @ApiResponse({ status: 200, description: 'Returns JWT access token' })
    async verifyOtp(@Body() body: { adminId: string; otpCode: string }) {
        return this.adminAuthService.verifyOtpAndLogin(body.adminId, body.otpCode);
    }

    @Get('fix-permissions')
    @ApiOperation({ summary: 'Emergency fix for admin permissions' })
    async fixPermissions() {
        return this.adminService.fixAdminPermissions();
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('me')
    @ApiOperation({ summary: 'Get current admin profile' })
    async getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('payment-config')
    @ApiOperation({ summary: 'Get payment configuration' })
    async getPaymentConfig() {
        return this.adminService.getPaymentConfig();
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('payment-config')
    @ApiOperation({ summary: 'Update payment configuration' })
    async updatePaymentConfig(@Body() body: {
        gstPercent: number;
        platformFeePercent: number;
        deliveryFee: number;
        vendorCommission: number;
        additionalFeeFlat: number;
        additionalFeeName: string;
    }) {
        return this.adminService.updatePaymentConfig(body);
    }
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('service-area')
    @ApiOperation({ summary: 'Get service areas' })
    async getServiceAreas() {
        return this.adminService.getServiceAreas();
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('service-area')
    @ApiOperation({ summary: 'Create service area' })
    async createServiceArea(@Body() body: { name: string; polygon: any; reason?: string }, @Request() req) {
        return this.adminService.createServiceArea({ ...body, createdBy: req.user.name || req.user.email });
    }
}
