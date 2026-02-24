/**
 * AdminManagementController — SUPER_ADMIN only
 * 
 * CRUD for admin accounts with audit logging.
 * All endpoints guarded by AdminAuthGuard + ADMIN_MANAGE permission check.
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

@ApiTags('Admin Management')
@Controller('admin/admins')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminManagementController {
    constructor(
        private readonly adminService: AdminService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Verify the requester has ADMIN_MANAGE permission (SUPER_ADMIN only)
     */
    private assertAdminManage(user: any) {
        const hasPermission =
            user.permissions?.includes('ADMIN_MANAGE') ||
            user.permissions?.includes('SUPERADMIN') ||
            user.permissions?.includes('*') ||
            user.role === 'SUPER_ADMIN';
        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }
    }

    // ----------------------------------------------------------------
    // POST /admin/admins — Create admin
    // ----------------------------------------------------------------
    @Post()
    @ApiOperation({ summary: 'Create a new admin' })
    async createAdmin(
        @Body() body: {
            email: string;
            password: string;
            name: string;
            phoneNumber: string;
            role?: string;
        },
        @Request() req,
    ) {
        this.assertAdminManage(req.user);

        // Validate required fields
        if (!body.email || !body.password || !body.name || !body.phoneNumber) {
            throw new BadRequestException('Email, password, name, and phone number are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            throw new BadRequestException('Invalid email format');
        }

        // Validate password strength
        if (body.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        // Validate phone number (E.164)
        const phoneRegex = /^\+[1-9]\d{6,14}$/;
        const normalizedPhone = body.phoneNumber.trim();
        if (!phoneRegex.test(normalizedPhone)) {
            throw new BadRequestException('Phone number must be in E.164 format (e.g. +919876543210)');
        }

        // Check for duplicate email
        const existing = await this.adminService.findByEmail(body.email.trim().toLowerCase());
        if (existing) {
            throw new ConflictException('An admin with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);

        // Determine role and permissions
        const role = body.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
        const permissions = role === 'SUPER_ADMIN'
            ? ['SUPERADMIN']
            : ['ORDER_READ', 'USER_READ', 'PARTNER_READ', 'RIDER_READ', 'PAYMENT_READ', 'DASHBOARD_READ'];

        // Create admin (inactive by default)
        const admin = await this.prisma.admin.create({
            data: {
                email: body.email.trim().toLowerCase(),
                password: passwordHash,
                name: body.name.trim(),
                phone: normalizedPhone,
                role: role as any,
                permissions,
                isActive: false,
                createdBy: req.user.id,
            },
        });

        // Audit log
        await this.prisma.adminAuditLog.create({
            data: {
                action: 'ADMIN_CREATED',
                targetAdminId: admin.id,
                performedBy: req.user.id,
                details: { email: admin.email, role: admin.role },
            },
        });

        // Return sanitized response (NEVER return password)
        return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            isActive: admin.isActive,
            createdAt: admin.createdAt,
        };
    }

    // ----------------------------------------------------------------
    // GET /admin/admins — List all admins
    // ----------------------------------------------------------------
    @Get()
    @ApiOperation({ summary: 'List all admins' })
    async listAdmins(@Request() req) {
        this.assertAdminManage(req.user);

        const admins = await this.prisma.admin.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                permissions: true,
                isActive: true,
                createdAt: true,
                createdBy: true,
                lastLogin: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Mask phone numbers
        return admins.map(a => ({
            ...a,
            phone: a.phone ? `***${a.phone.slice(-4)}` : null,
        }));
    }

    // ----------------------------------------------------------------
    // PATCH /admin/admins/:id/status — Activate/Deactivate
    // ----------------------------------------------------------------
    @Patch(':id/status')
    @ApiOperation({ summary: 'Activate or deactivate an admin' })
    async updateAdminStatus(
        @Param('id') id: string,
        @Body() body: { isActive: boolean },
        @Request() req,
    ) {
        this.assertAdminManage(req.user);

        // Cannot deactivate yourself
        if (id === req.user.id && body.isActive === false) {
            throw new BadRequestException('You cannot deactivate your own account');
        }

        const target = await this.prisma.admin.findUnique({ where: { id } });
        if (!target) {
            throw new BadRequestException('Admin not found');
        }

        const updated = await this.prisma.admin.update({
            where: { id },
            data: { isActive: body.isActive },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        // Audit log
        await this.prisma.adminAuditLog.create({
            data: {
                action: body.isActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
                targetAdminId: id,
                performedBy: req.user.id,
            },
        });

        return updated;
    }

    // ----------------------------------------------------------------
    // POST /admin/admins/:id/reset-password — Reset password
    // ----------------------------------------------------------------
    @Post(':id/reset-password')
    @ApiOperation({ summary: 'Reset an admin password' })
    async resetPassword(
        @Param('id') id: string,
        @Request() req,
    ) {
        this.assertAdminManage(req.user);

        const target = await this.prisma.admin.findUnique({ where: { id } });
        if (!target) {
            throw new BadRequestException('Admin not found');
        }

        // Generate temporary password (16 random chars)
        const tempPassword = randomBytes(12).toString('base64url').slice(0, 16);
        const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

        await this.prisma.admin.update({
            where: { id },
            data: { password: passwordHash },
        });

        // Audit log
        await this.prisma.adminAuditLog.create({
            data: {
                action: 'PASSWORD_RESET',
                targetAdminId: id,
                performedBy: req.user.id,
            },
        });

        // Return temporary password ONCE (shown to super admin to communicate)
        return {
            message: 'Password has been reset',
            temporaryPassword: tempPassword,
        };
    }
}
