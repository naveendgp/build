/**
 * AdminBannerController — SUPER_ADMIN only
 *
 * CRUD for banners with S3 image upload.
 * Endpoints: GET/POST /admin/banners, PUT/DELETE /admin/banners/:id, PATCH /admin/banners/:id/toggle
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { uploadToS3 } from '../utils/s3.util';

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
];

@ApiTags('Admin Banners')
@Controller('admin/banners')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminBannerController {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Verify the requester is a super-admin
     */
    private assertSuperAdmin(user: any) {
        const hasPermission =
            user.permissions?.includes('SUPERADMIN') ||
            user.permissions?.includes('*') ||
            user.role === 'SUPER_ADMIN';
        if (!hasPermission) {
            throw new ForbiddenException('Super-admin access required');
        }
    }

    // ----------------------------------------------------------------
    // GET /admin/banners — List all banners
    // ----------------------------------------------------------------
    @Get()
    @ApiOperation({ summary: 'List all banners' })
    async listBanners(@Request() req) {
        this.assertSuperAdmin(req.user);

        const banners = await this.prisma.banner.findMany({
            orderBy: [
                { position: { sort: 'asc', nulls: 'last' } },
                { createdAt: 'desc' },
            ],
        });

        return { data: banners };
    }

    // ----------------------------------------------------------------
    // POST /admin/banners — Create banner (multipart upload)
    // ----------------------------------------------------------------
    @Post()
    @ApiOperation({ summary: 'Create a new banner' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('banner_file'))
    async createBanner(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { type?: string; position?: string; cta?: string; isactive?: string },
        @Request() req,
    ) {
        this.assertSuperAdmin(req.user);

        if (!file || file.size === 0) {
            throw new BadRequestException('Banner image is required');
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }

        const position = body.position ? parseInt(body.position, 10) : null;

        // Validate position uniqueness
        if (position !== null) {
            const existing = await this.prisma.banner.findFirst({
                where: { position },
            });
            if (existing) {
                throw new BadRequestException(`Position ${position} is already taken`);
            }
        }

        // Upload to S3
        const ext = file.originalname?.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-banner.${ext}`;
        const assetUrl = await uploadToS3({
            buffer: file.buffer,
            mimeType: file.mimetype,
            folder: 'banners',
            filename,
        });

        const isActive = body.isactive === 'true';

        const banner = await this.prisma.banner.create({
            data: {
                assetUrl,
                isActive,
                enableStatus: isActive,
                position,
                type: body.type || null,
                cta: body.cta || null,
            },
        });

        return banner;
    }

    // ----------------------------------------------------------------
    // PUT /admin/banners/:id — Update banner (optional file re-upload)
    // ----------------------------------------------------------------
    @Put(':id')
    @ApiOperation({ summary: 'Update a banner' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('banner_file'))
    async updateBanner(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { type?: string; position?: string; cta?: string; isactive?: string },
        @Request() req,
    ) {
        this.assertSuperAdmin(req.user);

        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Banner not found');
        }

        const position = body.position ? parseInt(body.position, 10) : null;

        // Validate position uniqueness (excluding self)
        if (position !== null) {
            const conflict = await this.prisma.banner.findFirst({
                where: { position, id: { not: id } },
            });
            if (conflict) {
                throw new BadRequestException(`Position ${position} is already taken`);
            }
        }

        // Optionally upload new image
        let assetUrl: string | undefined;
        if (file && file.size > 0) {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(
                    `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
                );
            }
            const ext = file.originalname?.split('.').pop() || 'jpg';
            const filename = `${Date.now()}-banner.${ext}`;
            assetUrl = await uploadToS3({
                buffer: file.buffer,
                mimeType: file.mimetype,
                folder: 'banners',
                filename,
            });
        }

        const isActive = body.isactive === 'true';

        const updated = await this.prisma.banner.update({
            where: { id },
            data: {
                ...(assetUrl && { assetUrl }),
                isActive,
                enableStatus: isActive,
                position,
                type: body.type || null,
                cta: body.cta || null,
            },
        });

        return updated;
    }

    // ----------------------------------------------------------------
    // PATCH /admin/banners/:id/toggle — Toggle isActive
    // ----------------------------------------------------------------
    @Patch(':id/toggle')
    @ApiOperation({ summary: 'Toggle banner active status' })
    async toggleBanner(
        @Param('id') id: string,
        @Body() body: { isActive: boolean },
        @Request() req,
    ) {
        this.assertSuperAdmin(req.user);

        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Banner not found');
        }

        const updated = await this.prisma.banner.update({
            where: { id },
            data: { isActive: body.isActive },
        });

        return updated;
    }

    // ----------------------------------------------------------------
    // DELETE /admin/banners/:id — Delete banner (keep S3 image)
    // ----------------------------------------------------------------
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a banner' })
    async deleteBanner(@Param('id') id: string, @Request() req) {
        this.assertSuperAdmin(req.user);

        const existing = await this.prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Banner not found');
        }

        await this.prisma.banner.delete({ where: { id } });

        return { message: 'Banner deleted successfully' };
    }
}
