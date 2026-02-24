/**
 * AdminAuthService — Two-step login flow
 * 
 * Step 1: login() — validate credentials, generate OTP, send SMS
 * Step 2: verifyOtpAndLogin() — verify OTP, issue JWT
 * 
 * Security: No token is issued until OTP is verified.
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminOtpService } from './admin-otp.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly adminService: AdminService,
        private readonly jwtService: JwtService,
        private readonly adminOtpService: AdminOtpService,
    ) { }

    /**
     * Step 1: Validate email + password, then send OTP via SMS.
     * Returns phone hint — NO TOKEN ISSUED.
     */
    async login(email: string, password: string): Promise<{ step: string; phoneHint: string; adminId: string }> {
        const admin = await this.adminService.findByEmail(email);

        // Generic error for all credential failures (no information leakage)
        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, admin.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Admin must have a phone number registered
        if (!admin.phone) {
            throw new BadRequestException(
                'Phone number not configured. Contact your administrator.'
            );
        }

        // Generate OTP and send SMS
        const { phoneHint } = await this.adminOtpService.generateAndSendOtp(
            admin.id,
            admin.phone,
        );

        return {
            step: 'OTP_REQUIRED',
            phoneHint,
            adminId: admin.id,
        };
    }

    /**
     * Step 2: Verify OTP and issue JWT.
     */
    async verifyOtpAndLogin(adminId: string, otpCode: string): Promise<{ accessToken: string }> {
        // Verify the OTP (throws on failure)
        await this.adminOtpService.verifyOtp(adminId, otpCode);

        // Re-fetch admin to ensure still active
        const admin = await this.adminService.findById(adminId);
        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Account is not active');
        }

        // Update last login timestamp
        await this.adminService.updateLastLogin(admin.id);

        // Issue JWT
        const payload = {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
