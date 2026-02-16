import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Settlements')
@Controller('admin/settlements')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminSettlementController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'List settlements' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'partnerId', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    async getSettlements(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('partnerId') partnerId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.adminService.getSettlements(Number(page), Number(limit), fromDate, toDate, partnerId);
    }
}
