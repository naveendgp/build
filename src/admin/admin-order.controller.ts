import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Orders')
@Controller('admin/orders')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminOrderController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'List all orders with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    async getOrders(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.adminService.getOrders(Number(page), Number(limit), status, search, fromDate, toDate);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order details' })
    async getOrder(@Param('id') id: string) {
        return this.adminService.getOrderById(id);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel an order' })
    async cancelOrder(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Body('refund') refund: boolean
    ) {
        return this.adminService.cancelOrder(id, reason, refund);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update an order status' })
    async updateOrderStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.adminService.updateOrderStatus(id, status);
    }
}
