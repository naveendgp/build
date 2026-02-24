import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Payments')
@Controller('admin/payments') // Consistent naming
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminPaymentController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'Get payments list with breakdown' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'pageSize', required: false }) // Frontend sends pageSize
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'method', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    async getPayments(
        @Query('page') page: number = 1,
        @Query('pageSize') pageSize: number = 20,
        @Query('status') status?: string,
        @Query('method') method?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.adminService.getPayments(
            Number(page),
            Number(pageSize),
            status,
            method,
            fromDate,
            toDate
        );
    }

    @Get('revenue')
    @ApiOperation({ summary: 'Get strictly calculated platform revenue' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'pageSize', required: false })
    @ApiQuery({ name: 'fromDate', required: true })
    @ApiQuery({ name: 'toDate', required: true })
    async getRevenue(
        @Query('page') page: number = 1,
        @Query('pageSize') pageSize: number = 20,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
    ) {
        return this.adminService.getRevenueList(
            Number(page),
            Number(pageSize),
            fromDate,
            toDate
        );
    }
}
