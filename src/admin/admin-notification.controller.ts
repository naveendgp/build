import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminNotificationService } from './admin-notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminNotificationController {
    constructor(
        private readonly notificationService: AdminNotificationService,
    ) { }

    @Post('send')
    @ApiOperation({ summary: 'Send push notification (super-admin only)' })
    async sendNotification(
        @Body() dto: SendNotificationDto,
        @Request() req,
    ) {
        // Only super-admins can send notifications
        if (
            req.user.role !== 'SUPER_ADMIN' &&
            !req.user.permissions?.includes('SUPERADMIN') &&
            !req.user.permissions?.includes('*')
        ) {
            throw new ForbiddenException(
                'Only Super Admins can send push notifications',
            );
        }

        return this.notificationService.sendNotification(dto, req.user.id);
    }

    @Get('recipients/:type')
    @ApiOperation({ summary: 'Get recipients list by type' })
    @ApiQuery({ name: 'search', required: false })
    async getRecipients(
        @Param('type') type: string,
        @Query('search') search?: string,
    ) {
        return this.notificationService.getRecipients(type, search);
    }
}
