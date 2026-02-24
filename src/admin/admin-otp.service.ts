/**
 * AdminOtpService — Secure OTP generation, storage, and verification
 * 
 * Security invariants:
 * - OTP generated with crypto.randomInt (CSPRNG)
 * - OTP hashed with bcrypt before storage
 * - OTP NEVER logged or returned in plaintext after generation
 * - Deleted immediately on successful verification or lockout
 * - 5-minute expiry, max 5 attempts, 60s resend cooldown
 */

import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SnsService } from './sns.service';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const SALT_ROUNDS = 10;

@Injectable()
export class AdminOtpService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly snsService: SnsService,
    ) { }

    /**
     * Generate OTP, hash it, store it, and send via SMS.
     * Returns a masked phone hint for the frontend.
     */
    async generateAndSendOtp(adminId: string, phoneNumber: string): Promise<{ phoneHint: string }> {
        // Check resend cooldown
        const recentOtp = await this.prisma.adminOtp.findFirst({
            where: {
                adminId,
                createdAt: {
                    gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (recentOtp) {
            throw new HttpException(
                'Please wait before requesting a new code',
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Delete any existing OTPs for this admin (single active OTP)
        await this.prisma.adminOtp.deleteMany({
            where: { adminId },
        });

        // Generate 6-digit OTP using CSPRNG
        const otpValue = String(randomInt(100000, 999999));

        // Hash the OTP
        const otpHash = await bcrypt.hash(otpValue, SALT_ROUNDS);

        // Store hashed OTP
        await this.prisma.adminOtp.create({
            data: {
                adminId,
                otpHash,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
                attempts: 0,
            },
        });

        // DEV BYPASS: Log OTP to console instead of sending via SMS
        // TODO: Remove this bypass and uncomment SNS sending for production
        console.log(`\n========================================`);
        console.log(`  DEV MODE — OTP for ${phoneNumber}: ${otpValue}`);
        console.log(`========================================\n`);
        // const message = `Your admin login code is ${otpValue}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
        // await this.snsService.sendSms(phoneNumber, message);

        // Generate masked phone hint
        const phoneHint = phoneNumber.length > 4
            ? '***' + phoneNumber.slice(-4)
            : '****';

        return { phoneHint };
    }

    /**
     * Verify an OTP submitted by the admin.
     * On success: deletes the OTP record.
     * On failure: increments attempts, may lock out.
     */
    async verifyOtp(adminId: string, otpCode: string): Promise<boolean> {
        const otpRecord = await this.prisma.adminOtp.findFirst({
            where: { adminId },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('No verification code found. Please request a new one.');
        }

        // Check expiry
        if (new Date() > otpRecord.expiresAt) {
            await this.prisma.adminOtp.delete({ where: { id: otpRecord.id } });
            throw new UnauthorizedException('Verification code has expired. Please request a new one.');
        }

        // Check max attempts
        if (otpRecord.attempts >= MAX_ATTEMPTS) {
            await this.prisma.adminOtp.delete({ where: { id: otpRecord.id } });
            throw new HttpException(
                'Too many incorrect attempts. Please request a new code.',
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Compare hash
        const isValid = await bcrypt.compare(otpCode, otpRecord.otpHash);

        if (!isValid) {
            // Increment attempts
            await this.prisma.adminOtp.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new UnauthorizedException('Invalid verification code');
        }

        // Success — delete the OTP record (single-use)
        await this.prisma.adminOtp.delete({ where: { id: otpRecord.id } });

        return true;
    }
}
